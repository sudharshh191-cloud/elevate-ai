const API_BASE = 'http://localhost:5000/api';

async function runMockArenaE2E() {
  console.log('🚀 ================================================================');
  console.log('🚀 ELEVATE.AI MOCK ARENA END-TO-END VERIFICATION SUITE');
  console.log('🚀 ================================================================\n');

  // Step 1: Register a new candidate
  const candidateEmail = `e2e.candidate.${Date.now()}@elevate-ai.io`;
  const candidatePassword = 'CandidatePassword2026!';
  console.log(`▶️ [1/10] Registering candidate: ${candidateEmail}...`);

  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'E2E Test Candidate',
      email: candidateEmail,
      password: candidatePassword,
      targetRole: 'Staff Frontend Architect',
      experienceLevel: 'Staff',
    }),
  });

  const regData: any = await regRes.json();
  if (!regRes.ok || !regData.token) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }
  const token = regData.token;
  const userId = regData.user.id || regData.user._id;
  console.log(`✅ Registered candidate successfully. UserID=${userId}, Token prefix=${token.substring(0, 20)}...\n`);

  // Step 2: Test Unauthenticated Access Rejection (Security Check)
  console.log('▶️ [2/10] Testing security authorization barriers (401 unauthenticated)...');
  const unauthRes = await fetch(`${API_BASE}/interview/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain: 'Frontend', difficulty: 'Senior', format: 'Hybrid' }),
  });
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 Unauthorized for unauthenticated request, got ${unauthRes.status}`);
  }
  console.log('✅ Unauthenticated /interview/start correctly rejected with 401 Unauthorized.\n');

  // Step 3: Start Real Interview Assessment Session
  console.log('▶️ [3/10] Calling POST /api/interview/start with Frontend / Senior / Hybrid config...');
  const startRes = await fetch(`${API_BASE}/interview/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      domain: 'Frontend',
      difficulty: 'Senior',
      format: 'Hybrid',
      targetRole: 'Staff Frontend Architect',
      customTopicFocus: 'Browser Rendering & Virtualization',
      count: 2,
    }),
  });

  const startData: any = await startRes.json();
  if (!startRes.ok || !startData.sessionId) {
    throw new Error(`Start interview failed: ${JSON.stringify(startData)}`);
  }

  const sessionId = startData.sessionId;
  const questions = startData.session.questions;
  console.log(`✅ Interview session initialized in MongoDB! SessionID=${sessionId}`);
  console.log(`   Questions returned: ${questions.length}`);
  console.log(`   Q1 Title: "${questions[0].questionText.slice(0, 80)}..." (Source: ${questions[0].source || 'LIVE_AI'})`);
  console.log(`   Q1 Rubric criteria count: ${questions[0].rubricCriteria?.length || 0}\n`);

  // Step 4: Verify Session Persistence & State Retrieval (GET /api/interview/:sessionId)
  console.log(`▶️ [4/10] Calling GET /api/interview/${sessionId} to verify session state restore...`);
  const getSessRes = await fetch(`${API_BASE}/interview/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getSessData: any = await getSessRes.json();
  if (!getSessRes.ok || getSessData.session._id !== sessionId) {
    throw new Error(`Get session failed: ${JSON.stringify(getSessData)}`);
  }
  console.log(`✅ Session state verified: Status=${getSessData.session.status}, CurrentQuestionIndex=${getSessData.session.currentQuestionIndex}\n`);

  // Step 5: Submit Question 1 (Voice / Architectural Transcript)
  console.log('▶️ [5/10] Submitting Question 1 response (Voice Transcript)...');
  const q1ResponseText =
    'In designing an infinite scroll virtual list for 100,000 items, I calculate the visible window with startIndex and endIndex derived from scrollTop divided by itemHeight. I use CSS transform translateY with will-change to bypass CPU layout reflows and render directly on the GPU compositor. I allocate an overscan buffer of 5 elements to ensure 60fps scrolling without blank frames.';

  const submitQ1Res = await fetch(`${API_BASE}/interview/submit-response`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      sessionId,
      questionIndex: 0,
      responseType: 'voice_transcript',
      textResponse: q1ResponseText,
      audioMetrics: {
        durationSeconds: 140,
        wpm: 135,
        fillerWordsCount: 1,
        confidenceScore: 92,
      },
      timeSpentSeconds: 140,
    }),
  });

  const q1Data: any = await submitQ1Res.json();
  if (!submitQ1Res.ok || !q1Data.evaluation) {
    throw new Error(`Submit Q1 failed: ${JSON.stringify(q1Data)}`);
  }
  console.log(`✅ Question 1 Evaluated via Gemini!`);
  console.log(`   Overall Score: ${q1Data.evaluation.score}% (Technical: ${q1Data.evaluation.technicalAccuracyScore}%, Communication: ${q1Data.evaluation.communicationScore}%)`);
  console.log(`   Strengths: ${JSON.stringify(q1Data.evaluation.instantFeedback.strengths)}`);
  console.log(`   Coach Note: "${q1Data.evaluation.instantFeedback.coachNote}"\n`);

  // Step 6: Test Duplicate Submission Idempotency
  console.log('▶️ [6/10] Testing duplicate submission protection (re-submitting Q1)...');
  const reSubmitQ1 = await fetch(`${API_BASE}/interview/submit-response`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      sessionId,
      questionIndex: 0,
      responseType: 'voice_transcript',
      textResponse: q1ResponseText,
      timeSpentSeconds: 140,
    }),
  });
  const reSubmitData: any = await reSubmitQ1.json();
  if (!reSubmitQ1.ok) {
    throw new Error(`Re-submit Q1 failed: ${JSON.stringify(reSubmitData)}`);
  }
  // Check that session has exactly 1 response in DB, not 2
  const checkSessRes = await fetch(`${API_BASE}/interview/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const checkSessData: any = await checkSessRes.json();
  if (checkSessData.session.responses.length !== 1) {
    throw new Error(`Expected 1 response in session after idempotent re-submit, found ${checkSessData.session.responses.length}`);
  }
  console.log('✅ Duplicate protection verified: Exactly 1 response stored for Q1.\n');

  // Step 7: Submit Question 2 (Code Submission)
  console.log('▶️ [7/10] Submitting Question 2 response (TypeScript Solution)...');
  const q2Code = `
class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  put(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    }
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
  }
}
`;

  const submitQ2Res = await fetch(`${API_BASE}/interview/submit-response`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      sessionId,
      questionIndex: 1,
      responseType: 'code',
      codeSubmission: {
        code: q2Code,
        language: 'typescript',
      },
      timeSpentSeconds: 180,
    }),
  });

  const q2Data: any = await submitQ2Res.json();
  if (!submitQ2Res.ok || !q2Data.evaluation) {
    throw new Error(`Submit Q2 failed: ${JSON.stringify(q2Data)}`);
  }
  console.log(`✅ Question 2 Code Evaluated via Gemini!`);
  console.log(`   Overall Score: ${q2Data.evaluation.score}%`);
  console.log(`   isFinished: ${q2Data.isFinished}\n`);

  // Step 8: Finish Interview Session (POST /api/interview/finish)
  console.log(`▶️ [8/10] Finishing interview session (POST /api/interview/finish)...`);
  const finishRes = await fetch(`${API_BASE}/interview/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionId }),
  });

  const finishData: any = await finishRes.json();
  if (!finishRes.ok || !finishData.report) {
    throw new Error(`Finish interview failed: ${JSON.stringify(finishData)}`);
  }

  const report = finishData.report;
  console.log('✅ Final 360° Feedback Report generated and persisted to MongoDB!');
  console.log(`   Report ID: ${report.reportId || report._id}`);
  console.log(`   Overall Assessment Score: ${report.overallScore}/100`);
  console.log(`   Performance Tier: ${report.performanceTier}`);
  console.log(`   Technical Accuracy: ${report.metrics.technicalAccuracy}%`);
  console.log(`   Executive Summary: "${report.executiveSummary.slice(0, 100)}..."`);
  console.log(`   Radar Metrics Count: ${report.radarChartData?.length || 0}`);
  console.log(`   Actionable Roadmap Weeks: ${report.actionableRoadmap?.length || 0}\n`);

  // Step 9: Verify Real Scorecard via GET /api/interview/feedback/:sessionId
  console.log(`▶️ [9/10] Verifying GET /api/interview/feedback/${sessionId}...`);
  const feedbackRes = await fetch(`${API_BASE}/interview/feedback/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const feedbackData: any = await feedbackRes.json();
  if (!feedbackRes.ok || !feedbackData.report) {
    throw new Error(`Get feedback failed: ${JSON.stringify(feedbackData)}`);
  }
  console.log(`✅ Scorecard verified from MongoDB: Score=${feedbackData.report.overallScore}, Domain=${feedbackData.report.domain}\n`);

  // Step 10: Verify Interview History (GET /api/interview/history)
  console.log('▶️ [10/10] Verifying GET /api/interview/history...');
  const historyRes = await fetch(`${API_BASE}/interview/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const historyData: any = await historyRes.json();
  if (!historyRes.ok || !historyData.sessions?.length) {
    throw new Error(`History fetch failed: ${JSON.stringify(historyData)}`);
  }
  const historyItem = historyData.sessions.find((s: any) => s._id === sessionId);
  if (!historyItem) {
    throw new Error('Completed session not found in candidate history list');
  }
  console.log(`✅ Completed session found in candidate history: Title="${historyItem.title}", Status="${historyItem.status}"\n`);

  console.log('🎉 ================================================================');
  console.log('🎉 ALL 10/10 MOCK ARENA END-TO-END TESTS PASSED SUCCESSFULLY');
  console.log('🎉 ================================================================\n');
}

runMockArenaE2E().catch((err) => {
  console.error('❌ Mock arena E2E test failed:', err);
  process.exit(1);
});
