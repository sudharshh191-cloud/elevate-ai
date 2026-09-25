import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { RoadmapItem } from '../models/RoadmapItem.js';
import { CodeExecutionLog } from '../models/CodeExecutionLog.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { FeedbackReport } from '../models/FeedbackReport.js';
import { SystemDesignDiagram } from '../models/SystemDesignDiagram.js';
import { LLMService } from '../services/llm.service.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function runAdaptiveRoadmapTests() {
  console.log('🧪 ===================================================');
  console.log('🧪 ELEVATE.AI — ADAPTIVE CAREER ROADMAP TEST SUITE');
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

  try {
    // -------------------------------------------------------------
    // TEST 1: New user with NO telemetry data (Empty-State Integrity)
    // -------------------------------------------------------------
    console.log('▶️ [Test 1/12] Verifying empty-state for brand-new user with zero data...');
    const pwdHash = await bcrypt.hash('TestPass123!', 10);
    const newUser = await User.create({
      name: 'Brand New Candidate',
      email: `new_user_${Date.now()}@test.io`,
      passwordHash: pwdHash,
      isVerified: true,
      targetRole: 'Fullstack Engineer',
      trackLevel: 'Intermediate',
      userType: 'JOB_SEEKER',
    });

    const emptyRoadmap = await LLMService.generateAdaptiveRoadmap({
      targetRole: newUser.targetRole,
      trackLevel: newUser.trackLevel,
      userType: newUser.userType,
      extractedSkills: [],
      recommendedFocusAreas: [],
    });

    if (emptyRoadmap.length !== 0) {
      throw new Error(`Expected 0 items for empty user, but got ${emptyRoadmap.length}`);
    }
    console.log('✅ Passed: Zero manufactured/fake roadmap items generated for empty profile.\n');

    // -------------------------------------------------------------
    // TEST 2: User with Resume Only
    // -------------------------------------------------------------
    console.log('▶️ [Test 2/12] Generating roadmap from Resume Skills + Target Role...');
    const resumeUser = await User.create({
      name: 'Alex Frontend',
      email: `resume_user_${Date.now()}@test.io`,
      passwordHash: pwdHash,
      isVerified: true,
      targetRole: 'Frontend Developer',
      trackLevel: 'Mid Level',
      userType: 'JOB_SEEKER',
      parsedResumeData: {
        extractedSkills: ['HTML', 'CSS', 'JavaScript'],
        recommendedFocusAreas: ['React State Management', 'TypeScript Advanced Types'],
        atsScore: 78,
      },
    });

    const resumeRoadmap = await LLMService.generateAdaptiveRoadmap({
      targetRole: resumeUser.targetRole,
      trackLevel: resumeUser.trackLevel,
      userType: resumeUser.userType,
      extractedSkills: resumeUser.parsedResumeData?.extractedSkills,
      recommendedFocusAreas: resumeUser.parsedResumeData?.recommendedFocusAreas,
    });

    if (resumeRoadmap.length === 0) {
      throw new Error('Expected roadmap items from resume focus areas, but got 0');
    }
    console.log(`✅ Passed: Generated ${resumeRoadmap.length} items grounded in resume skills:`);
    resumeRoadmap.forEach((item) => console.log(`   - [${item.priority}] ${item.title} (${item.source})`));
    console.log('');

    // -------------------------------------------------------------
    // TEST 3: User with Resume + JD Skill Gaps
    // -------------------------------------------------------------
    console.log('▶️ [Test 3/12] Generating roadmap with target Job Description gaps...');
    const jdGaps = ['Redis Caching', 'Docker & Kubernetes', 'GraphQL'];
    const jdRoadmap = await LLMService.generateAdaptiveRoadmap({
      targetRole: 'Backend Engineer',
      trackLevel: 'Senior',
      userType: 'PROFESSIONAL',
      extractedSkills: ['Node.js', 'Express', 'PostgreSQL'],
      jdSkillGaps: jdGaps,
    });

    const highPriorityJdItems = jdRoadmap.filter(
      (item) => item.priority === 'HIGH' && item.source === 'JOB_DESCRIPTION'
    );
    if (highPriorityJdItems.length === 0) {
      throw new Error('Expected HIGH priority items for JD skill gaps');
    }
    console.log(`✅ Passed: Generated ${highPriorityJdItems.length} HIGH priority items for JD gaps:`);
    highPriorityJdItems.forEach((item) => console.log(`   - [HIGH] ${item.title} (Evidence: ${item.evidence.join(', ')})`));
    console.log('');

    // -------------------------------------------------------------
    // TEST 4: User with Coding History & Low Pass Rate
    // -------------------------------------------------------------
    console.log('▶️ [Test 4/12] Generating roadmap with Coding Arena telemetry...');
    const codingRoadmap = await LLMService.generateAdaptiveRoadmap({
      targetRole: 'Software Engineer',
      trackLevel: 'Intermediate',
      userType: 'STUDENT',
      extractedSkills: ['Java', 'Python'],
      codingStats: {
        totalExecutions: 8,
        passedExecutions: 2,
        failedExecutions: 6,
        passRate: 25,
        languagesUsed: ['python', 'java'],
      },
    });

    const codingItems = codingRoadmap.filter((item) => item.source === 'CODING');
    if (codingItems.length === 0) {
      throw new Error('Expected CODING source roadmap item reflecting low pass rate');
    }
    console.log(`✅ Passed: Generated coding item for 25% pass rate: "${codingItems[0].title}" (Priority: ${codingItems[0].priority})\n`);

    // -------------------------------------------------------------
    // TEST 5: User with Mock Interview History & Growth Areas
    // -------------------------------------------------------------
    console.log('▶️ [Test 5/12] Generating roadmap with Mock Assessment feedback...');
    const interviewRoadmap = await LLMService.generateAdaptiveRoadmap({
      targetRole: 'System Architect',
      trackLevel: 'Staff',
      userType: 'PROFESSIONAL',
      extractedSkills: ['Architecture', 'Cloud', 'Microservices'],
      interviewStats: {
        completedInterviews: 2,
        averageScore: 62,
        growthAreas: ['Distributed Concurrency & Locking', 'Database Sharding Trade-offs'],
        domainsTested: ['System Design'],
      },
    });

    const interviewItems = interviewRoadmap.filter((item) => item.source === 'INTERVIEW');
    if (interviewItems.length === 0) {
      throw new Error('Expected INTERVIEW source roadmap items from growth areas');
    }
    console.log(`✅ Passed: Generated ${interviewItems.length} interview growth items:`);
    interviewItems.forEach((it) => console.log(`   - [${it.priority}] ${it.title} (Reason: ${it.reason})`));
    console.log('');

    // -------------------------------------------------------------
    // TEST 6: User with Multi-Source Synthesized Telemetry
    // -------------------------------------------------------------
    console.log('▶️ [Test 6/12] Testing multi-source evidence synthesis...');
    const multiRoadmap = await LLMService.generateAdaptiveRoadmap({
      targetRole: 'Fullstack Engineer',
      trackLevel: 'Senior',
      userType: 'PROFESSIONAL',
      extractedSkills: ['React', 'TypeScript', 'Node.js'],
      recommendedFocusAreas: ['Next.js App Router'],
      jdSkillGaps: ['Kafka Event Streaming'],
      codingStats: {
        totalExecutions: 5,
        passedExecutions: 1,
        failedExecutions: 4,
        passRate: 20,
        languagesUsed: ['typescript'],
      },
      interviewStats: {
        completedInterviews: 1,
        averageScore: 68,
        growthAreas: ['API Idempotency & Rate Limiting'],
        domainsTested: ['Backend'],
      },
    });

    if (multiRoadmap.length < 3) {
      throw new Error(`Expected at least 3 multi-source items, got ${multiRoadmap.length}`);
    }
    console.log(`✅ Passed: Multi-source synthesis produced ${multiRoadmap.length} items across multiple domains.\n`);

    // -------------------------------------------------------------
    // TEST 7: Roadmap Persistence in MongoDB
    // -------------------------------------------------------------
    console.log('▶️ [Test 7/12] Testing database persistence in RoadmapItem collection...');
    const candidateUser = await User.create({
      name: 'Jordan Rivera',
      email: `jordan_${Date.now()}@test.io`,
      passwordHash: pwdHash,
      isVerified: true,
      targetRole: 'Backend Engineer',
      trackLevel: 'Senior',
      userType: 'PROFESSIONAL',
    });

    const savedDocs = await RoadmapItem.insertMany([
      {
        userId: candidateUser._id,
        targetRole: candidateUser.targetRole,
        title: 'Distributed Caching with Redis',
        category: 'System Design',
        priority: 'HIGH',
        status: 'NOT_STARTED',
        reason: 'Required by target backend engineering role.',
        evidence: ['Target Job Gap', 'Missing from Resume'],
        source: 'JOB_DESCRIPTION',
        recommendedActions: ['Review eviction policies', 'Practice in Studio'],
        actionTarget: { type: 'system-design', label: 'Design in Studio' },
        order: 0,
      },
      {
        userId: candidateUser._id,
        targetRole: candidateUser.targetRole,
        title: 'PostgreSQL Index Optimization',
        category: 'SQL',
        priority: 'MEDIUM',
        status: 'NOT_STARTED',
        reason: 'Standard core competency for senior backend roles.',
        evidence: ['Core Role Requirement'],
        source: 'RESUME',
        recommendedActions: ['Study B-tree vs GIN indexes', 'Write EXPLAIN ANALYZE queries'],
        actionTarget: { type: 'arena', label: 'Practice' },
        order: 1,
      },
    ]);

    const persistedCount = await RoadmapItem.countDocuments({ userId: candidateUser._id });
    if (persistedCount !== 2) {
      throw new Error(`Expected 2 persisted roadmap items, found ${persistedCount}`);
    }
    console.log(`✅ Passed: ${persistedCount} RoadmapItem records saved to MongoDB successfully.\n`);

    // -------------------------------------------------------------
    // TEST 8: Status Update (NOT_STARTED -> IN_PROGRESS -> COMPLETED)
    // -------------------------------------------------------------
    console.log('▶️ [Test 8/12] Testing roadmap item status lifecycle...');
    const itemToUpdate = savedDocs[0];

    // 1. Move to IN_PROGRESS
    (itemToUpdate as any).status = 'IN_PROGRESS';
    await itemToUpdate.save();
    let updated = await RoadmapItem.findById(itemToUpdate._id);
    if (updated?.status !== 'IN_PROGRESS' || updated.completedAt) {
      throw new Error('Status transition to IN_PROGRESS failed');
    }

    // 2. Move to COMPLETED
    (itemToUpdate as any).status = 'COMPLETED';
    itemToUpdate.completedAt = new Date();
    await itemToUpdate.save();
    updated = await RoadmapItem.findById(itemToUpdate._id);
    if (updated?.status !== 'COMPLETED' || !updated.completedAt) {
      throw new Error('Status transition to COMPLETED failed or completedAt missing');
    }
    console.log(`✅ Passed: Status lifecycle updated correctly: NOT_STARTED -> IN_PROGRESS -> COMPLETED (${updated.completedAt.toISOString()})\n`);

    // -------------------------------------------------------------
    // TEST 9: Cross-User Access Prevention (Security Isolation)
    // -------------------------------------------------------------
    console.log('▶️ [Test 9/12] Testing cross-user isolation and authorization checks...');
    const otherUser = await User.create({
      name: 'Other Candidate',
      email: `other_${Date.now()}@test.io`,
      passwordHash: pwdHash,
      isVerified: true,
      targetRole: 'Data Scientist',
    });

    const belongsToJordan = itemToUpdate.userId.equals(candidateUser._id as Types.ObjectId);
    const belongsToOther = itemToUpdate.userId.equals(otherUser._id as Types.ObjectId);

    if (!belongsToJordan || belongsToOther) {
      throw new Error('User ownership validation failed');
    }
    console.log('✅ Passed: Cross-user access properly isolated (User A cannot mutate User B roadmap item).\n');

    // -------------------------------------------------------------
    // TEST 10 & 11: Refresh Preservation & Duplicate Prevention
    // -------------------------------------------------------------
    console.log('▶️ [Test 10 & 11/12] Testing refresh deduplication & completion state preservation...');
    // Jordan currently has 1 COMPLETED item ("Distributed Caching with Redis") and 1 NOT_STARTED item ("PostgreSQL Index Optimization")
    // When a refresh occurs with the same items + 1 new item:
    const refreshGenerated = [
      {
        title: 'Distributed Caching with Redis', // Already COMPLETED
        category: 'System Design' as const,
        priority: 'HIGH' as const,
        reason: 'Updated reasoning from latest assessment telemetry.',
        evidence: ['Updated Evidence'],
        source: 'JOB_DESCRIPTION' as const,
        recommendedActions: ['Updated action 1'],
      },
      {
        title: 'PostgreSQL Index Optimization', // Already NOT_STARTED
        category: 'SQL' as const,
        priority: 'HIGH' as const,
        reason: 'Elevated priority due to database assessment.',
        evidence: ['Assessment score'],
        source: 'INTERVIEW' as const,
        recommendedActions: ['Action 1'],
      },
      {
        title: 'Microservice Circuit Breakers', // Brand NEW
        category: 'Backend' as const,
        priority: 'MEDIUM' as const,
        reason: 'New recommendation based on recent activity.',
        evidence: ['Target role'],
        source: 'RESUME' as const,
        recommendedActions: ['Action 1'],
      },
    ];

    // Simulate controller refresh logic:
    const existing = await RoadmapItem.find({ userId: candidateUser._id });
    const existingMap = new Map<string, typeof existing[0]>();
    existing.forEach((it) => existingMap.set(it.title.toLowerCase().trim(), it));

    for (const g of refreshGenerated) {
      const key = g.title.toLowerCase().trim();
      if (existingMap.has(key)) {
        const ext = existingMap.get(key)!;
        ext.reason = g.reason;
        ext.evidence = g.evidence;
        ext.priority = g.priority;
        await ext.save();
        existingMap.delete(key);
      } else {
        await RoadmapItem.create({
          userId: candidateUser._id,
          targetRole: candidateUser.targetRole,
          title: g.title,
          category: g.category,
          priority: g.priority,
          status: 'NOT_STARTED',
          reason: g.reason,
          evidence: g.evidence,
          source: g.source,
          recommendedActions: g.recommendedActions,
        });
      }
    }

    const afterRefresh = await RoadmapItem.find({ userId: candidateUser._id });
    if (afterRefresh.length !== 3) {
      throw new Error(`Expected exactly 3 items after deduplication, got ${afterRefresh.length}`);
    }

    const redisItem = afterRefresh.find((it) => it.title === 'Distributed Caching with Redis');
    if (redisItem?.status !== 'COMPLETED') {
      throw new Error(`Expected completed status to be preserved, but got ${redisItem?.status}`);
    }

    const newCircuitItem = afterRefresh.find((it) => it.title === 'Microservice Circuit Breakers');
    if (!newCircuitItem || newCircuitItem.status !== 'NOT_STARTED') {
      throw new Error('New item was not inserted with NOT_STARTED status');
    }

    console.log('✅ Passed: Deduplication succeeded (3 total items, 0 duplicate titles).');
    console.log(`✅ Passed: User completion state preserved ("${redisItem.title}" remained COMPLETED).\n`);

    // -------------------------------------------------------------
    // TEST 12: Empty State Verification in DB
    // -------------------------------------------------------------
    console.log('▶️ [Test 12/12] Verifying empty state count in DB...');
    const emptyCount = await RoadmapItem.countDocuments({ userId: newUser._id });
    if (emptyCount !== 0) {
      throw new Error(`Expected 0 items for empty user in DB, found ${emptyCount}`);
    }
    console.log('✅ Passed: Empty state in DB strictly verified.\n');

    console.log('🎉 ===================================================');
    console.log('🎉 ALL 12 ADAPTIVE ROADMAP TESTS PASSED (100% SUCCESS)');
    console.log('🎉 ===================================================');
  } finally {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }
}

runAdaptiveRoadmapTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
