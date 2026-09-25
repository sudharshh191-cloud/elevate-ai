const API_BASE = 'http://localhost:5000/api';

async function runSystemDesignTestSuite() {
  console.log('⚡ ================================================================');
  console.log('⚡ ELEVATE.AI SYSTEM DESIGN STUDIO TEST SUITE (PHASE 3)');
  console.log('⚡ ================================================================\n');

  // Step 1: Register User A
  console.log('▶️ [1/12] Registering candidate User A...');
  const userAEmail = `architect.a.${Date.now()}@elevate-ai.io`;
  const regARes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Grace Hopper',
      email: userAEmail,
      password: 'ArchitectPass2026!',
      targetRole: 'Principal Systems Architect',
    }),
  });
  const regAData: any = await regARes.json();
  const verifyARes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, otp: regAData.demoOtp, type: 'verification' }),
  });
  const verifyAData: any = await verifyARes.json();
  const tokenA = verifyAData.token;
  const userAId = verifyAData.user.id;
  console.log(`✅ User A registered and verified: UserID=${userAId}, Email=${userAEmail}\n`);

  // Step 2: Save new System Design Diagram for User A
  console.log('▶️ [2/12] Saving new System Design Diagram to MongoDB...');
  const diagramPayload = {
    problemId: 'url-shortener',
    templateTitle: 'Design a High-Scale URL Shortener (TinyURL)',
    domain: 'System Design',
    difficulty: 'Senior',
    trafficEstimation: '100M URLs/month • 10B redirects/month',
    trafficConfig: {
      dau: 25000000,
      requestsPerUser: 12,
      peakMultiplier: 2.5,
      readWriteRatio: 10,
      payloadSizeKb: 0.5,
    },
    calculatedMetrics: {
      totalDailyRequests: 300000000,
      avgRps: 3472,
      peakRps: 8681,
      readRps: 7892,
      writeRps: 789,
      ingressBandwidthMbps: 3.08,
      egressBandwidthMbps: 30.83,
      dailyStorageGb: 13.04,
      annualStorageTb: 13.94,
    },
    nodes: [
      { id: 'node-client-1', type: 'client', label: 'Web & Mobile Clients', position: { x: 80, y: 160 } },
      { id: 'node-lb-1', type: 'load_balancer', label: 'Layer 7 ALB', position: { x: 360, y: 160 } },
      { id: 'node-app-1', type: 'app_server', label: 'URL Redirect Service', position: { x: 640, y: 160 } },
      { id: 'node-cache-1', type: 'cache', label: 'Redis Alias Cache', position: { x: 640, y: 320 } },
      { id: 'node-db-1', type: 'sql_db', label: 'PostgreSQL URL Store', position: { x: 940, y: 160 }, data: { readReplicas: 2 } },
    ],
    edges: [
      { id: 'edge-1', source: 'node-client-1', target: 'node-lb-1', protocol: 'HTTPS' },
      { id: 'edge-2', source: 'node-lb-1', target: 'node-app-1', protocol: 'HTTP/2' },
      { id: 'edge-3', source: 'node-app-1', target: 'node-cache-1', protocol: 'Redis Protocol' },
      { id: 'edge-4', source: 'node-app-1', target: 'node-db-1', protocol: 'SQL / Query' },
    ],
    components: ['client', 'load_balancer', 'app_server', 'cache', 'sql_db'],
    notes: 'Write-through cache with 2 read replicas for primary DB.',
  };

  const saveRes = await fetch(`${API_BASE}/system-design`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify(diagramPayload),
  });
  const saveData: any = await saveRes.json();
  if (!saveRes.ok || !saveData.diagram?._id) {
    throw new Error(`Failed to save diagram: ${JSON.stringify(saveData)}`);
  }
  const diagramId = saveData.diagram._id;
  console.log(`✅ Diagram saved successfully in MongoDB: DiagramID=${diagramId}, Version=${saveData.diagram.version}\n`);

  // Step 3: Fetch list of user diagrams
  console.log('▶️ [3/12] Fetching list of saved designs for User A...');
  const listRes = await fetch(`${API_BASE}/system-design`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const listData: any = await listRes.json();
  if (!listRes.ok || listData.diagrams.length !== 1) {
    throw new Error(`Expected 1 saved diagram, got ${listData.diagrams?.length}`);
  }
  console.log(`✅ Found ${listData.diagrams.length} saved diagram for User A: Title="${listData.diagrams[0].templateTitle}"\n`);

  // Step 4: Fetch diagram by ID
  console.log('▶️ [4/12] Fetching diagram by ID...');
  const getRes = await fetch(`${API_BASE}/system-design/${diagramId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const getData: any = await getRes.json();
  if (!getRes.ok || getData.diagram.nodes.length !== 5) {
    throw new Error(`Failed to fetch diagram by ID: ${JSON.stringify(getData)}`);
  }
  console.log(`✅ Fetched diagram: ${getData.diagram.nodes.length} nodes, ${getData.diagram.edges.length} edges\n`);

  // Step 5: Update existing diagram
  console.log('▶️ [5/12] Updating existing diagram (Adding CDN Node)...');
  const updatePayload = {
    ...diagramPayload,
    id: diagramId,
    nodes: [
      ...diagramPayload.nodes,
      { id: 'node-cdn-1', type: 'cdn', label: 'Cloudflare Edge CDN', position: { x: 220, y: 80 } },
    ],
  };
  const updateRes = await fetch(`${API_BASE}/system-design`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify(updatePayload),
  });
  const updateData: any = await updateRes.json();
  if (!updateRes.ok || updateData.diagram.nodes.length !== 6 || updateData.diagram.version !== 2) {
    throw new Error(`Update failed: ${JSON.stringify(updateData)}`);
  }
  console.log(`✅ Diagram updated: Node count=${updateData.diagram.nodes.length}, Version=${updateData.diagram.version}\n`);

  // Step 6: Security - Unauthorized Request (Missing Token)
  console.log('▶️ [6/12] Testing unauthenticated access protection...');
  const unauthRes = await fetch(`${API_BASE}/system-design`, {
    method: 'GET',
  });
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 Unauthorized, got ${unauthRes.status}`);
  }
  console.log('✅ Unauthenticated request correctly rejected with 401 Unauthorized.\n');

  // Step 7: Security - Cross-User Session Access Isolation (User B accessing User A diagram)
  console.log('▶️ [7/12] Testing cross-user access isolation (User B accessing User A design)...');
  const userBEmail = `architect.b.${Date.now()}@elevate-ai.io`;
  const regBRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Alan Turing',
      email: userBEmail,
      password: 'SecurePass2026!',
    }),
  });
  const regBData: any = await regBRes.json();
  const verifyBRes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userBEmail, otp: regBData.demoOtp, type: 'verification' }),
  });
  const verifyBData: any = await verifyBRes.json();
  const tokenB = verifyBData.token;

  // User B tries to GET User A's diagram
  const crossGetRes = await fetch(`${API_BASE}/system-design/${diagramId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  if (crossGetRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for cross-user get, got ${crossGetRes.status}`);
  }

  // User B tries to MODIFY User A's diagram
  const crossModRes = await fetch(`${API_BASE}/system-design`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ id: diagramId, templateTitle: 'Hacked Title' }),
  });
  if (crossModRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for cross-user modify, got ${crossModRes.status}`);
  }
  console.log('✅ Cross-user access isolation verified: 403 Forbidden returned for both GET and POST.\n');

  // Step 8: AI Architecture Evaluation via Gemini LLM
  console.log('▶️ [8/12] Testing AI Architecture Evaluation via Gemini LLM...');
  const evalPayload = {
    problemTitle: 'Design a High-Scale URL Shortener (TinyURL)',
    requirements: 'Scale: 100M URLs/month, 10B redirects/month\nFunctional: Shorten URLs, Redirect with 301/302\nNon-Functional: P99 < 15ms, High Availability 99.99%',
    nodes: updateData.diagram.nodes,
    edges: updateData.diagram.edges,
    trafficConfig: diagramPayload.trafficConfig,
    calculatedMetrics: diagramPayload.calculatedMetrics,
    validationWarnings: [],
    diagramId,
  };

  const evalRes = await fetch(`${API_BASE}/system-design/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify(evalPayload),
  });
  const evalData: any = await evalRes.json();
  if (!evalRes.ok || !evalData.evaluation || typeof evalData.evaluation.overallScore !== 'number') {
    throw new Error(`AI Evaluation failed: ${JSON.stringify(evalData)}`);
  }
  console.log(`✅ AI Architecture Evaluation successful!`);
  console.log(`   • Overall Score: ${evalData.evaluation.overallScore} / 100`);
  console.log(`   • Verdict: ${evalData.evaluation.verdict}`);
  console.log(`   • Scalability: ${evalData.evaluation.dimensions.scalability}`);
  console.log(`   • Reliability: ${evalData.evaluation.dimensions.reliability}`);
  console.log(`   • Executive Summary: "${evalData.evaluation.executiveSummary.slice(0, 100)}..."`);
  console.log(`   • Top Strengths: ${evalData.evaluation.topStrengths.length} items`);
  console.log(`   • Critical Gaps: ${evalData.evaluation.criticalGaps.length} items\n`);

  // Step 9: Verify Evaluation was persisted on diagram in MongoDB
  console.log('▶️ [9/12] Verifying evaluation report persisted in MongoDB diagram document...');
  const reGetRes = await fetch(`${API_BASE}/system-design/${diagramId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const reGetData: any = await reGetRes.json();
  if (!reGetData.diagram.evaluation || reGetData.diagram.evaluation.overallScore !== evalData.evaluation.overallScore) {
    throw new Error('Evaluation was not persisted onto diagram document');
  }
  console.log(`✅ Evaluation persisted in MongoDB: Stored OverallScore=${reGetData.diagram.evaluation.overallScore}\n`);

  // Step 10: Validation on Empty Diagram
  console.log('▶️ [10/12] Testing evaluation validation rejection on empty nodes...');
  const emptyEvalRes = await fetch(`${API_BASE}/system-design/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ nodes: [] }),
  });
  if (emptyEvalRes.status !== 400) {
    throw new Error(`Expected 400 Bad Request for empty nodes, got ${emptyEvalRes.status}`);
  }
  console.log('✅ Empty diagram evaluation correctly rejected with 400 Bad Request.\n');

  // Step 11: Delete Diagram
  console.log('▶️ [11/12] Testing diagram deletion...');
  const delRes = await fetch(`${API_BASE}/system-design/${diagramId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  if (!delRes.ok) {
    throw new Error(`Failed to delete diagram: ${delRes.status}`);
  }
  console.log(`✅ Diagram ${diagramId} deleted successfully.\n`);

  // Step 12: Confirm 404 after deletion
  console.log('▶️ [12/12] Verifying 404 Not Found after deletion...');
  const postDelRes = await fetch(`${API_BASE}/system-design/${diagramId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  if (postDelRes.status !== 404) {
    throw new Error(`Expected 404 Not Found, got ${postDelRes.status}`);
  }
  console.log('✅ Deleted diagram returns 404 Not Found as expected.\n');

  console.log('🎉 ================================================================');
  console.log('🎉 ALL 12/12 SYSTEM DESIGN STUDIO INTEGRATION TESTS PASSED');
  console.log('🎉 ================================================================\n');
}

runSystemDesignTestSuite().catch((err) => {
  console.error('❌ System Design test suite failed:', err);
  process.exit(1);
});
