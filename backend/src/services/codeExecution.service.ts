import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import ts from 'typescript';
import { CodeExecutionLog } from '../models/CodeExecutionLog.js';
import mongoose, { Types } from 'mongoose';

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface ITestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTimeMs: number;
  errorOutput?: string;
  isHidden?: boolean;
}

export interface ICodeExecutionResponse {
  status: 'COMPLETED' | 'TIMEOUT' | 'COMPILE_ERROR' | 'RUNTIME_ERROR' | 'SECURITY_ERROR' | 'EXECUTION_ERROR';
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  executionTimeMs: number;
  memoryUsageKb: number | null;
  tests: ITestResult[];
  rawOutput?: string;
  errorOutput?: string;
  sandboxMode: 'docker' | 'isolated-subprocess';
}

export interface IExecuteCodeParams {
  userId?: string | Types.ObjectId;
  sessionId?: string | Types.ObjectId;
  questionIndex: number;
  language: string;
  code: string;
  testCases?: ITestCase[];
  isSubmission?: boolean;
}

export class CodeExecutionService {
  private static readonly TIMEOUT_PER_TEST_MS = 5000;
  private static readonly MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB cap
  private static isDockerCached: boolean | null = null;

  /**
   * Resolves g++ executable path on Windows / Linux
   */
  static getGppPath(): string {
    const candidates = [
      'C:\\Program Files (x86)\\Dev-Cpp\\MinGW64\\bin\\g++.exe',
      'C:\\MinGW\\bin\\g++.exe',
      'C:\\msys64\\mingw64\\bin\\g++.exe',
      'g++',
    ];
    for (const c of candidates) {
      if (c === 'g++' || fs.existsSync(c)) return c;
    }
    return 'g++';
  }

  /**
   * Resolves gcc executable path on Windows / Linux
   */
  static getGccPath(): string {
    const candidates = [
      'C:\\Program Files (x86)\\Dev-Cpp\\MinGW64\\bin\\gcc.exe',
      'C:\\MinGW\\bin\\gcc.exe',
      'C:\\msys64\\mingw64\\bin\\gcc.exe',
      'gcc',
    ];
    for (const c of candidates) {
      if (c === 'gcc' || fs.existsSync(c)) return c;
    }
    return 'gcc';
  }

  /**
   * Resolves javac executable path
   */
  static getJavacPath(): string {
    const candidates = [
      'C:\\Program Files\\Common Files\\Oracle\\Java\\javapath\\javac.exe',
      'javac',
    ];
    for (const c of candidates) {
      if (c === 'javac' || fs.existsSync(c)) return c;
    }
    return 'javac';
  }

  /**
   * Resolves java executable path
   */
  static getJavaPath(): string {
    const candidates = [
      'C:\\Program Files\\Common Files\\Oracle\\Java\\javapath\\java.exe',
      'java',
    ];
    for (const c of candidates) {
      if (c === 'java' || fs.existsSync(c)) return c;
    }
    return 'java';
  }

  /**
   * Checks if Docker is running and available on the host
   */
  static async isDockerAvailable(): Promise<boolean> {
    if (this.isDockerCached !== null) return this.isDockerCached;

    return new Promise<boolean>((resolve) => {
      try {
        const child = spawn('docker', ['info'], { stdio: 'ignore' });
        child.on('error', () => {
          this.isDockerCached = false;
          resolve(false);
        });
        child.on('close', (code) => {
          this.isDockerCached = code === 0;
          resolve(code === 0);
        });
      } catch {
        this.isDockerCached = false;
        resolve(false);
      }
    });
  }

