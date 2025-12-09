// 简单测试报告生成API
const http = require('http');

console.log('\n🧪 测试报告生成API');
console.log('='.repeat(60));

// 注意：需要先登录获取session cookie
console.log('⚠️  警告：此测试需要有效的session cookie');
console.log('请先在浏览器登录 http://localhost:3001');
console.log('然后从浏览器开发者工具复制cookie\n');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/report?symbol=AAPL&lang=zh-Hans&tone=baseline',
  method: 'GET',
  headers: {
    // 在这里添加从浏览器复制的cookie
    // 'Cookie': 'sb-inmtounwqcjwsxkfnsfd-auth-token=...'
  }
};

console.log(`请求: GET ${options.path}\n`);

const req = http.request(options, (res) => {
  let data = '';

  console.log(`状态码: ${res.statusCode}`);
  console.log('响应头:', res.headers);
  console.log('\n等待响应...\n');

  res.on('data', (chunk) => {
    data += chunk;
    process.stdout.write('.');
  });

  res.on('end', () => {
    console.log('\n\n响应完成！');
    console.log('='.repeat(60));

    try {
      const json = JSON.parse(data);

      if (json.success) {
        console.log('✅ 报告生成成功！');
        console.log('\n报告长度:', json.report?.length || 0, '字符');
        console.log('股票代码:', json.symbol);
        console.log('是否复用:', json.reused || false);
        console.log('\n报告预览:');
        console.log(json.report?.substring(0, 500) || '(无内容)');
      } else {
        console.log('❌ 报告生成失败');
        console.log('错误信息:', json.error?.message || json.message);
        console.log('错误代码:', json.error?.code);
      }
    } catch (e) {
      console.log('❌ 响应解析失败');
      console.log('原始响应:', data.substring(0, 1000));
    }
  });
});

req.on('error', (err) => {
  console.error('❌ 请求失败:', err.message);
});

req.end();

console.log('请求已发送，等待响应（可能需要60-150秒）...\n');
