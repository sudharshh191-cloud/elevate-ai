import { z } from 'zod';

export const RubricCriterionSchema = z.object({
  title: z.string(),
  weight: z.number().min(0).max(100).default(25),
  keyPointsToLookFor: z.array(z.string()).default([]),
});

export const CodeTemplateSchema = z.object({
  language: z.string().default('typescript'),
  starterCode: z.string().default(''),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
      })
    )
    .optional(),
});

export const GeneratedQuestionSchema = z.object({
  questionText: z.string().min(10),
  domain: z.string(),
  category: z.string().default('Technical Core'),
  difficulty: z.string().default('Senior'),
  format: z.enum(['Voice', 'Code', 'Hybrid']).default('Hybrid'),
  expectedDurationMinutes: z.number().default(5),
  hints: z.array(z.string()).default([]),
  rubricCriteria: z.array(RubricCriterionSchema).default([
    { title: 'Technical Precision', weight: 40, keyPointsToLookFor: ['Accurate concept understanding'] },
    { title: 'Communication Structure', weight: 30, keyPointsToLookFor: ['Clear explanation'] },
    { title: 'Problem Solving', weight: 30, keyPointsToLookFor: ['Edge case mitigation'] },
  ]),
  idealAnswerOutline: z.string().min(10),
  codeTemplate: CodeTemplateSchema.optional(),
  tags: z.array(z.string()).optional().default([]),
});

export const QuestionsResponseSchema = z.object({
  questions: z.array(GeneratedQuestionSchema).min(1),
});

export const AnswerEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  technicalAccuracyScore: z.number().min(0).max(100),
  communicationScore: z.number().min(0).max(100),
  instantFeedback: z.object({
    score: z.number().min(0).max(100),
    technicalAccuracy: z.number().min(0).max(100),
    communication: z.number().min(0).max(100),
    strengths: z.array(z.string()).min(1),
    improvements: z.array(z.string()).min(1),
    coachNote: z.string(),
  }),
  keyPointsCovered: z.array(z.string()).default([]),
  keyPointsMissed: z.array(z.string()).default([]),
  codeReviewFeedback: z
    .object({
      timeComplexity: z.string().optional(),
      spaceComplexity: z.string().optional(),
      codeSmells: z.array(z.string()).optional().default([]),
      bestPracticeTips: z.array(z.string()).optional().default([]),
    })
    .optional(),
  constructiveCritique: z.string().min(10),
});

export const RoadmapItemSchema = z.object({
  week: z.number().min(1).max(12),
  topic: z.string(),
  recommendedAction: z.string(),
  practiceResources: z.array(z.string()).default([]),
});

export const SkillScoreSchema = z.object({
  metric: z.string(),
  score: z.number().min(0).max(100),
  benchmark: z.number().min(0).max(100).default(75),
});

export const PerformanceTierSchema = z
  .union([
    z.enum(['Exceptional', 'Strong Hire', 'Hire', 'Borderline', 'Needs Practice']),
    z.string().transform((val) => {
      const lower = val.toLowerCase();
      if (lower.includes('exceptional')) return 'Exceptional';
      if (lower.includes('strong')) return 'Strong Hire';
      if (lower.includes('borderline')) return 'Borderline';
      if (lower.includes('needs') || lower.includes('no hire') || lower.includes('reject') || lower.includes('practice'))
        return 'Needs Practice';
      return 'Hire';
    }),
  ])
  .default('Hire');

export const SessionFeedbackReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  performanceTier: PerformanceTierSchema,
  executiveSummary: z.string().min(10),
  metrics: z.object({
    technicalAccuracy: z.number().min(0).max(100),
    communicationClarity: z.number().min(0).max(100),
    problemSolving: z.number().min(0).max(100),
    confidenceAndDelivery: z.number().min(0).max(100),
    codeQualityAndEfficiency: z.number().min(0).max(100),
  }),
  radarChartData: z.array(SkillScoreSchema).default([]),
  topStrengths: z.array(z.string()).default([]),
  criticalGaps: z.array(z.string()).default([]),
  actionableRoadmap: z.array(RoadmapItemSchema).default([]),
});

export const SystemDesignRecommendationSchema = z.object({
  category: z.string().default('Architecture'),
  title: z.string().default('Enhance Resilience'),
  description: z.string().default('Implement circuit breakers and automated failover.'),
  priority: z
    .union([
      z.enum(['High', 'Medium', 'Low']),
      z.string().transform((val) => {
        const lower = val.toLowerCase();
        if (lower.includes('high')) return 'High';
        if (lower.includes('low')) return 'Low';
        return 'Medium';
      }),
    ])
    .default('Medium'),
});

export const SystemDesignVerdictSchema = z
  .union([
    z.enum(['Staff Architect', 'Principal Ready', 'Senior Pass', 'Needs Work']),
    z.string().transform((val) => {
      const lower = val.toLowerCase();
      if (lower.includes('staff')) return 'Staff Architect';
      if (lower.includes('principal')) return 'Principal Ready';
      if (lower.includes('needs') || lower.includes('work') || lower.includes('reject')) return 'Needs Work';
      return 'Senior Pass';
    }),
  ])
  .default('Senior Pass');

export const SystemDesignTradeoffSchema = z.object({
  decision: z.string().default(''),
  upside: z.string().default(''),
  downside: z.string().default(''),
});

