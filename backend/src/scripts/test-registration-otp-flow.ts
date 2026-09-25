const API_BASE = 'http://localhost:5000/api';

async function runRegistrationOtpTestSuite() {
  console.log('⚡ ================================================================');
  console.log('⚡ ELEVATE.AI REGISTRATION EMAIL OTP TEST SUITE');
  console.log('⚡ ================================================================\n');

  const testEmail = `candidate.otp.${Date.now()}@elevate-ai.io`;
  const testPassword = 'SecurePassword2026!';
  const testName = 'Ada Lovelace';

  // TEST 1: Submit Registration Form
  console.log('▶️ [Test 1/6] Submitting Create Account form (POST /api/auth/register)...');
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      targetRole: 'Staff Frontend Architect',
      experienceLevel: 'Staff',
    }),
  });
  const regData: any = await regRes.json();

  if (regRes.status !== 201 || !regData.requireOtp) {
    throw new Error(`Expected 201 with requireOtp: true, got ${regRes.status}: ${JSON.stringify(regData)}`);
  }

  if (regData.token) {
    throw new Error(`CRITICAL DEFECT: Token was returned on registration before OTP verification!`);
  }

  console.log('✅ Registration successfully initiated:');
  console.log(`   • Message: "${regData.message}"`);
  console.log(`   • Require OTP: ${regData.requireOtp}`);
  console.log(`   • JWT Token issued: NONE (Correct - No dashboard access before verification)\n`);

  // TEST 2: Verify unverified user is blocked from direct login
  console.log('▶️ [Test 2/6] Verifying unverified user is blocked from direct login...');
  const directLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });
  const directLoginData: any = await directLoginRes.json();
  if (directLoginRes.status !== 401 || !directLoginData.requireVerification) {
    throw new Error(`Expected 401 requireVerification, got ${directLoginRes.status}: ${JSON.stringify(directLoginData)}`);
  }
  console.log('✅ Direct login blocked for unverified user (401 Unauthorized - Verification Required).\n');

  // TEST 3: Enter Incorrect OTP
  console.log('▶️ [Test 3/6] Testing rejection of incorrect OTP...');
  const wrongOtpRes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: '000000',
      type: 'verification',
    }),
  });
  const wrongOtpData: any = await wrongOtpRes.json();
  if (wrongOtpRes.status !== 400) {
    throw new Error(`Expected 400 for incorrect OTP, got ${wrongOtpRes.status}`);
  }
  if (wrongOtpData.token) {
    throw new Error(`CRITICAL DEFECT: Token issued on incorrect OTP!`);
  }
  console.log('✅ Incorrect OTP correctly rejected (400 Bad Request) with no token.\n');

  // TEST 4: Enter Correct OTP and complete verification
  console.log('▶️ [Test 4/6] Verifying correct OTP...');
  const actualOtp = regData.demoOtp || '123456';

  const correctVerifyRes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: actualOtp,
      type: 'verification',
    }),
  });
  const correctVerifyData: any = await correctVerifyRes.json();

  if (correctVerifyRes.status !== 200 || !correctVerifyData.token || !correctVerifyData.user) {
    throw new Error(`OTP Verification failed: ${JSON.stringify(correctVerifyData)}`);
  }

  console.log('✅ Correct OTP verified successfully:');
  console.log(`   • JWT Token issued: ${correctVerifyData.token.slice(0, 30)}...`);
  console.log(`   • User Profile: Name="${correctVerifyData.user.name}", Role="${correctVerifyData.user.targetRole}"`);
  console.log(`   • Account is now authenticated.\n`);

  // TEST 5: Normal Sign In regression test (Email + Password -> Direct Dashboard Access)
  console.log('▶️ [Test 5/6] Testing standard Sign In for verified user (Email + Password)...');
  const normalLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      keepMeSignedIn: true,
    }),
  });
  const normalLoginData: any = await normalLoginRes.json();
  if (normalLoginRes.status !== 200 || !normalLoginData.token) {
    throw new Error(`Normal login failed: ${JSON.stringify(normalLoginData)}`);
  }
  console.log('✅ Standard Sign In works directly with Email + Password (NO OTP required for normal login).\n');

  // TEST 6: Forgot Password Flow regression test
  console.log('▶️ [Test 6/6] Testing Forgot Password flow regression...');
  const sendForgotRes = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      type: 'reset_password',
    }),
  });
  const sendForgotData: any = await sendForgotRes.json();
  if (sendForgotRes.status !== 200 || !sendForgotData.demoOtp) {
    throw new Error(`Forgot password send OTP failed: ${JSON.stringify(sendForgotData)}`);
  }

  const verifyForgotRes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: sendForgotData.demoOtp,
      type: 'reset_password',
    }),
  });
  const verifyForgotData: any = await verifyForgotRes.json();
  if (verifyForgotRes.status !== 200 || !verifyForgotData.resetToken) {
    throw new Error(`Forgot password verify OTP failed: ${JSON.stringify(verifyForgotData)}`);
  }

  console.log('✅ Forgot password flow functions seamlessly with reset token acquired.\n');

  console.log('🎉 ================================================================');
  console.log('🎉 ALL 6/6 AUTH & REGISTRATION OTP TESTS PASSED');
  console.log('🎉 ================================================================\n');
}

runRegistrationOtpTestSuite().catch((err) => {
  console.error('❌ Registration OTP test failed:', err);
  process.exit(1);
});
