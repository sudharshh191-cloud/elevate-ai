import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { FeedbackReport } from '../models/FeedbackReport.js';
import { Notification } from '../models/Notification.js';
import { UserSettings } from '../models/UserSettings.js';

const API_BASE = 'http://localhost:5000/api';

async function runPhase4Tests() {
  console.log('⚡ ================================================================');
  console.log('⚡ ELEVATE.AI PHASE 4: COMPREHENSIVE END-TO-END VERIFICATION');
  console.log('⚡ Reports, Sharing, History, Notifications & Settings');
  console.log('⚡ ================================================================\n');

  let passedTests = 0;
  const totalTests = 14;

  // -------------------------------------------------------------
  // TEST 1: User A & User B Setup & Authentication
  // -------------------------------------------------------------
  console.log('▶️ [TEST 1/14] Setting up User A and User B in MongoDB...');
  const userAEmail = 'user_a_phase4@elevate.ai';
  const userBEmail = 'user_b_phase4@elevate.ai';
  const password = 'StrongPasswordPhase4!';

  await User.deleteMany({ email: { $in: [userAEmail, userBEmail] } });

  const userA = await User.create({
    name: 'Alice Architect',
    email: userAEmail,
    passwordHash: await bcrypt.hash(password, 10),
    isVerified: true,
    targetRole: 'Staff Distributed Systems Architect',
    experienceLevel: 'Staff',
  });

  const userB = await User.create({
    name: 'Bob Candidate',
    email: userBEmail,
    passwordHash: await bcrypt.hash(password, 10),
    isVerified: true,
    targetRole: 'Junior Frontend Developer',
    experienceLevel: 'Junior',
  });

  // Login User A
  const loginARes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, password }),
  });
  const loginAData = await loginARes.json();
  const tokenA = loginAData.token;

  // Login User B
  const loginBRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userBEmail, password }),
  });
  const loginBData = await loginBRes.json();
  const tokenB = loginBData.token;

  if (!tokenA || !tokenB) throw new Error('Failed to obtain JWTs for User A and User B');
  console.log('✅ User A and User B authenticated with real JWTs.');
  passedTests++;

  // -------------------------------------------------------------
  // TEST 2: Create Completed Interview & FeedbackReport for User A
  // -------------------------------------------------------------
  console.log('\n▶️ [TEST 2/14] Creating completed InterviewSession and FeedbackReport for User A...');
  const sessionA = await InterviewSession.create({
    userId: userA._id,
    title: 'Staff Distributed Systems Mock Assessment',
    domain: 'System Design',
    difficulty: 'Staff',
    format: 'Hybrid',
    status: 'completed',
    questions: [
      {
        questionText: 'Design a globally distributed multi-region rate limiter with sub-millisecond latency.',
        domain: 'System Design',
        category: 'Distributed Systems',
        difficulty: 'Staff',
        format: 'Hybrid',
        expectedDurationMinutes: 10,
        rubricCriteria: [{ title: 'Consistency & Partitioning', weight: 40, keyPointsToLookFor: ['Token bucket', 'Redis replication'] }],
        idealAnswerOutline: 'Hierarchical token bucket with local caching and asynchronous reconciliation via Kafka.',
        hints: ['Consider local memory vs remote state store trade-offs'],
      },
    ],
    responses: [
      {
        questionIndex: 0,
        questionText: 'Design a globally distributed multi-region rate limiter with sub-millisecond latency.',
        format: 'Hybrid',
        responseType: 'text',
        textResponse: 'We utilize local sliding window counters synchronized via Redis cluster with async Raft consensus.',
        timeSpentSeconds: 420,
        instantFeedback: {
          score: 92,
          technicalAccuracy: 95,
          communication: 90,
          strengths: ['Clear latency trade-offs', 'Robust consistency model'],
          improvements: ['Elaborate on split-brain scenarios'],
          coachNote: 'Exceptional architectural depth.',
        },
        evaluationDetails: {
          keyPointsCovered: ['Sliding window algorithm', 'Local Redis caching'],
          keyPointsMissed: ['Network partition recovery'],
          constructiveCritique: 'Superb breakdown with deep awareness of network partitions.',
        },
        submittedAt: new Date(),
      },
    ],
    totalDurationSeconds: 420,
  });

  const feedbackA = await FeedbackReport.create({
    sessionId: sessionA._id,
    userId: userA._id,
    domain: 'System Design',
    difficulty: 'Staff',
    overallScore: 92,
    performanceTier: 'Exceptional',
    metrics: {
      technicalAccuracy: 95,
      communicationClarity: 90,
      problemSolving: 93,
      confidenceAndDelivery: 88,
      codeQualityAndEfficiency: 92,
    },
    radarChartData: [
      { metric: 'Architecture', score: 95, benchmark: 75 },
      { metric: 'Scalability', score: 93, benchmark: 70 },
      { metric: 'Communication', score: 90, benchmark: 75 },
    ],
    topStrengths: ['Deep distributed systems knowledge', 'Clear latency/consistency trade-offs'],
    criticalGaps: ['Flesh out split-brain partition recovery handling'],
    actionableRoadmap: [
      {
        week: 1,
        topic: 'Distributed Consensus & Raft/Paxos',
        recommendedAction: 'Study edge-case partition behavior in multi-raft groups.',
        practiceResources: ['Designing Data-Intensive Applications Ch 9'],
      },
    ],
    questionDetails: [
      {
        questionIndex: 0,
        questionText: sessionA.questions[0].questionText,
        category: 'Distributed Systems',
        userResponseText: sessionA.responses[0].textResponse,
        score: 92,
        technicalAccuracyScore: 95,
        communicationScore: 90,
        idealAnswerSummary: sessionA.questions[0].idealAnswerOutline,
        keyPointsCovered: ['Sliding window algorithm', 'Local Redis caching'],
        keyPointsMissed: ['Network partition recovery'],
        constructiveCritique: 'Superb breakdown with deep awareness of network partitions.',
      },
    ],
    executiveSummary: 'Candidate demonstrated exceptional architectural mastery of distributed systems and high-throughput rate limiting.',
  });

  sessionA.feedbackReportRef = feedbackA._id as Types.ObjectId;
  await sessionA.save();
  console.log(`✅ Session and FeedbackReport created in MongoDB (Session ID: ${sessionA._id})`);
  passedTests++;

  // -------------------------------------------------------------
  // TEST 3: Generate Real Server-Side PDF Report
  // -------------------------------------------------------------
  console.log('\n▶️ [TEST 3/14] Testing PDF Scorecard Generation (GET /api/interview/export-pdf/:sessionId)...');
  const pdfRes = await fetch(`${API_BASE}/interview/export-pdf/${sessionA._id}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });

  const contentType = pdfRes.headers.get('content-type');
  const pdfArrayBuffer = await pdfRes.arrayBuffer();
  const pdfBuffer = Buffer.from(pdfArrayBuffer);
  const pdfHeader = pdfBuffer.slice(0, 5).toString('utf-8');

  console.log(`   • Status: ${pdfRes.status} (Expected: 200)`);
  console.log(`   • Content-Type: ${contentType} (Expected: application/pdf)`);
  console.log(`   • PDF Buffer Size: ${pdfBuffer.length} bytes`);
  console.log(`   • Header Bytes: "${pdfHeader}" (Expected: %PDF-)`);

  if (pdfRes.status !== 200 || !contentType?.includes('application/pdf') || pdfBuffer.length < 500 || !pdfHeader.startsWith('%PDF')) {
    throw new Error('PDF Generation test failed: Invalid PDF response');
  }
  console.log('✅ Real PDF report generated successfully.');
  passedTests++;

  // -------------------------------------------------------------
  // TEST 4: Security Check — User B cannot download User A's PDF
  // -------------------------------------------------------------
  console.log('\n▶️ [TEST 4/14] Security Check: User B attempts to export User A\'s PDF...');
  const unauthPdfRes = await fetch(`${API_BASE}/interview/export-pdf/${sessionA._id}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log(`   • Status: ${unauthPdfRes.status} (Expected: 403 Forbidden)`);
  if (unauthPdfRes.status !== 403) {
    throw new Error(`Unauthorized PDF access was not blocked! Received: ${unauthPdfRes.status}`);
  }
  console.log('✅ Security check passed: User B is forbidden (403) from downloading User A\'s PDF.');
  passedTests++;

  // -------------------------------------------------------------
  // TEST 5: Scorecard Sharing Link Generation
  // -------------------------------------------------------------
  console.log('\n▶️ [TEST 5/14] Generating Scorecard Share Link (POST /api/interview/share/:sessionId)...');
  const shareRes = await fetch(`${API_BASE}/interview/share/${sessionA._id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const shareData = await shareRes.json();
  console.log(`   • Status: ${shareRes.status} (Expected: 200)`);
  console.log(`   • Share ID: "${shareData.shareId}"`);
  console.log(`   • Share URL: "${shareData.shareUrl}"`);
  console.log(`   • Share Enabled: ${shareData.shareEnabled}`);

  if (shareRes.status !== 200 || !shareData.shareId || !shareData.shareEnabled) {
    throw new Error(`Share link generation failed: ${JSON.stringify(shareData)}`);
  }
  console.log('✅ Scorecard share link created and persisted in MongoDB.');
  passedTests++;

  // -------------------------------------------------------------
  // TEST 6: Public Access to Shared Scorecard (NO JWT Required)
  // -------------------------------------------------------------
  console.log('\n▶️ [TEST 6/14] Testing Public Scorecard Access (GET /api/public/scorecard/:shareId without JWT)...');
  const publicRes = await fetch(`${API_BASE}/public/scorecard/${shareData.shareId}`);
  const publicData = await publicRes.json();
  console.log(`   • Status: ${publicRes.status} (Expected: 200)`);
  console.log(`   • Candidate Name: "${publicData.report?.candidateName}"`);
  console.log(`   • Overall Score: ${publicData.report?.overallScore}`);
  console.log(`   • Performance Tier: ${publicData.report?.performanceTier}`);
  console.log(`   • Questions in Public View: ${publicData.report?.questionDetails?.length}`);

  // Verify no private account fields leaked
  const leakedFields = ['passwordHash', 'email', 'userId', 'otp', 'token', 'auth'].filter(
    (field) => (publicData.report as any)[field] !== undefined
  );
  if (leakedFields.length > 0) {
    throw new Error(`Private fields leaked in public scorecard: ${leakedFields.join(', ')}`);
  }
  if (publicRes.status !== 200 || !publicData.report || publicData.report.overallScore !== 92) {
    throw new Error('Public scorecard verification failed');
  }
  console.log('✅ Public scorecard verified: Sanitized, read-only, zero sensitive data exposed.');
  passedTests++;

  // -------------------------------------------------------------
  // TEST 7: Revoke Scorecard Share Link
  // -------------------------------------------------------------
  console.log('\n▶️ [TEST 7/14] Revoking Scorecard Share Link (POST /api/interview/share/:sessionId/revoke)...');
  const revokeRes = await fetch(`${API_BASE}/interview/share/${sessionA._id}/revoke`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const revokeData = await revokeRes.json();
  console.log(`   • Status: ${revokeRes.status} (Expected: 200)`);
  console.log(`   • Share Enabled: ${revokeData.shareEnabled} (Expected: false)`);

  if (revokeRes.status !== 200 || revokeData.shareEnabled !== false) {
    throw new Error('Revoke share link failed');
  }
  console.log('✅ Scorecard share link revoked.');
  passedTests++;

  // -------------------------------------------------------------
  // TEST 8: Verify Revoked Link Returns 404
  // -------------------------------------------------------------
  console.log('\n▶️ [TEST 8/14] Verifying Access to Revoked Public Link...');
  const revokedPublicRes = await fetch(`${API_BASE}/public/scorecard/${shareData.shareId}`);
  console.log(`   • Status: ${revokedPublicRes.status} (Expected: 404 Not Found)`);
  if (revokedPublicRes.status !== 404) {
    throw new Error(`Revoked scorecard should return 404! Received: ${revokedPublicRes.status}`);
  }
  console.log('✅ Revoked public link immediately stopped working (404).');
  passedTests++;

  // -------------------------------------------------------------
  // TEST 9: Notification Fetching & Unread Count
  // -------------------------------------------------------------
  console.log('\n▶️ [TEST 9/14] Testing Notification Retrieval (GET /api/notifications)...');
  const notifRes = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const notifData = await notifRes.json();
  console.log(`   • Status: ${notifRes.status} (Expected: 200)`);
  console.log(`   • Total Notifications: ${notifData.total}`);
  console.log(`   • Unread Count: ${notifData.unreadCount}`);
  if (notifData.notifications?.length > 0) {
    console.log(`   • Latest Notification: "${notifData.notifications[0].title}" - "${notifData.notifications[0].message}"`);
  }

  if (notifRes.status !== 200 || notifData.unreadCount < 1) {
    throw new Error('Notification retrieval test failed');
  }
  console.log('✅ Notifications retrieved successfully with accurate unread counts.');
  passedTests++;

  // -------------------------------------------------------------
  // TEST 10: Mark Single Notification Read
  // -------------------------------------------------------------
  console.log('\n▶️ [TEST 10/14] Marking Single Notification as Read (PUT /api/notifications/:id/read)...');
  const targetNotifId = notifData.notifications[0]._id;
  const markOneRes = await fetch(`${API_BASE}/notifications/${targetNotifId}/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const markOneData = await markOneRes.json();
  console.log(`   • Status: ${markOneRes.status} (Expected: 200)`);
  console.log(`   • Updated Unread Count: ${markOneData.unreadCount}`);

  if (markOneRes.status !== 200 || !markOneData.notification?.read) {
    throw new Error('Failed to mark individual notification as read');
  }
  console.log('✅ Single notification marked read.');
  passedTests++;

  // -------------------------------------------------------------
  // TEST 11: Mark All Notifications Read
  // -------------------------------------------------------------
  console.log('\n▶️ [TEST 11/14] Marking All Notifications as Read (PUT /api/notifications/read-all)...');
  const markAllRes = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const markAllData = await markAllRes.json();
  console.log(`   • Status: ${markAllRes.status} (Expected: 200)`);
  console.log(`   • Unread Count: ${markAllData.unreadCount} (Expected: 0)`);

  if (markAllRes.status !== 200 || markAllData.unreadCount !== 0) {
    throw new Error('Failed to mark all notifications as read');
  }
  console.log('✅ All notifications marked as read.');
  passedTests++;

  // -------------------------------------------------------------
  // TEST 12: User Settings Persistence
  // -------------------------------------------------------------
  console.log('\n▶️ [TEST 12/14] Testing User Settings (GET/PUT /api/user/settings)...');
  const updateSettingsRes = await fetch(`${API_BASE}/user/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      targetRole: 'Principal Cloud & Distributed Systems Architect',
      preferredDomain: 'System Design',
      preferredDifficulty: 'Staff',
      preferredFormat: 'Hybrid',
      audioSensitivity: 85,
      enableLiveCoaching: true,
      enableVoiceAvatar: false,
      notifications: {
        emailAlerts: true,
        weeklyProgressSummary: true,
        interviewReminders: false,
      },
    }),
  });
  const updateSettingsData = await updateSettingsRes.json();
  console.log(`   • Update Status: ${updateSettingsRes.status}`);

  // Fetch settings back from MongoDB to verify persistence
  const getSettingsRes = await fetch(`${API_BASE}/user/settings`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const getSettingsData = await getSettingsRes.json();
  const s = getSettingsData.settings;

  console.log(`   • Persisted Target Role: "${s.targetRole}"`);
  console.log(`   • Persisted Audio Sensitivity: ${s.audioSensitivity}%`);
  console.log(`   • Persisted Preferred Domain: ${s.preferredDomain}`);

  if (
    s.targetRole !== 'Principal Cloud & Distributed Systems Architect' ||
    s.audioSensitivity !== 85 ||
    s.preferredDomain !== 'System Design'
  ) {
    throw new Error('User settings persistence test failed');
  }
  console.log('✅ User settings persisted in MongoDB and verified on fresh GET.');
  passedTests++;

  // -------------------------------------------------------------
  // TEST 13: Security Isolation — User B cannot modify User A's settings or revoke User A's share
  // -------------------------------------------------------------
  console.log('\n▶️ [TEST 13/14] Security Isolation Check: User B attempts unauthorized mutations...');
  // User B tries to revoke User A's scorecard
  const badRevoke = await fetch(`${API_BASE}/interview/share/${sessionA._id}/revoke`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log(`   • User B Revoking User A\'s Share: ${badRevoke.status} (Expected: 403 Forbidden)`);

  // User B tries to read User A's feedback
  const badFeedback = await fetch(`${API_BASE}/interview/feedback/${sessionA._id}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log(`   • User B Reading User A\'s Feedback: ${badFeedback.status} (Expected: 403 Forbidden)`);

  if (badRevoke.status !== 403 || badFeedback.status !== 403) {
    throw new Error('Security isolation failed: User B was able to perform unauthorized actions on User A data');
  }
  console.log('✅ Multi-tenant security isolation verified: 403 returned on unauthorized actions.');
  passedTests++;

  // -------------------------------------------------------------
  // TEST 14: Interview History Ownership & Pagination
  // -------------------------------------------------------------
  console.log('\n▶️ [TEST 14/14] Testing Interview History Ownership (GET /api/interview/history)...');
  const historyARes = await fetch(`${API_BASE}/interview/history?page=1&limit=5`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const historyAData = await historyARes.json();
  console.log(`   • User A History Count: ${historyAData.total} sessions`);

  const historyBRes = await fetch(`${API_BASE}/interview/history?page=1&limit=5`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const historyBData = await historyBRes.json();
  console.log(`   • User B History Count: ${historyBData.total} sessions (Expected: 0)`);

  if (historyAData.total < 1 || historyBData.total !== 0) {
    throw new Error('Interview history isolation failed');
  }
  console.log('✅ Interview history strictly scoped to authenticated user.');
  passedTests++;

  console.log('\n🎉 ================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} PHASE 4 TESTS PASSED WITH 100% SUCCESS`);
  console.log('🎉 ================================================================\n');
}

async function start() {
  try {
    const healthRes = await fetch(`${API_BASE}/health`);
    const health = await healthRes.json();
    const dbHost = health.database?.host || '127.0.0.1';
    const dbPort = health.database?.port || 27017;
    const dbName = health.database?.dbName || 'test';
    const dynamicUri = `mongodb://${dbHost}:${dbPort}/${dbName}`;
    console.log(`🔌 Connecting test runner to active MongoDB at: ${dynamicUri}`);
    await mongoose.connect(dynamicUri);
    await runPhase4Tests();
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 4 Verification Error:', err);
    process.exit(1);
  }
}

start();
