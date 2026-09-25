import { UserPersonaType } from '../types';

export interface PersonaRoleOption {
  id: string;
  title: string;
  category?: string;
  description?: string;
}

export interface PersonaLevelOption {
  id: string;
  label: string;
  description: string;
  equivalentExperienceLevel: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Staff';
}

export interface PersonaConfig {
  id: UserPersonaType;
  title: string;
  badge: string;
  icon: string;
  tagline: string;
  description: string;
  highlights: string[];
  targetRoles: PersonaRoleOption[];
  trackLevels: PersonaLevelOption[];
  defaultRole: string;
  defaultLevel: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
}

export const PERSONA_CONFIGS: Record<UserPersonaType, PersonaConfig> = {
  STUDENT: {
    id: 'STUDENT',
    title: 'College Student',
    badge: '🎓 Campus Placement & Fresher Track',
    icon: '🎓',
    tagline: 'Campus Placement & SDE-1 Preparation',
    description: 'Preparing for campus recruitments, internships, coding rounds, and entry-level software engineering roles.',
    highlights: ['DSA & Core CS Foundations', 'Campus Placement Mock Arena', 'Fresher ATS Resume Check', 'Topic-wise Coding Drills'],
    defaultRole: 'Software Engineer',
    defaultLevel: 'Intermediate',
    dashboardTitle: 'Campus Placement & SDE-1 Prep Hub',
    dashboardSubtitle: 'Practice Data Structures, Core CS subjects (OOP, DBMS, OS, Networks), and entry-level technical interview rounds.',
    targetRoles: [
      { id: 'Software Engineer', title: 'Software Engineer', description: 'Campus placements, DSA & core problem solving' },
      { id: 'Frontend Developer', title: 'Frontend Developer', description: 'React, JavaScript, modern web interfaces' },
      { id: 'Backend Developer', title: 'Backend Developer', description: 'Node.js, Java, Python, REST APIs & SQL' },
      { id: 'Full Stack Developer', title: 'Full Stack Developer', description: 'End-to-end web applications & database systems' },
      { id: 'Java Developer', title: 'Java Developer', description: 'Core Java, Spring Boot, Object-Oriented Design' },
      { id: 'Python Developer', title: 'Python Developer', description: 'Python programming, Django/FastAPI, automation' },
      { id: 'AI/ML Engineer', title: 'AI/ML Engineer', description: 'Machine Learning, PyTorch, model basics' },
      { id: 'Data Scientist', title: 'Data Scientist', description: 'Data analytics, SQL, Python, data visualization' },
      { id: 'Cloud Engineer', title: 'Cloud Engineer', description: 'AWS, Azure, GCP fundamentals & cloud infrastructure' },
      { id: 'DevOps Engineer', title: 'DevOps Engineer', description: 'CI/CD, Linux, Docker, containerization basics' },
    ],
    trackLevels: [
      {
        id: 'Beginner',
        label: 'Beginner',
        description: 'Building foundational programming syntax, logic, and basic problem solving.',
        equivalentExperienceLevel: 'Junior',
      },
      {
        id: 'Intermediate',
        label: 'Intermediate',
        description: 'Practicing Data Structures & Algorithms, OOP, DBMS, and Web/API basics.',
        equivalentExperienceLevel: 'Junior',
      },
      {
        id: 'Advanced',
        label: 'Advanced',
        description: 'Solving complex algorithms, system fundamentals, and building full projects.',
        equivalentExperienceLevel: 'Junior',
      },
      {
        id: 'Placement Ready',
        label: 'Placement Ready',
        description: 'Ready for campus recruitment coding tests, technical interviews, and CS subjects.',
        equivalentExperienceLevel: 'Junior',
      },
    ],
  },

  JOB_SEEKER: {
    id: 'JOB_SEEKER',
    title: 'Job Seeker / Graduate',
    badge: '💼 Job Seeker & Technical Track',
    icon: '💼',
    tagline: 'Active Tech Job Search & Interview Readiness',
    description: 'Actively applying for tech roles and aiming to ace technical, live coding, and behavioral interview loops.',
    highlights: ['Full-Stack Mock Arena', 'ATS Resume Optimization', 'Interview Feedback', 'Real-Time Voice Coaching'],
    defaultRole: 'Full Stack Developer',
    defaultLevel: 'Intermediate',
    dashboardTitle: 'Job Seeker Technical Interview Hub',
    dashboardSubtitle: 'Personalized technical simulations powered by real-time rubrics, real-time voice pacing, and live code test validation.',
    targetRoles: [
      { id: 'Software Engineer', title: 'Software Engineer', description: 'Problem solving, algorithms, and core application development' },
      { id: 'Frontend Developer', title: 'Frontend Developer', description: 'React, Next.js, TypeScript, modern web performance' },
      { id: 'Backend Developer', title: 'Backend Developer', description: 'REST/GraphQL APIs, microservices, databases & scalability' },
      { id: 'Full Stack Developer', title: 'Full Stack Developer', description: 'Frontend, backend, databases, and API integrations' },
      { id: 'Java Developer', title: 'Java Developer', description: 'Enterprise Java, Spring Boot, Microservices' },
      { id: 'Python Developer', title: 'Python Developer', description: 'Python web architectures, backend services, API pipelines' },
      { id: 'AI/ML Engineer', title: 'AI/ML Engineer', description: 'LLMs, generative AI, model inference, PyTorch' },
      { id: 'Data Scientist', title: 'Data Scientist', description: 'Statistical modeling, predictive analytics, SQL, pandas' },
      { id: 'Cloud Engineer', title: 'Cloud Engineer', description: 'Cloud infrastructure, AWS/Azure/GCP, networking & storage' },
      { id: 'DevOps Engineer', title: 'DevOps Engineer', description: 'CI/CD automation, Kubernetes, Docker, Terraform' },
      { id: 'Senior Full Stack', title: 'Senior Full Stack', description: 'Full-stack system architecture, microservices, high performance' },
    ],
    trackLevels: [
      {
        id: 'Beginner',
        label: 'Beginner',
        description: 'Building fundamental technical interview problem solving and coding speed.',
        equivalentExperienceLevel: 'Junior',
      },
      {
        id: 'Intermediate',
        label: 'Intermediate',
        description: 'Experienced in core development targeting mid-tier engineering interviews.',
        equivalentExperienceLevel: 'Mid',
      },
      {
        id: 'Advanced',
        label: 'Advanced',
        description: 'Comprehensive problem solving, clean code architecture, and system concepts.',
        equivalentExperienceLevel: 'Senior',
      },
      {
        id: 'Interview Ready',
        label: 'Interview Ready',
        description: 'Fully prepared for live technical screens, take-home tasks, and final interview loops.',
        equivalentExperienceLevel: 'Senior',
      },
    ],
  },

  PROFESSIONAL: {
    id: 'PROFESSIONAL',
    title: 'Working Professional',
    badge: '👨‍💻 Senior & Staff Engineering Track',
    icon: '👨‍💻',
    tagline: 'Senior, Staff & Engineering Leadership',
    description: 'Upskilling, preparing for Mid/Senior/Staff level promotions, FAANG interviews, and leadership roles.',
    highlights: ['High-Scale System Design', 'Distributed Systems & Tradeoffs', 'Staff Architecture Defense', 'Leadership & Behavioral'],
    defaultRole: 'Senior Full Stack',
    defaultLevel: 'Senior',
    dashboardTitle: 'Senior & Staff Engineering Command Center',
    dashboardSubtitle: 'High-concurrency distributed architectures, microservices trade-offs, and Staff+ behavioral leadership simulations.',
    targetRoles: [
      { id: 'Senior Full Stack', title: 'Senior Full Stack', description: 'High-impact full-stack architecture, micro-frontends, and distributed systems' },
      { id: 'Staff Frontend', title: 'Staff Frontend', description: 'Large-scale web platforms, module federation, frontend architecture & DX' },
      { id: 'Principal Backend', title: 'Principal Backend', description: 'Distributed systems, high-concurrency, resilience & data consistency' },
      { id: 'Engineering Manager', title: 'Engineering Manager', description: 'Technical leadership, organizational execution, mentoring & strategy' },
      { id: 'Software Engineer', title: 'Software Engineer', description: 'Core software engineering and architectural delivery' },
      { id: 'Frontend Developer', title: 'Frontend Developer', description: 'Modern frontend application development and frameworks' },
      { id: 'Backend Developer', title: 'Backend Developer', description: 'Backend service design, distributed databases & APIs' },
      { id: 'Full Stack Developer', title: 'Full Stack Developer', description: 'End-to-end full-stack feature delivery and infrastructure' },
      { id: 'Cloud Engineer', title: 'Cloud Engineer', description: 'Multi-cloud architecture, infrastructure-as-code & reliability' },
      { id: 'DevOps Engineer', title: 'DevOps Engineer', description: 'SRE practices, deployment automation, container orchestration' },
      { id: 'AI/ML Engineer', title: 'AI/ML Engineer', description: 'Production AI systems, ML pipelines, LLM fine-tuning' },
      { id: 'Data Scientist', title: 'Data Scientist', description: 'Advanced ML modeling, statistical research & analytics infrastructure' },
    ],
    trackLevels: [
      {
        id: 'Mid-Level',
        label: 'Mid-Level',
        description: 'Solid professional experience targeting higher-impact technical engineering roles.',
        equivalentExperienceLevel: 'Mid',
      },
      {
        id: 'Senior',
        label: 'Senior',
        description: 'Experienced engineer targeting senior-level design, system architecture, and code ownership.',
        equivalentExperienceLevel: 'Senior',
      },
      {
        id: 'Lead',
        label: 'Lead',
        description: 'Technical lead driving system design, code reviews, cross-team projects, and architectural decisions.',
        equivalentExperienceLevel: 'Lead',
      },
      {
        id: 'Management',
        label: 'Management',
        description: 'Engineering management, team strategy, hiring, and delivery execution.',
        equivalentExperienceLevel: 'Lead',
      },
    ],
  },

  CAREER_SWITCHER: {
    id: 'CAREER_SWITCHER',
    title: 'Career Switcher',
    badge: '🔄 Tech Transition & Fundamentals Track',
    icon: '🔄',
    tagline: 'Transitioning into Tech & Software Engineering',
    description: 'Moving into software engineering, data, or cloud from a non-tech or different industry background.',
    highlights: ['Core Programming Fundamentals', 'Step-by-Step Tech Transition', 'Portfolio & Project Prep', 'Bridge Mock Interviews'],
    defaultRole: 'Frontend Developer',
    defaultLevel: 'Beginner',
    dashboardTitle: 'Tech Transition & Career Switcher Launchpad',
    dashboardSubtitle: 'Build confidence with hands-on coding problems, fundamental CS concepts, and structured communication.',
    targetRoles: [
      { id: 'Software Engineer', title: 'Software Engineer', description: 'Foundational problem solving, algorithms, and core programming' },
      { id: 'Frontend Developer', title: 'Frontend Developer', description: 'HTML, CSS, JavaScript, React, and modern UI engineering' },
      { id: 'Backend Developer', title: 'Backend Developer', description: 'Server APIs, databases, business logic with Node.js/Python' },
      { id: 'Full Stack Developer', title: 'Full Stack Developer', description: 'Frontend + backend web application development' },
      { id: 'Python Developer', title: 'Python Developer', description: 'Python scripting, backend automation, API development' },
      { id: 'Data Scientist', title: 'Data Scientist', description: 'Data analytics, SQL queries, Python pandas, dashboard creation' },
      { id: 'Cloud Engineer', title: 'Cloud Engineer', description: 'Cloud practitioner foundations, AWS/Azure basics, Linux' },
      { id: 'DevOps Engineer', title: 'DevOps Engineer', description: 'Automation scripts, CI/CD pipelines, container basics' },
    ],
    trackLevels: [
      {
        id: 'Beginner',
        label: 'Beginner',
        description: 'Starting foundational learning in programming, Web, and CS concepts.',
        equivalentExperienceLevel: 'Junior',
      },
      {
        id: 'Intermediate',
        label: 'Intermediate',
        description: 'Building practical projects and hands-on coding experience.',
        equivalentExperienceLevel: 'Junior',
      },
      {
        id: 'Advanced',
        label: 'Advanced',
        description: 'Comfortable with full project stacks and technical interview concepts.',
        equivalentExperienceLevel: 'Junior',
      },
      {
        id: 'Transition Ready',
        label: 'Transition Ready',
        description: 'Ready for entry-level tech roles, technical coding screens, and portfolio defense.',
        equivalentExperienceLevel: 'Junior',
      },
    ],
  },
};

/**
 * Helper to get persona config safely with fallback to JOB_SEEKER
 */
export function getPersonaConfig(userType?: string | null): PersonaConfig {
  if (userType && userType in PERSONA_CONFIGS) {
    return PERSONA_CONFIGS[userType as UserPersonaType];
  }
  return PERSONA_CONFIGS.JOB_SEEKER;
}
