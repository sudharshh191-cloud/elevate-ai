import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { 
  Play, 
  RotateCcw, 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  ShieldCheck,
  Send,
  Plus,
  Trash2,
  FileCode,
  Sparkles,
  Layers,
  WrapText,
  ZoomIn,
  ZoomOut,
  AlignLeft,
  Keyboard
} from 'lucide-react';
import { ICodeTemplate, ICodeExecutionResult } from '../../types';

interface CodeEditorPanelProps {
  codeTemplate?: ICodeTemplate;
  code: string;
  onCodeChange: (code: string) => void;
  language?: string;
  onLanguageChange?: (lang: string) => void;
  onRunCode?: () => void;
  isRunning?: boolean;
  onSubmitCode?: () => void;
  isSubmitting?: boolean;
  executionResult?: ICodeExecutionResult | null;
  customTestCases?: Array<{ input: string; expectedOutput: string }>;
  onCustomTestCasesChange?: (testCases: Array<{ input: string; expectedOutput: string }>) => void;
  autosaveStatus?: 'saved' | 'saving' | 'idle';
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  codeTemplate,
  code,
  onCodeChange,
  language = 'typescript',
  onLanguageChange,
  onRunCode,
  isRunning = false,
  onSubmitCode,
  isSubmitting = false,
  executionResult,
  customTestCases,
  onCustomTestCasesChange,
  autosaveStatus = 'idle',
}) => {
  const [copied, setCopied] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'results' | 'testcases' | 'raw'>('results');
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [fontSize, setFontSize] = useState(13);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
  const [showMinimap, setShowMinimap] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const onRunCodeRef = useRef(onRunCode);
  onRunCodeRef.current = onRunCode;

  // Map application language keys to Monaco language IDs
  const getMonacoLanguage = (lang: string): string => {
    switch (lang.toLowerCase()) {
      case 'python':
      case 'py':
        return 'python';
      case 'javascript':
      case 'js':
      case 'node':
        return 'javascript';
      case 'java':
        return 'java';
      case 'cpp':
      case 'c++':
        return 'cpp';
      case 'c':
        return 'c';
      case 'typescript':
      case 'ts':
      default:
        return 'typescript';
    }
  };

  const monacoLanguage = getMonacoLanguage(language);

  // Default clean starter templates per language with proper 4-space indentation
  const getStarterTemplate = useCallback((lang: string): string => {
    if (codeTemplate?.starterCode && lang === (codeTemplate.language || 'typescript')) {
      return codeTemplate.starterCode;
    }

    switch (lang.toLowerCase()) {
      case 'python':
        return `# Write your optimal Python 3 solution here\ndef solution(input_data=None):\n    # Process input and return optimal output\n    return input_data\n`;
      case 'javascript':
        return `// Write your optimal JavaScript (Node.js) solution here\nfunction solution(input) {\n    // Process input and return optimal output\n    return input;\n}\n`;
      case 'java':
        return `// Optimal Java Solution\nimport java.util.*;\n\npublic class Solution {\n    public static Object solution(Object input) {\n        // Process input and return optimal output\n        return input;\n    }\n\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        if (scanner.hasNextLine()) {\n            String line = scanner.nextLine();\n            System.out.println(solution(line));\n        } else {\n            System.out.println(solution(""));\n        }\n    }\n}\n`;
      case 'cpp':
      case 'c++':
        return `// Optimal C++ Solution\n#include <iostream>\n#include <string>\n#include <vector>\n\nint main() {\n    std::string input;\n    if (std::getline(std::cin, input)) {\n        // Implement optimal algorithm\n        std::cout << input << std::endl;\n    } else {\n        std::cout << "Output" << std::endl;\n    }\n    return 0;\n}\n`;
      case 'c':
        return `// Optimal C Solution\n#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char buffer[1024];\n    if (fgets(buffer, sizeof(buffer), stdin) != NULL) {\n        // Implement optimal algorithm\n        printf("%s", buffer);\n    } else {\n        printf("Output\\n");\n    }\n    return 0;\n}\n`;
      case 'typescript':
      default:
        return `// Write your optimal TypeScript solution here\nfunction solution(input: any): any {\n    // Process input and return optimal output\n    return input;\n}\n`;
    }
  }, [codeTemplate]);

  const handleLanguageSelect = (newLang: string) => {
    if (onLanguageChange) {
      onLanguageChange(newLang);
      // If code is empty or matches previous default starter template, auto-load starter for new language
      if (!code || code.trim().length === 0) {
        onCodeChange(getStarterTemplate(newLang));
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    onCodeChange(getStarterTemplate(language));
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const getFileExtension = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'python':
        return 'py';
      case 'javascript':
        return 'js';
      case 'java':
        return 'java';
      case 'cpp':
      case 'c++':
        return 'cpp';
      case 'c':
        return 'c';
      case 'typescript':
      default:
        return 'ts';
    }
  };

  // Switch to results tab automatically when execution completes
  useEffect(() => {
    if (executionResult) {
      setActiveConsoleTab('results');
    }
  }, [executionResult]);

  // Monaco Editor Mounting & Theme Configuration
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);

    // Define custom dark theme
    monaco.editor.defineTheme('elevate-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '818cf8', fontStyle: 'bold' },
        { token: 'identifier', foreground: 'f1f5f9' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'type', foreground: '38bdf8' },
        { token: 'function', foreground: '60a5fa' },
        { token: 'delimiter', foreground: '94a3b8' },
        { token: 'operator', foreground: 'c084fc' },
      ],
      colors: {
        'editor.background': '#0B0F19',
        'editor.foreground': '#F8FAFC',
        'editorCursor.foreground': '#6366F1',
        'editor.lineHighlightBackground': '#141A29',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#818CF8',
        'editor.selectionBackground': '#312E81',
        'editor.inactiveSelectionBackground': '#1E1B4B',
        'editorIndentGuide.background1': '#1E293B',
        'editorIndentGuide.activeBackground1': '#334155',
        'editorBracketMatch.background': '#312E8180',
        'editorBracketMatch.border': '#6366F1',
        'editorOverviewRuler.border': '#1E293B',
      },
    });

    monaco.editor.setTheme('elevate-dark');

    // Register Keybinding: Ctrl/Cmd + Enter to trigger Run Code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRunCodeRef.current) {
        onRunCodeRef.current();
      }
    });

    // Ensure focus and proper cursor rendering
    editor.focus();
  };

  // Test cases display
  const displayTestCases = customTestCases && customTestCases.length > 0
    ? customTestCases
    : (codeTemplate?.testCases && codeTemplate.testCases.length > 0
      ? codeTemplate.testCases
      : [{ input: 'Sample input 1', expectedOutput: 'Sample output 1' }]);

  const handleAddTestCase = () => {
    const updated = [
      ...displayTestCases,
      { input: `Test input ${displayTestCases.length + 1}`, expectedOutput: `Expected output ${displayTestCases.length + 1}` }
    ];
    if (onCustomTestCasesChange) {
      onCustomTestCasesChange(updated);
      setActiveTestCaseIndex(updated.length - 1);
    }
  };

  const handleDeleteTestCase = (index: number) => {
    if (displayTestCases.length <= 1) return;
    const updated = displayTestCases.filter((_, idx) => idx !== index);
    if (onCustomTestCasesChange) {
      onCustomTestCasesChange(updated);
      setActiveTestCaseIndex(Math.max(0, index - 1));
    }
  };

  const handleTestCaseChange = (index: number, field: 'input' | 'expectedOutput', value: string) => {
    const updated = [...displayTestCases];
    updated[index] = { ...updated[index], [field]: value };
    if (onCustomTestCasesChange) {
      onCustomTestCasesChange(updated);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 flex flex-col overflow-hidden shadow-2xs space-y-0">
      {/* IDE Top Toolbar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Language selector & File Tab */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono text-indigo-600 font-semibold shadow-2xs">
            <Code2 className="w-3.5 h-3.5" />
            <span>Solution.{getFileExtension(language)}</span>
          </div>

          <select
            value={language}
            onChange={(e) => handleLanguageSelect(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-600 font-mono cursor-pointer shadow-2xs"
          >
            <option value="typescript">TypeScript (TS Compiler • Active)</option>
            <option value="javascript">JavaScript (Node.js v25 • Active)</option>
            <option value="python">Python 3 (Python v3.11 • Active)</option>
            <option value="java">Java (JDK javac • Active)</option>
            <option value="cpp">C++ 14 (MinGW64 g++ • Active)</option>
            <option value="c">C 11 (MinGW64 gcc • Active)</option>
          </select>
        </div>

        {/* IDE Ergonomics Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Format Document */}
          <button
            onClick={handleFormat}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs transition-colors cursor-pointer shadow-2xs"
            title="Format Code (Shift+Alt+F)"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          {/* Word Wrap Toggle */}
          <button
            onClick={() => setWordWrap(prev => prev === 'on' ? 'off' : 'on')}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer shadow-2xs ${
              wordWrap === 'on' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title={`Word Wrap: ${wordWrap.toUpperCase()}`}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          {/* Font Size Adjusters */}
          <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-lg shadow-2xs">
            <button
              onClick={() => setFontSize(prev => Math.max(11, prev - 1))}
              className="px-1.5 py-1 text-slate-600 hover:text-slate-900 border-r border-slate-200 hover:bg-slate-50 transition-colors"
              title="Decrease Font Size"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="px-1.5 text-[10px] font-mono text-slate-500 font-semibold">{fontSize}px</span>
            <button
              onClick={() => setFontSize(prev => Math.min(18, prev + 1))}
              className="px-1.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Increase Font Size"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Copy Code */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs transition-colors cursor-pointer shadow-2xs"
            title="Copy Code to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Template */}
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs transition-colors cursor-pointer shadow-2xs"
            title="Reset to Default Starter Template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Autosave Status */}
          {autosaveStatus === 'saving' && (
            <span className="text-[10px] font-mono text-slate-400 hidden sm:flex items-center gap-1 ml-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              <span>Autosaving...</span>
            </span>
          )}
          {autosaveStatus === 'saved' && (
            <span className="text-[10px] font-mono text-emerald-600 hidden sm:flex items-center gap-1 ml-1">
              <Check className="w-2.5 h-2.5" />
              <span>Draft saved</span>
            </span>
          )}

          {/* RUN CODE Button */}
          <button
            onClick={onRunCode}
            disabled={isRunning || isSubmitting}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ml-1"
            title="Execute Code in Isolated Sandbox (Shortcut: Ctrl+Enter / Cmd+Enter)"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Run Code</span>
                <span className="hidden md:inline-block text-[9px] bg-emerald-800/60 px-1 py-0.2 rounded font-mono">⌘↵</span>
              </>
            )}
          </button>

          {/* SUBMIT SOLUTION Button */}
          {onSubmitCode && (
            <button
              onClick={onSubmitCode}
              disabled={isSubmitting || isRunning}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Submit Final Code Solution for Complete Rubric Grading"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>Submit Code</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Monaco Code Editor Workspace */}
      <div className="relative bg-[#0B0F19] min-h-[320px] h-[360px] sm:h-[400px] w-full overflow-hidden border-b border-slate-800">
        <Editor
          height="100%"
          width="100%"
          language={monacoLanguage}
          value={code}
          onChange={(val) => onCodeChange(val ?? '')}
          onMount={handleEditorDidMount}
          theme="elevate-dark"
          options={{
            fontSize: fontSize,
            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, Menlo, Monaco, monospace",
            fontLigatures: true,
            tabSize: 4,
            insertSpaces: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'full',
            formatOnPaste: true,
            formatOnType: true,
            matchBrackets: 'always',
            bracketPairColorization: {
              enabled: true,
            },
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            lineDecorationsWidth: 6,
            glyphMargin: false,
            folding: true,
            minimap: {
              enabled: showMinimap,
            },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            wordWrap: wordWrap,
            padding: {
              top: 12,
              bottom: 12,
            },
            renderLineHighlight: 'all',
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'smart',
            tabCompletion: 'on',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
          loading={
            <div className="flex flex-col items-center justify-center h-full bg-[#0B0F19] text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs font-mono">Initializing Monaco IDE Engine...</span>
            </div>
          }
        />
      </div>

      {/* Lower Console Tabs */}
      <div className="border-t border-slate-200 bg-slate-50">
        {/* Console Navigation Bar */}
        <div className="px-4 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveConsoleTab('results')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeConsoleTab === 'results'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Test Results</span>
              {executionResult && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  executionResult.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {executionResult.passedTests}/{executionResult.totalTests}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveConsoleTab('testcases')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeConsoleTab === 'testcases'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Test Cases ({displayTestCases.length})</span>
            </button>

            <button
              onClick={() => setActiveConsoleTab('raw')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeConsoleTab === 'raw'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Console Log</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 hidden sm:flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Process-Isolated Sandbox (5s Timeout)</span>
          </div>
        </div>

        {/* Tab 1: Test Results */}
        {activeConsoleTab === 'results' && (
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {executionResult ? (
              <>
                {/* Result Summary Bar */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                      executionResult.status === 'COMPLETED' && executionResult.passed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : executionResult.status === 'COMPILE_ERROR'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : executionResult.status === 'TIMEOUT'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {executionResult.status === 'COMPLETED' && executionResult.passed && '✓ PASSED ALL TESTS'}
                      {executionResult.status === 'COMPLETED' && !executionResult.passed && '✗ TEST CASES FAILED'}
                      {executionResult.status === 'COMPILE_ERROR' && '⚠️ COMPILATION ERROR'}
                      {executionResult.status === 'RUNTIME_ERROR' && '✗ RUNTIME ERROR'}
                      {executionResult.status === 'TIMEOUT' && '⏱️ TIME LIMIT EXCEEDED'}
                      {executionResult.status === 'EXECUTION_ERROR' && '✗ EXECUTION ERROR'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {executionResult.executionTimeMs} ms
                    </span>
                  </div>
                </div>

                {/* Compilation / Runtime Errors */}
                {executionResult.errorOutput && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-mono text-rose-800 whitespace-pre-wrap">
                    {executionResult.errorOutput}
                  </div>
                )}

                {/* Test Results Breakdown */}
                {executionResult.tests && executionResult.tests.length > 0 && (
                  <div className="space-y-2">
                    {executionResult.tests.map((test, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 ${
                          test.passed
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-rose-50/50 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {test.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            )}
                            <span className="font-bold text-slate-900">
                              {test.isHidden ? `Hidden Test ${idx + 1}` : `Sample Test Case ${idx + 1}`}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">{test.executionTimeMs} ms</span>
                        </div>

                        {!test.isHidden && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                            {test.input && (
                              <div className="bg-white p-2 rounded-lg border border-slate-200">
                                <span className="text-slate-400 block text-[10px]">Input:</span>
                                <span className="text-slate-800 truncate block font-medium">{test.input}</span>
                              </div>
                            )}
                            {test.expectedOutput && (
                              <div className="bg-white p-2 rounded-lg border border-slate-200">
                                <span className="text-slate-400 block text-[10px]">Expected Output:</span>
                                <span className="text-emerald-700 truncate block font-medium">{test.expectedOutput}</span>
                              </div>
                            )}
                            <div className="bg-white p-2 rounded-lg border border-slate-200 sm:col-span-2">
                              <span className="text-slate-400 block text-[10px]">Your Output:</span>
                              <span className={`block truncate font-medium ${test.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {test.actualOutput || (test.errorOutput ? `[Error]: ${test.errorOutput}` : '<no output>')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="py-6 text-center text-slate-500 space-y-1">
                <Terminal className="w-6 h-6 mx-auto text-slate-300" />
                <p className="text-xs font-medium">No execution results yet.</p>
                <p className="text-[11px] text-slate-400">Click <strong>Run Code</strong> or press <kbd className="bg-slate-200 text-slate-700 px-1 py-0.5 rounded text-[10px]">Ctrl+Enter</kbd> to compile and test your solution.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Sample & Custom Test Cases */}
        {activeConsoleTab === 'testcases' && (
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto text-xs">
            {/* Case Selector Pills + Add Case Button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {displayTestCases.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTestCaseIndex(idx)}
                    className={`px-3 py-1 rounded-lg font-mono text-xs font-semibold cursor-pointer transition-colors ${
                      activeTestCaseIndex === idx
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                {displayTestCases.length > 1 && onCustomTestCasesChange && (
                  <button
                    onClick={() => handleDeleteTestCase(activeTestCaseIndex)}
                    className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                    title="Delete current test case"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onCustomTestCasesChange && (
                  <button
                    onClick={handleAddTestCase}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1 transition-colors shadow-2xs"
                    title="Add new custom test case"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Case</span>
                  </button>
                )}
              </div>
            </div>

            {/* Selected Case Details */}
            {displayTestCases[activeTestCaseIndex] && (
              <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-slate-200 font-mono text-[11px]">
                <div>
                  <span className="text-slate-600 font-bold block mb-1">Input Data:</span>
                  {onCustomTestCasesChange ? (
                    <input
                      type="text"
                      value={displayTestCases[activeTestCaseIndex].input}
                      onChange={(e) => handleTestCaseChange(activeTestCaseIndex, 'input', e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                      placeholder="Enter test input..."
                    />
                  ) : (
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800">
                      {displayTestCases[activeTestCaseIndex].input || '<empty>'}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-slate-600 font-bold block mb-1">Expected Output:</span>
                  {onCustomTestCasesChange ? (
                    <input
                      type="text"
                      value={displayTestCases[activeTestCaseIndex].expectedOutput}
                      onChange={(e) => handleTestCaseChange(activeTestCaseIndex, 'expectedOutput', e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-emerald-700 font-semibold focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                      placeholder="Enter expected return..."
                    />
                  ) : (
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-emerald-700 font-semibold">
                      {displayTestCases[activeTestCaseIndex].expectedOutput || '<any valid return>'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Raw Console Output */}
        {activeConsoleTab === 'raw' && (
          <div className="p-4 max-h-64 overflow-y-auto">
            <pre className="p-3 rounded-xl bg-[#0B0F19] text-slate-200 font-mono text-xs whitespace-pre-wrap">
              {executionResult?.rawOutput || executionResult?.errorOutput || 'No console output logged.'}
            </pre>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="border-t border-slate-200 bg-white p-3 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-indigo-600" />
          <span>Press <kbd className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded border border-slate-200 text-[10px] font-mono">Ctrl+Enter</kbd> to run sandbox. Press <kbd className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded border border-slate-200 text-[10px] font-mono">Shift+Alt+F</kbd> to format code.</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 hidden sm:inline-block font-semibold">
          Monaco IDE Engine Active
        </span>
      </div>
    </div>
  );
};
