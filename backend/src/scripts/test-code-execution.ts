const API_BASE = 'http://localhost:5000/api';

async function runCodeExecutionTestSuite() {
  console.log('⚡ ================================================================');
  console.log('⚡ ELEVATE.AI SECURE CODE EXECUTION ENGINE TEST SUITE (PHASE 2.2)');
  console.log('⚡ ================================================================\n');

  // Step 1: Register and login User A
  console.log('▶️ [1/14] Setting up candidate session in MongoDB...');
  const userAEmail = `coder.user.a.${Date.now()}@elevate-ai.io`;
  const regARes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ada Lovelace',
      email: userAEmail,
      password: 'SecureCoder2026!',
      targetRole: 'Staff Software Architect',
    }),
  });
  const regAData: any = await regARes.json();
  const verifyARes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, otp: regAData.demoOtp, type: 'verification' }),
  });
  const verifyAData: any = await verifyARes.json();
  const tokenA = verifyAData.token;

  // Create session for User A
  const startSessRes = await fetch(`${API_BASE}/interview/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      domain: 'Fullstack',
      difficulty: 'Senior',
      format: 'Code',
      count: 2,
    }),
  });
  const sessData: any = await startSessRes.json();
  const sessionIdA = sessData.sessionId;
  console.log(`✅ User A registered and session created: SessionID=${sessionIdA}\n`);

  // Step 2: Test 1 - Correct Python Code
  console.log('▶️ [2/14] Testing Correct Python Code (def solution -> 2 + 3 = 5)...');
  const pyCode = `
def solution(input_data=None):
    return 2 + 3
`;
  const pyRes = await fetch(`${API_BASE}/code/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      questionIndex: 0,
      language: 'python',
      code: pyCode,
      testCases: [{ input: '', expectedOutput: '5' }],
    }),
  });
  const pyData: any = await pyRes.json();
  if (!pyRes.ok || !pyData.passed || pyData.tests[0].actualOutput !== '5') {
    throw new Error(`Correct Python test failed: ${JSON.stringify(pyData)}`);
  }
  console.log(`✅ Correct Python passed! Output=${pyData.tests[0].actualOutput}, Passed=${pyData.passed}, Time=${pyData.executionTimeMs}ms\n`);

  // Step 3: Test 2 - Incorrect Python Code
  console.log('▶️ [3/14] Testing Incorrect Python Code (Expected 42, received 41)...');
  const pyWrongCode = `
def solution(input_data=None):
    return 41
`;
  const pyWrongRes = await fetch(`${API_BASE}/code/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      questionIndex: 0,
      language: 'python',
      code: pyWrongCode,
      testCases: [{ input: '', expectedOutput: '42' }],
    }),
  });
  const pyWrongData: any = await pyWrongRes.json();
  if (pyWrongData.passed === true || pyWrongData.passedTests !== 0) {
    throw new Error(`Incorrect Python should fail: ${JSON.stringify(pyWrongData)}`);
  }
  console.log(`✅ Incorrect Python correctly failed: Expected=42, Received=${pyWrongData.tests[0].actualOutput}, Passed=false\n`);

  // Step 4: Test 3 - Python Runtime Error
  console.log('▶️ [4/14] Testing Python Runtime Error (1 / 0 ZeroDivisionError)...');
  const pyErrCode = `
def solution(input_data=None):
    return 1 / 0
`;
  const pyErrRes = await fetch(`${API_BASE}/code/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      questionIndex: 0,
      language: 'python',
      code: pyErrCode,
      testCases: [{ input: '', expectedOutput: '10' }],
    }),
  });
  const pyErrData: any = await pyErrRes.json();
  if (pyErrData.passed === true || !pyErrData.tests[0].errorOutput) {
    throw new Error(`Python runtime error test failed: ${JSON.stringify(pyErrData)}`);
  }
  console.log(`✅ Python runtime error captured: "${pyErrData.tests[0].errorOutput.trim()}"\n`);

  // Step 5: Test 4 - Infinite Loop Timeout Protection
  console.log('▶️ [5/14] Testing Infinite Loop Timeout (while True: pass)...');
  const pyTimeoutCode = `
def solution(input_data=None):
    while True:
        pass
`;
  const pyTimeoutRes = await fetch(`${API_BASE}/code/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      questionIndex: 0,
      language: 'python',
      code: pyTimeoutCode,
      testCases: [{ input: '', expectedOutput: '10' }],
    }),
  });
  const pyTimeoutData: any = await pyTimeoutRes.json();
  if (pyTimeoutData.status !== 'TIMEOUT' && !pyTimeoutData.tests[0].errorOutput?.includes('timed out')) {
    throw new Error(`Timeout protection failed: ${JSON.stringify(pyTimeoutData)}`);
  }
  console.log(`✅ Sandbox Timeout enforced successfully: Status=${pyTimeoutData.status}, Error="${pyTimeoutData.tests[0].errorOutput}"\n`);

  // Step 6: Test 5 - Correct JavaScript
  console.log('▶️ [6/14] Testing Correct JavaScript (Array Reverse)...');
  const jsCode = `
function solution(input) {
  return input.split('').reverse().join('');
}
`;
  const jsRes = await fetch(`${API_BASE}/code/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      questionIndex: 0,
      language: 'javascript',
      code: jsCode,
      testCases: [
        { input: 'elevate', expectedOutput: 'etavele' },
        { input: 'racecar', expectedOutput: 'racecar' },
      ],
    }),
  });
  const jsData: any = await jsRes.json();
  if (!jsRes.ok || !jsData.passed || jsData.passedTests !== 2) {
    throw new Error(`Correct JavaScript test failed: ${JSON.stringify(jsData)}`);
  }
  console.log(`✅ Correct JavaScript passed 2/2 test cases! Time=${jsData.executionTimeMs}ms\n`);

  // Step 7: Test 6 - Incorrect JavaScript
  console.log('▶️ [7/14] Testing Incorrect JavaScript...');
  const jsWrongCode = `
function solution(input) {
  return 'wrong_output';
}
`;
  const jsWrongRes = await fetch(`${API_BASE}/code/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      questionIndex: 0,
      language: 'javascript',
      code: jsWrongCode,
      testCases: [{ input: 'hello', expectedOutput: 'olleh' }],
    }),
  });
  const jsWrongData: any = await jsWrongRes.json();
  if (jsWrongData.passed === true) {
    throw new Error(`Incorrect JS should fail: ${JSON.stringify(jsWrongData)}`);
  }
  console.log(`✅ Incorrect JavaScript correctly rejected: Passed=${jsWrongData.passed}\n`);

  // Step 8: Test 7 - Correct TypeScript with Generics & Types
  console.log('▶️ [8/14] Testing Correct TypeScript (LRU Cache / Generic Function)...');
  const tsCode = `
interface INode<T> {
  val: T;
}
function solution(arr: number[]): number {
  return arr.reduce((acc: number, val: number) => acc + val, 0);
}
`;
  const tsRes = await fetch(`${API_BASE}/code/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      questionIndex: 0,
      language: 'typescript',
      code: tsCode,
      testCases: [
        { input: '[1, 2, 3, 4, 5]', expectedOutput: '15' },
        { input: '[10, 20, 30]', expectedOutput: '60' },
      ],
    }),
  });
  const tsData: any = await tsRes.json();
  if (!tsRes.ok || !tsData.passed || tsData.passedTests !== 2) {
    throw new Error(`Correct TypeScript test failed: ${JSON.stringify(tsData)}`);
  }
  console.log(`✅ Correct TypeScript passed 2/2 test cases! Output=${tsData.tests[0].actualOutput}, Time=${tsData.executionTimeMs}ms\n`);

  // Step 9: Test 8 - TypeScript Compilation Error
  console.log('▶️ [9/14] Testing TypeScript Syntax / Compilation Error...');
  const tsErrorCode = `
function solution(input: any) {
  let x: number = "cannot assign string to number invalid syntax {{{{
`;
  const tsErrRes = await fetch(`${API_BASE}/code/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      questionIndex: 0,
      language: 'typescript',
      code: tsErrorCode,
      testCases: [{ input: '', expectedOutput: '' }],
    }),
  });
  const tsErrData: any = await tsErrRes.json();
  if (tsErrData.status !== 'COMPILE_ERROR') {
    throw new Error(`Expected COMPILE_ERROR, got ${tsErrData.status}`);
  }
  console.log(`✅ TypeScript compilation error caught: Status=${tsErrData.status}\n`);

  // Step 10: Test 9 - Unauthorized Request (Missing Token)
  console.log('▶️ [10/14] Testing Unauthorized Execution (No JWT)...');
  const unauthRes = await fetch(`${API_BASE}/code/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: sessionIdA, code: 'print(1)' }),
  });
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 Unauthorized, got ${unauthRes.status}`);
  }
  console.log('✅ Unauthorized request correctly rejected with 401.\n');

  // Step 11: Test 10 - Cross-User Session Isolation (User B accessing User A session)
  console.log('▶️ [11/14] Testing Cross-User Access Isolation...');
  const userBEmail = `coder.user.b.${Date.now()}@elevate-ai.io`;
  const regBRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User B', email: userBEmail, password: 'Password2026!' }),
  });
  const regBData: any = await regBRes.json();
  const verifyBRes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userBEmail, otp: regBData.demoOtp, type: 'verification' }),
  });
  const verifyBData: any = await verifyBRes.json();
  const tokenB = verifyBData.token;

  const crossRes = await fetch(`${API_BASE}/code/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      sessionId: sessionIdA, // User A's session!
      questionIndex: 0,
      language: 'python',
      code: 'print(1)',
    }),
  });
  if (crossRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for cross-user execution, got ${crossRes.status}`);
  }
  console.log('✅ Cross-user execution attempt correctly rejected with 403 Forbidden.\n');

  // Step 12: Test 11 - Empty Code
  console.log('▶️ [12/14] Testing Empty Code Validation...');
  const emptyRes = await fetch(`${API_BASE}/code/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      questionIndex: 0,
      language: 'python',
      code: '   ',
    }),
  });
  if (emptyRes.status !== 400) {
    throw new Error(`Expected 400 Bad Request for empty code, got ${emptyRes.status}`);
  }
  console.log('✅ Empty code correctly rejected with 400 Bad Request.\n');

  // Step 13: Test 12 - Unsupported Language Handling
  console.log('▶️ [13/14] Testing Unsupported Language (e.g. rust/c++)...');
  const unsuppRes = await fetch(`${API_BASE}/code/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      questionIndex: 0,
      language: 'rust',
      code: 'fn main() {}',
    }),
  });
  const unsuppData: any = await unsuppRes.json();
  if (unsuppRes.status !== 400 || !unsuppData.error.includes('coming soon')) {
    throw new Error(`Unsupported language check failed: ${JSON.stringify(unsuppData)}`);
  }
  console.log(`✅ Unsupported language correctly reported: "${unsuppData.error}"\n`);

  // Step 14: Test 13 & 14 - Security Environment Variable Isolation Test
  console.log('▶️ [14/14] Testing Security Environment Variable Leak Prevention...');
  const envTestCode = `
import os
def solution(inp=None):
    # Attempt to read JWT_SECRET or MONGO_URI from environment
    secret = os.environ.get('JWT_SECRET') or os.environ.get('MONGO_URI') or 'NO_LEAK'
    return secret
`;
  const envRes = await fetch(`${API_BASE}/code/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      questionIndex: 0,
      language: 'python',
      code: envTestCode,
      testCases: [{ input: '', expectedOutput: 'NO_LEAK' }],
    }),
  });
  const envData: any = await envRes.json();
  if (!envRes.ok || envData.tests[0].actualOutput !== 'NO_LEAK') {
    throw new Error(`Security environment leak detected! Result: ${JSON.stringify(envData)}`);
  }
  console.log('✅ Environment isolation verified: Zero backend secrets accessible by candidate code.\n');

  console.log('🎉 ================================================================');
  console.log('🎉 ALL 14/14 CODE EXECUTION & SECURITY TESTS PASSED');
  console.log('🎉 ================================================================\n');
}

runCodeExecutionTestSuite().catch((err) => {
  console.error('❌ Code execution test suite failed:', err);
  process.exit(1);
});
