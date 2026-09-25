import mongoose, { Types } from 'mongoose';
import { RoadmapItem, IRoadmapItem, RoadmapCategory, RoadmapPriority, RoadmapStatus, RoadmapSource } from '../models/RoadmapItem.js';
import { User } from '../models/User.js';
import { CodeExecutionLog } from '../models/CodeExecutionLog.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { FeedbackReport } from '../models/FeedbackReport.js';
import { SystemDesignDiagram } from '../models/SystemDesignDiagram.js';
import { LLMService } from './llm.service.js';

export class AdaptiveRoadmapService {
  /**
   * Normalizes a raw skill or topic string into a standardized title & canonical category
   */
  static normalizeSkill(rawSkill: string): { title: string; category: RoadmapCategory; focusTopic: string } {
    const s = (rawSkill || '').trim();
    const lower = s.toLowerCase();

    // DSA & Algorithmic Patterns
    if (/binary\s*search/i.test(lower)) {
      return { title: 'Binary Search & Monotonic Search Spaces', category: 'DSA', focusTopic: 'Binary Search' };
    }
    if (/two\s*pointer|sliding\s*window/i.test(lower)) {
      return { title: 'Two Pointers & Sliding Window Patterns', category: 'DSA', focusTopic: 'Two Pointers' };
    }
    if (/dynamic\s*prog|dp\b|memoiz/i.test(lower)) {
      return { title: 'Dynamic Programming & Memoization', category: 'DSA', focusTopic: 'Dynamic Programming' };
    }
    if (/graph|bfs|dfs|topological|dijkstra/i.test(lower)) {
      return { title: 'Graph Algorithms & Traversal (BFS/DFS)', category: 'DSA', focusTopic: 'Graphs' };
    }
    if (/tree|binary\s*tree|bst|trie/i.test(lower)) {
      return { title: 'Tree Structures & BST Traversal', category: 'DSA', focusTopic: 'Trees' };
    }
    if (/array|hash|string/i.test(lower)) {
      return { title: 'Arrays, Hash Maps & String Manipulation', category: 'DSA', focusTopic: 'Arrays & Hashing' };
    }
    if (/dsa|data\s*structure|algorithm/i.test(lower)) {
      return { title: 'Data Structures & Algorithmic Problem Solving', category: 'DSA', focusTopic: 'Data Structures' };
    }

    // System Design & Architecture
    if (/consensus|raft|paxos|replication/i.test(lower)) {
      return { title: 'Distributed Consensus & Replication (Raft/Paxos)', category: 'System Design', focusTopic: 'Distributed Consensus' };
    }
    if (/kafka|message\s*queue|rabbitmq|pub\/?sub|event/i.test(lower)) {
      return { title: 'Event-Driven Architecture & Message Queues', category: 'System Design', focusTopic: 'Kafka & Message Queues' };
    }
    if (/redis|cache|caching|in-memory/i.test(lower)) {
      return { title: 'Distributed Caching Strategies & Redis', category: 'System Design', focusTopic: 'Redis & Caching' };
    }
    if (/system\s*design|architecture|distributed|microservice|load\s*balanc|sharding/i.test(lower)) {
      return { title: 'High-Throughput Distributed System Design', category: 'System Design', focusTopic: 'System Design' };
    }

    // Databases & SQL
    if (/postgres|mysql|sql|indexing|query\s*optim|acid/i.test(lower)) {
      return { title: 'SQL & Relational Database Optimization', category: 'SQL', focusTopic: 'SQL' };
    }
    if (/mongo|nosql|dynamodb|cassandra/i.test(lower)) {
      return { title: 'NoSQL Architecture & Document Stores', category: 'Backend', focusTopic: 'NoSQL' };
    }

    // Cloud & DevOps
    if (/docker|container/i.test(lower)) {
      return { title: 'Docker Containerization & Microservices', category: 'DevOps', focusTopic: 'Docker' };
    }
    if (/k8s|kubernetes|helm/i.test(lower)) {
      return { title: 'Kubernetes Cluster Orchestration & Deployment', category: 'DevOps', focusTopic: 'Kubernetes' };
    }
    if (/aws|gcp|azure|cloud|serverless/i.test(lower)) {
      return { title: 'Cloud Infrastructure & Cloud Architecture', category: 'Cloud', focusTopic: 'Cloud' };
    }
    if (/ci\/?cd|pipeline|github\s*actions/i.test(lower)) {
      return { title: 'CI/CD Automation & Build Pipelines', category: 'DevOps', focusTopic: 'CI/CD' };
    }

    // Frontend & Web
    if (/react|next|redux/i.test(lower)) {
      return { title: 'React.js & Modern Frontend Architecture', category: 'Frontend', focusTopic: 'React' };
    }
    if (/typescript|javascript|js|ts/i.test(lower)) {
      return { title: 'TypeScript & Modern JavaScript Engineering', category: 'Programming', focusTopic: 'TypeScript' };
    }
    if (/graphql|rest\s*api|api\s*design/i.test(lower)) {
      return { title: 'API Design & GraphQL Architecture', category: 'Backend', focusTopic: 'API Design' };
    }
    if (/go\b|golang/i.test(lower)) {
      return { title: 'Go / Golang Systems Programming', category: 'Backend', focusTopic: 'Go' };
    }
    if (/rust\b/i.test(lower)) {
      return { title: 'Rust High-Performance Systems Engineering', category: 'Backend', focusTopic: 'Rust' };
    }

    // Fallback: Title case raw skill
    const titleCased = s.charAt(0).toUpperCase() + s.slice(1);
    return { title: titleCased, category: 'Backend', focusTopic: titleCased };
  }

