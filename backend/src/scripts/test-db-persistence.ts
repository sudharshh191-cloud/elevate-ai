import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { FeedbackReport } from '../models/FeedbackReport.js';
import { UserSettings } from '../models/UserSettings.js';
import { SystemDesignDiagram } from '../models/SystemDesignDiagram.js';
import { CodeExecutionLog } from '../models/CodeExecutionLog.js';
import { OTP } from '../models/OTP.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function runTestSuite() {
  console.log('🧪 ===================================================');
  console.log('🧪 Starting ELEVATE.AI Phase 1 Database Test Suite');
  console.log('🧪 ===================================================\n');

  let mongod: MongoMemoryServer | null = null;
  let uri = process.env.MONGO_URI;

  try {
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    console.log(`🔌 Spawning MongoDB Engine Instance: ${uri}`);
  } catch (err: any) {
    console.log(`ℹ️ Using configured MONGO_URI: ${uri}`);
  }

  if (!uri) {
    throw new Error('No MongoDB URI available for testing');
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB successfully.\n');

  // Test 1: Create User
  console.log('▶️ [Test 1/7] Creating test candidate user...');
  const testEmail = `candidate_${Date.now()}@elevate-ai.io`;
  const passwordHash = await bcrypt.hash('SecurePassword2026!', 10);

  const newUser = await User.create({
    name: 'Sarah Chen',
    email: testEmail,
    passwordHash,
    isVerified: true,
    targetRole: 'Staff Distributed Systems Engineer',
    experienceLevel: 'Staff',
    skills: [
      { name: 'TypeScript', level: 95, category: 'Frontend' },
      { name: 'Distributed Systems (Raft/Kafka)', level: 92, category: 'Backend' },
      { name: 'System Architecture', level: 94, category: 'Architecture' },
    ],
    parsedResumeData: {
      summary: 'Principal engineer with 8+ years leading distributed systems and real-time collaborative applications.',
      extractedSkills: ['TypeScript', 'Node.js', 'Kafka', 'Redis', 'Docker', 'Kubernetes'],
      experienceYears: 8,
      atsScore: 96,
      targetRoleMatch: 95,
      recommendedFocusAreas: ['Multi-Region Active-Active Replication', 'Sub-50ms CRDT Sync'],
    },
    stats: {
      totalInterviews: 1,
      completedInterviews: 1,
      averageScore: 92,
      domainScores: { 'System Design': 92 },
      streakDays: 4,
      lastActiveDate: new Date(),
    },
  });
  console.log(`✅ User created with _id: ${newUser._id}`);

  // Test 2: Retrieve User
  console.log('\n▶️ [Test 2/7] Retrieving user and validating password hash...');
  const fetchedUser = await User.findOne({ email: testEmail });
  if (!fetchedUser) throw new Error('Failed to find user by email');
  const passwordMatches = await bcrypt.compare('SecurePassword2026!', fetchedUser.passwordHash);
  if (!passwordMatches) throw new Error('Password verification failed');
  console.log(`✅ User retrieved: ${fetchedUser.name} (${fetchedUser.email}), Target: ${fetchedUser.targetRole}`);

  // Test 3: Create Interview Session with Questions
  console.log('\n▶️ [Test 3/7] Creating and persisting InterviewSession...');
  const session = await InterviewSession.create({
    userId: fetchedUser._id,
    title: 'Staff System Design Assessment',
    domain: 'System Design',
    difficulty: 'Staff',
    format: 'Hybrid',
    status: 'in-progress',
    questions: [
      {
        questionText: 'Design a global real-time collaborative document editor with sub-50ms sync.',
        domain: 'System Design',
        category: 'Distributed Systems',
        difficulty: 'Staff',
        format: 'Hybrid',
        expectedDurationMinutes: 6,
        rubricCriteria: [
          { title: 'CRDT vs OT', weight: 40, keyPointsToLookFor: ['Deterministic conflict resolution', 'State vs op-based'] },
          { title: 'Connection Tier', weight: 30, keyPointsToLookFor: ['WebSocket load balancing with consistent hashing'] },
          { title: 'Snapshot Persistence', weight: 30, keyPointsToLookFor: ['Compacted snapshots to S3, deltas to Kafka'] },
        ],
        idealAnswerOutline: 'Use Yjs CRDT model, regional edge WebSocket servers, Kafka delta log, and S3 snapshot flusher.',
        hints: ['Consider vector clocks and offline reconnect buffers.'],
      },
    ],
    currentQuestionIndex: 0,
    responses: [],
    startedAt: new Date(),
    totalDurationSeconds: 0,
  });
  console.log(`✅ InterviewSession persisted: ${session._id}`);

  // Test 4: Save Interview Response
  console.log('\n▶️ [Test 4/7] Saving Candidate Response to session...');
  session.responses.push({
    questionIndex: 0,
    questionText: session.questions[0].questionText,
    format: 'Hybrid',
    responseType: 'mixed',
    textResponse: 'We deploy regional WebSocket servers with Anycast routing and use Yjs CRDTs for deterministic convergence.',
    codeSubmission: {
      code: 'export class CRDTOperations { merge(a: State, b: State): State { return resolve(a, b); } }',
      language: 'typescript',
      passedTestCases: 2,
      totalTestCases: 2,
    },
    audioMetrics: {
      durationSeconds: 145,
      wpm: 138,
      fillerWordsCount: 2,
      confidenceScore: 92,
    },
    timeSpentSeconds: 145,
    instantFeedback: {
      score: 93,
      technicalAccuracy: 95,
      communication: 91,
      strengths: ['Flawless CRDT state convergence breakdown', 'Optimal WebSocket edge routing'],
      improvements: ['Mention tombstone garbage collection'],
      coachNote: 'Executive-level clarity with strong distributed systems depth.',
    },
    submittedAt: new Date(),
  });
  session.currentQuestionIndex = 1;
  session.totalDurationSeconds = 145;
  session.status = 'completed';
  session.completedAt = new Date();
  await session.save();
  console.log(`✅ Response appended and session status updated to completed.`);

  // Test 5: Save Evaluation Scorecard (FeedbackReport)
  console.log('\n▶️ [Test 5/7] Creating and persisting 360° FeedbackReport...');
  const feedbackDoc = await FeedbackReport.create({
    sessionId: session._id,
    userId: fetchedUser._id,
    domain: session.domain,
    difficulty: session.difficulty,
    overallScore: 93,
    performanceTier: 'Exceptional',
    metrics: {
      technicalAccuracy: 95,
      communicationClarity: 92,
      problemSolving: 94,
      confidenceAndDelivery: 90,
      codeQualityAndEfficiency: 93,
    },
    radarChartData: [
      { metric: 'Distributed Concurrency', score: 95, benchmark: 78 },
      { metric: 'Edge Architecture', score: 94, benchmark: 76 },
      { metric: 'Data Modeling & Persistence', score: 91, benchmark: 75 },
      { metric: 'STAR Communication', score: 92, benchmark: 72 },
    ],
    topStrengths: ['Deep mastery of CRDT operational semantics', 'Clear quantitative latency calculations'],
    criticalGaps: ['Briefly elaborate on tombstone compaction policies'],
    actionableRoadmap: [
      {
        week: 1,
        topic: 'CRDT Tombstone Garbage Collection',
        recommendedAction: 'Study Automerge vector clock pruning algorithms.',
        practiceResources: ['Designing Data-Intensive Applications Ch. 9'],
      },
    ],
    questionDetails: [
      {
        questionIndex: 1,
        questionText: session.questions[0].questionText,
        category: 'Distributed Systems',
        userResponseText: session.responses[0].textResponse,
        userSubmittedCode: session.responses[0].codeSubmission?.code,
        score: 93,
        technicalAccuracyScore: 95,
        communicationScore: 91,
        idealAnswerSummary: session.questions[0].idealAnswerOutline,
        keyPointsCovered: ['CRDT state merging', 'WebSocket edge routing'],
        keyPointsMissed: ['Tombstone compaction'],
        constructiveCritique: 'Staff-tier execution with rigorous trade-off articulation.',
      },
    ],
    executiveSummary: 'Candidate demonstrated exceptional distributed systems knowledge and concise technical communication.',
  });

  session.feedbackReportRef = feedbackDoc._id;
  await session.save();
  console.log(`✅ FeedbackReport created: ${feedbackDoc._id}, linked to session.`);

  // Test 6: Retrieve Interview History
  console.log('\n▶️ [Test 6/7] Querying interview history with populate...');
  const history = await InterviewSession.find({ userId: fetchedUser._id })
    .sort({ createdAt: -1 })
    .populate('feedbackReportRef');
  if (history.length === 0) throw new Error('Interview history empty');
  console.log(`✅ Interview history found ${history.length} session(s).`);
  console.log(`   Session Title: "${history[0].title}", Status: "${history[0].status}"`);

  // Test 7: Retrieve Scorecard by sessionId
  console.log('\n▶️ [Test 7/7] Retrieving scorecard by sessionId...');
  const retrievedReport = await FeedbackReport.findOne({ sessionId: session._id });
  if (!retrievedReport) throw new Error('Scorecard not found');
  console.log(`✅ Scorecard retrieved! Overall Score: ${retrievedReport.overallScore}/100, Tier: ${retrievedReport.performanceTier}`);

  // Auxiliary Model Verification
  console.log('\n▶️ [Auxiliary Models Verification] Testing UserSettings, SystemDesignDiagram, CodeExecutionLog...');
  await UserSettings.create({
    userId: fetchedUser._id,
    theme: 'executive_hybrid',
    audioSensitivity: 85,
    preferredDomain: 'System Design',
    preferredDifficulty: 'Staff',
    preferredFormat: 'Hybrid',
  });
  console.log('✅ UserSettings model verified.');

  await SystemDesignDiagram.create({
    userId: fetchedUser._id,
    templateTitle: 'Global Collaborative Doc Editor',
    difficulty: 'Staff',
    nodes: [{ id: 'ws1', label: 'WebSocket Edge Gateway', position: { x: 100, y: 100 } }],
    edges: [{ id: 'e1', source: 'ws1', target: 'redis1', label: 'Pub/Sub' }],
    components: ['WebSockets', 'Redis Cluster', 'CRDT Engine'],
  });
  console.log('✅ SystemDesignDiagram model verified.');

  await CodeExecutionLog.create({
    userId: fetchedUser._id,
    sessionId: session._id,
    questionIndex: 0,
    language: 'typescript',
    code: 'export function test() { return true; }',
    status: 'passed',
    executionTimeMs: 14,
    memoryUsageKb: 2048,
    testCasesPassed: 2,
    totalTestCases: 2,
  });
  console.log('✅ CodeExecutionLog model verified.');

  // Verify Collection Indexes
  console.log('\n▶️ [Index Verification] Checking database indexes...');
  const userIndexes = await User.collection.indexes();
  console.log('✅ User Indexes:', userIndexes.map((i: any) => Object.keys(i.key).join('+')));

  const sessionIndexes = await InterviewSession.collection.indexes();
  console.log('✅ InterviewSession Indexes:', sessionIndexes.map((i: any) => Object.keys(i.key).join('+')));

  const reportIndexes = await FeedbackReport.collection.indexes();
  console.log('✅ FeedbackReport Indexes:', reportIndexes.map((i: any) => Object.keys(i.key).join('+')));

  console.log('\n🎉 ===================================================');
  console.log('🎉 ALL 7 DATABASE PERSISTENCE TESTS PASSED CLEANLY');
  console.log('🎉 ===================================================\n');

  await mongoose.disconnect();
  if (mongod) await mongod.stop();
  process.exit(0);
}

runTestSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
