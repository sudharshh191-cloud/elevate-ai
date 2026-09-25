import { ENV } from '../config/env.js';

async function testGemini() {
  const models = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
  for (const model of models) {
    console.log(`\nTesting model: ${model}...`);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENV.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with strict JSON: {"status": "live_working"}' }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );
      const data: any = await response.json();
      if (data.candidates && data.candidates[0]) {
        console.log(`✅ [${model}] SUCCESS:`, data.candidates[0].content.parts[0].text);
      } else {
        console.log(`❌ [${model}] Error:`, data.error?.message || JSON.stringify(data));
      }
    } catch (e: any) {
      console.log(`❌ [${model}] Exception:`, e.message);
    }
  }
}

testGemini();
