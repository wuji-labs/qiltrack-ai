// 快速诊断报告生成系统健康状况
const https = require('https');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

async function checkFinnhub() {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    console.log('❌ Finnhub API: 未配置 FINNHUB_API_KEY');
    return false;
  }

  const url = `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${apiKey}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.c !== undefined) {
              console.log('✅ Finnhub API: 正常 (AAPL价格:', json.c, ')');
              resolve(true);
            } else {
              console.log('❌ Finnhub API: 响应格式异常');
              console.log('   响应:', data.substring(0, 200));
              resolve(false);
            }
          } catch (e) {
            console.log('❌ Finnhub API: JSON解析失败');
            console.log('   响应:', data.substring(0, 200));
            resolve(false);
          }
        } else {
          console.log(`❌ Finnhub API: HTTP ${res.statusCode}`);
          console.log('   响应:', data.substring(0, 200));
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log('❌ Finnhub API: 网络错误 -', err.message);
      resolve(false);
    });
  });
}

async function checkHelicone() {
  const apiKey = process.env.HELICONE_API_KEY;
  const model = process.env.HELICONE_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    console.log('❌ Helicone API: 未配置 HELICONE_API_KEY');
    return false;
  }

  const data = JSON.stringify({
    model: model,
    messages: [{ role: 'user', content: 'test' }],
    max_tokens: 10
  });

  const options = {
    hostname: 'ai-gateway.helicone.ai',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let response = '';
      res.on('data', chunk => response += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(response);
            if (json.choices && json.choices[0]) {
              console.log('✅ Helicone API: 正常 (模型:', model, ')');
              resolve(true);
            } else {
              console.log('❌ Helicone API: 响应格式异常');
              console.log('   响应:', response.substring(0, 200));
              resolve(false);
            }
          } catch (e) {
            console.log('❌ Helicone API: JSON解析失败');
            console.log('   响应:', response.substring(0, 200));
            resolve(false);
          }
        } else {
          console.log(`❌ Helicone API: HTTP ${res.statusCode}`);
          console.log('   响应:', response.substring(0, 300));
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Helicone API: 网络错误 -', err.message);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

async function checkOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  if (!apiKey) {
    console.log('⚠️  OpenRouter API: 未配置 (作为备用，非必需)');
    return true; // Not required, so return true
  }

  const data = JSON.stringify({
    model: model,
    messages: [{ role: 'user', content: 'test' }],
    max_tokens: 50  // GPT-5.1 requires minimum 16
  });

  const options = {
    hostname: 'openrouter.ai',
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let response = '';
      res.on('data', chunk => response += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ OpenRouter API: 正常 (备用服务)');
          resolve(true);
        } else {
          console.log(`⚠️  OpenRouter API: HTTP ${res.statusCode} (备用服务)`);
          resolve(true); // Non-critical
        }
      });
    });

    req.on('error', (err) => {
      console.log('⚠️  OpenRouter API: 网络错误 -', err.message, '(备用服务)');
      resolve(true); // Non-critical
    });

    req.write(data);
    req.end();
  });
}

async function checkSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.log('❌ Supabase: 配置缺失');
    return false;
  }

  const url = new URL('/rest/v1/profiles', supabaseUrl);
  url.searchParams.set('select', 'id');
  url.searchParams.set('limit', '1');

  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  };

  return new Promise((resolve) => {
    const protocol = url.protocol === 'https:' ? https : require('http');
    const req = protocol.get(`${url.href}`, {
      headers: options.headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Supabase: 数据库连接正常');
          resolve(true);
        } else {
          console.log(`❌ Supabase: HTTP ${res.statusCode}`);
          console.log('   响应:', data.substring(0, 200));
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log('❌ Supabase: 网络错误 -', err.message);
      resolve(false);
    });
  });
}

async function main() {
  console.log('\n🔍 报告生成系统诊断');
  console.log('='.repeat(60) + '\n');

  const results = await Promise.all([
    checkSupabase(),
    checkFinnhub(),
    checkHelicone(),
    checkOpenRouter()
  ]);

  console.log('\n' + '='.repeat(60));

  const criticalOk = results[0] && results[1] && results[2]; // Supabase, Finnhub, Helicone

  if (criticalOk) {
    console.log('✅ 核心服务全部正常，报告生成功能应该可用');
  } else {
    console.log('❌ 核心服务异常，报告生成功能可能无法使用');
    console.log('\n请检查:');
    if (!results[0]) console.log('  - Supabase 配置和连接');
    if (!results[1]) console.log('  - Finnhub API 密钥和配额');
    if (!results[2]) console.log('  - Helicone API 密钥和配额');
  }

  console.log('');
  process.exit(criticalOk ? 0 : 1);
}

main();
