import dotenv from 'dotenv';
dotenv.config();
import * as https from 'https';

const key = process.env.GROQ_API_KEY;

console.log('\n=== ReCarbo AI — Groq Connection Test ===\n');

if (!key || key === '<your_groq_api_key_here>') {
  console.error('❌ GROQ_API_KEY not set in backend/.env');
  process.exit(1);
}

console.log('✅ Key found:', key.slice(0, 8) + '...' + key.slice(-4));
console.log('🚀 Sending test prompt to llama3-8b-8192...\n');

const body = JSON.stringify({
  model: 'groq/compound-mini',
  messages: [{ role: 'user', content: 'You are ReCarbo AI for a CO2 marketplace in Gujarat. In one sentence, what is ReCarbo?' }],
  max_tokens: 80,
  temperature: 0.3,
});

const req = https.request(
  {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'Content-Length': Buffer.byteLength(body),
    },
    agent: new https.Agent({ rejectUnauthorized: false }),
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const reply = json.choices?.[0]?.message?.content?.trim();
        if (reply) {
          console.log('✅ Groq is working!\n');
          console.log('🤖 AI Reply:', reply);
          console.log('\n✅ ReCarbo AI will now use real LLM replies.\n');
        } else {
          console.error('❌ Unexpected response:', data.slice(0, 300));
        }
      } catch {
        console.error('❌ Parse error:', data.slice(0, 300));
      }
    });
  }
);
req.on('error', (err) => console.error('❌ Error:', err.message));
req.write(body);
req.end();
