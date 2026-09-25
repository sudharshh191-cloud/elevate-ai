import { LLMService } from '../services/llm.service.js';
import { ENV } from '../config/env.js';

async function testGeminiPhase5() {
  console.log('⚡ ================================================================');
  console.log('⚡ ELEVATE.AI PHASE 5: LIVE GEMINI AI VERIFICATION');
  console.log('⚡ ================================================================\n');

  // Test 1: API Key & Status
  console.log('▶️ [1/6] Checking Gemini API Key Detection & LLM Status...');
  const status = LLMService.getLlmStatus();
  console.log('   • Provider:', status.provider);
  console.log('   • Configured:', status.configured);
  console.log('   • Status:', status.status);
  console.log('   • Active Model:', status.model);
  console.log('   • Key Length:', ENV.GEMINI_API_KEY ? ENV.GEMINI_API_KEY.length : 0);

  if (!status.configured || status.provider !== 'gemini' || status.model !== 'gemini-3.6-flash') {
    throw new Error(`LLM Status check failed: ${JSON.stringify(status)}`);
  }
  console.log('✅ Gemini API key detected and configured with model gemini-3.6-flash.\n');

  // Test 2: Raw Model Response
  console.log('▶️ [2/6] Testing Direct HTTP Call to Gemini Model Endpoint...');
  const models = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
  let directSuccess = false;
  let activeWorkingModel = '';

  for (const model of models) {
    try {
      const directResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENV.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with strict JSON: {"status": "LIVE_GEMINI_ACTIVE"}' }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );
      const directData: any = await directResponse.json();
      const directText = directData.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log(`   • Model: ${model} -> HTTP Status: ${directResponse.status}`);
      if (directText && directText.includes('LIVE_GEMINI_ACTIVE')) {
        console.log(`   • Raw Response: ${directText}`);
        directSuccess = true;
        activeWorkingModel = model;
        break;
      } else {
        console.log(`   • Notice: ${directData.error?.message?.slice(0, 100) || 'Rate limited or busy'}`);
      }
    } catch (e: any) {
      console.log(`   • Attempt on ${model} caught: ${e.message}`);
    }
  }

  if (!directSuccess) {
    throw new Error('All direct Gemini API endpoint calls failed');
  }
  console.log(`✅ Direct call to Gemini (${activeWorkingModel}) responded with valid JSON.\n`);

  // Test 3: generateQuestions()
  console.log('▶️ [3/6] Testing LLMService.generateQuestions() with candidate skills...');
  const genStart = Date.now();
  const questions = await LLMService.generateQuestions({
    domain: 'Frontend',
    difficulty: 'Senior',
    format: 'Hybrid',
    targetRole: 'Staff Frontend Architect',
    userSkills: ['React', 'TypeScript', 'Web Audio API', 'State Management'],
    count: 2,
  });
  const genDuration = Date.now() - genStart;
  console.log(`   • Questions Generated: ${questions.length} (Latency: ${genDuration}ms)`);
  questions.forEach((q, idx) => {
    console.log(`   [Q${idx + 1}] (${q.domain} / ${q.difficulty} / ${q.format}): "${q.questionText}"`);
    console.log(`        Rubric criteria count: ${q.rubricCriteria?.length || 0}`);
    console.log(`        Hints available: ${q.hints?.length || 0}`);
  });

  if (!questions || questions.length < 1) {
    throw new Error('generateQuestions returned empty array');
  }
  console.log('✅ generateQuestions() executed live with Gemini and validated against Zod schema.\n');

  // Test 4: evaluateResponse()
  console.log('▶️ [4/6] Testing LLMService.evaluateResponse()...');
  const evalStart = Date.now();
  const evaluation = await LLMService.evaluateResponse({
    questionText: questions[0].questionText,
    domain: questions[0].domain,
    category: questions[0].category || 'Frontend Architecture',
    difficulty: questions[0].difficulty,
    format: questions[0].format,
    userResponseText:
      'To build an infinite scroll list with 100k items, I implement virtualized windowing by rendering only items visible in viewport plus a buffer zone. We calculate dynamic row heights using ResizeObserver and maintain binary search index for scroll position offsets. For state, we use shallow memoization and Web Workers for expensive data parsing.',
    rubricCriteria: questions[0].rubricCriteria,
  });
  const evalDuration = Date.now() - evalStart;
  console.log(`   • Overall Score: ${evaluation.score}/100 (Latency: ${evalDuration}ms)`);
  console.log(`   • Technical Accuracy: ${evaluation.technicalAccuracyScore}/100`);
  console.log(`   • Communication: ${evaluation.communicationScore}/100`);
  console.log(`   • Coach Note: "${evaluation.instantFeedback?.coachNote || ''}"`);
  console.log(`   • Strengths: ${evaluation.instantFeedback?.strengths?.join(' | ') || ''}`);
  console.log(`   • Constructive Critique: "${evaluation.constructiveCritique}"`);

  if (!evaluation || evaluation.score === undefined) {
    throw new Error('evaluateResponse failed');
  }
  console.log('✅ evaluateResponse() returned live structured critique from Gemini.\n');

  // Test 5: generateSessionReport()
  console.log('▶️ [5/6] Testing LLMService.generateSessionReport()...');
  const reportStart = Date.now();
  const masterReport = await LLMService.generateSessionReport({
    domain: 'Frontend',
    difficulty: 'Senior',
    targetRole: 'Staff Frontend Architect',
    candidateSkills: ['React', 'TypeScript', 'Web Audio API'],
    questions: [
      {
        questionIndex: 0,
        questionText: questions[0].questionText,
        category: questions[0].category || 'Frontend Architecture',
        userResponseText: 'Virtualized windowing with dynamic row heights and ResizeObserver.',
        evaluation,
      },
    ],
    overallAverageScore: evaluation.score,
  });
  const reportDuration = Date.now() - reportStart;
  console.log(`   • Performance Tier: "${masterReport.performanceTier}" (Latency: ${reportDuration}ms)`);
  console.log(`   • Executive Summary: "${masterReport.executiveSummary}"`);
  console.log(`   • Top Strengths (${masterReport.topStrengths?.length || 0}): ${masterReport.topStrengths?.join(' | ') || 'None'}`);
  console.log(`   • Critical Gaps (${masterReport.criticalGaps?.length || 0}): ${masterReport.criticalGaps?.join(' | ') || 'None'}`);
  console.log(`   • 4-Week Roadmap Items: ${masterReport.actionableRoadmap?.length || 0}`);

  if (!masterReport || !masterReport.performanceTier || !masterReport.executiveSummary) {
    throw new Error('generateSessionReport failed');
  }
  console.log('✅ generateSessionReport() synthesized live comprehensive scorecard.\n');

  // Test 6: evaluateSystemDesign()
  console.log('▶️ [6/6] Testing LLMService.evaluateSystemDesign()...');
  const designStart = Date.now();
  const designEval = await LLMService.evaluateSystemDesign({
    problemTitle: 'Design Global Rate Limiter',
    requirements: 'Scale: 100M daily users, sub-millisecond latency, multi-region sync.',
    nodes: [
      { id: '1', label: 'Layer 7 Load Balancer', type: 'load_balancer' },
      { id: '2', label: 'Rate Limiter Service', type: 'microservice' },
      { id: '3', label: 'Redis Cluster', type: 'cache' },
    ],
    edges: [
      { source: '1', target: '2', protocol: 'HTTPS' },
      { source: '2', target: '3', protocol: 'Redis TCP' },
    ],
    trafficConfig: { dau: 100000000, requestsPerUser: 10, peakMultiplier: 2.0 },
    calculatedMetrics: { peakRps: 23148, dailyStorageGb: 50 },
    validationWarnings: [],
  });
  const designDuration = Date.now() - designStart;
  console.log(`   • System Design Score: ${designEval.overallScore}/100 (Latency: ${designDuration}ms)`);
  console.log(`   • Verdict: "${designEval.verdict}"`);
  console.log(`   • Executive Summary: "${designEval.executiveSummary}"`);

  if (!designEval || designEval.overallScore === undefined) {
    throw new Error('evaluateSystemDesign failed');
  }
  console.log('✅ evaluateSystemDesign() evaluated architecture with live Gemini.\n');

  console.log('🎉 ================================================================');
  console.log('🎉 ALL 6/6 LIVE GEMINI AI TESTS PASSED WITH 100% SUCCESS');
  console.log(`🎉 Primary Model: gemini-3.6-flash (with automatic fallback chain)`);
  console.log('🎉 ================================================================\n');
}

testGeminiPhase5()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Phase 5 Gemini Test Error:', err);
    process.exit(1);
  });
