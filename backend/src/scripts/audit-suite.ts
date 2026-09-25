import { ENV } from '../config/env.js';

interface AuditResult {
  id: number;
  title: string;
  status: 'VERIFIED LIVE' | 'PARTIALLY WORKING' | 'BROKEN' | 'NOT VERIFIED';
  browserResult: string;
  endpoint: string;
  dbInteraction: string;
  exactError: string | null;
  files: string[];
  recommendation: string;
}

const results: AuditResult[] = [];

async function runAudit() {
  console.log('🔍 ================================================================');
  console.log('🔍 ELEVATE.AI COMPREHENSIVE LIVE PRODUCTION AUDIT');
  console.log('🔍 ================================================================\n');

  const backendUrl = 'http://localhost:5000/api';
  const frontendUrl = 'http://localhost:5173';
  const pythonUrl = 'http://localhost:8000';

  // 1. Landing page loads
  console.log('▶️ [Audit 1] Testing Landing Page HTML delivery...');
  try {
    const res = await fetch(frontendUrl);
    const html = await res.text();
    const titleMatch = html.includes('<title>') || html.includes('ELEVATE') || html.includes('root');
    console.log(`   • Frontend HTTP Status: ${res.status}, Contains root element: ${titleMatch}`);
  } catch (e: any) {
    console.log(`   • Error: ${e.message}`);
  }

  // 2 & 3. Public vs Protected routing
  console.log('▶️ [Audit 2 & 3] Checking Public & Protected routing endpoints...');
  try {
    const publicRes = await fetch(`${backendUrl}/health`);
    console.log(`   • Public Health API Status: ${publicRes.status}`);

    const protectedRes = await fetch(`${backendUrl}/interview/history`);
    console.log(`   • Unauthenticated Protected Route (/interview/history) Status: ${protectedRes.status} (Expected 401)`);
  } catch (e: any) {
    console.log(`   • Error: ${e.message}`);
  }

  // 4. Sign In Flow
  console.log('▶️ [Audit 4] Testing Sign In flow with Invalid & Valid credentials...');
  try {
    const invalidRes = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@elevate.ai', password: 'wrongpassword' }),
    });
    const invalidData: any = await invalidRes.json();
    console.log(`   • Invalid Login Status: ${invalidRes.status}, Error Message: "${invalidData.error}"`);

    const validRes = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.chen@elevate.ai', password: 'Password@123' }),
    });
    const validData: any = await validRes.json();
    console.log(`   • Valid Login Status: ${validRes.status}, Token Present: ${Boolean(validData.token)}, User: ${validData.user?.name}`);
  } catch (e: any) {
    console.log(`   • Error: ${e.message}`);
  }

  // 5. Create Account Flow (OTP requirement)
  console.log('▶️ [Audit 5] Testing Create Account & Email OTP flow...');
  const testRegEmail = `test_candidate_${Date.now()}@example.com`;
  try {
    const regRes = await fetch(`${backendUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Audit Test Candidate',
        email: testRegEmail,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      }),
    });
    const regData: any = await regRes.json();
    console.log(`   • Register Submit Status: ${regRes.status}, Response:`, JSON.stringify(regData));

    // Test verify with wrong OTP
    const wrongOtpRes = await fetch(`${backendUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testRegEmail,
        otp: '000000',
      }),
    });
    const wrongOtpData: any = await wrongOtpRes.json();
    console.log(`   • Invalid OTP Verification Status: ${wrongOtpRes.status}, Error: "${wrongOtpData.error}"`);
  } catch (e: any) {
    console.log(`   • Error: ${e.message}`);
  }

  // 6. Forgot Password Flow
  console.log('▶️ [Audit 6] Testing Forgot Password endpoint...');
  try {
    const forgotRes = await fetch(`${backendUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.chen@elevate.ai' }),
    });
    const forgotData: any = await forgotRes.json();
    console.log(`   • Forgot Password Request Status: ${forgotRes.status}, Message:`, JSON.stringify(forgotData));
  } catch (e: any) {
    console.log(`   • Error: ${e.message}`);
  }

  // 7. Session persistence & Auth token verification
  console.log('▶️ [Audit 7] Testing Token Verification (/auth/me)...');
  try {
    const loginRes = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.chen@elevate.ai', password: 'Password@123' }),
    });
    const loginData: any = await loginRes.json();
    const token = loginData.token;

    const meRes = await fetch(`${backendUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData: any = await meRes.json();
    console.log(`   • GET /auth/me Status: ${meRes.status}, User: ${meData.user?.email}`);
  } catch (e: any) {
    console.log(`   • Error: ${e.message}`);
  }

  // 8. Python NLP Service & Resume parsing
  console.log('▶️ [Audit 8] Testing Python NLP Service direct & backend integration...');
  try {
    const nlpHealth = await fetch(`${pythonUrl}/health`).then(r => r.json());
    console.log('   • Python NLP Health:', JSON.stringify(nlpHealth));

    // Test text extraction endpoint
    const parseRes = await fetch(`${pythonUrl}/parse-resume-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text: 'Senior Software Engineer with 7 years experience in React, TypeScript, Node.js, GraphQL, Docker, Kubernetes, AWS, PostgreSQL, MongoDB, Redis, CI/CD pipelines, System Design, Microservices, and Vitest.',
        target_role: 'Senior Full Stack Engineer',
      }),
    });
    const parseData: any = await parseRes.json();
    console.log(`   • NLP Text Parse Status: ${parseRes.status}, ATS Score: ${parseData.ats_score}, Extracted Skills (${parseData.extracted_skills?.length}):`, parseData.extracted_skills);
  } catch (e: any) {
    console.log(`   • Error: ${e.message}`);
  }

  // 12. Code Sandbox Execution
  console.log('▶️ [Audit 12] Testing Code Sandbox Execution API...');
  try {
    const loginRes = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.chen@elevate.ai', password: 'Password@123' }),
    });
    const { token } = await loginRes.json();

    const codeRes = await fetch(`${backendUrl}/code/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        language: 'javascript',
        code: 'console.log("Hello from Sandbox!"); const sum = (a,b) => a+b; console.log("Result:", sum(10, 25));',
      }),
    });
    const codeData: any = await codeRes.json();
    console.log(`   • Code Sandbox Execute Status: ${codeRes.status}, Output:`, JSON.stringify(codeData));
  } catch (e: any) {
    console.log(`   • Error: ${e.message}`);
  }

  // 15. PDF Export
  console.log('▶️ [Audit 15] Testing PDF Report generation endpoint...');
  try {
    const loginRes = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.chen@elevate.ai', password: 'Password@123' }),
    });
    const { token } = await loginRes.json();

    // First get a session
    const histRes = await fetch(`${backendUrl}/interview/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const histData: any = await histRes.json();
    const sessionId = histData.sessions?.[0]?._id;
    console.log(`   • Available Session for PDF Export: ${sessionId}`);

    if (sessionId) {
      const pdfRes = await fetch(`${backendUrl}/interview/export-pdf/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pdfHeader = pdfRes.headers.get('content-type');
      const pdfBuffer = await pdfRes.arrayBuffer();
      console.log(`   • PDF Export Status: ${pdfRes.status}, Content-Type: ${pdfHeader}, Bytes: ${pdfBuffer.byteLength}`);
    }
  } catch (e: any) {
    console.log(`   • Error: ${e.message}`);
  }

  // 16. Scorecard Sharing & Revocation
  console.log('▶️ [Audit 16] Testing Public Scorecard Sharing, Access & Revocation...');
  try {
    const loginRes = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.chen@elevate.ai', password: 'Password@123' }),
    });
    const { token } = await loginRes.json();

    const histRes = await fetch(`${backendUrl}/interview/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const histData: any = await histRes.json();
    const sessionId = histData.sessions?.[0]?._id;

    if (sessionId) {
      // 1. Share
      const shareRes = await fetch(`${backendUrl}/interview/share/${sessionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const shareData: any = await shareRes.json();
      console.log(`   • Generate Share Link Status: ${shareRes.status}, ShareId: ${shareData.shareId}`);

      // 2. Access Publicly (No Auth)
      const pubRes = await fetch(`${backendUrl}/interview/public/scorecard/${shareData.shareId}`);
      const pubData: any = await pubRes.json();
      console.log(`   • Public Access Status: ${pubRes.status}, Tier: ${pubData.report?.performanceTier}, Email Excluded: ${!pubData.report?.userEmail}`);

      // 3. Revoke
      const revokeRes = await fetch(`${backendUrl}/interview/share/${sessionId}/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`   • Revoke Share Link Status: ${revokeRes.status}`);

      // 4. Access after Revoke
      const afterRevokeRes = await fetch(`${backendUrl}/interview/public/scorecard/${shareData.shareId}`);
      console.log(`   • Access Revoked Link Status: ${afterRevokeRes.status} (Expected 404/403)`);
    }
  } catch (e: any) {
    console.log(`   • Error: ${e.message}`);
  }

  // 17. In-App Notifications
  console.log('▶️ [Audit 17] Testing In-App Notifications endpoints...');
  try {
    const loginRes = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.chen@elevate.ai', password: 'Password@123' }),
    });
    const { token } = await loginRes.json();

    const notifRes = await fetch(`${backendUrl}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const notifData: any = await notifRes.json();
    console.log(`   • GET /notifications Status: ${notifRes.status}, Count: ${notifData.notifications?.length}`);

    const unreadRes = await fetch(`${backendUrl}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const unreadData: any = await unreadRes.json();
    console.log(`   • GET /notifications/unread-count Status: ${unreadRes.status}, Unread: ${unreadData.unreadCount}`);
  } catch (e: any) {
    console.log(`   • Error: ${e.message}`);
  }

  // 18. User Settings
  console.log('▶️ [Audit 18] Testing User Settings endpoints...');
  try {
    const loginRes = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.chen@elevate.ai', password: 'Password@123' }),
    });
    const { token } = await loginRes.json();

    const getSettingsRes = await fetch(`${backendUrl}/user/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getSettingsData: any = await getSettingsRes.json();
    console.log(`   • GET /user/settings Status: ${getSettingsRes.status}, Role: ${getSettingsData.settings?.targetRole}`);

    const putSettingsRes = await fetch(`${backendUrl}/user/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        targetRole: 'Principal Systems Architect',
        primaryDomain: 'Distributed Systems',
      }),
    });
    const putSettingsData: any = await putSettingsRes.json();
    console.log(`   • PUT /user/settings Status: ${putSettingsRes.status}, Updated Role: ${putSettingsData.settings?.targetRole}`);
  } catch (e: any) {
    console.log(`   • Error: ${e.message}`);
  }

  // 19 & 20. Multi-User Isolation & Security Audit
  console.log('▶️ [Audit 19 & 20] Testing Multi-Tenant Data Isolation & Security...');
  try {
    // User A
    const loginARes = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.chen@elevate.ai', password: 'Password@123' }),
    });
    const { token: tokenA } = await loginARes.json();

    // Start session for User A
    const sessionARes = await fetch(`${backendUrl}/interview/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        domain: 'Frontend',
        difficulty: 'Senior',
        count: 1,
      }),
    });
    const { sessionId: sessionAId } = await sessionARes.json();

    // User B (Create a separate token for User B)
    const jwt = (await import('jsonwebtoken')).default;
    const mongoose = (await import('mongoose')).default;
    const userBId = new mongoose.Types.ObjectId().toString();
    const tokenB = jwt.sign(
      { userId: userBId, email: 'user_b@elevate.ai', role: 'user' },
      ENV.JWT_SECRET || 'fallback-secret-for-dev',
      { expiresIn: '1h' }
    );

    // User B tries to read User A's session
    const hackSessionRes = await fetch(`${backendUrl}/interview/${sessionAId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    console.log(`   • Cross-Tenant Access to Session Status: ${hackSessionRes.status} (Expected 403 Forbidden)`);

    // User B tries to export User A's PDF
    const hackPdfRes = await fetch(`${backendUrl}/interview/export-pdf/${sessionAId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    console.log(`   • Cross-Tenant PDF Export Status: ${hackPdfRes.status} (Expected 403 Forbidden)`);
  } catch (e: any) {
    console.log(`   • Error: ${e.message}`);
  }

  console.log('\n✅ Audit suite execution finished.');
}

runAudit();
