import mongoose, { Document, Schema } from 'mongoose';

export type UserPersonaType = 'STUDENT' | 'JOB_SEEKER' | 'PROFESSIONAL' | 'CAREER_SWITCHER';

export interface IStudentProfile {
  collegeName?: string;
  degree?: string;
  branchMajor?: string;
  currentYear?: string;
  graduationYear?: number;
  cgpa?: number;
  programmingLanguages?: string[];
  technicalSkills?: string[];
  areasOfInterest?: string[];
  targetJobRoles?: string[];
  internshipInterest?: boolean;
  placementPrepStatus?: string;
}

export interface IProfessionalProfile {
  currentRole?: string;
  yearsOfExperience?: number;
  industry?: string;
  currentSkills?: string[];
  targetRole?: string;
}

export interface ICareerSwitcherProfile {
  currentBackground?: string;
  yearsOfExperience?: number;
  currentSkills?: string[];
  targetCareerRole?: string;
  skillsToLearn?: string[];
}

export interface IParsedResume {
  rawText?: string;
  summary?: string;
  extractedSkills: string[];
  experienceYears?: number;
  education?: Array<{ degree: string; institution: string; year?: string }>;
  workHistory?: Array<{ company: string; role: string; duration?: string; highlights?: string[] }>;
  targetRoleMatch?: number; // 0 - 100%
  atsScore?: number; // 0 - 100
  recommendedFocusAreas?: string[];
}

export interface IEducationItem {
  _id?: string;
  institution: string;
  degree: string;
  department?: string;
  currentYear?: string;
  graduationYear?: number;
  gpa?: number | string;
  description?: string;
}

export interface IExperienceItem {
  _id?: string;
  company: string;
  role: string;
  employmentType?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  skills?: string[];
}

export interface IProjectItem {
  _id?: string;
  name: string;
  description: string;
  technologies?: string[];
  projectLink?: string;
  githubLink?: string;
  startDate?: string;
  endDate?: string;
}