  /**
   * Normalizes test outputs for strict equality checking across languages
   */
  static normalizeOutput(str: string): string {
    if (!str) return '';
    const trimmed = str
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    // Normalize Boolean strings
    if (trimmed.toLowerCase() === 'true') return 'true';
    if (trimmed.toLowerCase() === 'false') return 'false';

    // Try standard JSON normalization for arrays and objects
    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed);
    } catch {}

    // Normalize Python-style data structures (e.g. [0, 1], {'a': 1}, True, False, None)
    try {
      const jsonCandidate = trimmed
        .replace(/'/g, '"')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null');
      const parsed = JSON.parse(jsonCandidate);
      return JSON.stringify(parsed);
    } catch {}

    return trimmed;
  }

  /**
   * Normalizes language names to standard keys
   */
  static normalizeLanguage(lang: string): string {
    const l = (lang || '').toLowerCase().trim();
    if (['python', 'python3', 'py'].includes(l)) return 'python';
    if (['javascript', 'js', 'node'].includes(l)) return 'javascript';
    if (['typescript', 'ts'].includes(l)) return 'typescript';
    if (['java'].includes(l)) return 'java';
    if (['cpp', 'c++', 'cxx'].includes(l)) return 'cpp';
    if (['c'].includes(l)) return 'c';
    return l;
  }

  /**
   * List of supported execution languages
   */
  static getSupportedLanguages(): string[] {
    return ['python', 'javascript', 'typescript', 'java', 'cpp', 'c'];
  }

  /**
   * Executes untrusted candidate code against a suite of test cases
   */
  static async executeCode(params: IExecuteCodeParams): Promise<ICodeExecutionResponse> {
    const { userId, sessionId, questionIndex, language, code, testCases = [], isSubmission = false } = params;

    const normalizedLang = this.normalizeLanguage(language);
    const supported = this.getSupportedLanguages();
    if (!supported.includes(normalizedLang)) {
      throw new Error(`Runtime execution for '${language}' is not supported. Supported: Python, JavaScript, TypeScript, Java, C++, C.`);
    }

    if (!code || code.trim().length === 0) {
      return {
        status: 'EXECUTION_ERROR',
        passed: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        executionTimeMs: 0,
        memoryUsageKb: null,
        tests: [],
        errorOutput: 'Code cannot be empty.',
        sandboxMode: 'isolated-subprocess',
      };
    }

    if (code.length > 50000) {
      return {
        status: 'SECURITY_ERROR',
        passed: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        executionTimeMs: 0,
        memoryUsageKb: null,
        tests: [],
        errorOutput: 'Code length exceeds maximum allowed limit (50,000 characters).',
        sandboxMode: 'isolated-subprocess',
      };
    }

    // Prepare test cases
    const casesToRun: ITestCase[] =
      testCases && testCases.length > 0
        ? testCases
        : [{ input: '', expectedOutput: '', isHidden: false }];

    // Create isolated sandbox directory
    const sandboxDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'elevate_sandbox_'));
    const isDocker = await this.isDockerAvailable();

    try {
      // 1. Pre-compilation step per language
      let preparedCode = code;
      let executableName = '';

      if (normalizedLang === 'typescript') {
        try {
          const transpileResult = ts.transpileModule(code, {
            compilerOptions: {
              module: ts.ModuleKind.CommonJS,
              target: ts.ScriptTarget.ES2020,
              noImplicitAny: false,
              strict: false,
            },
            reportDiagnostics: true,
          });

          if (transpileResult.diagnostics && transpileResult.diagnostics.length > 0) {
            const errors = transpileResult.diagnostics
              .filter((d) => d.category === ts.DiagnosticCategory.Error)
              .map((d) => typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText);

            if (errors.length > 0) {
              const compileErrResult: ICodeExecutionResponse = {
                status: 'COMPILE_ERROR',
                passed: false,
                totalTests: casesToRun.length,
                passedTests: 0,
                failedTests: casesToRun.length,
                executionTimeMs: 0,
                memoryUsageKb: null,
                tests: [],
                errorOutput: `TypeScript Compilation Error:\n${errors.join('\n')}`,
                sandboxMode: 'isolated-subprocess',
              };
              await this.persistLog(params, compileErrResult);
              return compileErrResult;
            }
          }
          preparedCode = transpileResult.outputText;
        } catch (err: any) {
          const compileErrResult: ICodeExecutionResponse = {
            status: 'COMPILE_ERROR',
            passed: false,
            totalTests: casesToRun.length,
            passedTests: 0,
            failedTests: casesToRun.length,
            executionTimeMs: 0,
            memoryUsageKb: null,
            tests: [],
            errorOutput: `TypeScript Transpiler Error: ${err.message}`,
            sandboxMode: 'isolated-subprocess',
          };
          await this.persistLog(params, compileErrResult);
          return compileErrResult;
        }
      } else if (normalizedLang === 'cpp' || normalizedLang === 'c') {
        const isCpp = normalizedLang === 'cpp';
        const srcFile = path.join(sandboxDir, isCpp ? 'solution.cpp' : 'solution.c');
        executableName = path.join(sandboxDir, 'solution.exe');

        await fs.promises.writeFile(srcFile, code, 'utf8');

        const compilerPath = isCpp ? this.getGppPath() : this.getGccPath();
        const compileArgs = ['-O2', isCpp ? '-std=c++14' : '-std=c11', srcFile, '-o', executableName];

        const compileRes = await new Promise<{ success: boolean; error?: string }>((resolve) => {
          let errData = '';
          const child = spawn(compilerPath, compileArgs, { cwd: sandboxDir });
          child.stderr?.on('data', (d) => { errData += d.toString(); });
          child.on('error', (err) => {
            resolve({ success: false, error: `Compiler invocation error: ${err.message}` });
          });
          child.on('close', (code) => {
            if (code === 0) {
              resolve({ success: true });
            } else {
              resolve({ success: false, error: errData.trim() || `Compiler failed with code ${code}` });
            }
          });
        });

        if (!compileRes.success) {
          const compileErrResult: ICodeExecutionResponse = {
            status: 'COMPILE_ERROR',
            passed: false,
            totalTests: casesToRun.length,
            passedTests: 0,
            failedTests: casesToRun.length,
            executionTimeMs: 0,
            memoryUsageKb: null,
            tests: [],
            errorOutput: `${isCpp ? 'C++ (g++)' : 'C (gcc)'} Compilation Error:\n${compileRes.error}`,
            sandboxMode: 'isolated-subprocess',
          };
          await this.persistLog(params, compileErrResult);
          return compileErrResult;
        }
      } else if (normalizedLang === 'java') {
        // Ensure class name matches file name or wraps solution
        let javaCode = code;
        let className = 'Solution';

        const classMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
        if (classMatch && classMatch[1]) {
          className = classMatch[1];
        } else if (!code.includes('class ')) {
          javaCode = `public class Solution {\n${code}\n}`;
        }

        const srcFile = path.join(sandboxDir, `${className}.java`);
        await fs.promises.writeFile(srcFile, javaCode, 'utf8');

        const javacPath = this.getJavacPath();
        const compileRes = await new Promise<{ success: boolean; error?: string }>((resolve) => {
          let errData = '';
          const child = spawn(javacPath, [srcFile], { cwd: sandboxDir });
          child.stderr?.on('data', (d) => { errData += d.toString(); });
          child.on('error', (err) => {
            resolve({ success: false, error: `Java compiler error: ${err.message}` });
          });
          child.on('close', (code) => {
            if (code === 0) {
              resolve({ success: true });
            } else {
              resolve({ success: false, error: errData.trim() || `javac exited with code ${code}` });
            }
          });
        });

        if (!compileRes.success) {
          const compileErrResult: ICodeExecutionResponse = {
            status: 'COMPILE_ERROR',
            passed: false,
            totalTests: casesToRun.length,
            passedTests: 0,
            failedTests: casesToRun.length,
            executionTimeMs: 0,
            memoryUsageKb: null,
            tests: [],
            errorOutput: `Java (javac) Compilation Error:\n${compileRes.error}`,
            sandboxMode: 'isolated-subprocess',
          };
          await this.persistLog(params, compileErrResult);
          return compileErrResult;
        }
        executableName = className;
      }

      // 2. Run Test Cases
      const testResults: ITestResult[] = [];
      let totalExecTime = 0;
      let globalStatus: ICodeExecutionResponse['status'] = 'COMPLETED';
      let combinedStdout = '';
      let combinedStderr = '';

      for (let i = 0; i < casesToRun.length; i++) {
        const testCase = casesToRun[i];
        const isHidden = !!testCase.isHidden;

        const caseResult = await this.runSingleTestCase({
          sandboxDir,
          language: normalizedLang,
          preparedCode,
          executableName,
          testInput: testCase.input,
          expectedOutput: testCase.expectedOutput,
          isHidden,
          isDocker,
        });

        testResults.push(caseResult);
        totalExecTime += caseResult.executionTimeMs;

        const label = isHidden ? `[Hidden Test ${i + 1}]` : `[Test ${i + 1}]`;
        if (caseResult.actualOutput && !isHidden) {
          combinedStdout += `${label} Output:\n${caseResult.actualOutput}\n`;
        }
        if (caseResult.errorOutput) {
          combinedStderr += `${label} Error:\n${caseResult.errorOutput}\n`;
        }

        if (caseResult.errorOutput?.includes('Execution timed out') || caseResult.errorOutput?.includes('Time Limit Exceeded')) {
          globalStatus = 'TIMEOUT';
        } else if (!caseResult.passed && caseResult.errorOutput && globalStatus === 'COMPLETED') {
          globalStatus = 'RUNTIME_ERROR';
        }
      }

      const passedTests = testResults.filter((t) => t.passed).length;
      const failedTests = testResults.length - passedTests;
      const allPassed = testResults.length > 0 && passedTests === testResults.length;

      const response: ICodeExecutionResponse = {
        status: globalStatus,
        passed: allPassed,
        totalTests: testResults.length,
        passedTests,
        failedTests,
        executionTimeMs: totalExecTime,
        memoryUsageKb: null,
        tests: testResults,
        rawOutput: combinedStdout.trim(),
        errorOutput: combinedStderr.trim() || undefined,
        sandboxMode: isDocker ? 'docker' : 'isolated-subprocess',
      };

      // Persist to MongoDB CodeExecutionLog
      await this.persistLog(params, response);

      return response;
    } finally {
      // Clean up temporary sandbox directory
      try {
        await fs.promises.rm(sandboxDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.warn('Sandbox directory cleanup warning:', cleanupErr);
      }
    }
  }

  /**
   * Executes a single test case inside the isolated sandbox
   */
  private static async runSingleTestCase(opts: {
    sandboxDir: string;
    language: string;
    preparedCode: string;
    executableName: string;
    testInput: string;
    expectedOutput: string;
    isHidden: boolean;
    isDocker: boolean;
  }): Promise<ITestResult> {
    const { sandboxDir, language, preparedCode, executableName, testInput, expectedOutput, isHidden } = opts;
    const startTime = Date.now();

    let cmd = 'node';
    let args: string[] = [];

    if (language === 'python') {
      const fileName = 'solution.py';
      const filePath = path.join(sandboxDir, fileName);

      // Smart Python harness: multi-function discovery + intelligent argument parser
      const runnableCode = `
import sys
import json
import ast
import re

# Candidate Solution Code
${preparedCode}

def __parse_test_arguments(raw_input):
    if not raw_input or not raw_input.strip():
        return []
    s = raw_input.strip()
    
    # 1. Try JSON parsing (single primitive, list, or dict)
    try:
        val = json.loads(s)
        if isinstance(val, tuple):
            return list(val)
        return [val]
    except Exception:
        pass

    # 2. Try multiline JSON or raw values
    lines = [l.strip() for l in s.split('\\n') if l.strip()]
    if len(lines) > 1:
        res = []
        for line in lines:
            try:
                res.append(json.loads(line))
            except Exception:
                res.append(line)
        return res

    # 3. Try variable assignments like "nums = [2,7,11,15], target = 9"
    try:
        if '=' in s:
            parts = re.split(r',\\s*(?=[a-zA-Z_][a-zA-Z0-9_]*\\s*=)', s)
            locs = {}
            exec('\\n'.join(parts), {}, locs)
            if locs:
                return list(locs.values())
    except Exception:
        pass

    # 4. Try Python literal evaluation as tuple
    try:
        val = ast.literal_eval(f"({s},)")
        if isinstance(val, tuple):
            return list(val)
    except Exception:
        pass

    return [s]

def __resolve_target_function():
    common_names = [
        'two_sum', 'twoSum', 'contains_duplicate', 'containsDuplicate',
        'is_valid', 'isValid', 'search', 'is_anagram', 'isAnagram',
        'climb_stairs', 'climbStairs', 'length_of_longest_substring',
        'lengthOfLongestSubstring', 'max_sub_array', 'maxSubArray',
        'product_except_self', 'productExceptSelf', 'max_profit', 'maxProfit',
        'reverse_list', 'reverseList', 'has_cycle', 'hasCycle',
        'solution', 'Solution'
    ]
    for name in common_names:
        if name in globals() and callable(globals()[name]):
            return globals()[name]
    
    # Fallback to any user-defined non-private callable function
    builtins_set = {
        '__parse_test_arguments', '__resolve_target_function',
        'json', 'ast', 're', 'sys'
    }
    for k, v in list(globals().items()):
        if callable(v) and not k.startswith('_') and k not in builtins_set:
            return v
    return None

if __name__ == '__main__':
    target_fn = __resolve_target_function()
    raw_inp = """${testInput.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"""
    
    if target_fn:
        try:
            args = __parse_test_arguments(raw_inp)
            res = target_fn(*args)
            if res is not None:
                if isinstance(res, (list, dict, bool, int, float)):
                    print(json.dumps(res))
                else:
                    print(res)
        except Exception as e:
            sys.stderr.write(f"Runtime Exception: {str(e)}\\n")
            sys.exit(1)
`;
      await fs.promises.writeFile(filePath, runnableCode, 'utf8');
      cmd = 'python';
      args = [filePath];
    } else if (language === 'javascript' || language === 'typescript') {
      const fileName = 'solution.js';
      const filePath = path.join(sandboxDir, fileName);

      // Smart JS/TS harness: multi-function discovery + intelligent argument parser
      const runnableCode = `
const util = require('util');

// Candidate Solution Code
${preparedCode}

function __parseTestArguments(rawInput) {
  if (!rawInput || !rawInput.trim()) return [];
  const s = rawInput.trim();

  // 1. Try direct JSON parsing
  try {
    const val = JSON.parse(s);
    return [val];
  } catch (e) {}

  // 2. Try multiline parsing
  const lines = s.split('\\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    return lines.map(line => {
      try { return JSON.parse(line); } catch (e) { return line; }
    });
  }

  // 3. Try variable assignments like "nums = [2,7,11,15], target = 9"
  try {
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*\\s*=/.test(s)) {
      const parts = s.split(/,\\s*(?=[a-zA-Z_$][a-zA-Z0-9_$]*\\s*=)/);
      const exprs = parts.map(p => p.replace(/^[a-zA-Z_$][a-zA-Z0-9_$]*\\s*=\\s*/, ''));
      const fn = new Function(\`return [\${exprs.join(', ')}];\`);
      const evaluated = fn();
      if (Array.isArray(evaluated)) return evaluated;
    }
  } catch (e) {}

  // 4. Try comma-separated literal arguments
  try {
    const fn = new Function(\`return [\${s}];\`);
    const evaluated = fn();
    if (Array.isArray(evaluated)) return evaluated;
  } catch (e) {}

  return [s];
}

function __resolveTargetFunction() {
  const commonNames = [
    'twoSum', 'containsDuplicate', 'isValid', 'search', 'isAnagram',
    'climbStairs', 'lengthOfLongestSubstring', 'maxSubArray', 'merge',
    'productExceptSelf', 'hasCycle', 'reverseList', 'maxProfit',
    'longestPalindrome', 'groupAnagrams', 'topKFrequent', 'characterReplacement',
    'minWindow', 'isValidSudoku', 'trap', 'evalRPN', 'generateParenthesis',
    'dailyTemperatures', 'carFleet', 'findMin', 'searchMatrix', 'timeMap',
    'reorderList', 'removeNthFromEnd', 'invertTree', 'maxDepth', 'isSameTree',
    'isSubtree', 'lowestCommonAncestor', 'levelOrder', 'isValidBST', 'kthSmallest',
    'buildTree', 'maxPathSum', 'numIslands', 'cloneGraph', 'pacificAtlantic',
    'canFinish', 'findOrder', 'ladderLength', 'coinChange', 'lengthOfLIS',
    'maxProduct', 'wordBreak', 'canPartition', 'uniquePaths', 'rob',
    'solution'
  ];

  for (const name of commonNames) {
    if (typeof globalThis[name] === 'function') return globalThis[name];
    if (typeof eval !== 'undefined') {
      try {
        const fn = eval(name);
        if (typeof fn === 'function') return fn;
      } catch (e) {}
    }
  }

  // Check if module.exports or exports has a function
  if (typeof module !== 'undefined' && typeof module.exports === 'function') {
    return module.exports;
  }

  return null;
}

if (typeof process !== 'undefined') {
  const rawInput = ${JSON.stringify(testInput)};
  const targetFn = __resolveTargetFunction();

  if (targetFn) {
    try {
      const args = __parseTestArguments(rawInput);
      const res = targetFn(...args);
      if (res !== undefined) {
        if (typeof res === 'object' && res !== null) {
          console.log(JSON.stringify(res));
        } else {
          console.log(String(res));
        }
      }
    } catch (err) {
      console.error('Runtime Exception: ' + (err && err.message ? err.message : err));
      process.exit(1);
    }
  }
}
`;
      await fs.promises.writeFile(filePath, runnableCode, 'utf8');
      cmd = 'node';
      args = ['--max-old-space-size=256', filePath];
    } else if (language === 'java') {
      cmd = this.getJavaPath();
      args = ['-Xmx256m', '-cp', sandboxDir, executableName || 'Solution'];
    } else if (language === 'cpp' || language === 'c') {
      cmd = executableName;
      args = [];
    }

    // Minimal sanitized environment (never exposes DB, JWT, LLM secrets to child processes)
    const safeEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH || '',
      SYSTEMROOT: process.env.SYSTEMROOT || '',
      TEMP: sandboxDir,
      TMP: sandboxDir,
    };

    return new Promise<ITestResult>((resolve) => {
      let child: ChildProcess;
      let stdoutData = '';
      let stderrData = '';
      let isTimedOut = false;

      const killChildTree = () => {
        if (!child) return;
        try {
          if (process.platform === 'win32' && child.pid) {
            spawn('taskkill', ['/F', '/T', '/PID', child.pid.toString()], { stdio: 'ignore' });
          } else {
            child.kill('SIGKILL');
          }
        } catch {
          try {
            if (!child.killed) child.kill('SIGKILL');
          } catch {}
        }
      };

      const timeoutId = setTimeout(() => {
        isTimedOut = true;
        killChildTree();
      }, this.TIMEOUT_PER_TEST_MS);

      try {
        child = spawn(cmd, args, {
          cwd: sandboxDir,
          env: safeEnv,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        if (testInput && child.stdin) {
          child.stdin.write(testInput + '\n');
          child.stdin.end();
        }

        child.stdout?.on('data', (data) => {
          if (stdoutData.length < this.MAX_OUTPUT_BYTES) {
            stdoutData += data.toString();
          }
        });

        child.stderr?.on('data', (data) => {
          if (stderrData.length < this.MAX_OUTPUT_BYTES) {
            stderrData += data.toString();
          }
        });

        child.on('error', (err) => {
          clearTimeout(timeoutId);
          const execTime = Date.now() - startTime;
          resolve({
            input: isHidden ? '[Hidden Test Case]' : testInput,
            expectedOutput: isHidden ? '[Hidden]' : expectedOutput,
            actualOutput: '',
            passed: false,
            executionTimeMs: execTime,
            errorOutput: `Failed to spawn runtime process: ${err.message}`,
            isHidden,
          });
        });

        child.on('close', (code) => {
          clearTimeout(timeoutId);
          const execTime = Date.now() - startTime;

          if (isTimedOut) {
            resolve({
              input: isHidden ? '[Hidden Test Case]' : testInput,
              expectedOutput: isHidden ? '[Hidden]' : expectedOutput,
              actualOutput: isHidden ? '[Hidden Timeout]' : this.normalizeOutput(stdoutData),
              passed: false,
              executionTimeMs: this.TIMEOUT_PER_TEST_MS,
              errorOutput: `Time Limit Exceeded (> ${this.TIMEOUT_PER_TEST_MS / 1000}s limit).`,
              isHidden,
            });
            return;
          }

          const normalizedActual = this.normalizeOutput(stdoutData);
          const normalizedExpected = this.normalizeOutput(expectedOutput);

          const isPass =
            code === 0 &&
            (!normalizedExpected || normalizedActual === normalizedExpected);

          resolve({
            input: isHidden ? '[Hidden Test Case]' : testInput,
            expectedOutput: isHidden ? '[Hidden]' : expectedOutput,
            actualOutput: isHidden ? (isPass ? '[Passed Hidden Test]' : '[Failed Hidden Test]') : normalizedActual,
            passed: isPass,
            executionTimeMs: execTime,
            errorOutput: code !== 0 ? stderrData.trim() || `Process exited with code ${code}` : undefined,
            isHidden,
          });
        });
      } catch (spawnErr: any) {
        clearTimeout(timeoutId);
        resolve({
          input: isHidden ? '[Hidden Test Case]' : testInput,
          expectedOutput: isHidden ? '[Hidden]' : expectedOutput,
          actualOutput: '',
          passed: false,
          executionTimeMs: Date.now() - startTime,
          errorOutput: `Sandbox Execution Error: ${spawnErr.message}`,
          isHidden,
        });
      }
    });
  }

  /**
   * Persists the execution record to MongoDB CodeExecutionLog
   */
  private static async persistLog(
    params: IExecuteCodeParams,
    response: ICodeExecutionResponse
  ): Promise<void> {
    try {
      const { userId, sessionId, questionIndex, language, code } = params;

      let mappedStatus: 'passed' | 'failed' | 'syntax_error' | 'timeout' = 'passed';
      if (response.status === 'TIMEOUT') {
        mappedStatus = 'timeout';
      } else if (response.status === 'COMPILE_ERROR') {
        mappedStatus = 'syntax_error';
      } else if (!response.passed) {
        mappedStatus = 'failed';
      }

      await CodeExecutionLog.create({
        userId: userId && mongoose.Types.ObjectId.isValid(userId.toString()) ? new Types.ObjectId(userId.toString()) : undefined,
        sessionId: sessionId && mongoose.Types.ObjectId.isValid(sessionId.toString()) ? new Types.ObjectId(sessionId.toString()) : undefined,
        questionIndex: questionIndex || 0,
        language: language || 'typescript',
        code: code || '',
        status: mappedStatus,
        executionTimeMs: response.executionTimeMs,
        memoryUsageKb: response.memoryUsageKb || 0,
        testCasesPassed: response.passedTests,
        totalTestCases: response.totalTests,
        rawOutput: response.rawOutput,
        errorOutput: response.errorOutput,
      });
    } catch (dbErr) {
      console.warn('Failed to save CodeExecutionLog to MongoDB:', dbErr);
    }
  }
}