export const SystemDesignEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  verdict: SystemDesignVerdictSchema,
  executiveSummary: z.string().min(10),
  dimensions: z.object({
    scalability: z.number().min(0).max(100),
    reliability: z.number().min(0).max(100),
    availability: z.number().min(0).max(100),
    performance: z.number().min(0).max(100),
    dataDesign: z.number().min(0).max(100),
    security: z.number().min(0).max(100),
    costEfficiency: z.number().min(0).max(100),
  }),
  topStrengths: z.array(z.string()).default([]),
  criticalGaps: z.array(z.string()).default([]),
  recommendations: z.array(SystemDesignRecommendationSchema).default([]),
  tradeoffs: z.array(SystemDesignTradeoffSchema).default([]),
});

export const AdaptiveRoadmapItemSchema = z.object({
  title: z.string(),
  category: z.enum([
    'DSA',
    'Programming',
    'CS Fundamentals',
    'SQL',
    'Backend',
    'Frontend',
    'Full Stack',
    'System Design',
    'Cloud',
    'DevOps',
    'AI/ML',
    'Data',
    'Behavioral',
    'Interview',
    'Other',
  ]).default('Other'),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  reason: z.string(),
  evidence: z.array(z.string()).default([]),
  source: z.enum([
    'RESUME',
    'JOB_DESCRIPTION',
    'CODING',
    'INTERVIEW',
    'SYSTEM_DESIGN',
    'AI_ANALYSIS',
    'COMBINED',
  ]).default('COMBINED'),
  recommendedActions: z.array(z.string()).default([]),
  actionTarget: z.object({
    type: z.enum(['arena', 'resume', 'system-design', 'analytics']).default('arena'),
    label: z.string().default('Practice'),
    focusTopic: z.string().optional(),
  }).optional(),
});

export const AdaptiveRoadmapResponseSchema = z.object({
  roadmapItems: z.array(AdaptiveRoadmapItemSchema),
});

export const JobAnalysisRequirementCategorySchema = z.object({
  category: z.string(),
  skills: z.array(z.string()).default([]),
});

export const JobAnalysisEvidenceItemSchema = z.object({
  skill: z.string(),
  category: z.string().default('General'),
  status: z.enum(['MATCHED', 'PARTIAL', 'NO_EVIDENCE']).default('NO_EVIDENCE'),
  evidenceText: z.string().default(''),
  source: z.enum(['RESUME', 'PROFILE', 'PRACTICE', 'SYSTEM_DESIGN', 'INTERVIEW', 'NONE']).default('NONE'),
});

export const JobAnalysisGapItemSchema = z.object({
  skill: z.string(),
  category: z.string().default('General'),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  reason: z.string(),
  actionType: z.enum(['arena', 'resume', 'system-design', 'profile', 'analytics']).default('arena'),
  actionLabel: z.string().default('Practice in Arena'),
});

export const JobAnalysisNextStepSchema = z.object({
  title: z.string(),
  reason: z.string(),
  actionType: z.enum(['arena', 'resume', 'system-design', 'profile', 'analytics']).default('arena'),
  actionLabel: z.string().default('Start Practice'),
  focusTopic: z.string().optional(),
});

export const JobIntelligenceResponseSchema = z.object({
  jobTitle: z.string(),
  company: z.string().default('Target Company'),
  matchScore: z.number().min(0).max(100).default(0),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  categorizedRequirements: z.array(JobAnalysisRequirementCategorySchema).default([]),
  evidenceBreakdown: z.array(JobAnalysisEvidenceItemSchema).default([]),
  strongMatchingSkills: z.array(z.string()).default([]),
  skillsToDevelop: z.array(z.string()).default([]),
  gaps: z.array(JobAnalysisGapItemSchema).default([]),
  nextSteps: z.array(JobAnalysisNextStepSchema).default([]),
  likelyInterviewTopics: z.array(z.string()).default([]),
  preparationStrategy: z.array(z.string()).default([]),
  overview: z.string(),
});

export const AssistantActionTypeSchema = z.enum([
  'PRACTICE',
  'RESUME',
  'JOB_INTELLIGENCE',
  'INTERVIEW',
  'SYSTEM_DESIGN',
  'ROADMAP',
  'PROFILE',
]);

export const AssistantSuggestedActionSchema = z.object({
  label: z.string(),
  type: AssistantActionTypeSchema,
  route: z.string().default('dashboard'),
  focusTopic: z.string().optional(),
});

export const AskAssistantResponseSchema = z.object({
  answer: z.string(),
  whyThisMatters: z.string().optional(),
  suggestedActions: z.array(AssistantSuggestedActionSchema).default([]),
});

export type IGeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;
export type IAnswerEvaluation = z.infer<typeof AnswerEvaluationSchema>;
export type ISessionFeedbackReport = z.infer<typeof SessionFeedbackReportSchema>;
export type ISystemDesignEvaluation = z.infer<typeof SystemDesignEvaluationSchema>;
export type IAdaptiveRoadmapItem = z.infer<typeof AdaptiveRoadmapItemSchema>;
export type IAdaptiveRoadmapResponse = z.infer<typeof AdaptiveRoadmapResponseSchema>;
export type IJobIntelligenceResponse = z.infer<typeof JobIntelligenceResponseSchema>;
export type IAssistantActionType = z.infer<typeof AssistantActionTypeSchema>;
export type IAssistantSuggestedAction = z.infer<typeof AssistantSuggestedActionSchema>;
export type IAskAssistantResponse = z.infer<typeof AskAssistantResponseSchema>;


