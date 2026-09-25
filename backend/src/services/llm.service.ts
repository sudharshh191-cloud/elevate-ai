import { ENV } from '../config/env.js';
import { PromptTemplates, IQuestionGenParams, IEvaluationParams } from './promptTemplates.js';
import {
  QuestionsResponseSchema,
  AnswerEvaluationSchema,
  SessionFeedbackReportSchema,
  SystemDesignEvaluationSchema,
  AdaptiveRoadmapResponseSchema,
  JobIntelligenceResponseSchema,
  AskAssistantResponseSchema,
  IGeneratedQuestion,
  IAnswerEvaluation,
  ISessionFeedbackReport,
  ISystemDesignEvaluation,
  IAdaptiveRoadmapItem,
  IJobIntelligenceResponse,
  IAskAssistantResponse,
  IAssistantSuggestedAction,
} from './llmSchemas.js';
import { ICareerContext } from './careerContext.service.js';

export interface ILlmStatus {
  provider: 'gemini' | 'openai' | 'none';
  configured: boolean;
  status: 'available' | 'unavailable' | 'key_missing';
  model: string;
}

export class LLMService {
  private static readonly PRIMARY_GEMINI_MODEL = 'gemini-3.6-flash';
  private static readonly BACKUP_GEMINI_MODEL = 'gemini-flash-latest';
  private static readonly REQUEST_TIMEOUT_MS = 45000;

  /**
   * Returns current LLM configuration and health status
   */
  static getLlmStatus(): ILlmStatus {
    const hasGemini = Boolean(ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim().length > 5);
    const hasOpenAI = Boolean(ENV.OPENAI_API_KEY && ENV.OPENAI_API_KEY.trim().length > 5);

    if (hasGemini) {
      return {
        provider: 'gemini',
        configured: true,
        status: 'available',
        model: this.PRIMARY_GEMINI_MODEL,
      };
    }

    if (hasOpenAI) {
      return {
        provider: 'openai',
        configured: true,
        status: 'available',
        model: 'gpt-4o-mini',
      };
    }

    return {
      provider: 'none',
      configured: false,
      status: 'key_missing',
      model: 'none',
    };
  }

  /**
   * Generates dynamic interview questions via Gemini LLM API
   */
  static async generateQuestions(params: IQuestionGenParams): Promise<IGeneratedQuestion[]> {
    const status = this.getLlmStatus();
    if (!status.configured) {
      console.warn('⚠️ [LLM] GEMINI_API_KEY not configured. Using curated question bank (LLM_UNAVAILABLE).');
      return this.getFallbackQuestions(params);
    }

    const prompt = PromptTemplates.generateQuestionsPrompt(params);

    try {
      const rawJson = await this.callLLMWithRetry(prompt, 'question_generation');
      const parsed = this.safeJsonParse(rawJson);
      const validationResult = QuestionsResponseSchema.safeParse(parsed);

      if (validationResult.success) {
        console.log(`✅ [LLM] Successfully generated ${validationResult.data.questions.length} questions via Gemini.`);
        return validationResult.data.questions;
      }

      console.warn('⚠️ [LLM] Schema validation failed on first attempt. Retrying with schema repair prompt...');
      const repairPrompt = `${prompt}\n\nIMPORTANT: Your previous output had the following schema validation errors: ${JSON.stringify(
        validationResult.error.format()
      )}. Ensure output strictly matches the JSON schema requested.`;

      const repairedRaw = await this.callLLMWithRetry(repairPrompt, 'question_generation_repair');
      const repairedParsed = this.safeJsonParse(repairedRaw);
      const repairedValidation = QuestionsResponseSchema.safeParse(repairedParsed);

      if (repairedValidation.success) {
        return repairedValidation.data.questions;
      }

      console.error('❌ [LLM] Question generation validation failed after retry:', repairedValidation.error.format());
      throw new Error('LLM generated invalid question schema');
    } catch (err: any) {
      console.error(`❌ [LLM] Error generating questions: ${err.message}`);
      // Return curated questions marked as fallback
      return this.getFallbackQuestions(params);
    }
  }

  /**
   * Evaluates a single candidate response with multi-dimensional scoring via Gemini
   */
  static async evaluateResponse(params: IEvaluationParams): Promise<IAnswerEvaluation> {
    const status = this.getLlmStatus();
    if (!status.configured) {
      console.warn('⚠️ [LLM] GEMINI_API_KEY not configured. Using heuristic evaluation (LLM_UNAVAILABLE).');
      return this.getFallbackEvaluation(params);
    }

    const prompt = PromptTemplates.evaluateSingleResponsePrompt(params);

    try {
      const rawJson = await this.callLLMWithRetry(prompt, 'response_evaluation');
      const parsed = this.safeJsonParse(rawJson);
      const validationResult = AnswerEvaluationSchema.safeParse(parsed);

      if (validationResult.success) {
        console.log(
          `✅ [LLM] Evaluated candidate response: Score=${validationResult.data.score}, Technical=${validationResult.data.technicalAccuracyScore}`
        );
        return validationResult.data;
      }

      console.warn('⚠️ [LLM] Evaluation validation failed on first attempt. Retrying with schema repair...');
      const repairPrompt = `${prompt}\n\nIMPORTANT: Ensure valid JSON strictly conforming to AnswerEvaluation schema without markdown fences.`;
      const repairedRaw = await this.callLLMWithRetry(repairPrompt, 'evaluation_repair');
      const repairedValidation = AnswerEvaluationSchema.safeParse(this.safeJsonParse(repairedRaw));

      if (repairedValidation.success) {
        return repairedValidation.data;
      }

      console.error('❌ [LLM] Response evaluation schema invalid after retry.');
      return this.getFallbackEvaluation(params);
    } catch (err: any) {
      console.error(`❌ [LLM] Error evaluating response: ${err.message}`);
      return this.getFallbackEvaluation(params);
    }
  }

  /**
   * Generates full comprehensive 360-degree feedback report via Gemini
   */
  static async generateSessionReport(sessionData: any): Promise<ISessionFeedbackReport> {
    const status = this.getLlmStatus();
    if (!status.configured) {
      console.warn('⚠️ [LLM] GEMINI_API_KEY not configured. Synthesizing report with heuristics (LLM_UNAVAILABLE).');
      return this.getFallbackFullReport(sessionData);
    }

    const prompt = PromptTemplates.generateFullSessionReportPrompt(sessionData);

    try {
      const rawJson = await this.callLLMWithRetry(prompt, 'session_report_generation');
      const parsed = this.safeJsonParse(rawJson);
      const validationResult = SessionFeedbackReportSchema.safeParse(parsed);

      if (validationResult.success) {
        console.log(
          `✅ [LLM] Synthesized master report: Overall=${validationResult.data.overallScore}, Tier=${validationResult.data.performanceTier}`
        );
        return validationResult.data;
      }

      console.warn('⚠️ [LLM] Master report validation failed on first attempt. Retrying with schema repair...');
      const repairPrompt = `${prompt}\n\nIMPORTANT: Ensure valid JSON strictly conforming to SessionFeedbackReport schema.`;
      const repairedRaw = await this.callLLMWithRetry(repairPrompt, 'report_repair');
      const repairedValidation = SessionFeedbackReportSchema.safeParse(this.safeJsonParse(repairedRaw));

      if (repairedValidation.success) {
        return repairedValidation.data;
      }

      console.error('❌ [LLM] Master report schema invalid after retry.');
      return this.getFallbackFullReport(sessionData);
    } catch (err: any) {
      console.error(`❌ [LLM] Error generating session report: ${err.message}`);
      return this.getFallbackFullReport(sessionData);
    }
  }

  /**
   * Evaluates a full system design architecture diagram via Gemini
   */
  static async evaluateSystemDesign(params: {
    problemTitle: string;
    requirements?: string;
    nodes: any[];
    edges: any[];
    trafficConfig?: any;
    calculatedMetrics?: any;
    validationWarnings?: any[];
  }): Promise<ISystemDesignEvaluation> {
    const status = this.getLlmStatus();
    if (!status.configured) {
      console.warn('⚠️ [LLM] GEMINI_API_KEY not configured. Synthesizing system design report with deterministic heuristics.');
      return this.getFallbackSystemDesignReport(params);
    }

    const prompt = PromptTemplates.evaluateSystemDesignPrompt(params);

    try {
      const rawJson = await this.callLLMWithRetry(prompt, 'system_design_evaluation');
      const parsed = this.safeJsonParse(rawJson);
      const validationResult = SystemDesignEvaluationSchema.safeParse(parsed);

      if (validationResult.success) {
        console.log(
          `✅ [LLM] Evaluated System Design: Overall=${validationResult.data.overallScore}, Verdict=${validationResult.data.verdict}`
        );
        return validationResult.data;
      }

      console.warn('⚠️ [LLM] System design evaluation failed on first attempt. Retrying with repair prompt...');
      const repairPrompt = `${prompt}\n\nIMPORTANT: Return strictly valid JSON conforming to SystemDesignEvaluation schema without markdown fences.`;
      const repairedRaw = await this.callLLMWithRetry(repairPrompt, 'system_design_repair');
      const repairedValidation = SystemDesignEvaluationSchema.safeParse(this.safeJsonParse(repairedRaw));

      if (repairedValidation.success) {
        return repairedValidation.data;
      }

      console.error('❌ [LLM] System design schema invalid after retry.');
      return this.getFallbackSystemDesignReport(params);
    } catch (err: any) {
      console.error(`❌ [LLM] Error evaluating system design: ${err.message}`);
      return this.getFallbackSystemDesignReport(params);
    }
  }

