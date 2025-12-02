// Chrome DevTools Protocol 截图脚本
const http = require("http");
const https = require("https");
const fs = require("fs");
const WebSocket = require("ws");

const debugPort = 9333;
const targetUrl = "http://localhost:3000";
const screenshotPath = "./homepage-screenshot.png";

console.log("🎯 开始自动化操作...\n");

// 1. 创建新标签页
console.log("1️⃣  创建新标签页...");
http
  .get(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(targetUrl)}`, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      const pageInfo = JSON.parse(data);
      console.log(`   ✅ 标签页已创建 (ID: ${pageInfo.id})\n`);

      // 2. 等待页面加载
      console.log("2️⃣  等待页面加载...");
      setTimeout(() => {
        // 3. 连接 WebSocket 并截图
        console.log("3️⃣  连接 DevTools 并截图...\n");
        const ws = new WebSocket(pageInfo.webSocketDebuggerUrl);

        ws.on("open", () => {
          console.log("   ✅ WebSocket 已连接");

          // 发送截图命令
          ws.send(
            JSON.stringify({
              id: 1,
              method: "Page.captureScreenshot",
              params: { format: "png", fromSurface: true },
            })
          );
          console.log("   📤 截图命令已发送");
        });

        ws.on("message", (data) => {
          const response = JSON.parse(data);
          if (response.id === 1 && response.result && response.result.data) {
            // 保存截图
            const imageBuffer = Buffer.from(response.result.data, "base64");
            fs.writeFileSync(screenshotPath, imageBuffer);

            console.log("\n✅ 截图成功保存！");
            console.log(`   📁 位置: ${screenshotPath}`);
            console.log(`   📏 大小: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`);
            console.log("🎉 操作完成！");
            console.log(`   🌐 页面: ${targetUrl}`);
            console.log(`   📸 截图: ${screenshotPath}`);

            ws.close();
            process.exit(0);
          }
        });

        ws.on("error", (error) => {
          console.error("   ❌ WebSocket 错误:", error.message);
          process.exit(1);
        });
      }, 3000);
    });
  })
  .on("error", (error) => {
    console.error("❌ 创建标签页失败:", error.message);
    process.exit(1);
  });
