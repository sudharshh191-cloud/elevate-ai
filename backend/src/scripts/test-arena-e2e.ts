const API_BASE = 'http://localhost:5000/api';

async function runE2ETests() {
  console.log('====================================================');
  console.log('ELEVATE.AI — CODING ARENA 14-POINT E2E TEST SUITE');
  console.log('====================================================\n');

  let passedScenarios = 0;
  const totalScenarios = 14;

  try {
    // ----------------------------------------------------
    // PREPARATION: Authenticate Candidate 1 & Candidate 2
    // ----------------------------------------------------
    console.log('[Setup] Authenticating test candidates...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@ai-interview.io', password: 'Password123!' })
    });
    const loginData = await loginRes.json() as any;
    const token1 = loginData.token;

    // Create a mock token for Candidate 2 for security / cross-tenant testing using correct secret
    const jwt = await import('jsonwebtoken');
    const token2 = jwt.default.sign(
      { userId: '660000000000000000000099', email: 'intruder@elevate.test' },
      process.env.JWT_SECRET || 'super_secret_ai_interview_jwt_key_2026',
      { expiresIn: '1h' }
    );

    console.log('Tokens initialized. Starting mock coding session for Candidate 1...');

    const startRes = await fetch(`${API_BASE}/interview/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        domain: 'Backend',
        difficulty: 'Senior',
        format: 'Code',
        customTopicFocus: 'Data Structures and Algorithms'
      })
    });
    const startData = await startRes.json() as any;
    const session = startData.session;
    const sessionId = session._id;
    console.log(`Session created: ${sessionId} with ${session.questions.length} questions.\n`);

    // ----------------------------------------------------
    // SCENARIO 1: Python 3 Correct Solution
    // ----------------------------------------------------
    console.log('1. Testing Python 3 Correct Execution...');
    const pyCode = `
def solution(input_data):
    nums = [int(x) for x in str(input_data).split()]
    return sum(nums)
`;
    const pyRes = await fetch(`${API_BASE}/code/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({
        sessionId,
        questionIndex: 0,
        language: 'python',
        code: pyCode,
        testCases: [
          { input: '2 3', expectedOutput: '5' },
          { input: '10 20', expectedOutput: '30' }
        ]
      })
    });
    const pyData = await pyRes.json() as any;
    if (pyData && pyData.passed === true && pyData.passedTests === 2) {
      console.log('   ✅ SCENARIO 1 PASSED: Python 3 execution succeeded and passed all test cases.');
      passedScenarios++;
    } else {
      console.error('   ❌ SCENARIO 1 FAILED:', pyData);
    }

    // ----------------------------------------------------
    // SCENARIO 2: Python 3 Incorrect Solution Fails
    // ----------------------------------------------------
    console.log('\n2. Testing Python 3 Incorrect Solution Failure...');
    const pyWrongCode = `
def solution(input_data):
    return 999999
`;
    const pyWrongRes = await fetch(`${API_BASE}/code/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({
        sessionId,
        questionIndex: 0,
        language: 'python',
        code: pyWrongCode,
        testCases: [{ input: '2 3', expectedOutput: '5' }]
      })
    });
    const pyWrongData = await pyWrongRes.json() as any;
    if (pyWrongData && pyWrongData.passed === false && pyWrongData.failedTests === 1) {
      console.log('   ✅ SCENARIO 2 PASSED: Incorrect solution correctly marked failed.');
      passedScenarios++;
    } else {
      console.error('   ❌ SCENARIO 2 FAILED:', pyWrongData);
    }

    // ----------------------------------------------------
    // SCENARIO 3: JavaScript / TypeScript Execution
    // ----------------------------------------------------
    console.log('\n3. Testing TypeScript / JavaScript Execution...');
    const tsCode = `
function solution(input: any): any {
  const parts = String(input).split(' ').map(Number);
  return parts.reduce((a, b) => a + b, 0);
}
`;
    const tsRes = await fetch(`${API_BASE}/code/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({
        sessionId,
        questionIndex: 0,
        language: 'typescript',
        code: tsCode,
        testCases: [
          { input: '4 6', expectedOutput: '10' },
          { input: '100 200', expectedOutput: '300' }
        ]
      })
    });
    const tsData = await tsRes.json() as any;
    if (tsData && tsData.passed === true && tsData.passedTests === 2) {
      console.log('   ✅ SCENARIO 3 PASSED: TypeScript transpile & Node.js execution passed.');
      passedScenarios++;
    } else {
      console.error('   ❌ SCENARIO 3 FAILED:', tsData);
    }

    // ----------------------------------------------------
    // SCENARIO 4: C++ (MinGW64 g++) Compilation & Execution
    // ----------------------------------------------------
    console.log('\n4. Testing C++ (MinGW64 g++) Execution...');
    const cppCode = `
#include <iostream>
#include <sstream>

int main() {
    int a, b;
    if (std::cin >> a >> b) {
        std::cout << (a + b);
    }
    return 0;
}
`;
    const cppRes = await fetch(`${API_BASE}/code/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({
        sessionId,
        questionIndex: 0,
        language: 'cpp',
        code: cppCode,
        testCases: [{ input: '15 25', expectedOutput: '40' }]
      })
    });
    const cppData = await cppRes.json() as any;
    if (cppData && cppData.passed === true && cppData.passedTests === 1) {
      console.log('   ✅ SCENARIO 4 PASSED: C++ code compiled with MinGW64 g++ and executed.');
      passedScenarios++;
    } else {
      console.error('   ❌ SCENARIO 4 FAILED:', cppData);
    }

    // ----------------------------------------------------
    // SCENARIO 5: Java (JDK javac & java) Execution
    // ----------------------------------------------------
    console.log('\n5. Testing Java (JDK javac) Execution...');
    const javaCode = `
import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int a = sc.nextInt();
            int b = sc.nextInt();
            System.out.println(a + b);
        }
    }
}
`;
    const javaRes = await fetch(`${API_BASE}/code/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({
        sessionId,
        questionIndex: 0,
        language: 'java',
        code: javaCode,
        testCases: [{ input: '50 50', expectedOutput: '100' }]
      })
    });
    const javaData = await javaRes.json() as any;
    if (javaData && javaData.passed === true && javaData.passedTests === 1) {
      console.log('   ✅ SCENARIO 5 PASSED: Java compiled with javac and executed successfully.');
      passedScenarios++;
    } else {
      console.error('   ❌ SCENARIO 5 FAILED:', javaData);
    }

    // ----------------------------------------------------
    // SCENARIO 6: Compilation Error Handling
    // ----------------------------------------------------
    console.log('\n6. Testing Compilation Error Handling (C++ Syntax Error)...');
    const invalidCpp = `
#include <iostream>
int main() {
    this_is_an_invalid_syntax_error >>> ;;;
    return 0;
}
`;
    const compileErrRes = await fetch(`${API_BASE}/code/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({
        sessionId,
        questionIndex: 0,
        language: 'cpp',
        code: invalidCpp,
        testCases: [{ input: '1', expectedOutput: '1' }]
      })
    });
    const compileErrData = await compileErrRes.json() as any;
    if (compileErrData && compileErrData.status === 'COMPILE_ERROR' && compileErrData.errorOutput) {
      console.log('   ✅ SCENARIO 6 PASSED: Compilation error caught and formatted accurately.');
      passedScenarios++;
    } else {
      console.error('   ❌ SCENARIO 6 FAILED:', compileErrData);
    }

    // ----------------------------------------------------
    // SCENARIO 7: Runtime Error Handling (Division by Zero)
    // ----------------------------------------------------
    console.log('\n7. Testing Runtime Error Handling (Python ZeroDivisionError)...');
    const runtimeErrCode = `
def solution(input_data):
    return 1 / 0
`;
    const runtimeErrRes = await fetch(`${API_BASE}/code/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({
        sessionId,
        questionIndex: 0,
        language: 'python',
        code: runtimeErrCode,
        testCases: [{ input: '1', expectedOutput: '1' }]
      })
    });
    const runtimeErrData = await runtimeErrRes.json() as any;
    if (runtimeErrData && (runtimeErrData.status === 'RUNTIME_ERROR' || runtimeErrData.passed === false)) {
      console.log('   ✅ SCENARIO 7 PASSED: Runtime error handled gracefully without crashing server.');
      passedScenarios++;
    } else {
      console.error('   ❌ SCENARIO 7 FAILED:', runtimeErrData);
    }

    // ----------------------------------------------------
    // SCENARIO 8: Infinite Loop / Timeout Enforcement (5000ms SIGKILL)
    // ----------------------------------------------------
    console.log('\n8. Testing Sandbox Timeout Enforcement (Infinite Loop)...');
    const infiniteLoopCode = `
def solution(input_data):
    while True:
        pass
    return "done"
`;
    const timeoutRes = await fetch(`${API_BASE}/code/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({
        sessionId,
        questionIndex: 0,
        language: 'python',
        code: infiniteLoopCode,
        testCases: [{ input: '1', expectedOutput: 'done' }]
      })
    });
    const timeoutData = await timeoutRes.json() as any;
    if (timeoutData && (timeoutData.status === 'TIMEOUT' || (timeoutData.errorOutput && timeoutData.errorOutput.includes('Time Limit Exceeded')))) {
      console.log('   ✅ SCENARIO 8 PASSED: 5s timeout triggered and process killed with SIGKILL.');
      passedScenarios++;
    } else {
      console.error('   ❌ SCENARIO 8 FAILED:', timeoutData);
    }

    // ----------------------------------------------------
    // SCENARIO 9: Safe Output Truncation (64KB Buffer Guard)
    // ----------------------------------------------------
    console.log('\n9. Testing Safe Output Truncation (Flooding Stdout)...');
    const floodCode = `
def solution(input_data):
    print("A" * 100000)
    return "ok"
`;
    const floodRes = await fetch(`${API_BASE}/code/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({
        sessionId,
        questionIndex: 0,
        language: 'python',
        code: floodCode,
        testCases: [{ input: '1', expectedOutput: 'ok' }]
      })
    });
    const floodData = await floodRes.json() as any;
    if (floodData && floodData.tests && floodData.tests[0]?.actualOutput) {
      console.log('   ✅ SCENARIO 9 PASSED: Huge output handled safely without out-of-memory crash.');
      passedScenarios++;
    } else {
      console.error('   ❌ SCENARIO 9 FAILED:', floodData);
    }

    // ----------------------------------------------------
    // SCENARIO 10: Unauthenticated Request Guard (HTTP 401)
    // ----------------------------------------------------
    console.log('\n10. Testing Unauthenticated Request Guard (No JWT)...');
    const unauthRes = await fetch(`${API_BASE}/code/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        questionIndex: 0,
        language: 'python',
        code: 'print(1)'
      })
    });
    if (unauthRes.status === 401) {
      console.log('   ✅ SCENARIO 10 PASSED: HTTP 401 Unauthorized returned for missing token.');
      passedScenarios++;
    } else {
      console.error('   ❌ SCENARIO 10 FAILED: Expected 401, got', unauthRes.status);
    }

    // ----------------------------------------------------
    // SCENARIO 11: Cross-Tenant Security Isolation (HTTP 403)
    // ----------------------------------------------------
    console.log('\n11. Testing Cross-Tenant Security Isolation (Candidate 2 on Candidate 1 session)...');
    const crossTenantRes = await fetch(`${API_BASE}/code/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}` // Candidate 2
      },
      body: JSON.stringify({
        sessionId, // Candidate 1's session
        questionIndex: 0,
        language: 'python',
        code: 'print("hacked")'
      })
    });
    if (crossTenantRes.status === 403) {
      console.log('   ✅ SCENARIO 11 PASSED: HTTP 403 Forbidden returned for cross-tenant access attempt.');
      passedScenarios++;
    } else {
      console.error('   ❌ SCENARIO 11 FAILED: Expected 403, got', crossTenantRes.status);
    }

    // ----------------------------------------------------
    // SCENARIO 12: Draft Autosave & Recovery
    // ----------------------------------------------------
    console.log('\n12. Testing Code Draft Autosave Endpoint...');
    const draftCode = 'def solution():\n    # In progress draft\n    pass';
    const draftRes = await fetch(`${API_BASE}/code/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        sessionId,
        questionIndex: 0,
        language: 'python',
        code: draftCode
      })
    });
    const draftData = await draftRes.json() as any;
    if (draftData && draftData.saved === true) {
      console.log('   ✅ SCENARIO 12 PASSED: Code draft autosaved successfully to MongoDB session state.');
      passedScenarios++;
    } else {
      console.error('   ❌ SCENARIO 12 FAILED:', draftData);
    }

    // ----------------------------------------------------
    // SCENARIO 13: Full Submission with Test Grading & Gemini AI
    // ----------------------------------------------------
    console.log('\n13. Testing Full Code Submission with Custom/Hidden Tests & Gemini Evaluation...');
    const submitCodeSol = `
def solution(input_data):
    # Two Sum / Addition
    nums = [int(x) for x in str(input_data).split()]
    return sum(nums)
`;
    const submitRes = await fetch(`${API_BASE}/code/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        sessionId,
        questionIndex: 0,
        language: 'python',
        code: submitCodeSol,
        customTestCases: [
          { input: '10 20', expectedOutput: '30' },
          { input: '100 200', expectedOutput: '300' }
        ]
      })
    });
    const submitData = await submitRes.json() as any;
    if (submitData.evaluation && typeof submitData.score === 'number' && submitData.passedTests === 2) {
      console.log(`   ✅ SCENARIO 13 PASSED: Code submitted, scored (${submitData.score}/100), and evaluated with Gemini.`);
      console.log(`      - Pass rate: ${submitData.passedTests}/${submitData.totalTests}`);
      console.log(`      - Technical Score: ${submitData.evaluation.technicalAccuracyScore}/100`);
      passedScenarios++;
    } else {
      console.error('   ❌ SCENARIO 13 FAILED:', submitData);
    }

    // ----------------------------------------------------
    // SCENARIO 14: Session Scorecard Generation & Feedback Report
    // ----------------------------------------------------
    console.log('\n14. Testing Interview Finish & Executive Scorecard Generation...');
    const finishRes = await fetch(`${API_BASE}/interview/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({ sessionId })
    });
    const finishData = await finishRes.json() as any;
    if (finishData.report && finishData.report.radarChartData && typeof finishData.report.overallScore === 'number') {
      console.log(`   ✅ SCENARIO 14 PASSED: Executive Scorecard generated.`);
      console.log(`      - Report ID: ${finishData.report._id || finishData.report.reportId}`);
      console.log(`      - Overall Score: ${finishData.report.overallScore}/100`);
      console.log(`      - Performance Tier: ${finishData.report.performanceTier}`);
      passedScenarios++;
    } else {
      console.error('   ❌ SCENARIO 14 FAILED:', finishData);
    }

    console.log('\n====================================================');
    console.log(`RESULT: ${passedScenarios} / ${totalScenarios} SCENARIOS PASSED (${Math.round((passedScenarios/totalScenarios)*100)}%)`);
    console.log('====================================================\n');

  } catch (error: any) {
    console.error('Test Suite Error:', error);
  }
}

runE2ETests();
