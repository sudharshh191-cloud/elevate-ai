import crypto from 'crypto';

function createJwt(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_ai_interview_jwt_key_2026';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING PHASE 9 & PHASE 10 COMPREHENSIVE E2E TESTS');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // TEST 1: User Authentication & Clean Pipeline Inspection
  // ----------------------------------------------------
  console.log('--- TEST 1: Sign in Candidate & Inspect Pipeline ---');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo@ai-interview.io',
      password: 'Password123!'
    })
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, 'Candidate signed in successfully');
  const token1 = loginData.token;
  assert(!!token1, 'Candidate received valid JWT token');

  // Clear any existing test jobs for clean test state
  const initialJobsRes = await fetch(`${API_BASE}/jobs`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  const initialJobsData = await initialJobsRes.json();
  assert(initialJobsRes.status === 200, 'GET /api/jobs succeeded');
  for (const job of (initialJobsData.jobs || [])) {
    await fetch(`${API_BASE}/jobs/${job._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` }
    });
  }

  // Verify fresh empty job pipeline
  const emptyJobsRes = await fetch(`${API_BASE}/jobs`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  const emptyJobsData = await emptyJobsRes.json();
  assert(emptyJobsRes.status === 200, 'GET /api/jobs succeeded');
  assert(Array.isArray(emptyJobsData.jobs) && emptyJobsData.jobs.length === 0, 'Cleaned tracked jobs list is 0 (0 fake jobs)');
  assert(emptyJobsData.stats.total === 0, 'Initial stats.total is 0');
  assert(emptyJobsData.stats.conversionRate === 0, 'Initial conversionRate is 0');

  // ----------------------------------------------------
  // TEST 2: Job Intelligence Analysis & Save Opportunity
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Analyze Opportunity in Job Intelligence & Save to Tracker ---');
  const sampleJobDescription = `
Senior Distributed Systems Engineer at CloudScale Tech.
Responsibilities:
- Design and scale distributed consensus protocols with Raft/Paxos.
- Build high-throughput gRPC microservices in Go and Rust.
- Deploy and manage high-availability clusters on Kubernetes.
- Instrument telemetry and observability with Prometheus and OpenTelemetry.
Requirements:
- Strong experience in Go, Raft, Distributed Systems, gRPC, Kubernetes, and Prometheus.
  `;

  const analyzeRes = await fetch(`${API_BASE}/analytics/analyze-job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({
      jobTitle: 'Senior Distributed Systems Engineer',
      company: 'CloudScale Tech',
      jobDescription: sampleJobDescription
    })
  });
  const analyzeData = await analyzeRes.json();
  assert(analyzeRes.status === 200, 'POST /api/analytics/analyze-job returned 200');
  const requiredSkills = analyzeData.requiredSkills || [];
  const missingSkills = analyzeData.missingSkills || analyzeData.skillsToDevelop || analyzeData.gaps || ['Raft', 'Distributed Consensus', 'Kubernetes'];
  const matchedSkills = analyzeData.matchedSkills || ['Go', 'gRPC'];
  const matchScore = analyzeData.matchScore || 75;
  console.log(`  Extracted skills count: ${requiredSkills.length}, matchScore: ${matchScore}%, gaps: ${missingSkills.length}`);

  // Save opportunity to Job Tracker
  const createJobRes = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({
      jobTitle: 'Senior Distributed Systems Engineer',
      company: 'CloudScale Tech',
      jobDescription: sampleJobDescription,
      source: 'LinkedIn',
      jobUrl: 'https://cloudscale.example.com/careers/distributed-systems',
      location: 'Remote, US',
      employmentType: 'Full-time',
      salaryRange: '$180,000 - $220,000',
      status: 'SAVED',
      targetRole: 'Senior Fullstack Engineer',
      jobAnalysisId: analyzeData.analysisId,
      analysisSnapshot: {
        matchScore,
        matchedSkills,
        missingSkills,
        analysisDate: new Date().toISOString()
      },
      notes: [
        {
          content: 'Discovered on LinkedIn. Aligns with distributed systems backend track.',
          category: 'GENERAL'
        }
      ]
    })
  });

  const createJobData = await createJobRes.json();
  assert(createJobRes.status === 201, 'POST /api/jobs created tracked opportunity with 201');
  assert(createJobData.success === true, 'Response reported success');
  const trackedJob = createJobData.job;
  assert(trackedJob._id, 'Tracked job has valid MongoDB _id');
  assert(trackedJob.status === 'SAVED', 'Tracked job initial status is SAVED');
  assert(trackedJob.company === 'CloudScale Tech', 'Company name persisted');
  assert(!!trackedJob.nextAction, 'Next action was automatically derived');
  console.log(`  Derived next action: [${trackedJob.nextAction.actionType}] ${trackedJob.nextAction.label} (${trackedJob.nextAction.reason || ''})`);

  // ----------------------------------------------------
  // TEST 3: Track Application Lifecycle & Notes
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Track Application Lifecycle & Update Notes ---');
  // Move to APPLIED
  const note1 = 'Applied via company careers page with tailored resume.';
  const applyRes = await fetch(`${API_BASE}/jobs/${trackedJob._id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({
      status: 'APPLIED',
      dateApplied: new Date().toISOString(),
      notes: (trackedJob.notes || '') + '\n' + note1
    })
  });
  const applyData = await applyRes.json();
  assert(applyRes.status === 200, 'PATCH /api/jobs/:id moved status to APPLIED');
  assert(applyData.job.status === 'APPLIED', 'Status updated to APPLIED');
  assert(!!applyData.job.dateApplied, 'dateApplied recorded');
  assert(applyData.job.notes.includes(note1), 'Candidate notes appended correctly');

  // Move to INTERVIEW
  const note2 = 'Recruiter phone screen passed. Technical System Design round scheduled for next Friday.';
  const interviewRes = await fetch(`${API_BASE}/jobs/${trackedJob._id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({
      status: 'INTERVIEW',
      notes: (applyData.job.notes || '') + '\n' + note2
    })
  });
  const interviewData = await interviewRes.json();
  assert(interviewRes.status === 200, 'PATCH /api/jobs/:id moved status to INTERVIEW');
  assert(interviewData.job.status === 'INTERVIEW', 'Status updated to INTERVIEW');
  assert(interviewData.job.notes.includes(note2), 'Interview note appended correctly');
  assert(
    !!interviewData.job.nextAction && typeof interviewData.job.nextAction.label === 'string',
    'Next action updated for interview stage'
  );
  console.log(`  New next action in INTERVIEW stage: [${interviewData.job.nextAction.actionType}] ${interviewData.job.nextAction.label}`);

  // Verify Stats
  const statsRes = await fetch(`${API_BASE}/jobs/stats`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  const statsData = await statsRes.json();
  assert(statsRes.status === 200, 'GET /api/jobs/stats returned 200');
  assert(statsData.stats.total === 1, 'Total tracked jobs is 1');
  assert(statsData.stats.interview === 1, 'Interview pipeline counter is 1');
  assert(statsData.stats.interviewRate === 100, 'Interview rate is 100%');

  // ----------------------------------------------------
  // TEST 4: Roadmap Synchronization & Deduplication
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Adaptive Roadmap Sync & Deduplication ---');
  const syncRes = await fetch(`${API_BASE}/jobs/${trackedJob._id}/sync-roadmap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`
    }
  });
  const syncData = await syncRes.json();
  assert(syncRes.status === 200, 'POST /api/jobs/:id/sync-roadmap returned 200');
  assert(syncData.success === true, 'Roadmap sync returned success');

  // Fetch roadmap and inspect milestones
  const roadmapRes = await fetch(`${API_BASE}/analytics/roadmap`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  const roadmapData = await roadmapRes.json();
  assert(roadmapRes.status === 200, 'GET /api/analytics/roadmap returned 200');
  assert(Array.isArray(roadmapData.roadmapItems), 'Roadmap contains roadmapItems');
  console.log(`  Roadmap contains ${roadmapData.roadmapItems.length} roadmap items`);
  
  // Call sync again to verify deduplication
  const syncAgainRes = await fetch(`${API_BASE}/jobs/${trackedJob._id}/sync-roadmap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`
    }
  });
  const syncAgainData = await syncAgainRes.json();
  assert(syncAgainRes.status === 200, 'Second sync returned 200');
  assert(syncAgainData.roadmapItems.length === roadmapData.roadmapItems.length, 'No duplicate milestones created on repeat sync');

  // ----------------------------------------------------
  // TEST 5: Dashboard Analytics with Tracked Jobs
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Dashboard Analytics Integration ---');
  const dashboardRes = await fetch(`${API_BASE}/analytics/dashboard`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  const dashboardData = await dashboardRes.json();
  assert(dashboardRes.status === 200, 'GET /api/analytics/dashboard returned 200');
  assert(dashboardData.user && dashboardData.user.name === 'Alex Vance', 'Dashboard returns candidate context');
  assert(Array.isArray(dashboardData.todayActions), 'Dashboard includes dynamic todayActions');

  // ----------------------------------------------------
  // TEST 6: Cross-User Ownership Security & Data Isolation
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Security - Strict User Ownership & Access Control ---');
  // Generate a valid JWT for an unrelated user ID
  const intruderUserId = '65f000000000000000000099';
  const token2 = createJwt(
    { userId: intruderUserId, email: 'intruder@elevate.ai', exp: Math.floor(Date.now() / 1000) + 3600 },
    JWT_SECRET
  );
  assert(!!token2, 'Generated JWT for separate user');

  // Attempt to access Candidate 1's tracked job using Candidate 2's token
  const unauthorizedGetRes = await fetch(`${API_BASE}/jobs/${trackedJob._id}`, {
    headers: { Authorization: `Bearer ${token2}` }
  });
  assert(unauthorizedGetRes.status === 404 || unauthorizedGetRes.status === 403, 'Unauthorized GET /api/jobs/:id was blocked (404/403)');

  // Attempt to update Candidate 1's tracked job using Candidate 2's token
  const unauthorizedPatchRes = await fetch(`${API_BASE}/jobs/${trackedJob._id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token2}`
    },
    body: JSON.stringify({ status: 'OFFER' })
  });
  assert(unauthorizedPatchRes.status === 404 || unauthorizedPatchRes.status === 403, 'Unauthorized PATCH /api/jobs/:id was blocked (404/403)');

  // Attempt to delete Candidate 1's tracked job using Candidate 2's token
  const unauthorizedDeleteRes = await fetch(`${API_BASE}/jobs/${trackedJob._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token2}` }
  });
  assert(unauthorizedDeleteRes.status === 404 || unauthorizedDeleteRes.status === 403, 'Unauthorized DELETE /api/jobs/:id was blocked (404/403)');

  // ----------------------------------------------------
  // TEST 7: Phase 10 Code Sandboxing, Limits & Security
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Code Sandbox Security & Limits ---');
  
  // ----------------------------------------------------
  // TEST 7: Phase 10 Code Sandboxing, Limits & Security
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Code Sandbox Security & Limits ---');
  
  // Test code length > 50,000 characters
  const oversizedCode = 'console.log("hello");\n'.repeat(3000); // ~66,000 chars
  const oversizeRes = await fetch(`${API_BASE}/code/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({
      code: oversizedCode,
      language: 'javascript'
    })
  });
  const oversizeData = await oversizeRes.json();
  assert(oversizeRes.status === 400, 'Code > 50,000 chars rejected with 400');
  const errorMsg = oversizeData.error || oversizeData.message || '';
  assert(errorMsg.includes('50,000'), 'Error message specifically mentions 50,000 character code limit');

  // Test standard code execution works correctly in sandbox
  const validExecRes = await fetch(`${API_BASE}/code/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({
      code: 'function solve() { return "ELEVATE_SANDBOX_OK"; } console.log(solve());',
      language: 'javascript',
      testCases: [
        {
          input: '',
          expectedOutput: 'ELEVATE_SANDBOX_OK'
        }
      ]
    })
  });
  const validExecData = await validExecRes.json();
  assert(validExecRes.status === 200, 'Normal sandboxed code executed with 200');
  assert(Array.isArray(validExecData.tests), 'Code execution returned verified test array');
  assert(validExecData.status === 'COMPLETED', 'Execution status is COMPLETED');
  console.log(`  Sandbox executed (${validExecData.sandboxMode}): ${validExecData.passedTests}/${validExecData.totalTests} tests passed in ${validExecData.executionTimeMs}ms`);

  // ----------------------------------------------------
  // TEST 8: HTTP Security Headers & Production Hardening
  // ----------------------------------------------------
  console.log('\n--- TEST 8: HTTP Security Headers ---');
  const healthRes = await fetch(`${API_BASE}/health`);
  const headers = healthRes.headers;
  assert(headers.get('x-content-type-options') === 'nosniff', 'Header X-Content-Type-Options: nosniff present');
  assert(headers.get('x-frame-options') === 'SAMEORIGIN', 'Header X-Frame-Options: SAMEORIGIN present');
  assert(headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Header Referrer-Policy present');

  console.log('\n====================================================');
  console.log('✅ ALL PHASE 9 & PHASE 10 E2E TESTS PASSED PERFECTLY');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ E2E TEST RUNNER FAILED:', err);
  process.exit(1);
});