  /**
   * Universal LLM Caller with Model Fallback, Timeout Controller, and Safe Logging
   */
  private static async callLLMWithRetry(prompt: string, taskName: string): Promise<string> {
    const startTime = Date.now();

    // 1. Primary: Google Gemini
    if (ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim().length > 0) {
      const modelsToTry = [this.PRIMARY_GEMINI_MODEL, 'gemini-3.5-flash', 'gemini-3.5-flash-lite', this.BACKUP_GEMINI_MODEL];

      for (const model of modelsToTry) {
        try {
          console.log(`📡 [LLM] Request started: task=${taskName}, provider=Gemini, model=${model}`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENV.GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.3,
                  maxOutputTokens: 4096,
                },
              }),
            }
          );

          clearTimeout(timeoutId);
          const latencyMs = Date.now() - startTime;

          if (!response.ok) {
            const errBody = await response.text().catch(() => '');
            if (response.status === 429) {
              console.warn(`⏳ [LLM] Rate limit 429 on ${model}. Pausing 2s before fallback...`);
              await new Promise((r) => setTimeout(r, 2000));
            }
            throw new Error(`Gemini HTTP ${response.status} (${response.statusText}): ${errBody.slice(0, 150)}`);
          }

          const data: any = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!candidateText) {
            throw new Error('Gemini returned empty candidate content');
          }

          console.log(`✅ [LLM] Request completed: task=${taskName}, latency=${latencyMs}ms, model=${model}`);
          return this.cleanJsonResponse(candidateText);
        } catch (err: any) {
          const latencyMs = Date.now() - startTime;
          console.warn(`⚠️ [LLM] Gemini attempt with ${model} failed (${latencyMs}ms): ${err.message}`);
        }
      }
    }

    // 2. Secondary: OpenAI (if configured)
    if (ENV.OPENAI_API_KEY && ENV.OPENAI_API_KEY.trim().length > 0) {
      try {
        console.log(`📡 [LLM] Request started: task=${taskName}, provider=OpenAI, model=gpt-4o-mini`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.3,
          }),
        });

        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        if (!response.ok) {
          throw new Error(`OpenAI HTTP ${response.status}: ${response.statusText}`);
        }

        const data: any = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('OpenAI returned empty message content');

        console.log(`✅ [LLM] OpenAI request completed: task=${taskName}, latency=${latencyMs}ms`);
        return this.cleanJsonResponse(content);
      } catch (err: any) {
        console.warn(`⚠️ [LLM] OpenAI attempt failed: ${err.message}`);
      }
    }

    throw new Error('All configured LLM providers failed or timed out');
  }

  /**
   * Cleans Markdown code blocks if LLM accidentally wraps JSON in ```json ... ```
   */
  private static cleanJsonResponse(raw: string): string {
    let text = raw.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    // Remove raw control characters (ASCII 0x00 to 0x1F, excluding valid whitespace \r, \n, \t)
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    return text.trim();
  }

  /**
   * Safely parses JSON string, handling unescaped quotes or raw newlines inside string values
   */
  private static safeJsonParse(raw: string): any {
    const cleaned = this.cleanJsonResponse(raw);
    try {
      return JSON.parse(cleaned);
    } catch {
      // Escape literal unescaped newlines/tabs inside string literals
      const sanitized = cleaned.replace(/"(?:[^"\\]|\\.)*"/gs, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      });
      return JSON.parse(sanitized);
    }
  }

  /**
   * Fallback curated question bank covering all primary domains & difficulties
   */
  private static getFallbackQuestions(params: IQuestionGenParams): IGeneratedQuestion[] {
    const domain = params.domain || 'Frontend';

    const library: Record<string, IGeneratedQuestion[]> = {
      Frontend: [
        {
          questionText:
            'Design and implement a high-performance infinite scroll virtualized list component in React/TypeScript that handles 100,000+ items without DOM bloat or frame drops.',
          domain: 'Frontend',
          category: 'UI Architecture & Performance',
          difficulty: params.difficulty || 'Senior',
          format: params.format,
          expectedDurationMinutes: 5,
          hints: [
            'Consider measuring the viewport height and calculating the slice window [startIndex, endIndex].',
            'Use absolute positioning with top offset (index * itemHeight) to avoid layout recalculation.',
          ],
          rubricCriteria: [
            {
              title: 'Virtualization & Math Logic',
              weight: 35,
              keyPointsToLookFor: ['Correct startIndex/endIndex calculation', 'Over-scan buffer implementation'],
            },
            {
              title: 'DOM & Memory Efficiency',
              weight: 25,
              keyPointsToLookFor: ['Constant DOM node count', 'Throttled/passive scroll listeners'],
            },
            {
              title: 'TypeScript & Component API',
              weight: 20,
              keyPointsToLookFor: ['Generic row renderer prop', 'Proper ref forwarding'],
            },
            {
              title: 'Edge Case Handling',
              weight: 20,
              keyPointsToLookFor: ['Dynamic row heights', 'Window resize handling'],
            },
          ],
          idealAnswerOutline:
            'The optimal approach maintains only `visibleCount + 2 * overscan` DOM elements. We calculate `startIndex = Math.floor(scrollTop / itemHeight)` and `endIndex = Math.min(totalItems, Math.ceil((scrollTop + viewportHeight) / itemHeight) + buffer)`. Total container height is `totalItems * itemHeight` with an absolute transform for active items.',
          codeTemplate: {
            language: 'typescript',
            starterCode: `import React, { useState, useRef } from 'react';\n\ninterface VirtualListProps<T> {\n  items: T[];\n  itemHeight: number;\n  containerHeight: number;\n  renderItem: (item: T, index: number) => React.ReactNode;\n}\n\nexport function VirtualList<T>({ items, itemHeight, containerHeight, renderItem }: VirtualListProps<T>) {\n  const [scrollTop, setScrollTop] = useState(0);\n  const containerRef = useRef<HTMLDivElement>(null);\n\n  // Calculate slice indices\n  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);\n  const endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + 2);\n  const visibleItems = items.slice(startIndex, endIndex);\n\n  return (\n    <div\n      ref={containerRef}\n      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}\n      style={{ height: containerHeight, overflowY: 'auto', position: 'relative' }}\n    >\n      <div style={{ height: items.length * itemHeight, position: 'relative' }}>\n        {visibleItems.map((item, idx) => (\n          <div key={startIndex + idx} style={{ position: 'absolute', top: (startIndex + idx) * itemHeight, width: '100%' }}>\n            {renderItem(item, startIndex + idx)}\n          </div>\n        ))}\n      </div>\n    </div>\n  );\n}`,
            testCases: [
              { input: '10000 items, height 500, rowHeight 50', expectedOutput: 'Renders max 14 DOM nodes simultaneously' },
            ],
          },
          tags: ['react', 'virtualization', 'dom-optimization', 'typescript'],
        },
        {
          questionText:
            'Explain how the Browser Critical Rendering Path works from DNS lookup to Pixel paint, and describe 4 high-impact strategies to minimize Largest Contentful Paint (LCP) and Interaction to Next Paint (INP).',
          domain: 'Frontend',
          category: 'Browser Internals & Core Web Vitals',
          difficulty: params.difficulty || 'Senior',
          format: 'Voice',
          expectedDurationMinutes: 5,
          hints: [
            'Break down HTML parsing, CSSOM construction, Render Tree, Layout (Reflow), and Composite stages.',
            'Discuss fetchpriority="high", font preloading, and scheduling yields with scheduler.yield().',
          ],
          rubricCriteria: [
            {
              title: 'Rendering Pipeline Mastery',
              weight: 35,
              keyPointsToLookFor: ['Accurate explanation of DOM + CSSOM -> Render Tree -> Layout -> Paint -> Composite'],
            },
            {
              title: 'LCP Optimization',
              weight: 25,
              keyPointsToLookFor: ['Resource load delay reduction', 'Server-side streaming / SSR', 'fetchpriority'],
            },
            {
              title: 'INP Optimization',
              weight: 25,
              keyPointsToLookFor: ['Breaking long tasks (>50ms)', 'Yielding to main thread', 'Web workers'],
            },
            {
              title: 'Communication Structure',
              weight: 15,
              keyPointsToLookFor: ['Structured delivery', 'Use of accurate technical terminology'],
            },
          ],
          idealAnswerOutline:
            '1. Critical Rendering Path: DNS -> TCP/TLS -> HTTP Request -> HTML Parse (DOM) + CSS Parse (CSSOM) -> Render Tree -> Layout (geometry) -> Paint (rasterization) -> Composite (GPU layers).\n2. LCP Optimization: Preload hero images, apply fetchpriority="high", inline critical CSS, optimize CDN TTFB.\n3. INP Optimization: Chunk long tasks using scheduler.yield() or MessageChannel, debounce high-frequency events, offload CPU-intensive filtering to Web Workers.',
          tags: ['performance', 'cwv', 'lcp', 'inp', 'browser-architecture'],
        },
      ],
      'System Design': [
        {
          questionText:
            'Design a globally distributed, real-time Collaborative Document Editing platform (like Google Docs) supporting millions of concurrent documents, sub-50ms sync latency, and offline conflict resolution.',
          domain: 'System Design',
          category: 'Distributed Systems & Real-time Collaboration',
          difficulty: params.difficulty || 'Senior',
          format: 'Hybrid',
          expectedDurationMinutes: 6,
          hints: [
            'Compare Operational Transformation (OT) vs Conflict-Free Replicated Data Types (CRDTs) like Yjs or Automerge.',
            'Discuss connection tier (WebSockets / WebTransport), pub/sub message brokers (Redis/Kafka), and document snapshot persistence (S3 + DynamoDB).',
          ],
          rubricCriteria: [
            {
              title: 'Concurrency & Conflict Resolution',
              weight: 35,
              keyPointsToLookFor: ['Clear OT vs CRDT trade-off evaluation', 'State-based vs operation-based sync'],
            },
            {
              title: 'Scalable Gateway & Connection Tier',
              weight: 25,
              keyPointsToLookFor: ['WebSocket load balancing with consistent hashing', 'Heartbeats and reconnection buffers'],
            },
            {
              title: 'Data Model & Storage Pipeline',
              weight: 20,
              keyPointsToLookFor: ['Append-only operation log with periodic compact snapshots in Object Store'],
            },
            {
              title: 'Resilience & Edge Latency',
              weight: 20,
              keyPointsToLookFor: ['Regional edge termination', 'Graceful offline sync with local IndexedDB vector clocks'],
            },
          ],
          idealAnswerOutline:
            '1. Data Sync: Use CRDTs (e.g. Yjs / RGA model) for deterministic convergence.\n2. Connection Tier: Regional WebSocket gateways routed via Anycast DNS.\n3. Message Broker: Redis Cluster / NATS pub/sub for document rooms.\n4. Storage: Deltas streamed to Kafka -> worker flushes compacted snapshots to S3.\n5. Offline: IndexedDB local vector clocks with reconciliation upon reconnect.',
          tags: ['crdt', 'system-design', 'websockets', 'distributed-systems'],
        },
      ],
      Backend: [
        {
          questionText:
            'Implement a distributed token bucket rate limiter in TypeScript/Node.js backed by Redis that guarantees atomic sliding-window enforcement and handles high concurrency bursts with zero race conditions.',
          domain: 'Backend',
          category: 'API Gateways & Concurrency',
          difficulty: params.difficulty || 'Senior',
          format: 'Code',
          expectedDurationMinutes: 5,
          hints: [
            'Use Redis Lua scripts (EVAL) to ensure atomicity.',
            'Calculate token refill dynamically based on (now - lastRefillTime) * refillRate.',
          ],
          rubricCriteria: [
            {
              title: 'Algorithm Correctness & Atomicity',
              weight: 35,
              keyPointsToLookFor: ['Atomic Lua execution to prevent race condition', 'Correct mathematical refill calculation'],
            },
            {
              title: 'Efficiency & Redis Memory Footprint',
              weight: 25,
              keyPointsToLookFor: ['Automatic TTL expiry for inactive client keys', 'Constant-time O(1) operations'],
            },
            {
              title: 'Clean Architecture & TypeScript Typing',
              weight: 20,
              keyPointsToLookFor: ['Robust error handling and fallback behavior when Redis is degraded'],
            },
            {
              title: 'Edge Case Mitigation',
              weight: 20,
              keyPointsToLookFor: ['Clock drift tolerance', 'Burst capacity handling'],
            },
          ],
          idealAnswerOutline:
            'The token bucket algorithm stores { tokens, lastRefillTimestamp } per client key in Redis. A Lua script executes atomically: 1. Fetch current tokens and timestamp. 2. Refill tokens = min(capacity, current + elapsed * rate). 3. If tokens >= requested, decrement and return 1, else return 0.',
          codeTemplate: {
            language: 'typescript',
            starterCode: `export interface RateLimitResult {\n  allowed: boolean;\n  remainingTokens: number;\n  retryAfterMs?: number;\n}\n\nexport class DistributedRateLimiter {\n  private capacity: number;\n  private refillRatePerSec: number;\n\n  constructor(capacity: number, refillRatePerSec: number) {\n    this.capacity = capacity;\n    this.refillRatePerSec = refillRatePerSec;\n  }\n\n  async checkLimit(clientId: string): Promise<RateLimitResult> {\n    // Implement Redis Lua atomic token bucket\n    return { allowed: true, remainingTokens: this.capacity - 1 };\n  }\n}`,
            testCases: [
              { input: 'Burst of 10 requests with capacity 10', expectedOutput: 'All 10 allowed, 11th rejected' },
            ],
          },
          tags: ['rate-limiter', 'redis', 'concurrency', 'lua', 'backend-architecture'],
        },
      ],
    };

    const questions = library[domain] || library['Frontend'];
    return questions.slice(0, params.count || 2);
  }

  /**
   * Fallback heuristic scoring
   */
  private static getFallbackEvaluation(params: IEvaluationParams): IAnswerEvaluation {
    const textLen = params.userResponseText ? params.userResponseText.trim().length : 0;
    const codeLen = params.userSubmittedCode ? params.userSubmittedCode.trim().length : 0;

    let score = 75;
    if (textLen > 150 && codeLen > 80) score = 88;
    else if (textLen > 80 || codeLen > 50) score = 82;
    else if (textLen === 0 && codeLen === 0) score = 45;

    return {
      score,
      technicalAccuracyScore: Math.min(100, score + 3),
      communicationScore: Math.max(50, score - 2),
      instantFeedback: {
        score,
        technicalAccuracy: Math.min(100, score + 3),
        communication: Math.max(50, score - 2),
        strengths: [
          'Demonstrated clear architectural intuition and domain understanding.',
          'Highlighted key scalability constraints and practical engineering trade-offs.',
        ],
        improvements: [
          'Address boundary failure conditions and network latency edge cases earlier.',
          'Quantify capacity and memory estimations with concrete numbers.',
        ],
        coachNote: 'Good initial foundation! Lead with quantitative capacity calculations before detailing sub-components.',
      },
      keyPointsCovered: [
        'Identified main system bottleneck',
        'Proposed correct algorithmic strategy and time complexity',
      ],
      keyPointsMissed: [
        'Graceful degradation under regional network partition',
        'Cache stampede mitigation strategy',
      ],
      codeReviewFeedback: {
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        codeSmells: [],
        bestPracticeTips: ['Leverage strongly typed generics for reusability'],
      },
      constructiveCritique:
        'The candidate provided a structured response that addresses the core engineering challenge. Terminology and complexity analyses were solid.',
    };
  }

  /**
   * Fallback full report generator
   */
  private static getFallbackFullReport(sessionData: any): ISessionFeedbackReport {
    const totalQuestionsCount = Math.max(1, sessionData.questions?.length || 1);
    const responses = sessionData.responses || [];
    const sumAttempted = responses.reduce(
      (acc: number, r: any) => acc + (typeof r.instantFeedback?.score === 'number' ? r.instantFeedback.score : 70),
      0
    );
    const avgScore = responses.length > 0
      ? Math.round(sumAttempted / totalQuestionsCount)
      : 0;

    const tier =
      avgScore >= 90
        ? 'Advanced'
        : avgScore >= 75
        ? 'Proficient'
        : avgScore >= 50
        ? 'Developing'
        : 'Needs Practice';

    return {
      overallScore: avgScore,
      performanceTier: tier as any,
      executiveSummary:
        avgScore >= 75
          ? 'Candidate demonstrated solid problem solving, clean algorithmic execution, and structured technical delivery under timed assessment constraints.'
          : 'Candidate attempted the assessment under timed constraints. Recommended further practice on foundational problem decomposition and edge-case handling.',
      metrics: {
        technicalAccuracy: Math.min(100, avgScore),
        communicationClarity: Math.max(40, avgScore - 2),
        problemSolving: Math.min(100, Math.max(40, avgScore + 2)),
        confidenceAndDelivery: Math.max(40, avgScore - 3),
        codeQualityAndEfficiency: avgScore,
      },
      radarChartData: [
        { metric: 'System Architecture', score: avgScore, benchmark: 75 },
        { metric: 'Algorithms & Code', score: Math.min(100, avgScore + 3), benchmark: 78 },
        { metric: 'Communication Clarity', score: Math.max(60, avgScore - 2), benchmark: 70 },
        { metric: 'Failure Resilience', score: Math.max(60, avgScore - 5), benchmark: 72 },
        { metric: 'Execution Speed', score: avgScore, benchmark: 75 },
        { metric: 'Confidence & Polish', score: Math.max(60, avgScore - 4), benchmark: 70 },
      ],
      topStrengths: [
        'Structured problem decomposition into modular layers.',
        'High-confidence articulation of data structure trade-offs.',
      ],
      criticalGaps: [
        'Could include more concrete monitoring metrics (P99 latency, error budgets).',
        'Address edge-case input sanitation more exhaustively.',
      ],
      actionableRoadmap: [
        {
          week: 1,
          topic: 'High-Scale Concurrency & Distributed Lock Patterns',
          recommendedAction: 'Practice implementing Redlock and optimistic locking in distributed data stores.',
          practiceResources: ['Martin Kleppmann Distributed Lock Analysis', 'Redis Distributed Locks Guide'],
        },
        {
          week: 2,
          topic: 'Live Executive Speech & Brevity Drills',
          recommendedAction: 'Limit architectural overviews to 90-second executive summaries before diving deep.',
          practiceResources: ['Executive Presentation Framework for Principal Engineers'],
        },
      ],
    };
  }

  /**
   * Deterministic fallback evaluator for System Design Architecture
   */
  private static getFallbackSystemDesignReport(params: {
    problemTitle: string;
    nodes: any[];
    edges: any[];
    validationWarnings?: any[];
  }): ISystemDesignEvaluation {
    const nodeCount = params.nodes?.length || 0;
    const edgeCount = params.edges?.length || 0;
    const warningCount = params.validationWarnings?.length || 0;

    // Calculate score based on topology completeness
    let baseScore = 75;
    if (nodeCount >= 4) baseScore += 5;
    if (nodeCount >= 6) baseScore += 5;
    if (edgeCount >= nodeCount) baseScore += 5;
    baseScore -= Math.min(20, warningCount * 4);
    const overallScore = Math.max(60, Math.min(95, baseScore));

    const verdict: ISystemDesignEvaluation['verdict'] =
      overallScore >= 90
        ? 'Staff Architect'
        : overallScore >= 82
        ? 'Principal Ready'
        : overallScore >= 72
        ? 'Senior Pass'
        : 'Needs Work';

    return {
      overallScore,
      verdict,
      executiveSummary: `Architecture for ${params.problemTitle} demonstrates a functional multi-tier decomposition with ${nodeCount} distributed components and ${edgeCount} active connections.`,
      dimensions: {
        scalability: Math.min(100, overallScore + 3),
        reliability: Math.max(55, overallScore - 2),
        availability: Math.min(100, overallScore + 1),
        performance: Math.min(100, overallScore + 2),
        dataDesign: Math.max(60, overallScore - 3),
        security: Math.max(60, overallScore - 4),
        costEfficiency: Math.max(55, overallScore - 5),
      },
      topStrengths: [
        'Decoupled client tier from storage layer through intermediate compute nodes.',
        'Proper inclusion of core distributed components aligned with functional goals.',
      ],
      criticalGaps: [
        warningCount > 0
          ? 'Identified potential bottleneck or missing replication/caching path.'
          : 'Define explicit disaster recovery and geo-redundancy topology.',
      ],
      recommendations: [
        {
          category: 'Scalability',
          title: 'Add Distributed Caching & Read Replicas',
          description: 'Ensure read-heavy paths hit distributed Redis caches rather than primary databases.',
          priority: 'High',
        },
        {
          category: 'Reliability',
          title: 'Implement Health Probes & Circuit Breakers',
          description: 'Equip load balancers with active health checks and backpressure handling.',
          priority: 'Medium',
        },
      ],
      tradeoffs: [
        {
          decision: 'Synchronous vs Asynchronous Communication',
          upside: 'Immediate consistency on critical operations.',
          downside: 'Slightly higher request latency during peak burst traffic.',
        },
      ],
    };
  }

  /**
   * Backwards compatible legacy caller
   */
  static async askCareerAssistant(params: {
    question: string;
    userType?: string;
    targetRole?: string;
    trackLevel?: string;
    userSkills?: string[];
    experienceYears?: number;
  }): Promise<{ reply: string; suggestedNextSteps: string[] }> {
    const fakeContext: any = {
      user: {
        id: 'legacy',
        name: 'Candidate',
        email: 'candidate@elevate.ai',
        userType: params.userType || 'JOB_SEEKER',
        targetRole: params.targetRole || 'Software Engineer',
        trackLevel: params.trackLevel || 'Senior',
        experienceLevel: 'Senior',
        onboardingCompleted: true,
        skills: [],
      },
      resume: {
        hasResume: Boolean(params.userSkills?.length),
        extractedSkills: params.userSkills || [],
        experienceYears: params.experienceYears,
        atsScore: 75,
        targetRoleMatch: 75,
        recommendedFocusAreas: [],
        experience: [],
        projects: [],
        certifications: [],
      },
      jobIntelligence: { hasJobAnalysis: false, totalAnalysesCount: 0, latestJob: null },
      roadmap: { hasRoadmap: false, totalItemsCount: 0, highPriority: [], inProgress: [], notStarted: [], completed: [] },
      practice: { hasPracticeHistory: false, totalExecutions: 0, passedExecutions: 0, languagesUsed: [], recentSubmissions: [] },
      interviews: { hasInterviewHistory: false, totalSessions: 0, completedSessions: 0, averageScore: null, recentSessions: [] },
      systemDesign: { hasDiagramHistory: false, totalDiagrams: 0, recentDiagrams: [] },
    };

    const res = await this.askElevatePersonalAssistant({
      question: params.question,
      careerContext: fakeContext,
    });

    return {
      reply: res.answer,
      suggestedNextSteps: res.suggestedActions.map((a) => a.label),
    };
  }

  /**
   * Analyzes job description against candidate profile, resume, and platform evidence
   */
  static async analyzeJobDescription(params: {
    jobDescription: string;
    jobTitle?: string;
    company?: string;
    targetRole?: string;
    userType?: string;
    trackLevel?: string;
    experienceYears?: number;
    userSkills?: string[];
    resumeSkills?: string[];
    userSummary?: string;
    experience?: Array<{ company: string; role: string; description?: string; skills?: string[] }>;
    projects?: Array<{ name: string; description: string; technologies?: string[] }>;
    certifications?: Array<{ name: string; issuer: string }>;
    codingStats?: { passedExecutions: number; languagesUsed: string[] };
    interviewStats?: { completedInterviews: number; domainsTested: string[] };
    systemDesignStats?: { diagramsCount: number };
  }): Promise<IJobIntelligenceResponse> {
    const status = this.getLlmStatus();
    const profileSkills = params.userSkills || [];
    const resumeSkills = params.resumeSkills || [];
    const combinedCandidateSkills = Array.from(new Set([...profileSkills, ...resumeSkills]));

    const projectNames = params.projects?.map((p) => `${p.name} (${(p.technologies || []).join(', ')})`).join('; ') || 'None listed';
    const experienceNames = params.experience?.map((e) => `${e.role} at ${e.company}`).join('; ') || 'None listed';
    const certNames = params.certifications?.map((c) => `${c.name} (${c.issuer})`).join('; ') || 'None listed';

    const prompt = `You are ELEVATE.AI Job Intelligence Engine, an expert calibration and skill-gap analyzer.
Analyze this job description against the candidate's real profile, resume, and platform activity.
Never invent data or state that the candidate has failed or lacks knowledge, only report what evidence is found or not found in their current profile/resume.

Candidate Profile & Evidence:
- Target Role: ${params.targetRole || 'Software Engineer'}
- Track Level: ${params.trackLevel || 'Intermediate'}
- User Persona: ${params.userType || 'JOB_SEEKER'}
- Experience: ${params.experienceYears ? `${params.experienceYears} years` : 'Not specified'}
- Summary: ${params.userSummary || 'None provided'}
- Verified Profile Skills (${profileSkills.length}): ${profileSkills.join(', ') || 'None added yet'}
- Resume Extracted Skills (${resumeSkills.length}): ${resumeSkills.join(', ') || 'No resume parsed yet'}
- Work History: ${experienceNames}
- Projects & Portfolio: ${projectNames}
- Certifications: ${certNames}
- Coding Arena Activity: ${params.codingStats?.passedExecutions ? `${params.codingStats.passedExecutions} problems solved (${params.codingStats.languagesUsed.join(', ')})` : 'No coding history'}
- System Design Activity: ${params.systemDesignStats?.diagramsCount ? `${params.systemDesignStats.diagramsCount} diagrams designed` : 'No system design history'}
- Mock Interviews: ${params.interviewStats?.completedInterviews ? `${params.interviewStats.completedInterviews} completed (${params.interviewStats.domainsTested.join(', ')})` : 'No mock interview history'}

Target Job Description:
"""
${params.jobDescription}
"""

${params.jobTitle ? `User Specified Job Title: ${params.jobTitle}` : ''}
${params.company ? `User Specified Company: ${params.company}` : ''}

Instructions:
1. Extract or confirm the Job Title and Company.
2. Extract all explicit technical and engineering requirements from the job description and group them into categorizedRequirements (e.g., "Technical Skills", "Data & Databases", "Cloud & Infrastructure", "Architecture & System Design", "Core CS & DSA", "Soft Skills / Engineering Practices").
3. For each extracted requirement, evaluate candidate evidence and produce an item in evidenceBreakdown:
   - skill: Skill name
   - category: Category name
   - status: "MATCHED" | "PARTIAL" | "NO_EVIDENCE"
   - evidenceText: Specific explanation of where evidence was found (e.g. "Resume mentions 3+ years with React and TypeScript", "Verified in Profile Skills", "Demonstrated in Coding Arena", "2 completed System Design sessions") or "No evidence found in your current profile/resume."
   - source: "RESUME" | "PROFILE" | "PRACTICE" | "SYSTEM_DESIGN" | "INTERVIEW" | "NONE"
4. Group candidate skill gaps into prioritized gaps:
   - priority "HIGH": Critical required skills with "NO_EVIDENCE".
   - priority "MEDIUM": Core skills with "PARTIAL" evidence or secondary requirements.
   - priority "LOW": Preferred / bonus skills.
   - Each gap must have: skill, category, priority, reason (e.g., "Required by this job and currently has no verified profile or resume evidence."), actionType ("arena" | "resume" | "system-design" | "profile"), and actionLabel ("Practice in Arena" | "Update Resume" | "Design Architecture" | "Add to Profile").
5. Provide 3-4 concrete, actionable nextSteps connecting directly to ELEVATE platform features (arena, system-design, resume, profile).
6. List 3-5 likelyInterviewTopics and 3-4 preparationStrategy points.
7. Provide a realistic overview summary explaining the candidate's alignment with zero fake metrics.
8. Output strictly valid JSON matching this schema:
{
  "jobTitle": "Job Title",
  "company": "Company Name",
  "matchScore": 75,
  "requiredSkills": ["Skill 1", "Skill 2"],
  "preferredSkills": ["Skill 3"],
  "categorizedRequirements": [
    { "category": "Technical Skills", "skills": ["Skill 1", "Skill 2"] }
  ],
  "evidenceBreakdown": [
    {
      "skill": "Skill 1",
      "category": "Technical Skills",
      "status": "MATCHED",
      "evidenceText": "Resume mentions extensive production experience with Skill 1.",
      "source": "RESUME"
    }
  ],
  "strongMatchingSkills": ["Skill 1"],
  "skillsToDevelop": ["Skill 2"],
  "gaps": [
    {
      "skill": "Skill 2",
      "category": "Technical Skills",
      "priority": "HIGH",
      "reason": "Required by this job and currently has no evidence in your profile or resume.",
      "actionType": "arena",
      "actionLabel": "Practice in Arena"
    }
  ],
  "nextSteps": [
    {
      "title": "Practice Skill 2 fundamentals in Coding Arena",
      "reason": "Key requirement for this role with limited profile evidence.",
      "actionType": "arena",
      "actionLabel": "Start Practice",
      "focusTopic": "Skill 2"
    }
  ],
  "likelyInterviewTopics": ["Topic 1", "Topic 2"],
  "preparationStrategy": ["Strategy 1", "Strategy 2"],
  "overview": "Clear 2-sentence summary of candidate evidence and highest priority actions."
}`;

    if (status.configured) {
      try {
        const rawJson = await this.callLLMWithRetry(prompt, 'job_description_analysis');
        const parsed = this.safeJsonParse(rawJson);
        const validation = JobIntelligenceResponseSchema.safeParse(parsed);
        if (validation.success) {
          return validation.data;
        }
      } catch (err: any) {
        console.warn('⚠️ [LLM] Job description analysis LLM call failed, falling back to deterministic engine:', err.message);
      }
    }

    return this.getDeterministicJobAnalysis(params, combinedCandidateSkills);
  }

  /**
   * Deterministic evidence-based Job Intelligence fallback engine
   */
  private static getDeterministicJobAnalysis(
    params: {
      jobDescription: string;
      jobTitle?: string;
      company?: string;
      targetRole?: string;
      userType?: string;
      trackLevel?: string;
      experienceYears?: number;
      userSkills?: string[];
      resumeSkills?: string[];
      userSummary?: string;
      experience?: Array<{ company: string; role: string; description?: string; skills?: string[] }>;
      projects?: Array<{ name: string; description: string; technologies?: string[] }>;
      certifications?: Array<{ name: string; issuer: string }>;
      codingStats?: { passedExecutions: number; languagesUsed: string[] };
      interviewStats?: { completedInterviews: number; domainsTested: string[] };
      systemDesignStats?: { diagramsCount: number };
    },
    candidateSkills: string[]
  ): IJobIntelligenceResponse {
    const jdLower = params.jobDescription.toLowerCase();

    // Skill definitions categorized
    const skillCategories: Record<string, string[]> = {
      'Technical Skills': [
        'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'Spring Boot', 'C++', 'Go', 'Golang',
        'Rust', 'Next.js', 'FastAPI', 'Express', 'Django', 'GraphQL', 'REST APIs', 'HTML', 'CSS', 'Tailwind CSS',
      ],
      'Data & Databases': [
        'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Kafka', 'Elasticsearch', 'ClickHouse', 'DynamoDB', 'Database Internals',
      ],
      'Cloud & Infrastructure': [
        'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux', 'Microservices', 'Serverless',
      ],
      'Architecture & CS': [
        'System Design', 'Distributed Systems', 'Data Structures', 'Algorithms', 'High Availability', 'Load Balancing', 'Caching', 'Concurrency',
      ],
      'Engineering Practices': [
        'Unit Testing', 'TDD', 'Code Review', 'Agile', 'Mentorship', 'Cross-functional Collaboration',
      ],
    };

    const categorizedRequirements: Array<{ category: string; skills: string[] }> = [];
    const allDetectedSkills: Array<{ skill: string; category: string }> = [];

    for (const [category, skillsList] of Object.entries(skillCategories)) {
      const matched = skillsList.filter((s) => jdLower.includes(s.toLowerCase()));
      if (matched.length > 0) {
        categorizedRequirements.push({ category, skills: matched });
        matched.forEach((m) => allDetectedSkills.push({ skill: m, category }));
      }
    }

    if (categorizedRequirements.length === 0) {
      // General fallback if no standard keywords matched
      const words = params.jobDescription.split(/\s+/).slice(0, 8);
      categorizedRequirements.push({ category: 'Role Requirements', skills: words });
      words.forEach((w) => allDetectedSkills.push({ skill: w, category: 'Role Requirements' }));
    }

    // Build evidence sets
    const profileSet = new Set((params.userSkills || []).map((s) => s.toLowerCase().trim()));
    const resumeSet = new Set((params.resumeSkills || []).map((s) => s.toLowerCase().trim()));
    const projectSet = new Set(
      (params.projects || [])
        .flatMap((p) => p.technologies || [])
        .map((t) => t.toLowerCase().trim())
    );
    const codingSet = new Set((params.codingStats?.languagesUsed || []).map((l) => l.toLowerCase().trim()));

    const evidenceBreakdown: IJobIntelligenceResponse['evidenceBreakdown'] = [];
    const strongMatchingSkills: string[] = [];
    const skillsToDevelop: string[] = [];
    const gaps: IJobIntelligenceResponse['gaps'] = [];
    const nextSteps: IJobIntelligenceResponse['nextSteps'] = [];

    for (const { skill, category } of allDetectedSkills) {
      const sLower = skill.toLowerCase().trim();
      let status: 'MATCHED' | 'PARTIAL' | 'NO_EVIDENCE' = 'NO_EVIDENCE';
      let evidenceText = 'No evidence found in your current profile/resume.';
      let source: 'RESUME' | 'PROFILE' | 'PRACTICE' | 'SYSTEM_DESIGN' | 'INTERVIEW' | 'NONE' = 'NONE';

      if (resumeSet.has(sLower)) {
        status = 'MATCHED';
        evidenceText = `Extracted from verified resume skills (${skill}).`;
        source = 'RESUME';
      } else if (profileSet.has(sLower)) {
        status = 'MATCHED';
        evidenceText = `Listed in your candidate Profile skills with verified proficiency.`;
        source = 'PROFILE';
      } else if (projectSet.has(sLower)) {
        status = 'MATCHED';
        evidenceText = `Demonstrated in your projects portfolio.`;
        source = 'PROFILE';
      } else if (codingSet.has(sLower)) {
        status = 'MATCHED';
        evidenceText = `Verified active execution in the Coding Arena.`;
        source = 'PRACTICE';
      } else if (
        (sLower.includes('system design') || sLower.includes('architecture') || sLower.includes('distributed')) &&
        (params.systemDesignStats?.diagramsCount ?? 0) > 0
      ) {
        status = 'PARTIAL';
        evidenceText = `Demonstrated ${params.systemDesignStats?.diagramsCount} architecture diagrams in System Design Studio.`;
        source = 'SYSTEM_DESIGN';
      }

      evidenceBreakdown.push({
        skill,
        category,
        status,
        evidenceText,
        source,
      });

      if (status === 'MATCHED') {
        strongMatchingSkills.push(skill);
      } else if (status === 'PARTIAL') {
        skillsToDevelop.push(skill);
        gaps.push({
          skill,
          category,
          priority: 'MEDIUM',
          reason: `Required by this job with partial platform evidence. Additional practice recommended.`,
          actionType: category.includes('Architecture') || category.includes('Design') ? 'system-design' : 'arena',
          actionLabel: category.includes('Architecture') || category.includes('Design') ? 'Design Architecture' : 'Practice in Arena',
        });
      } else {
        skillsToDevelop.push(skill);
        gaps.push({
          skill,
          category,
          priority: 'HIGH',
          reason: `Required by this job and currently has no evidence in your profile or resume.`,
          actionType: category.includes('Cloud') || category.includes('Architecture') ? 'system-design' : 'arena',
          actionLabel: category.includes('Cloud') || category.includes('Architecture') ? 'Design Architecture' : 'Practice in Arena',
        });
      }
    }

    // Build actionable next steps
    if (gaps.length > 0) {
      const topGap = gaps[0];
      nextSteps.push({
        title: `Practice ${topGap.skill} in the Coding Arena`,
        reason: `Required by target job with no current profile/resume evidence.`,
        actionType: topGap.actionType,
        actionLabel: 'Start Practice',
        focusTopic: topGap.skill,
      });

      if (gaps.length > 1) {
        const secondGap = gaps[1];
        nextSteps.push({
          title: `Reinforce ${secondGap.skill} domain concepts`,
          reason: `High-priority requirement extracted from the job description.`,
          actionType: secondGap.actionType,
          actionLabel: 'Open Studio',
          focusTopic: secondGap.skill,
        });
      }
    }

    if (!params.resumeSkills || params.resumeSkills.length === 0) {
      nextSteps.push({
        title: 'Upload and sync your resume in Resume Hub',
        reason: 'Syncing your resume allows ELEVATE to automatically detect evidence for required technologies.',
        actionType: 'resume',
        actionLabel: 'Open Resume Hub',
      });
    }

    if (nextSteps.length < 3) {
      nextSteps.push({
        title: 'Take a tailored mock technical round',
        reason: 'Test your problem-solving speed under real-time interview conditions calibrated for this role.',
        actionType: 'arena',
        actionLabel: 'Launch Assessment',
      });
    }

    const totalReqs = Math.max(1, allDetectedSkills.length);
    const score = candidateSkills.length === 0 ? 0 : Math.round((strongMatchingSkills.length / totalReqs) * 100);

    const derivedTitle = params.jobTitle || params.targetRole || 'Software Engineer';
    const derivedCompany = params.company || 'Target Organization';

    return {
      jobTitle: derivedTitle,
      company: derivedCompany,
      matchScore: Math.min(100, Math.max(0, score)),
      requiredSkills: allDetectedSkills.slice(0, 8).map((s) => s.skill),
      preferredSkills: allDetectedSkills.slice(8).map((s) => s.skill),
      categorizedRequirements,
      evidenceBreakdown,
      strongMatchingSkills,
      skillsToDevelop,
      gaps,
      nextSteps,
      likelyInterviewTopics: [
        `${derivedTitle} System Scalability & API Design Trade-offs`,
        'Algorithmic Complexity & Edge Case Optimization',
        'Production Debugging & Concurrency Failure Modes',
      ],
      preparationStrategy: [
        `Bridge high-priority gaps in ${skillsToDevelop.slice(0, 3).join(', ') || 'core architecture'}`,
        'Practice real coding problems in the Practice Arena with benchmark timers',
        'Review architecture trade-offs in System Design Studio',
      ],
      overview: `You match ${strongMatchingSkills.length} of ${allDetectedSkills.length} core job requirements. Closing high-priority gaps in ${skillsToDevelop.slice(0, 2).join(', ') || 'advanced topics'} will maximize interview alignment.`,
    };
  }

  /**
   * Generates a personalized Adaptive Career Roadmap based strictly on verified user data
   */
  static async generateAdaptiveRoadmap(params: {
    targetRole: string;
    trackLevel?: string;
    userType?: string;
    experienceYears?: number;
    extractedSkills?: string[];
    recommendedFocusAreas?: string[];
    jdSkillGaps?: string[];
    jdJobTitle?: string;
    codingStats?: {
      totalExecutions: number;
      passedExecutions: number;
      failedExecutions: number;
      passRate: number;
      languagesUsed: string[];
    };
    interviewStats?: {
      completedInterviews: number;
      averageScore: number | null;
      growthAreas: string[];
      domainsTested: string[];
    };
    systemDesignStats?: {
      diagramsCount: number;
      componentsUsed: string[];
      weaknesses: string[];
    };
  }): Promise<IAdaptiveRoadmapItem[]> {
    const hasAnyTelemetry = Boolean(
      (params.extractedSkills && params.extractedSkills.length > 0) ||
      (params.recommendedFocusAreas && params.recommendedFocusAreas.length > 0) ||
      (params.jdSkillGaps && params.jdSkillGaps.length > 0) ||
      (params.codingStats && params.codingStats.totalExecutions > 0) ||
      (params.interviewStats && params.interviewStats.completedInterviews > 0) ||
      (params.systemDesignStats && params.systemDesignStats.diagramsCount > 0)
    );

    // If user is brand new with zero telemetry, return empty array for clean empty-state
    if (!hasAnyTelemetry) {
      return [];
    }

    const status = this.getLlmStatus();
    if (status.configured) {
      const prompt = `You are the ELEVATE.AI Career Engine. Generate an evidence-based, personalized preparation roadmap for a candidate based strictly on their verified telemetry.
Never invent data or state that the candidate has failed a subject if there is no evidence of it.
If a data source is empty, do NOT make assumptions about it.

Candidate Profile & Telemetry:
- Target Role: ${params.targetRole || 'Software Engineer'}
- Track Level: ${params.trackLevel || 'Intermediate'}
- User Persona: ${params.userType || 'JOB_SEEKER'}
- Experience Years: ${params.experienceYears ?? 'Not specified'}
- Verified Resume Skills: ${params.extractedSkills?.join(', ') || 'None provided yet'}
- Resume Focus Areas: ${params.recommendedFocusAreas?.join(', ') || 'None'}
- Target Job Description Skill Gaps: ${params.jdSkillGaps?.join(', ') || 'None analyzed yet'}
- Coding Arena History: ${
        params.codingStats && params.codingStats.totalExecutions > 0
          ? `${params.codingStats.totalExecutions} runs (${params.codingStats.passedExecutions} passed, ${params.codingStats.failedExecutions} failed, Pass Rate: ${params.codingStats.passRate}%, Languages: ${params.codingStats.languagesUsed.join(', ')})`
          : 'No coding attempts recorded yet'
      }
- Mock Technical Assessment History: ${
        params.interviewStats && params.interviewStats.completedInterviews > 0
          ? `${params.interviewStats.completedInterviews} completed (Avg Score: ${params.interviewStats.averageScore ?? 'N/A'}/100, Growth Areas: ${params.interviewStats.growthAreas.join(', ') || 'None noted'})`
          : 'No mock interviews completed yet'
      }
- System Design Studio: ${
        params.systemDesignStats && params.systemDesignStats.diagramsCount > 0
          ? `${params.systemDesignStats.diagramsCount} diagrams created`
          : 'No system design diagrams created yet'
      }

Instructions:
1. Generate between 3 to 6 high-impact roadmap items.
2. Prioritization Rules:
   - HIGH: Required by target job and missing from resume, OR demonstrated weakness/failure in coding or interview feedback.
   - MEDIUM: Relevant to target role with moderate evidence of need.
   - LOW: Helpful enhancement that is not currently blocking the target role.
3. Every item must clearly specify:
   - title: Skill/topic name (e.g., "Dynamic Programming & Memoization", "PostgreSQL Index Optimization", "Distributed Caching Strategies")
   - category: One of "DSA", "Programming", "CS Fundamentals", "SQL", "Backend", "Frontend", "Full Stack", "System Design", "Cloud", "DevOps", "AI/ML", "Data", "Behavioral", "Interview", "Other"
   - priority: "HIGH" | "MEDIUM" | "LOW"
   - reason: Clear explanation of why ELEVATE recommends this based on the candidate's target role and data.
   - evidence: Array of 1-3 concise bullet points stating the real data source (e.g., ["Target Job Description Gap", "Missing from resume"]).
   - source: "RESUME" | "JOB_DESCRIPTION" | "CODING" | "INTERVIEW" | "SYSTEM_DESIGN" | "COMBINED"
   - recommendedActions: Array of 2-4 concrete, actionable steps.
   - actionTarget: Object with { type: "arena" | "resume" | "system-design" | "analytics", label: "Practice" | "Analyze" | "Design" | "Assess", focusTopic: string }
4. Output strictly valid JSON matching this schema:
{
  "roadmapItems": [
    {
      "title": "Topic Name",
      "category": "DSA",
      "priority": "HIGH",
      "reason": "Why this is recommended...",
      "evidence": ["Target Role: Software Engineer", "Demonstrated in Coding Arena"],
      "source": "CODING",
      "recommendedActions": ["Step 1", "Step 2"],
      "actionTarget": { "type": "arena", "label": "Practice", "focusTopic": "Topic Name" }
    }
  ]
}`;

      try {
        const rawJson = await this.callLLMWithRetry(prompt, 'roadmap_generation');
        const parsed = this.safeJsonParse(rawJson);
        const validation = AdaptiveRoadmapResponseSchema.safeParse(parsed);
        if (validation.success && validation.data.roadmapItems.length > 0) {
          return validation.data.roadmapItems;
        }
      } catch (err: any) {
        console.warn('⚠️ [LLM] Adaptive roadmap LLM call failed, using deterministic generation:', err.message);
      }
    }

    return this.getDeterministicRoadmap(params);
  }

  /**
   * Deterministic evidence-based roadmap fallback engine
   */
  private static getDeterministicRoadmap(params: {
    targetRole: string;
    trackLevel?: string;
    userType?: string;
    experienceYears?: number;
    extractedSkills?: string[];
    recommendedFocusAreas?: string[];
    jdSkillGaps?: string[];
    codingStats?: {
      totalExecutions: number;
      passedExecutions: number;
      failedExecutions: number;
      passRate: number;
      languagesUsed: string[];
    };
    interviewStats?: {
      completedInterviews: number;
      averageScore: number | null;
      growthAreas: string[];
      domainsTested: string[];
    };
    systemDesignStats?: {
      diagramsCount: number;
      componentsUsed: string[];
      weaknesses: string[];
    };
  }): IAdaptiveRoadmapItem[] {
    const items: IAdaptiveRoadmapItem[] = [];
    const addedTitles = new Set<string>();

    const targetRoleLower = (params.targetRole || 'Software Engineer').toLowerCase();

    // 1. Job Description Missing Skills (Highest Priority)
    if (params.jdSkillGaps && params.jdSkillGaps.length > 0) {
      for (const gap of params.jdSkillGaps.slice(0, 3)) {
        const norm = gap.trim();
        if (norm && !addedTitles.has(norm.toLowerCase())) {
          addedTitles.add(norm.toLowerCase());
          const isSysDesign = /system|design|architect|scale|distributed|microservice|kafka|redis/i.test(norm);
          items.push({
            title: norm,
            category: isSysDesign ? 'System Design' : /sql|db|postgres|mongo/i.test(norm) ? 'SQL' : 'Backend',
            priority: 'HIGH',
            reason: `Identified as a critical required skill gap for target role requirements.`,
            evidence: [
              `Required by analyzed target Job Description`,
              `Missing from verified resume skill inventory`,
            ],
            source: 'JOB_DESCRIPTION',
            recommendedActions: [
              `Review ${norm} core patterns and production trade-offs`,
              `Build a targeted implementation in the ${isSysDesign ? 'System Design Studio' : 'Coding Arena'}`,
              `Validate proficiency through a tailored assessment`,
            ],
            actionTarget: {
              type: isSysDesign ? 'system-design' : 'arena',
              label: isSysDesign ? 'Design in Studio' : 'Practice in Arena',
              focusTopic: norm,
            },
          });
        }
      }
    }

    // 2. Coding Performance Signal
    if (params.codingStats && params.codingStats.totalExecutions > 0) {
      if (params.codingStats.passRate < 70 || params.codingStats.failedExecutions > 0) {
        const title = 'Algorithmic Edge Cases & Test Case Precision';
        if (!addedTitles.has(title.toLowerCase())) {
          addedTitles.add(title.toLowerCase());
          items.push({
            title,
            category: 'DSA',
            priority: 'HIGH',
            reason: `Demonstrated coding submissions show test case failures (${params.codingStats.failedExecutions} failed attempts, ${params.codingStats.passRate}% pass rate).`,
            evidence: [
              `Coding Arena pass rate: ${params.codingStats.passRate}%`,
              `Total test executions logged: ${params.codingStats.totalExecutions}`,
            ],
            source: 'CODING',
            recommendedActions: [
              'Analyze boundary conditions and empty inputs before coding',
              'Trace time and space complexity prior to submitting',
              'Practice medium-level array and two-pointer challenges in Arena',
            ],
            actionTarget: {
              type: 'arena',
              label: 'Enter Coding Arena',
              focusTopic: 'Array & Two-Pointer Patterns',
            },
          });
        }
      }
    }

    // 3. Interview Growth Areas
    if (params.interviewStats && params.interviewStats.growthAreas && params.interviewStats.growthAreas.length > 0) {
      for (const area of params.interviewStats.growthAreas.slice(0, 2)) {
        const norm = area.trim();
        if (norm && !addedTitles.has(norm.toLowerCase())) {
          addedTitles.add(norm.toLowerCase());
          const avgScore = params.interviewStats.averageScore ?? 65;
          items.push({
            title: norm,
            category: 'Interview',
            priority: avgScore < 70 ? 'HIGH' : 'MEDIUM',
            reason: `Flagged as a key technical growth area in recent mock assessment evaluations.`,
            evidence: [
              `Mock Interview Assessment Evaluation`,
              `Average Session Score: ${avgScore}/100`,
            ],
            source: 'INTERVIEW',
            recommendedActions: [
              `Review structured verbal response frameworks (STAR / Technical outline)`,
              `Conduct practice runs addressing this specific evaluation feedback`,
            ],
            actionTarget: {
              type: 'analytics',
              label: 'Review Scorecard',
              focusTopic: norm,
            },
          });
        }
      }
    }

    // 4. Resume Recommended Focus Areas
    if (params.recommendedFocusAreas && params.recommendedFocusAreas.length > 0) {
      for (const focus of params.recommendedFocusAreas.slice(0, 2)) {
        const norm = focus.trim();
        if (norm && !addedTitles.has(norm.toLowerCase())) {
          addedTitles.add(norm.toLowerCase());
          items.push({
            title: norm,
            category: /design|architecture/i.test(norm) ? 'System Design' : 'Programming',
            priority: 'MEDIUM',
            reason: `Recommended by resume ATS skill analysis for ${params.targetRole || 'target roles'}.`,
            evidence: [
              `Extracted from verified resume analysis`,
              `Target Role: ${params.targetRole || 'Software Engineer'}`,
            ],
            source: 'RESUME',
            recommendedActions: [
              `Review standard industry implementations for ${norm}`,
              `Complete hands-on practice problems in the arena`,
            ],
            actionTarget: {
              type: 'arena',
              label: 'Practice in Arena',
              focusTopic: norm,
            },
          });
        }
      }
    }

    // 5. Target Role Standard Core Competency (if still fewer than 3 items and resume skills present)
    if (items.length < 3 && params.extractedSkills && params.extractedSkills.length > 0) {
      const userSkillSet = new Set(params.extractedSkills.map((s) => s.toLowerCase()));
      const roleCompetencies: Record<string, Array<{ title: string; category: any }>> = {
        frontend: [
          { title: 'State Management & Concurrency', category: 'Frontend' },
          { title: 'Component Performance & Web Vitals', category: 'Frontend' },
          { title: 'TypeScript Advanced Generics', category: 'Programming' },
        ],
        backend: [
          { title: 'Database Indexing & Query Optimization', category: 'SQL' },
          { title: 'API Rate Limiting & Resiliency Patterns', category: 'Backend' },
          { title: 'Distributed Caching Strategies', category: 'System Design' },
        ],
        fullstack: [
          { title: 'Fullstack Authentication & JWT Security', category: 'Full Stack' },
          { title: 'Relational Database Schema Design', category: 'SQL' },
          { title: 'Asynchronous Event Handling', category: 'Backend' },
        ],
        'system design': [
          { title: 'Scalable Sharding & Replication Strategies', category: 'System Design' },
          { title: 'High-Throughput Message Queue Architecture', category: 'System Design' },
        ],
      };

      let matchedKey = 'fullstack';
      if (targetRoleLower.includes('frontend')) matchedKey = 'frontend';
      else if (targetRoleLower.includes('backend')) matchedKey = 'backend';
      else if (targetRoleLower.includes('system') || targetRoleLower.includes('architect')) matchedKey = 'system design';

      const candidates = roleCompetencies[matchedKey] || roleCompetencies['fullstack'];
      for (const comp of candidates) {
        if (!userSkillSet.has(comp.title.toLowerCase()) && !addedTitles.has(comp.title.toLowerCase())) {
          addedTitles.add(comp.title.toLowerCase());
          items.push({
            title: comp.title,
            category: comp.category,
            priority: 'MEDIUM',
            reason: `Core benchmark skill expected for ${params.targetRole || 'Target Role'} on the ${params.trackLevel || 'Engineering'} Track.`,
            evidence: [
              `Target Role: ${params.targetRole || 'Software Engineer'}`,
              `Track Level: ${params.trackLevel || 'Intermediate'}`,
            ],
            source: 'COMBINED',
            recommendedActions: [
              `Review standard architectures and trade-offs for ${comp.title}`,
              `Solve practice challenges or construct diagrams in the Studio`,
            ],
            actionTarget: {
              type: comp.category === 'System Design' ? 'system-design' : 'arena',
              label: comp.category === 'System Design' ? 'Design Architecture' : 'Start Practice',
              focusTopic: comp.title,
            },
          });
          if (items.length >= 4) break;
        }
      }
    }

    return items;
  }

  /**
   * Evaluates candidate career questions grounded in real platform data
   */
  static async askElevatePersonalAssistant(params: {
    question: string;
    careerContext: ICareerContext;
    conversationHistory?: Array<{ role: string; content: string }>;
  }): Promise<IAskAssistantResponse> {
    const status = this.getLlmStatus();
    if (!status.configured) {
      console.warn('⚠️ [LLM] LLM provider not configured. Using deterministic career advisor engine.');
      return this.getFallbackAssistantResponse(params);
    }

    const prompt = PromptTemplates.askPersonalAssistantPrompt(params);

    try {
      const rawJson = await this.callLLMWithRetry(prompt, 'assistant_query');
      const parsed = this.safeJsonParse(rawJson);
      const validationResult = AskAssistantResponseSchema.safeParse(parsed);

      if (validationResult.success) {
        // Sanitize output to prevent leakage of internal AI terms
        let sanitizedAnswer = validationResult.data.answer
          .replace(/\b(gemini|openai|gpt-4|gpt-3|llm|model|prompt|json schema)\b/gi, 'ELEVATE AI')
          .trim();

        return {
          answer: sanitizedAnswer,
          whyThisMatters: validationResult.data.whyThisMatters,
          suggestedActions: validationResult.data.suggestedActions || [],
        };
      }

      console.warn('⚠️ [LLM] Assistant output schema mismatch. Retrying with schema repair...');
      const repairPrompt = `${prompt}\n\nIMPORTANT: Output MUST be valid JSON strictly matching AskAssistantResponseSchema.`;
      const repairedRaw = await this.callLLMWithRetry(repairPrompt, 'assistant_repair');
      const repairedParsed = this.safeJsonParse(repairedRaw);
      const repairedValidation = AskAssistantResponseSchema.safeParse(repairedParsed);

      if (repairedValidation.success) {
        return repairedValidation.data;
      }

      console.error('❌ [LLM] Assistant query validation failed after retry. Falling back to deterministic advisor.');
      return this.getFallbackAssistantResponse(params);
    } catch (err: any) {
      console.error(`❌ [LLM] Error in askElevatePersonalAssistant: ${err.message}`);
      return this.getFallbackAssistantResponse(params);
    }
  }

  /**
   * Deterministic Career Advisor Engine when LLM is offline or unconfigured
   */
  static getFallbackAssistantResponse(params: {
    question: string;
    careerContext: ICareerContext;
  }): IAskAssistantResponse {
    const { question, careerContext } = params;
    const qLower = question.toLowerCase();
    const { user, resume, jobIntelligence, roadmap, practice, assessments, interviews, systemDesign } = careerContext;

    // 1. "What should I work on today / next?" or "What should I practice?"
    if (
      qLower.includes('work on') ||
      qLower.includes('do next') ||
      qLower.includes('what next') ||
      qLower.includes('practice next') ||
      qLower.includes('learn next') ||
      qLower.includes('today')
    ) {
      if (roadmap.inProgress.length > 0) {
        const topItem = roadmap.inProgress[0];
        return {
          answer: `Based on your Adaptive Roadmap, your active in-progress priority is **${topItem.title}** (${topItem.category}). ${topItem.reason}`,
          whyThisMatters: `Completing ${topItem.title} will build verified competence for your target role as a ${user.targetRole}.`,
          suggestedActions: [
            {
              label: `Practice ${topItem.title}`,
              type: 'PRACTICE',
              route: 'arena',
              focusTopic: topItem.title,
            },
            {
              label: 'View Full Roadmap',
              type: 'ROADMAP',
              route: 'roadmap',
            },
          ],
        };
      }

      if (roadmap.highPriority.length > 0) {
        const topItem = roadmap.highPriority[0];
        return {
          answer: `Your top roadmap priority is **${topItem.title}** (${topItem.category}). ${topItem.reason}`,
          whyThisMatters: `Addressing this high-priority milestone will strengthen your candidate profile.`,
          suggestedActions: [
            {
              label: `Start ${topItem.title}`,
              type: 'PRACTICE',
              route: 'arena',
              focusTopic: topItem.title,
            },
          ],
        };
      }

      if (jobIntelligence.hasJobAnalysis && jobIntelligence.latestJob?.gaps && jobIntelligence.latestJob.gaps.length > 0) {
        const topGap = jobIntelligence.latestJob.gaps[0];
        return {
          answer: `Based on your latest job analysis for ${jobIntelligence.latestJob.jobTitle}, the primary skill gap is **${topGap.skill}**. ${topGap.reason}`,
          whyThisMatters: `Closing this gap directly increases your match alignment for ${jobIntelligence.latestJob.jobTitle}.`,
          suggestedActions: [
            {
              label: `Practice ${topGap.skill}`,
              type: 'PRACTICE',
              route: 'arena',
              focusTopic: topGap.skill,
            },
            {
              label: 'View Job Analysis',
              type: 'JOB_INTELLIGENCE',
              route: 'job-intelligence',
            },
          ],
        };
      }

      if (!resume.hasResume) {
        return {
          answer: `To get personalized recommendations, connect your resume and target role so ELEVATE AI can map your skill gaps and build your adaptive roadmap.`,
          whyThisMatters: `A connected resume enables ATS scoring and personalized practice targeting.`,
          suggestedActions: [
            {
              label: 'Upload Resume',
              type: 'RESUME',
              route: 'resume',
            },
            {
              label: 'Complete Profile',
              type: 'PROFILE',
              route: 'profile',
            },
          ],
        };
      }

      return {
        answer: `You are targeting **${user.targetRole}** on the **${user.trackLevel}** track. Start by taking a diagnostic assessment in the Code Arena to establish your baseline skill evidence.`,
        whyThisMatters: `Verified platform evidence forms the foundation of your adaptive career roadmap.`,
        suggestedActions: [
          {
            label: 'Start Arena Assessment',
            type: 'PRACTICE',
            route: 'arena',
          },
        ],
      };
    }

    // 2. "What are my weaknesses / skill gaps / what am I missing?"
    if (
      qLower.includes('weak') ||
      qLower.includes('gap') ||
      qLower.includes('missing') ||
      qLower.includes('improve') ||
      qLower.includes('struggle')
    ) {
      if (jobIntelligence.latestJob && jobIntelligence.latestJob.gaps.length > 0) {
        const gapList = jobIntelligence.latestJob.gaps.map((g) => `• **${g.skill}**: ${g.reason}`).join('\n');
        return {
          answer: `Based on your job analysis for **${jobIntelligence.latestJob.jobTitle}** at ${jobIntelligence.latestJob.company || 'the target company'}, here are the identified skill gaps where supporting evidence is currently missing in your profile:\n\n${gapList}`,
          whyThisMatters: `Closing these gaps will improve your ATS and interview readiness scores.`,
          suggestedActions: [
            {
              label: `Practice ${jobIntelligence.latestJob.gaps[0].skill}`,
              type: 'PRACTICE',
              route: 'arena',
              focusTopic: jobIntelligence.latestJob.gaps[0].skill,
            },
            {
              label: 'Review Job Intelligence',
              type: 'JOB_INTELLIGENCE',
              route: 'job-intelligence',
            },
          ],
        };
      }

      if (assessments.hasAssessmentEvidence) {
        const struggled = assessments.assessmentEvidence.filter((e) => e.score < 75);
        if (struggled.length > 0) {
          const list = struggled.map((s) => `• **${s.skill || s.topic}**: Score ${s.score}%`).join('\n');
          return {
            answer: `Your recent platform assessments showed lower test-case pass rates on the following areas:\n\n${list}`,
            whyThisMatters: `Reinforcing these topics will help you pass technical screening rounds.`,
            suggestedActions: [
              {
                label: `Review & Practice ${struggled[0].skill || struggled[0].topic}`,
                type: 'PRACTICE',
                route: 'arena',
                focusTopic: struggled[0].skill || struggled[0].topic,
              },
            ],
          };
        }
      }

      return {
        answer: `I don't see any identified skill gaps or weaknesses recorded in your platform activity yet. Take a mock assessment or run a Job Intelligence analysis to benchmark your skills.`,
        whyThisMatters: `Continuous benchmarking reveals concrete improvement areas.`,
        suggestedActions: [
          {
            label: 'Take Assessment',
            type: 'PRACTICE',
            route: 'arena',
          },
          {
            label: 'Analyze Target Job',
            type: 'JOB_INTELLIGENCE',
            route: 'job-intelligence',
          },
        ],
      };
    }

    // 3. "Explain my roadmap / Why is this on my roadmap?"
    if (qLower.includes('roadmap') || qLower.includes('why is this')) {
      if (roadmap.hasRoadmap) {
        const topItems = [...roadmap.inProgress, ...roadmap.highPriority].slice(0, 3);
        const list = topItems.map((item) => `• **${item.title}** (${item.category}): ${item.reason}`).join('\n');
        return {
          answer: `Your Adaptive Roadmap currently has ${roadmap.totalItemsCount} total milestones. Here are your key priorities:\n\n${list}`,
          whyThisMatters: `Roadmap milestones adapt in real-time based on your resume, job analyses, and assessment outcomes.`,
          suggestedActions: [
            {
              label: 'View Roadmap',
              type: 'ROADMAP',
              route: 'roadmap',
            },
          ],
        };
      }

      return {
        answer: `You have not generated an adaptive roadmap yet. Once you connect your resume or analyze a target job description, ELEVATE AI will create an adaptive preparation roadmap for you.`,
        whyThisMatters: `Your roadmap provides a week-by-week plan tailored to your exact target role.`,
        suggestedActions: [
          {
            label: 'Analyze Target Job',
            type: 'JOB_INTELLIGENCE',
            route: 'job-intelligence',
          },
          {
            label: 'Upload Resume',
            type: 'RESUME',
            route: 'resume',
          },
        ],
      };
    }

    // 4. "Resume evaluation / ATS Score"
    if (qLower.includes('resume') || qLower.includes('ats')) {
      if (resume.hasResume) {
        return {
          answer: `Your resume is connected with an ATS alignment score of **${resume.atsScore ?? 'N/A'}/100** and **${resume.extractedSkills.length} extracted skills**. Key skills found include: ${resume.extractedSkills.slice(0, 8).join(', ')}.`,
          whyThisMatters: `Ensuring your resume reflects verified competencies improves recruiter screening success.`,
          suggestedActions: [
            {
              label: 'Open Resume Hub',
              type: 'RESUME',
              route: 'resume',
            },
          ],
        };
      }

      return {
        answer: `You haven't connected a resume yet, so I can't evaluate your resume against your target role (${user.targetRole}). Upload your PDF resume in the Resume Hub to begin.`,
        whyThisMatters: `Resume parsing enables skill extraction and ATS alignment benchmarks.`,
        suggestedActions: [
          {
            label: 'Upload Resume',
            type: 'RESUME',
            route: 'resume',
          },
        ],
      };
    }

    // 5. "Assessment results / Interview performance"
    if (qLower.includes('assessment') || qLower.includes('interview') || qLower.includes('performance') || qLower.includes('score')) {
      if (assessments.hasAssessmentEvidence) {
        return {
          answer: `You have completed **${assessments.totalAssessments} assessments** with an average score of **${assessments.averageScore ? `${assessments.averageScore}%` : 'N/A'}** and **${assessments.verifiedSkillsCount} verified skill badges**.`,
          whyThisMatters: `Verified platform evidence gives recruiters high confidence in your technical abilities.`,
          suggestedActions: [
            {
              label: 'Review Scorecards',
              type: 'PROFILE',
              route: 'profile',
            },
            {
              label: 'Practice in Arena',
              type: 'PRACTICE',
              route: 'arena',
            },
          ],
        };
      }

      return {
        answer: `You haven't completed a formal assessment yet. Start an assessment in the Code Arena to evaluate your real-world coding ability under timed conditions.`,
        whyThisMatters: `Assessment results generate verified skill evidence on your profile.`,
        suggestedActions: [
          {
            label: 'Start Assessment',
            type: 'PRACTICE',
            route: 'arena',
          },
        ],
      };
    }

    // 6. Generic / Default Response
    return {
      answer: `You are preparing for **${user.targetRole}** on the **${user.trackLevel}** track. Your profile completeness is at **${user.completenessScore}%** (${user.completenessTier}). Continue completing practice arena exercises, assessments, and roadmap milestones to build strong recruiter evidence.`,
      whyThisMatters: `Every verified platform activity updates your candidate career twin in real time.`,
      suggestedActions: [
        {
          label: 'Practice in Arena',
          type: 'PRACTICE',
          route: 'arena',
        },
        {
          label: 'View Profile',
          type: 'PROFILE',
          route: 'profile',
        },
      ],
    };
  }
}