  /**
   * Finds an existing equivalent roadmap item using normalization & regex aliasing
   */
  static async findEquivalentItem(userId: string | Types.ObjectId, skillName: string): Promise<any | null> {
    const { title, focusTopic } = this.normalizeSkill(skillName);
    const cleanRaw = skillName.trim();

    // 1. Direct title match or normalized title match
    let item = await RoadmapItem.findOne({
      userId,
      $or: [
        { title: { $regex: new RegExp(`^${cleanRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { title: { $regex: new RegExp(focusTopic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
      ],
    });

    if (item) return item;

    // 2. Keyword substring scan across all user items
    const allItems = await RoadmapItem.find({ userId });
    for (const it of allItems) {
      const itLower = it.title.toLowerCase();
      const rawLower = cleanRaw.toLowerCase();
      if (
        itLower.includes(rawLower) ||
        rawLower.includes(itLower) ||
        itLower.includes(focusTopic.toLowerCase())
      ) {
        return it;
      }
    }

    return null;
  }

  /**
   * Event Trigger: Assessment Completed (Real Submissions & Test Telemetry)
   */
  static async recordAssessmentResult(
    userId: string | Types.ObjectId,
    skillEvidence: Array<{
      topic: string;
      category?: string;
      problemsPassed: number;
      problemsEncountered: number;
      testCasePassRate: number;
      evidenceText: string;
    }>,
    overallScore?: number
  ): Promise<void> {
    const user = await User.findById(userId);
    const targetRole = user?.targetRole || 'Software Engineer';

    for (const ev of skillEvidence) {
      const { title, category, focusTopic } = this.normalizeSkill(ev.topic);
      const existing = await this.findEquivalentItem(userId, ev.topic);

      const hasGaps = ev.testCasePassRate < 75 || ev.problemsPassed < ev.problemsEncountered;
      const isMastered = ev.testCasePassRate >= 85 && ev.problemsPassed === ev.problemsEncountered;

      const evidenceLine = `Assessment evidence: ${ev.evidenceText}`;

      if (existing) {
        if (!existing.evidence.includes(evidenceLine)) {
          existing.evidence.push(evidenceLine);
        }

        if (hasGaps) {
          existing.priority = 'HIGH';
          existing.reason = `Recent assessment identified test-case gaps on ${ev.topic} (${ev.testCasePassRate}% pass rate).`;
          existing.lastUpdatedReason = `Prioritized to HIGH following assessment performance on ${ev.topic} (${ev.testCasePassRate}% pass rate)`;
        } else if (isMastered) {
          if (existing.priority === 'HIGH') {
            existing.priority = 'MEDIUM';
            existing.lastUpdatedReason = `Priority adjusted to MEDIUM after demonstrated assessment mastery on ${ev.topic} (${ev.testCasePassRate}% pass rate)`;
          }
        }
        existing.source = 'ASSESSMENT';
        existing.updatedAt = new Date();
        await existing.save();
      } else if (hasGaps) {
        // Genuinely new gap identified in assessment
        const count = await RoadmapItem.countDocuments({ userId });
        await RoadmapItem.create({
          userId,
          targetRole,
          title,
          category,
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          reason: `Recent assessment identified test-case difficulty on ${ev.topic} (${ev.testCasePassRate}% pass rate).`,
          evidence: [evidenceLine],
          source: 'ASSESSMENT',
          recommendedActions: [
            `Review edge cases and boundary constraints for ${focusTopic}`,
            `Solve benchmark challenges in Coding Arena under timed constraints`,
            `Verify test case correctness and runtime complexity`,
          ],
          actionTarget: {
            type: category === 'System Design' ? 'system-design' : 'arena',
            label: category === 'System Design' ? 'Design Architecture' : 'Practice in Arena',
            focusTopic,
          },
          order: count,
          lastUpdatedReason: `Created from assessment performance telemetry (${ev.testCasePassRate}% pass rate)`,
        });
      }
    }
  }

  /**
   * Event Trigger: Coding Practice Submission in Arena
   */
  static async recordCodingPractice(
    userId: string | Types.ObjectId,
    practiceResult: {
      questionTitle?: string;
      category?: string;
      passedTests: number;
      totalTests: number;
      status: string;
      language?: string;
    }
  ): Promise<void> {
    const topic = practiceResult.category || practiceResult.questionTitle || 'Data Structures';
    const { title, category, focusTopic } = this.normalizeSkill(topic);
    const existing = await this.findEquivalentItem(userId, topic);

    const passRate = practiceResult.totalTests > 0
      ? Math.round((practiceResult.passedTests / practiceResult.totalTests) * 100)
      : (practiceResult.status === 'passed' ? 100 : 0);

    const evidenceLine = `Coding Arena: ${practiceResult.passedTests}/${practiceResult.totalTests} tests passed (${passRate}%)${practiceResult.language ? ` in ${practiceResult.language}` : ''}`;

    if (existing) {
      if (!existing.evidence.includes(evidenceLine)) {
        existing.evidence.push(evidenceLine);
      }
      if (passRate < 70) {
        existing.priority = 'HIGH';
        existing.lastUpdatedReason = `Prioritized to HIGH following Coding Arena test failures on ${focusTopic}`;
      } else if (passRate === 100 && existing.priority === 'HIGH') {
        existing.priority = 'MEDIUM';
        existing.lastUpdatedReason = `Demoted to MEDIUM after solving 100% of test cases in Coding Arena`;
      }
      existing.source = 'CODING';
      existing.updatedAt = new Date();
      await existing.save();
    }
  }

  /**
   * Event Trigger: Job Intelligence Analysis (New Target Job Gaps)
   */
  static async recordJobIntelligence(
    userId: string | Types.ObjectId,
    jobAnalysis: {
      jobTitle?: string;
      company?: string;
      missingSkills?: string[];
      requiredSkills?: string[];
    }
  ): Promise<void> {
    const user = await User.findById(userId);
    const targetRole = user?.targetRole || jobAnalysis.jobTitle || 'Software Engineer';
    const missing = jobAnalysis.missingSkills || [];

    for (const gap of missing) {
      const { title, category, focusTopic } = this.normalizeSkill(gap);
      const existing = await this.findEquivalentItem(userId, gap);

      const evidenceLine = jobAnalysis.jobTitle
        ? `Required by ${jobAnalysis.jobTitle}${jobAnalysis.company ? ` at ${jobAnalysis.company}` : ''}`
        : 'Required by target job description analysis';

      if (existing) {
        if (!existing.evidence.includes(evidenceLine)) {
          existing.evidence.push(evidenceLine);
        }
        existing.priority = 'HIGH';
        existing.source = 'JOB_DESCRIPTION';
        existing.lastUpdatedReason = `Updated from Job Intelligence analysis for ${jobAnalysis.jobTitle || 'target role'}`;
        existing.updatedAt = new Date();
        await existing.save();
      } else {
        const count = await RoadmapItem.countDocuments({ userId });
        await RoadmapItem.create({
          userId,
          targetRole,
          title,
          category,
          priority: 'HIGH',
          status: 'NOT_STARTED',
          reason: `Required by target job posting: ${jobAnalysis.jobTitle || targetRole}. Closing this gap will elevate candidate match readiness.`,
          evidence: [evidenceLine, 'Missing from current verified profile evidence'],
          source: 'JOB_DESCRIPTION',
          recommendedActions: [
            `Review production patterns and documentation for ${focusTopic}`,
            `Build a targeted implementation in the ${category === 'System Design' ? 'System Design Studio' : 'Coding Arena'}`,
            `Validate proficiency through tailored assessment`,
          ],
          actionTarget: {
            type: category === 'System Design' ? 'system-design' : 'arena',
            label: category === 'System Design' ? 'Design Architecture' : 'Practice in Arena',
            focusTopic,
          },
          order: count,
          lastUpdatedReason: `Added from Job Intelligence analysis for ${jobAnalysis.jobTitle || 'target role'}`,
        });
      }
    }
  }

  /**
   * Event Trigger: Mock Interview Completed (Feedback Scorecard Telemetry)
   */
  static async recordInterviewFeedback(
    userId: string | Types.ObjectId,
    session: any,
    report: any
  ): Promise<void> {
    const user = await User.findById(userId);
    const targetRole = user?.targetRole || session?.domain || 'Software Engineer';

    const gaps = [
      ...(Array.isArray(report.criticalGaps) ? report.criticalGaps : []),
      ...(Array.isArray(report.actionableRoadmap) ? report.actionableRoadmap.map((a: any) => a.topic) : []),
    ].filter(Boolean);

    for (const gap of gaps.slice(0, 3)) {
      const { title, category, focusTopic } = this.normalizeSkill(gap);
      const existing = await this.findEquivalentItem(userId, gap);

      const evidenceLine = `Mock Interview Evaluation (${session?.domain || 'Technical'} Domain, Score: ${report.overallScore || 'N/A'}/100)`;

      if (existing) {
        if (!existing.evidence.includes(evidenceLine)) {
          existing.evidence.push(evidenceLine);
        }
        existing.priority = 'HIGH';
        existing.source = 'INTERVIEW';
        existing.lastUpdatedReason = `Prioritized to HIGH following mock interview evaluation on ${gap}`;
        existing.updatedAt = new Date();
        await existing.save();
      } else {
        const count = await RoadmapItem.countDocuments({ userId });
        await RoadmapItem.create({
          userId,
          targetRole,
          title,
          category: 'Interview',
          priority: 'HIGH',
          status: 'NOT_STARTED',
          reason: `Flagged as a key technical growth area in recent mock assessment evaluation.`,
          evidence: [evidenceLine],
          source: 'INTERVIEW',
          recommendedActions: [
            `Review structured technical explanation frameworks for ${focusTopic}`,
            `Conduct practice runs addressing this specific evaluation feedback`,
          ],
          actionTarget: {
            type: 'analytics',
            label: 'Review Scorecard',
            focusTopic,
          },
          order: count,
          lastUpdatedReason: `Created from mock interview evaluation feedback`,
        });
      }
    }
  }

  /**
   * Event Trigger: System Design Diagram Evaluated
   */
  static async recordSystemDesignEvaluation(
    userId: string | Types.ObjectId,
    evaluation: {
      overallScore?: number;
      topStrengths?: string[];
      criticalGaps?: string[];
      weaknesses?: string[];
      recommendations?: Array<any> | string[];
      suggestedImprovements?: string[];
      dimensions?: any;
    } | any,
    problemTitle?: string
  ): Promise<void> {
    const user = await User.findById(userId);
    const targetRole = user?.targetRole || 'Software Engineer';

    const weaknesses: string[] = [
      ...(Array.isArray(evaluation.criticalGaps) ? evaluation.criticalGaps : []),
      ...(Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses : []),
      ...(Array.isArray(evaluation.suggestedImprovements) ? evaluation.suggestedImprovements : []),
      ...(Array.isArray(evaluation.recommendations)
        ? evaluation.recommendations.map((r: any) => (typeof r === 'string' ? r : r.title || r.category || ''))
        : []),
    ].filter(Boolean);

    for (const w of weaknesses.slice(0, 2)) {
      const { title, category, focusTopic } = this.normalizeSkill(w);
      const existing = await this.findEquivalentItem(userId, w);

      const evidenceLine = `System Design Studio Evaluation: ${problemTitle || 'Architecture Graph'} (Score: ${evaluation.overallScore || 'N/A'}/100)`;

      if (existing) {
        if (!existing.evidence.includes(evidenceLine)) {
          existing.evidence.push(evidenceLine);
        }
        existing.priority = 'HIGH';
        existing.source = 'SYSTEM_DESIGN';
        existing.lastUpdatedReason = `Updated from System Design Studio architecture evaluation`;
        existing.updatedAt = new Date();
        await existing.save();
      } else {
        const count = await RoadmapItem.countDocuments({ userId });
        await RoadmapItem.create({
          userId,
          targetRole,
          title,
          category: 'System Design',
          priority: 'HIGH',
          status: 'NOT_STARTED',
          reason: `System Design evaluation flagged improvement area in ${w}.`,
          evidence: [evidenceLine],
          source: 'SYSTEM_DESIGN',
          recommendedActions: [
            `Study trade-offs regarding ${focusTopic} in distributed systems`,
            `Refactor architecture canvas in System Design Studio`,
          ],
          actionTarget: {
            type: 'system-design',
            label: 'Design in Studio',
            focusTopic,
          },
          order: count,
          lastUpdatedReason: `Created from System Design Studio evaluation`,
        });
      }
    }
  }

  /**
   * Event Trigger: Resume Uploaded & Analyzed
   */
  static async recordResumeUpdate(
    userId: string | Types.ObjectId,
    extractedSkills: string[],
    recommendedFocusAreas: string[]
  ): Promise<void> {
    const user = await User.findById(userId);
    const targetRole = user?.targetRole || 'Software Engineer';

    // 1. For skills extracted on resume: update evidence on existing items
    for (const skill of extractedSkills) {
      const existing = await this.findEquivalentItem(userId, skill);
      if (existing) {
        const evLine = 'Skill verified in latest uploaded resume';
        if (!existing.evidence.includes(evLine)) {
          existing.evidence.push(evLine);
          existing.lastUpdatedReason = 'Updated evidence: Skill verified in latest uploaded resume';
          existing.updatedAt = new Date();
          await existing.save();
        }
      }
    }

    // 2. For recommended focus areas from resume NLP analysis: add/update roadmap
    for (const focus of (recommendedFocusAreas || []).slice(0, 2)) {
      const { title, category, focusTopic } = this.normalizeSkill(focus);
      const existing = await this.findEquivalentItem(userId, focus);

      const evLine = 'Identified as recommended focus area during Resume Intelligence analysis';
      if (existing) {
        if (!existing.evidence.includes(evLine)) {
          existing.evidence.push(evLine);
          existing.lastUpdatedReason = 'Updated from Resume Intelligence analysis';
          existing.updatedAt = new Date();
          await existing.save();
        }
      } else {
        const count = await RoadmapItem.countDocuments({ userId });
        await RoadmapItem.create({
          userId,
          targetRole,
          title,
          category,
          priority: 'MEDIUM',
          status: 'NOT_STARTED',
          reason: `Resume Intelligence recommends deepening expertise in ${focus} for ${targetRole}.`,
          evidence: [evLine],
          source: 'RESUME',
          recommendedActions: [
            `Review industry best practices for ${focusTopic}`,
            `Build practical projects and practice in Code Arena`,
          ],
          actionTarget: {
            type: category === 'System Design' ? 'system-design' : 'arena',
            label: 'Practice',
            focusTopic,
          },
          order: count,
          lastUpdatedReason: 'Added from Resume Intelligence analysis',
        });
      }
    }
  }

  /**
   * Event Trigger: Target Role Changed
   * Re-evaluates active priorities without erasing completed milestone history!
   */
  static async recordTargetRoleChange(
    userId: string | Types.ObjectId,
    oldRole: string,
    newRole: string,
    newTrackLevel?: string
  ): Promise<void> {
    if (!newRole || oldRole === newRole) return;

    const items = await RoadmapItem.find({ userId });
    const isNewRoleBackend = /backend|distributed|systems|cloud|data/i.test(newRole);
    const isNewRoleFrontend = /frontend|ui|react|web/i.test(newRole);

    for (const item of items) {
      // Rule: COMPLETED items stay COMPLETED as immutable historical evidence
      if (item.status === 'COMPLETED') {
        continue;
      }

      // Re-evaluate active items based on new target role alignment
      item.targetRole = newRole;
      const cat = item.category;

      if (isNewRoleBackend) {
        if (cat === 'Backend' || cat === 'System Design' || cat === 'SQL' || cat === 'Cloud') {
          item.priority = 'HIGH';
          item.lastUpdatedReason = `Prioritized to HIGH to align with new target role: ${newRole}`;
        } else if (cat === 'Frontend') {
          item.priority = 'LOW';
          item.lastUpdatedReason = `Deprioritized following target role change from ${oldRole} to ${newRole}`;
        }
      } else if (isNewRoleFrontend) {
        if (cat === 'Frontend' || (cat === 'Programming' && /react|ts|js/i.test(item.title))) {
          item.priority = 'HIGH';
          item.lastUpdatedReason = `Prioritized to HIGH to align with new target role: ${newRole}`;
        } else if (cat === 'System Design' && !/frontend/i.test(item.title)) {
          item.priority = 'MEDIUM';
          item.lastUpdatedReason = `Adjusted priority following target role change from ${oldRole} to ${newRole}`;
        }
      } else {
        item.lastUpdatedReason = `Re-evaluated following target role change to ${newRole}`;
      }

      item.updatedAt = new Date();
      await item.save();
    }
  }

  /**
   * Explicit Roadmap Refresh / Synchronization
   */
  static async refreshRoadmap(userId: string | Types.ObjectId, jdSkillGaps?: string[]): Promise<any[]> {
    const user = await User.findById(userId);
    if (!user) return [];

    const [codeLogs, sessions, reports, diagrams, existingItems] = await Promise.all([
      CodeExecutionLog.find({ userId }).sort({ createdAt: -1 }).limit(30),
      InterviewSession.find({ userId, status: 'completed' }).sort({ createdAt: -1 }).limit(10),
      FeedbackReport.find({ userId }).sort({ createdAt: -1 }).limit(10),
      SystemDesignDiagram.find({ userId }).sort({ updatedAt: -1 }).limit(10),
      RoadmapItem.find({ userId }),
    ]);

    const totalExecutions = codeLogs.length;
    const passedExecutions = codeLogs.filter((l) => l.status === 'passed').length;
    const failedExecutions = codeLogs.filter((l) => l.status !== 'passed').length;
    const passRate = totalExecutions > 0 ? Math.round((passedExecutions / totalExecutions) * 100) : 0;
    const languagesUsed = Array.from(new Set(codeLogs.map((l) => l.language).filter(Boolean)));

    const growthAreas: string[] = [];
    reports.forEach((r) => {
      if (Array.isArray(r.criticalGaps)) growthAreas.push(...r.criticalGaps);
      if (Array.isArray(r.actionableRoadmap)) {
        r.actionableRoadmap.forEach((a) => { if (a.topic) growthAreas.push(a.topic); });
      }
    });

    const params = {
      targetRole: user.targetRole || 'Software Engineer',
      trackLevel: user.trackLevel || 'Intermediate',
      userType: user.userType || 'JOB_SEEKER',
      experienceYears: user.parsedResumeData?.experienceYears,
      extractedSkills: user.parsedResumeData?.extractedSkills || [],
      recommendedFocusAreas: user.parsedResumeData?.recommendedFocusAreas || [],
      jdSkillGaps: jdSkillGaps || [],
      codingStats: {
        totalExecutions,
        passedExecutions,
        failedExecutions,
        passRate,
        languagesUsed,
      },
      interviewStats: {
        completedInterviews: sessions.length,
        averageScore: reports.length > 0
          ? Math.round(reports.reduce((acc, r) => acc + (r.overallScore || 0), 0) / reports.length)
          : null,
        growthAreas: Array.from(new Set(growthAreas)),
        domainsTested: Array.from(new Set(sessions.map((s) => s.domain))),
      },
      systemDesignStats: {
        diagramsCount: diagrams.length,
        componentsUsed: Array.from(new Set(diagrams.flatMap((d) => d.components || []))),
        weaknesses: [],
      },
    };

    const generated = await LLMService.generateAdaptiveRoadmap(params);

    const existingMap = new Map<string, any>();
    existingItems.forEach((it) => {
      existingMap.set(it.title.toLowerCase().trim(), it);
    });

    const updatedItems: any[] = [];
    let orderIndex = 0;

    for (const g of generated) {
      const key = g.title.toLowerCase().trim();
      if (existingMap.has(key)) {
        const existing = existingMap.get(key)!;
        existing.reason = g.reason;
        existing.evidence = g.evidence;
        existing.priority = g.priority;
        existing.recommendedActions = g.recommendedActions;
        if (g.actionTarget) existing.actionTarget = g.actionTarget;
        existing.order = orderIndex++;
        existing.lastUpdatedReason = 'Synchronized with latest platform telemetry';
        await existing.save();
        updatedItems.push(existing);
        existingMap.delete(key);
      } else {
        const newItem = await RoadmapItem.create({
          userId,
          targetRole: params.targetRole,
          title: g.title,
          category: g.category,
          priority: g.priority,
          status: 'NOT_STARTED',
          reason: g.reason,
          evidence: g.evidence,
          source: g.source,
          recommendedActions: g.recommendedActions,
          actionTarget: g.actionTarget,
          order: orderIndex++,
          lastUpdatedReason: 'Generated from platform telemetry review',
        });
        updatedItems.push(newItem);
      }
    }

    // Preserve all remaining items that are in progress or completed
    for (const remaining of existingMap.values()) {
      if (remaining.status === 'IN_PROGRESS' || remaining.status === 'COMPLETED') {
        remaining.order = orderIndex++;
        await remaining.save();
        updatedItems.push(remaining);
      }
    }

    return this.sortRoadmapItems(updatedItems);
  }

  /**
   * Retrieves candidate roadmap with stable, logical sorting
   */
  static async getRoadmap(userId: string | Types.ObjectId): Promise<any[]> {
    let items: any[] = await RoadmapItem.find({ userId });

    // If candidate has no items, attempt initial generation from verified profile data
    if (items.length === 0) {
      items = await this.refreshRoadmap(userId);
    }

    return this.sortRoadmapItems(items);
  }

  /**
   * Sorts roadmap items: IN_PROGRESS first, then NOT_STARTED, then COMPLETED; secondary by priority (HIGH > MEDIUM > LOW)
   */
  static sortRoadmapItems(items: any[]): any[] {
    const priorityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const statusWeight: Record<string, number> = { IN_PROGRESS: 3, NOT_STARTED: 2, COMPLETED: 1 };

    return [...items].sort((a, b) => {
      const sDiff = (statusWeight[b.status] || 0) - (statusWeight[a.status] || 0);
      if (sDiff !== 0) return sDiff;
      const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return a.order - b.order;
    });
  }
}

export default AdaptiveRoadmapService;