export interface ICertificationItem {
  _id?: string;
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface IAchievementItem {
  _id?: string;
  title: string;
  description?: string;
  date?: string;
  organization?: string;
}

export interface ILanguageItem {
  _id?: string;
  language: string;
  proficiency: string;
}

export interface ICareerPreferences {
  preferredRoles?: string[];
  preferredLocations?: string[];
  workModes?: string[];
  industries?: string[];
}

export interface IJobAnalysisRequirementCategory {
  category: string;
  skills: string[];
}

export interface IJobAnalysisEvidenceItem {
  skill: string;
  category?: string;
  status: 'MATCHED' | 'PARTIAL' | 'NO_EVIDENCE';
  evidenceText: string;
  source: 'RESUME' | 'PROFILE' | 'PRACTICE' | 'SYSTEM_DESIGN' | 'INTERVIEW' | 'NONE';
}

export interface IJobAnalysisGapItem {
  skill: string;
  category?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  actionType: 'arena' | 'resume' | 'system-design' | 'profile' | 'analytics';
  actionLabel: string;
}

export interface IJobAnalysisNextStep {
  title: string;
  reason: string;
  actionType: 'arena' | 'resume' | 'system-design' | 'profile' | 'analytics';
  actionLabel: string;
  focusTopic?: string;
}

export interface IJobAnalysisItem {
  _id?: string;
  jobTitle: string;
  company?: string;
  jobDescription?: string;
  matchScore: number;
  requiredSkills?: string[];
  preferredSkills?: string[];
  strongMatchingSkills?: string[];
  skillsToDevelop?: string[];
  categorizedRequirements: IJobAnalysisRequirementCategory[];
  evidenceBreakdown: IJobAnalysisEvidenceItem[];
  gaps: IJobAnalysisGapItem[];
  nextSteps: IJobAnalysisNextStep[];
  likelyInterviewTopics: string[];
  preparationStrategy: string[];
  overview: string;
  createdAt?: Date;
}

export interface IProfileCompletenessSection {
  id: string;
  title: string;
  weight: number;
  completed: boolean;
  description: string;
}

export interface IProfileCompleteness {
  score: number;
  percentage: number;
  tier: 'Incomplete' | 'Basic' | 'Intermediate' | 'Advanced' | 'All-Star';
  completedSectionsCount: number;
  totalSectionsCount: number;
  sections: IProfileCompletenessSection[];
  nextRecommendedStep?: string;
}

export interface IAssessmentEvidence {
  _id?: string;
  skill: string;
  topic: string;
  category?: string;
  problemsAttempted: number;
  problemsPassed: number;
  passedTestCases: number;
  totalTestCases: number;
  successRate: number; // 0 - 100
  evidenceText: string;
  lastAssessedAt: Date;
  source: 'ASSESSMENT';
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  isVerified: boolean;
  userType: UserPersonaType;
  onboardingCompleted: boolean;
  avatar?: string;
  headline?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  targetRole: string;
  trackLevel?: string;
  experienceLevel: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Staff';
  careerGoalObjective?: string;
  careerPreferences?: ICareerPreferences;
  skills: Array<{ name: string; level: number; category: string }>;
  assessmentEvidence?: IAssessmentEvidence[];
  education?: IEducationItem[];
  experience?: IExperienceItem[];
  projects?: IProjectItem[];
  certifications?: ICertificationItem[];
  achievements?: IAchievementItem[];
  languages?: ILanguageItem[];
  studentProfile?: IStudentProfile;
  professionalProfile?: IProfessionalProfile;
  careerSwitcherProfile?: ICareerSwitcherProfile;
  resumeUrl?: string;
  parsedResumeData?: IParsedResume;
  recentJobAnalyses?: IJobAnalysisItem[];
  stats: {
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number;
    domainScores: Record<string, number>;
    streakDays: number;
    lastActiveDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export function calculateProfileCompleteness(user: any): IProfileCompleteness {
  if (!user) {
    return {
      score: 0,
      percentage: 0,
      tier: 'Incomplete',
      completedSectionsCount: 0,
      totalSectionsCount: 8,
      sections: [],
    };
  }

  const isStudent = user.userType === 'STUDENT';

  const hasBasicInfo = Boolean(
    user.name?.trim() && (user.headline?.trim() || user.bio?.trim() || user.location?.trim() || user.phone?.trim())
  );
  const hasCareerGoal = Boolean(
    user.targetRole?.trim() && (user.trackLevel || user.careerGoalObjective || user.careerPreferences?.preferredRoles?.length)
  );
  const hasEducation = Boolean(
    (user.education && user.education.length > 0 && user.education[0]?.institution) ||
    user.studentProfile?.collegeName
  );
  const hasSkills = Boolean(
    (user.skills && user.skills.length > 0) ||
    (user.parsedResumeData?.extractedSkills && user.parsedResumeData.extractedSkills.length > 0)
  );
  const hasExperience = Boolean(
    (user.experience && user.experience.length > 0 && user.experience[0]?.company) ||
    (user.parsedResumeData?.workHistory && user.parsedResumeData.workHistory.length > 0) ||
    user.professionalProfile?.currentRole
  );
  const hasProjects = Boolean(
    user.projects && user.projects.length > 0 && user.projects[0]?.name
  );
  const hasCertificationsOrAwards = Boolean(
    (user.certifications && user.certifications.length > 0) ||
    (user.achievements && user.achievements.length > 0)
  );
  const hasResume = Boolean(
    user.resumeUrl ||
    (user.parsedResumeData?.extractedSkills && user.parsedResumeData.extractedSkills.length > 0)
  );

  // For students, work experience is satisfied if they have internships OR strong projects
  const studentExperienceCompleted = hasExperience || hasProjects;

  const sections: IProfileCompletenessSection[] = [
    {
      id: 'basic_info',
      title: 'Basic Information',
      weight: 15,
      completed: hasBasicInfo,
      description: 'Full name, headline, location, or bio overview',
    },
    {
      id: 'career_goal',
      title: 'Career Goal & Target Role',
      weight: 15,
      completed: hasCareerGoal,
      description: 'Target position, career level, and preferences',
    },
    {
      id: 'education',
      title: 'Education',
      weight: isStudent ? 20 : 15,
      completed: hasEducation,
      description: 'Degree, institution, and graduation details',
    },
    {
      id: 'skills',
      title: 'Technical Skills',
      weight: 15,
      completed: hasSkills,
      description: 'Categorized user skills or verified keywords',
    },
    {
      id: 'experience',
      title: isStudent ? 'Work / Internships' : 'Work Experience',
      weight: isStudent ? 10 : 15,
      completed: isStudent ? studentExperienceCompleted : hasExperience,
      description: isStudent ? 'Internships, campus roles, or technical project evidence' : 'Positions, organizations, and impact descriptions',
    },
    {
      id: 'projects',
      title: 'Projects',
      weight: isStudent ? 15 : 10,
      completed: hasProjects,
      description: 'Technical repositories, live projects, and tools used',
    },
    {
      id: 'certifications',
      title: 'Certifications & Achievements',
      weight: 5,
      completed: hasCertificationsOrAwards,
      description: 'Verified credentials, awards, or hackathon wins',
    },
    {
      id: 'resume',
      title: 'Resume Connection',
      weight: 5,
      completed: hasResume,
      description: 'Uploaded resume document and ATS telemetry',
    },
  ];

  const completedSections = sections.filter((s) => s.completed);
  const score = Math.min(100, sections.reduce((acc, s) => acc + (s.completed ? s.weight : 0), 0));

  let tier: 'Incomplete' | 'Basic' | 'Intermediate' | 'Advanced' | 'All-Star' = 'Incomplete';
  if (score >= 90) tier = 'All-Star';
  else if (score >= 70) tier = 'Advanced';
  else if (score >= 50) tier = 'Intermediate';
  else if (score >= 25) tier = 'Basic';

  const firstIncomplete = sections.find((s) => !s.completed);
  const nextRecommendedStep = firstIncomplete ? `Add your ${firstIncomplete.title.toLowerCase()}` : undefined;

  return {
    score,
    percentage: score,
    tier,
    completedSectionsCount: completedSections.length,
    totalSectionsCount: sections.length,
    sections,
    nextRecommendedStep,
  };
}

const EducationItemSchema = new Schema(
  {
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    department: { type: String, default: '' },
    currentYear: { type: String, default: '' },
    graduationYear: { type: Number },
    gpa: { type: Schema.Types.Mixed },
    description: { type: String, default: '' },
  },
  { _id: true }
);

const ExperienceItemSchema = new Schema(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    employmentType: { type: String, default: 'Full-time' },
    location: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    current: { type: Boolean, default: false },
    description: { type: String, default: '' },
    skills: { type: [String], default: [] },
  },
  { _id: true }
);

const ProjectItemSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    technologies: { type: [String], default: [] },
    projectLink: { type: String, default: '' },
    githubLink: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
  },
  { _id: true }
);

