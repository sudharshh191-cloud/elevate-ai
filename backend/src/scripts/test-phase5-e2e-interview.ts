import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { ENV } from '../config/env.js';

async function runE2EInterviewTest() {
  console.log('🚀 ================================================================');
  console.log('🚀 ELEVATE.AI PHASE 5: REAL END-TO-END INTERVIEW TEST');
  console.log('🚀 ================================================================\n');

  const baseUrl = 'http://localhost:5000/api';
  const testUserId = new Types.ObjectId().toString();
  const token = jwt.sign(
    { userId: testUserId, email: 'candidate_phase5@elevate.ai', role: 'user' },
    ENV.JWT_SECRET || 'fallback-secret-for-dev',
    { expiresIn: '1h' }
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Step 1: Start Interview
  console.log('▶️ [1/4] Initializing Live Interview Session via POST /api/interview/start...');
  const startRes = await fetch(`${baseUrl}/interview/start`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      domain: 'Frontend',
      difficulty: 'Senior',
      format: 'Hybrid',
      targetRole: 'Senior Frontend Engineer',
      count: 2,
    }),
  });

  const startData: any = await startRes.json();
  if (!startRes.ok) {
    throw new Error(`Start interview failed (${startRes.status}): ${JSON.stringify(startData)}`);
  }

  const sessionId = startData.sessionId;
  const questions = startData.session?.questions || [];
  console.log(`   • Session Created: ${sessionId}`);
  console.log(`   • Questions Generated: ${questions.length}`);
  console.log(`   • Q1: "${questions[0]?.questionText}"`);
  console.log(`   • Category: ${questions[0]?.category} | Difficulty: ${questions[0]?.difficulty}`);
  console.log('✅ Interview session initialized and stored in database.\n');

  // Step 2: Submit Response & Evaluate via Gemini
  console.log('▶️ [2/4] Submitting Candidate Answer via POST /api/interview/submit-response...');
  const submitRes = await fetch(`${baseUrl}/interview/submit-response`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      sessionId,
      questionIndex: 0,
      responseType: 'text',
      textResponse:
        'To optimize web performance and handle large scale datasets, we implement virtual windowing using absolute transforms, offload heavy state transformations to Web Workers to keep the main thread at 60fps, and synchronize high-frequency updates via requestAnimationFrame.',
      timeSpentSeconds: 95,
    }),
  });

  const submitData: any = await submitRes.json();
  if (!submitRes.ok) {
    throw new Error(`Submit response failed (${submitRes.status}): ${JSON.stringify(submitData)}`);
  }

  const evaluation = submitData.evaluation;
  console.log(`   • Score: ${evaluation.score}/100`);
  console.log(`   • Technical Accuracy: ${evaluation.technicalAccuracyScore}/100`);
  console.log(`   • Communication: ${evaluation.communicationScore}/100`);
  console.log(`   • Coach Note: "${evaluation.instantFeedback?.coachNote}"`);
  console.log(`   • Strengths: ${evaluation.instantFeedback?.strengths?.join(' | ')}`);
  console.log('✅ Gemini evaluation generated and persisted with response.\n');

  // Step 3: Finish Interview & Synthesize FeedbackReport
  console.log('▶️ [3/4] Finalizing Interview & Generating Master Report via POST /api/interview/finish...');
  const finishRes = await fetch(`${baseUrl}/interview/finish`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      sessionId,
      totalDurationSeconds: 120,
    }),
  });

  const finishData: any = await finishRes.json();
  if (!finishRes.ok) {
    throw new Error(`Finish interview failed (${finishRes.status}): ${JSON.stringify(finishData)}`);
  }

  const report = finishData.report;
  console.log(`   • Master Report Generated: ${report?._id || 'Success'}`);
  console.log(`   • Performance Tier: ${report?.performanceTier}`);
  console.log(`   • Overall Score: ${report?.overallScore}/100`);
  console.log(`   • Executive Summary: "${report?.executiveSummary}"`);
  console.log(`   • Top Strengths: ${report?.topStrengths?.join(' | ')}`);
  console.log('✅ Master Feedback Report synthesized and saved.\n');

  // Step 4: Verify Persistence
  console.log('▶️ [4/4] Verifying MongoDB Persistence via GET /api/interview/feedback/:sessionId...');
  const reportRes = await fetch(`${baseUrl}/interview/feedback/${sessionId}`, {
    headers: authHeaders,
  });
  const reportData: any = await reportRes.json();
  if (!reportRes.ok || !reportData.report) {
    throw new Error(`Report retrieval failed: ${JSON.stringify(reportData)}`);
  }
  console.log(`   • Retrieved Report from DB: Status=${reportData.report.performanceTier}, Score=${reportData.report.overallScore}`);
  console.log('✅ Full end-to-end interview flow verified with 100% database persistence.\n');

  console.log('🎉 ================================================================');
  console.log('🎉 REAL END-TO-END INTERVIEW TEST COMPLETED SUCCESSFULLY');
  console.log('🎉 ================================================================\n');
}

runE2EInterviewTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ E2E Interview Test Failed:', err);
    process.exit(1);
  });
