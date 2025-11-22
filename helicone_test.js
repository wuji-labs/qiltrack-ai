// Quick test script for Helicone chat completions
const axios = require('axios');
require('dotenv').config();

const heliConeApiKey = process.env.HELICONE_API_KEY;
const baseUrl = process.env.HELICONE_BASE_URL || 'https://ai-gateway.helicone.ai';
const modelId = process.env.HELICONE_MODEL || 'openai/gpt-5.1';

async function getResponse() {
  if (!heliConeApiKey) {
    console.error('Missing HELICONE_API_KEY.');
    process.exit(1);
  }

  try {
    const response = await axios.post(
      `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`,
      {
        model: modelId,
        messages: [
          { role: 'system', content: 'You are a helpful coding assistant.' },
          { role: 'user', content: '请用 JavaScript 写一个二叉树前序遍历函数。' },
        ],
        max_tokens: 200,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${heliConeApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Helicone response:', response.data.choices?.[0]?.message?.content || response.data);
  } catch (error) {
    console.error('Helicone call failed:', error.response ? error.response.data : error.message);
  }
}

getResponse();