const CertificationItemSchema = new Schema(
  {
    name: { type: String, required: true },
    issuer: { type: String, required: true },
    issueDate: { type: String, default: '' },
    expiryDate: { type: String, default: '' },
    credentialId: { type: String, default: '' },
    credentialUrl: { type: String, default: '' },
  },
  { _id: true }
);

const AchievementItemSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    date: { type: String, default: '' },
    organization: { type: String, default: '' },
  },
  { _id: true }
);

const LanguageItemSchema = new Schema(
  {
    language: { type: String, required: true },
    proficiency: { type: String, default: 'Professional Working' },
  },
  { _id: true }
);

const JobAnalysisItemSchema = new Schema(
  {
    jobTitle: { type: String, required: true },
    company: { type: String, default: '' },
    jobDescription: { type: String, default: '' },
    matchScore: { type: Number, default: 0 },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    strongMatchingSkills: { type: [String], default: [] },
    skillsToDevelop: { type: [String], default: [] },
    categorizedRequirements: [
      {
        category: { type: String, required: true },
        skills: { type: [String], default: [] },
      },
    ],
    evidenceBreakdown: [
      {
        skill: { type: String, required: true },
        category: { type: String, default: 'General' },
        status: { type: String, enum: ['MATCHED', 'PARTIAL', 'NO_EVIDENCE'], default: 'NO_EVIDENCE' },
        evidenceText: { type: String, default: '' },
        source: {
          type: String,
          enum: ['RESUME', 'PROFILE', 'PRACTICE', 'SYSTEM_DESIGN', 'INTERVIEW', 'NONE'],
          default: 'NONE',
        },
      },
    ],
    gaps: [
      {
        skill: { type: String, required: true },
        category: { type: String, default: 'General' },
        priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
        reason: { type: String, default: '' },
        actionType: { type: String, default: 'arena' },
        actionLabel: { type: String, default: 'Practice in Arena' },
      },
    ],
    nextSteps: [
      {
        title: { type: String, required: true },
        reason: { type: String, default: '' },
        actionType: { type: String, default: 'arena' },
        actionLabel: { type: String, default: 'Start Practice' },
        focusTopic: { type: String, default: '' },
      },
    ],
    likelyInterviewTopics: { type: [String], default: [] },
    preparationStrategy: { type: [String], default: [] },
    overview: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const AssessmentEvidenceSchema = new Schema<IAssessmentEvidence>(
  {
    skill: { type: String, required: true },
    topic: { type: String, required: true },
    category: { type: String, default: 'General' },
    problemsAttempted: { type: Number, default: 0 },
    problemsPassed: { type: Number, default: 0 },
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    evidenceText: { type: String, required: true },
    lastAssessedAt: { type: Date, default: Date.now },
    source: { type: String, enum: ['ASSESSMENT'], default: 'ASSESSMENT' },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    userType: {
      type: String,
      enum: ['STUDENT', 'JOB_SEEKER', 'PROFESSIONAL', 'CAREER_SWITCHER'],
      default: 'JOB_SEEKER',
    },
    onboardingCompleted: { type: Boolean, default: false },
    avatar: { type: String, default: '' },
    headline: { type: String, default: '' },
    bio: { type: String, default: '' },
    location: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    targetRole: { type: String, default: 'Fullstack Engineer' },
    trackLevel: { type: String, default: 'Intermediate' },
    experienceLevel: {
      type: String,
      enum: ['Junior', 'Mid', 'Senior', 'Lead', 'Staff'],
      default: 'Mid',
    },
    careerGoalObjective: { type: String, default: '' },
    careerPreferences: {
      preferredRoles: { type: [String], default: [] },
      preferredLocations: { type: [String], default: [] },
      workModes: { type: [String], default: [] },
      industries: { type: [String], default: [] },
    },
    skills: [
      {
        name: { type: String, required: true },
        level: { type: Number, min: 1, max: 100, default: 70 },
        category: { type: String, default: 'Technical' },
      },
    ],
    assessmentEvidence: { type: [AssessmentEvidenceSchema], default: [] },
    education: { type: [EducationItemSchema], default: [] },
    experience: { type: [ExperienceItemSchema], default: [] },
    projects: { type: [ProjectItemSchema], default: [] },
    certifications: { type: [CertificationItemSchema], default: [] },
    achievements: { type: [AchievementItemSchema], default: [] },
    languages: { type: [LanguageItemSchema], default: [] },
    studentProfile: {
      collegeName: { type: String, default: '' },
      degree: { type: String, default: '' },
      branchMajor: { type: String, default: '' },
      currentYear: { type: String, default: '' },
      graduationYear: { type: Number },
      cgpa: { type: Number },
      programmingLanguages: { type: [String], default: [] },
      technicalSkills: { type: [String], default: [] },
      areasOfInterest: { type: [String], default: [] },
      targetJobRoles: { type: [String], default: [] },
      internshipInterest: { type: Boolean, default: true },
      placementPrepStatus: { type: String, default: 'Actively Preparing' },
    },
    professionalProfile: {
      currentRole: { type: String, default: '' },
      yearsOfExperience: { type: Number, default: 0 },
      industry: { type: String, default: '' },
      currentSkills: { type: [String], default: [] },
      targetRole: { type: String, default: '' },
    },
    careerSwitcherProfile: {
      currentBackground: { type: String, default: '' },
      yearsOfExperience: { type: Number, default: 0 },
      currentSkills: { type: [String], default: [] },
      targetCareerRole: { type: String, default: '' },
      skillsToLearn: { type: [String], default: [] },
    },
    resumeUrl: { type: String },
    parsedResumeData: {
      type: {
        rawText: String,
        summary: String,
        extractedSkills: [String],
        experienceYears: Number,
        education: [
          {
            degree: String,
            institution: String,
            year: String,
          },
        ],
        workHistory: [
          {
            company: String,
            role: String,
            duration: String,
            highlights: [String],
          },
        ],
        targetRoleMatch: Number,
        atsScore: Number,
        recommendedFocusAreas: [String],
      },
      default: undefined,
    },
    recentJobAnalyses: { type: [JobAnalysisItemSchema], default: [] },
    stats: {
      totalInterviews: { type: Number, default: 0 },
      completedInterviews: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      domainScores: { type: Map, of: Number, default: {} },
      streakDays: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
