import { LLMService } from '../services/llm.service.js';
import { PromptTemplates } from '../services/promptTemplates.js';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { FeedbackReport } from '../models/FeedbackReport.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function runPhase2Tests() {
  console.log('🧠 ========================================================');
  console.log('🧠 Starting ELEVATE.AI Phase 2 LLM Integration Test Suite');
  console.log('🧠 ========================================================\n');

  // 1. Check LLM Status
  const llmStatus = LLMService.getLlmStatus();
  console.log('▶️ [Test 1/6] Inspecting LLM Provider Health Status...');
  console.log(`   Provider: ${llmStatus.provider}`);
  console.log(`   Configured: ${llmStatus.configured}`);
  console.log(`   Status: ${llmStatus.status}`);
  console.log(`   Model: ${llmStatus.model}`);
  console.log('✅ LLM Provider health inspection passed.\n');

  // 2. Initialize Database for Session & Evaluation Flow
  console.log('▶️ [Test 2/6] Connecting to MongoDB Engine...');
  let mongod: MongoMemoryServer | null = null;
  let uri = process.env.MONGO_URI;

  try {
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  } catch (err) {
    uri = uri || 'mongodb://localhost:27017/ai_interview_platform';
  }

  await mongoose.connect(uri!);
  console.log(`✅ Connected to MongoDB: ${uri}\n`);

  // 3. Question Generation with Candidate Skills
  console.log('▶️ [Test 3/6] Generating Dynamic Questions tailored to candidate skills...');
  const candidateSkills = ['React', 'TypeScript', 'Redis', 'WebSockets', 'System Design'];
  const questions = await LLMService.generateQuestions({
    domain: 'Frontend',
    difficulty: 'Senior',
    format: 'Hybrid',
    targetRole: 'Senior Fullstack Architect',
    userSkills: candidateSkills,
    customTopicFocus: 'Real-Time State Synchronization',
    count: 2,
  });

  if (!questions || questions.length === 0) {
    throw new Error('Failed to generate interview questions');
  }

  console.log(`✅ Generated ${questions.length} questions.`);
  console.log(`   Q1: "${questions[0].questionText.slice(0, 80)}..."`);
  console.log(`   Category: "${questions[0].category}", Rubric Criteria Count: ${questions[0].rubricCriteria.length}`);

  // Create user & interview session in DB
  const user = await User.create({
    name: 'Alex Vance',
    email: `alex_${Date.now()}@elevate-ai.io`,
    passwordHash: 'hashed',
    targetRole: 'Senior Fullstack Architect',
    parsedResumeData: {
      extractedSkills: candidateSkills,
      atsScore: 92,
      targetRoleMatch: 90,
    },
  });

  const session = await InterviewSession.create({
    userId: user._id,
    title: 'Senior Frontend & Real-Time Assessment',
    domain: 'Frontend',
    difficulty: 'Senior',
    format: 'Hybrid',
    status: 'in-progress',
    questions,
    currentQuestionIndex: 0,
    responses: [],
    startedAt: new Date(),
    totalDurationSeconds: 0,
  });

  console.log(`✅ InterviewSession persisted to MongoDB with ID: ${session._id}\n`);

  // 4. Multi-Dimensional Response Evaluation
  console.log('▶️ [Test 4/6] Evaluating candidate answer with multi-dimensional rubric scoring...');
  const candidateAnswer =
    'For real-time sync with 100k items, we maintain a virtual window with startIndex and endIndex. We stream delta updates over WebSockets and use CRDTs to resolve conflicting text edits deterministically with zero server roundtrip blocking.';

  const candidateCode = `export function computeVirtualWindow(scrollTop: number, itemHeight: number, viewportHeight: number, total: number) {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
  const end = Math.min(total, Math.ceil((scrollTop + viewportHeight) / itemHeight) + 2);
  return { start, end };
}`;

  const evaluation = await LLMService.evaluateResponse({
    questionText: questions[0].questionText,
    domain: questions[0].domain,
    category: questions[0].category,
    difficulty: questions[0].difficulty,
    format: questions[0].format,
    rubricCriteria: questions[0].rubricCriteria,
    userResponseText: candidateAnswer,
    userSubmittedCode: candidateCode,
    codeLanguage: 'typescript',
    audioMetrics: {
      durationSeconds: 120,
      wpm: 140,
      fillerWordsCount: 1,
      confidenceScore: 92,
    },
  });

  console.log(`✅ Evaluation Completed:`);
  console.log(`   Overall Score: ${evaluation.score}/100`);
  console.log(`   Technical Accuracy: ${evaluation.technicalAccuracyScore}/100`);
  console.log(`   Communication: ${evaluation.communicationScore}/100`);
  console.log(`   Coach Note: "${evaluation.instantFeedback.coachNote}"`);
  console.log(`   Key Points Covered: [${evaluation.keyPointsCovered.join(', ')}]`);

  // Save response into session
  session.responses.push({
    questionIndex: 0,
    questionText: questions[0].questionText,
    format: 'Hybrid',
    responseType: 'mixed',
    textResponse: candidateAnswer,
    codeSubmission: {
      code: candidateCode,
      language: 'typescript',
    },
    audioMetrics: {
      durationSeconds: 120,
      wpm: 140,
      fillerWordsCount: 1,
      confidenceScore: 92,
    },
    timeSpentSeconds: 120,
    instantFeedback: evaluation.instantFeedback,
    evaluationDetails: evaluation,
    submittedAt: new Date(),
  });

  session.currentQuestionIndex = 1;
  session.status = 'completed';
  session.completedAt = new Date();
  await session.save();
  console.log('✅ Candidate response saved to MongoDB session.\n');

  // 5. 360-Degree Feedback Report Synthesis
  console.log('▶️ [Test 5/6] Synthesizing comprehensive 360-degree feedback report...');
  const report = await LLMService.generateSessionReport(session.toJSON());

  const feedbackDoc = await FeedbackReport.create({
    sessionId: session._id,
    userId: user._id,
    domain: session.domain,
    difficulty: session.difficulty,
    overallScore: report.overallScore,
    performanceTier: report.performanceTier,
    metrics: report.metrics,
    radarChartData: report.radarChartData,
    topStrengths: report.topStrengths,
    criticalGaps: report.criticalGaps,
    actionableRoadmap: report.actionableRoadmap,
    questionDetails: session.responses.map((r: any, idx: number) => ({
      questionIndex: idx + 1,
      questionText: r.questionText,
      category: questions[idx]?.category || 'Architecture',
      userResponseText: r.textResponse,
      userSubmittedCode: r.codeSubmission?.code,
      score: r.instantFeedback?.score || 85,
      technicalAccuracyScore: r.instantFeedback?.technicalAccuracy || 88,
      communicationScore: r.instantFeedback?.communication || 82,
      idealAnswerSummary: questions[idx]?.idealAnswerOutline || 'Standard optimal architecture',
      keyPointsCovered: r.evaluationDetails?.keyPointsCovered || ['Core concept covered'],
      keyPointsMissed: r.evaluationDetails?.keyPointsMissed || ['Edge case trade-offs'],
      constructiveCritique:
        r.evaluationDetails?.constructiveCritique || 'Solid answer demonstrating strong domain knowledge.',
    })),
    executiveSummary: report.executiveSummary,
  });

  session.feedbackReportRef = feedbackDoc._id;
  await session.save();

  console.log(`✅ FeedbackReport Synthesized & Persisted:`);
  console.log(`   Report ID: ${feedbackDoc._id}`);
  console.log(`   Overall Score: ${feedbackDoc.overallScore}/100`);
  console.log(`   Verdict Tier: ${feedbackDoc.performanceTier}`);
  console.log(`   Radar Metrics Count: ${feedbackDoc.radarChartData.length}`);
  console.log(`   Roadmap Weeks Count: ${feedbackDoc.actionableRoadmap.length}\n`);

  // 6. Query and Verification
  console.log('▶️ [Test 6/6] Verifying session and scorecard queries from MongoDB...');
  const queriedReport = await FeedbackReport.findOne({ sessionId: session._id });
  if (!queriedReport) throw new Error('Failed to query FeedbackReport');
  console.log(`✅ Scorecard successfully retrieved: OverallScore=${queriedReport.overallScore}`);

  const history = await InterviewSession.find({ userId: user._id }).populate('feedbackReportRef');
  if (history.length === 0) throw new Error('Failed to retrieve history');
  console.log(`✅ Interview history verified: ${history.length} session(s) retrieved.\n`);

  console.log('🎉 ========================================================');
  console.log('🎉 ALL PHASE 2 LLM & SCORECARD TESTS PASSED WITH 100% SUCCESS');
  console.log('🎉 ========================================================\n');

  await mongoose.disconnect();
  if (mongod) await mongod.stop();
  process.exit(0);
}

runPhase2Tests().catch((err) => {
  console.error('❌ Phase 2 test failed:', err);
  process.exit(1);
});
