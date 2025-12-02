// screenshot-auto.js - 自动获取页面ID并截图
// 用法: node scripts/screenshot-auto.js [url] [output]
// 例如: node scripts/screenshot-auto.js http://localhost:3000 ./screenshot.png

const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");

const args = process.argv.slice(2);
const targetUrl = args[0] || "http://localhost:3000";
const outputPath = args[1] || "./screenshot.png";
const debugPort = process.env.PORT || 9333;

console.log("\n🎯 Chrome DevTools Protocol 自动截图工具");
console.log("━".repeat(50));
console.log(`   目标 URL:  ${targetUrl}`);
console.log(`   输出路径:  ${outputPath}`);
console.log(`   调试端口:  ${debugPort}`);
console.log("━".repeat(50) + "\n");

// Step 1: 获取页面 WebSocket URL
console.log("1️⃣  获取页面信息...");
http
  .get(`http://127.0.0.1:${debugPort}/json`, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      const pages = JSON.parse(data);
      const mainPage = pages.find((p) => p.type === "page" && !p.parentId);

      if (!mainPage) {
        console.error("❌ 未找到可用页面");
        process.exit(1);
      }

      console.log(`   ✅ 找到页面: ${mainPage.title || mainPage.url}\n`);
      takeScreenshot(mainPage.webSocketDebuggerUrl);
    });
  })
  .on("error", (err) => {
    console.error(`❌ 连接 Chrome 失败: ${err.message}`);
    console.error(`   请确保 Chrome 已启动调试模式 (端口 ${debugPort})`);
    process.exit(1);
  });

function takeScreenshot(wsUrl) {
  console.log("2️⃣  连接 WebSocket...");
  const ws = new WebSocket(wsUrl);
  let messageId = 1;

  ws.on("open", () => {
    console.log("   ✅ 已连接\n");
    console.log("3️⃣  启用 Page domain...");
    ws.send(JSON.stringify({ id: messageId++, method: "Page.enable" }));
  });

  ws.on("message", (data) => {
    const response = JSON.parse(data);

    // Page.enable 响应
    if (response.id === 1) {
      console.log("   ✅ Page domain 已启用\n");
      console.log(`4️⃣  导航到 ${targetUrl}...`);
      ws.send(
        JSON.stringify({
          id: messageId++,
          method: "Page.navigate",
          params: { url: targetUrl },
        })
      );
    }

    // 导航响应
    if (response.id === 2) {
      console.log("   ✅ 导航命令已发送");
      console.log("   ⏳ 等待页面加载...");
    }

    // 页面加载完成
    if (response.method === "Page.loadEventFired") {
      console.log("   ✅ 页面加载完成\n");
      console.log("5️⃣  等待渲染 (1秒)...");

      setTimeout(() => {
        console.log("6️⃣  开始截图...");
        ws.send(
          JSON.stringify({
            id: messageId++,
            method: "Page.captureScreenshot",
            params: { format: "png" },
          })
        );
      }, 1000);
    }

    // 截图结果
    if (response.result && response.result.data) {
      const imageBuffer = Buffer.from(response.result.data, "base64");
      fs.writeFileSync(outputPath, imageBuffer);

      const sizeKB = (imageBuffer.length / 1024).toFixed(2);
      console.log("   ✅ 截图成功\n");
      console.log("━".repeat(50));
      console.log(`🎉 完成!`);
      console.log(`   📁 文件: ${outputPath}`);
      console.log(`   📏 大小: ${sizeKB} KB`);
      console.log("━".repeat(50) + "\n");

      ws.close();
      process.exit(0);
    }
  });

  ws.on("error", (error) => {
    console.error(`❌ WebSocket 错误: ${error.message}`);
    process.exit(1);
  });

  // 超时
  setTimeout(() => {
    console.error("\n❌ 操作超时 (15秒)");
    console.error("   可能原因:");
    console.error("   - 目标页面加载时间过长");
    console.error("   - 网络问题");
    console.error("   - URL 不可访问");
    ws.close();
    process.exit(1);
  }, 15000);
}
