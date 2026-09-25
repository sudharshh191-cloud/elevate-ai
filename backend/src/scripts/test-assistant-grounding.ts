import mongoose, { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import http from 'http';
import { connectDB } from '../config/db.js';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { CareerContextService } from '../services/careerContext.service.js';
import { LLMService } from '../services/llm.service.js';

function makeRequest(options: http.RequestOptions, postData: any = null): Promise<{ status: number; headers: any; data: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {
          // raw text
        }
        resolve({
          status: res.statusCode || 500,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 ELEVATE.AI — ASK ELEVATE ASSISTANT GROUNDING SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Connect to MongoDB
  await connectDB();
  console.log('--- 1. Connected to MongoDB ---');

  // 2. Test CareerContextService on Demo User
  console.log('\n--- 2. Testing CareerContextService Data Collection ---');
  const demoUser = await User.findOne({ email: 'demo@ai-interview.io' });
  assert(Boolean(demoUser), 'Demo user found in MongoDB');

  if (demoUser) {
    const demoCtx = await CareerContextService.getCareerContext(demoUser._id);
    assert(Boolean(demoCtx), 'Career context returned for demo user');
    assert(demoCtx?.user.name === demoUser.name, `User profile matched: ${demoCtx?.user.name}`);
    assert(demoCtx?.resume.hasResume === true, 'Resume status is true for demo user');
    assert(demoCtx?.resume.extractedSkills.length === 10, `Extracted skills count: ${demoCtx?.resume.extractedSkills.length}`);
    assert(typeof demoCtx?.resume.atsScore === 'number', `ATS score is present: ${demoCtx?.resume.atsScore}%`);
  }

  // 3. Test Clean Candidate (No Fake Personalization)
  console.log('\n--- 3. Testing Clean Candidate (No Resume / No Job Analysis) ---');
  const cleanUserId = new Types.ObjectId();
  const cleanEmail = `clean_${Date.now()}@elevate.test`;

  const cleanUser = await User.create({
    _id: cleanUserId,
    name: 'Clean Slate Candidate',
    email: cleanEmail,
    passwordHash: 'dummy',
    isVerified: true,
    userType: 'JOB_SEEKER',
    targetRole: 'Backend Engineer',
    trackLevel: 'Senior',
    experienceLevel: 'Senior',
    onboardingCompleted: true,
    skills: [],
    parsedResumeData: undefined,
    recentJobAnalyses: [],
    stats: {
      totalInterviews: 0,
      completedInterviews: 0,
      averageScore: 0,
      domainScores: {},
      streakDays: 0,
    },
  });

  const cleanCtx = await CareerContextService.getCareerContext(cleanUserId);
  assert(cleanCtx?.resume.hasResume === false, 'Clean candidate hasResume is false');
  assert(cleanCtx?.jobIntelligence.hasJobAnalysis === false, 'Clean candidate hasJobAnalysis is false');
  assert(cleanCtx?.roadmap.hasRoadmap === false, 'Clean candidate hasRoadmap is false');
  assert(cleanCtx?.practice.passedExecutions === 0, 'Clean candidate passedExecutions is 0');

  // Test Assistant Grounding for Clean Candidate Query 1
  const cleanJobRes = await LLMService.askElevatePersonalAssistant({
    question: 'Why am I not matching this job?',
    careerContext: cleanCtx!,
  });

  assert(
    cleanJobRes.answer.toLowerCase().includes("don't have a target job") ||
    cleanJobRes.answer.toLowerCase().includes('no target job') ||
    cleanJobRes.answer.toLowerCase().includes('analyze a job') ||
    cleanJobRes.answer.toLowerCase().includes('job intelligence'),
    'Assistant does NOT fabricate a job match and guides user to Job Intelligence'
  );
  assert(
    cleanJobRes.suggestedActions.some((a) => a.type === 'JOB_INTELLIGENCE' || a.route === 'job-intelligence'),
    'Suggested action guides to Job Intelligence route'
  );

  // Test Assistant Grounding for Clean Candidate Query 2
  const cleanResumeRes = await LLMService.askElevatePersonalAssistant({
    question: 'What skills am I missing from my resume?',
    careerContext: cleanCtx!,
  });

  assert(
    cleanResumeRes.answer.toLowerCase().includes("haven't analyzed your resume") ||
    cleanResumeRes.answer.toLowerCase().includes('not uploaded') ||
    cleanResumeRes.answer.toLowerCase().includes('upload your resume') ||
    cleanResumeRes.answer.toLowerCase().includes('resume hub'),
    'Assistant does NOT fabricate skills/ATS score and guides user to Resume Hub'
  );
  assert(
    cleanResumeRes.suggestedActions.some((a) => a.type === 'RESUME' || a.route === 'resume'),
    'Suggested action guides to Resume Hub route'
  );

  // 4. Test API Endpoint POST /api/assistant/ask over HTTP
  console.log('\n--- 4. Testing HTTP API: POST /api/assistant/ask ---');
  const cleanToken = jwt.sign(
    { userId: cleanUserId.toString(), email: cleanEmail, userType: 'JOB_SEEKER' },
    ENV.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const httpRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/assistant/ask',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanToken}`,
      },
    },
    { message: 'What should I work on today?' }
  );

  assert(httpRes.status === 200, `HTTP status 200 (Got ${httpRes.status})`);
  assert(typeof httpRes.data?.answer === 'string' && httpRes.data.answer.length > 20, 'HTTP response answer is valid text');
  assert(typeof httpRes.data?.whyThisMatters === 'string', 'HTTP response includes whyThisMatters evidence');
  assert(Array.isArray(httpRes.data?.suggestedActions), 'HTTP response includes suggestedActions array');

  // Clean up clean user
  await User.deleteOne({ _id: cleanUserId });
  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log(`📊 SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
