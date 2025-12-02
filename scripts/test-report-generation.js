// test-report-generation.js - 自动化测试报告生成功能
const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");

const debugPort = 9333;
const targetUrl = "http://localhost:3000";
const testTicker = "NVDA";

console.log("\n🧪 测试报告生成功能");
console.log("━".repeat(60));
console.log(`   测试股票: ${testTicker}`);
console.log(`   目标页面: ${targetUrl}`);
console.log("━".repeat(60) + "\n");

// 获取页面并开始测试
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

      startTest(mainPage.webSocketDebuggerUrl);
    });
  })
  .on("error", (err) => {
    console.error(`❌ 连接失败: ${err.message}`);
    process.exit(1);
  });

function startTest(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let messageId = 1;
  const testSteps = [];
  let currentStep = 0;

  function addStep(name) {
    testSteps.push({ name, status: "pending", startTime: Date.now() });
    currentStep = testSteps.length - 1;
  }

  function completeStep(status = "success", message = "") {
    testSteps[currentStep].status = status;
    testSteps[currentStep].duration = Date.now() - testSteps[currentStep].startTime;
    testSteps[currentStep].message = message;

    const icon = status === "success" ? "✅" : "❌";
    const duration = `(${testSteps[currentStep].duration}ms)`;
    console.log(`   ${icon} ${testSteps[currentStep].name} ${duration}`);
    if (message) console.log(`      ${message}`);
  }

  addStep("连接 WebSocket");

  ws.on("open", () => {
    completeStep();

    addStep("启用 Page domain");
    ws.send(JSON.stringify({ id: messageId++, method: "Page.enable" }));

    addStep("启用 Console");
    ws.send(JSON.stringify({ id: messageId++, method: "Console.enable" }));

    addStep("启用 Runtime");
    ws.send(JSON.stringify({ id: messageId++, method: "Runtime.enable" }));
  });

  let pageEnabled = false;
  let navigated = false;
  let inputFilled = false;
  let buttonClicked = false;
  let reportGenerated = false;

  ws.on("message", (data) => {
    const response = JSON.parse(data);

    // Page.enable 完成
    if (response.id === 1 && !pageEnabled) {
      pageEnabled = true;
      completeStep();

      addStep("导航到首页");
      ws.send(
        JSON.stringify({
          id: messageId++,
          method: "Page.navigate",
          params: { url: targetUrl },
        })
      );
    }

    // Console.enable 完成
    if (response.id === 2) {
      completeStep();
    }

    // Runtime.enable 完成
    if (response.id === 3) {
      completeStep();
    }

    // 页面加载完成
    if (response.method === "Page.loadEventFired" && !navigated) {
      navigated = true;
      completeStep();

      // 等待页面渲染
      setTimeout(() => {
        addStep("查找搜索输入框");
        ws.send(
          JSON.stringify({
            id: messageId++,
            method: "Runtime.evaluate",
            params: {
              expression: `
                            const input = document.querySelector('#report-query-input');
                            input ? 'found' : 'not found';
                        `,
              returnByValue: true,
            },
          })
        );
      }, 1500);
    }

    // 输入框查找结果
    if (response.id === 4 && !inputFilled) {
      if (response.result.value === "found") {
        completeStep("success", "输入框已找到");

        addStep(`输入股票代码: ${testTicker}`);
        ws.send(
          JSON.stringify({
            id: messageId++,
            method: "Runtime.evaluate",
            params: {
              expression: `
                            const input = document.querySelector('#report-query-input');
                            input.value = '${testTicker}';
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                            'input set';
                        `,
              returnByValue: true,
            },
          })
        );
      } else {
        completeStep("failed", "输入框未找到");
        takeScreenshot(ws, messageId++, "./test-failed-no-input.png");
        setTimeout(() => process.exit(1), 2000);
      }
    }

    // 输入完成
    if (response.id === 5 && !inputFilled) {
      inputFilled = true;
      completeStep();

      // 截图：输入后的状态
      takeScreenshot(ws, messageId++, "./test-step1-input.png");

      setTimeout(() => {
        addStep("查找并点击生成按钮");
        ws.send(
          JSON.stringify({
            id: messageId++,
            method: "Runtime.evaluate",
            params: {
              expression: `
                            const form = document.querySelector('form');
                            if (form) {
                                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                                'submitted';
                            } else {
                                'form not found';
                            }
                        `,
              returnByValue: true,
            },
          })
        );
      }, 1000);
    }

    // 按钮点击结果
    if (response.id === 7 && !buttonClicked) {
      buttonClicked = true;
      if (response.result.value === "submitted") {
        completeStep("success", "生成按钮已点击");

        addStep("监控报告生成进度");
        console.log("      ⏳ 等待报告生成...");

        // 定期检查进度
        const checkInterval = setInterval(() => {
          ws.send(
            JSON.stringify({
              id: messageId++,
              method: "Runtime.evaluate",
              params: {
                expression: `
                                const progressBar = document.querySelector('[role="progressbar"]');
                                const errorMsg = document.querySelector('[role="alert"]');
                                const reportContent = document.querySelector('.report-content');

                                JSON.stringify({
                                    hasProgress: !!progressBar,
                                    progressValue: progressBar?.getAttribute('aria-valuenow'),
                                    hasError: !!errorMsg,
                                    errorText: errorMsg?.textContent,
                                    hasReport: !!reportContent,
                                    reportLength: reportContent?.textContent?.length || 0
                                });
                            `,
                returnByValue: true,
              },
            })
          );
        }, 2000);

        // 30秒超时
        setTimeout(() => {
          if (!reportGenerated) {
            clearInterval(checkInterval);
            completeStep("failed", "报告生成超时 (30秒)");
            takeScreenshot(ws, messageId++, "./test-failed-timeout.png");
            setTimeout(() => {
              printSummary();
              process.exit(1);
            }, 2000);
          }
        }, 30000);
      } else {
        completeStep("failed", "表单未找到");
        takeScreenshot(ws, messageId++, "./test-failed-no-form.png");
        setTimeout(() => process.exit(1), 2000);
      }
    }

    // 进度检查结果
    if (
      response.result &&
      typeof response.result.value === "string" &&
      response.result.value.includes("hasProgress")
    ) {
      try {
        const status = JSON.parse(response.result.value);

        if (status.hasError) {
          clearInterval(checkInterval);
          completeStep("failed", `错误: ${status.errorText}`);
          takeScreenshot(ws, messageId++, "./test-failed-error.png");
          setTimeout(() => {
            printSummary();
            process.exit(1);
          }, 2000);
        }

        if (status.hasReport && status.reportLength > 100 && !reportGenerated) {
          reportGenerated = true;
          completeStep("success", `报告已生成 (${status.reportLength} 字符)`);

          // 最终截图
          addStep("截图：报告生成完成");
          takeScreenshot(ws, messageId++, "./test-success-report.png", () => {
            completeStep();

            console.log("\n" + "━".repeat(60));
            console.log("🎉 测试完成！");
            printSummary();

            ws.close();
            setTimeout(() => process.exit(0), 1000);
          });
        } else if (status.hasProgress) {
          process.stdout.write(`\r      📊 进度: ${status.progressValue || "?"}%  `);
        }
      } catch (e) {
        // 忽略解析错误
      }
    }

    // Console 消息监控
    if (response.method === "Console.messageAdded") {
      const msg = response.params.message;
      if (msg.level === "error") {
        console.log(`\n      ⚠️  Console Error: ${msg.text}`);
      }
    }

    // Runtime 异常
    if (response.method === "Runtime.exceptionThrown") {
      console.log(`\n      ⚠️  Exception: ${response.params.exceptionDetails.text}`);
    }
  });

  ws.on("error", (error) => {
    console.error(`\n❌ WebSocket 错误: ${error.message}`);
    process.exit(1);
  });

  function takeScreenshot(ws, id, filename, callback) {
    ws.send(
      JSON.stringify({
        id: id,
        method: "Page.captureScreenshot",
        params: { format: "png" },
      })
    );

    const handler = (data) => {
      const response = JSON.parse(data);
      if (response.id === id && response.result && response.result.data) {
        const buffer = Buffer.from(response.result.data, "base64");
        fs.writeFileSync(filename, buffer);
        console.log(`      📸 截图已保存: ${filename}`);
        ws.off("message", handler);
        if (callback) callback();
      }
    };

    ws.on("message", handler);
  }

  function printSummary() {
    console.log("\n" + "━".repeat(60));
    console.log("📊 测试总结");
    console.log("━".repeat(60));

    const passed = testSteps.filter((s) => s.status === "success").length;
    const failed = testSteps.filter((s) => s.status === "failed").length;
    const total = testSteps.length;
    const totalTime = testSteps.reduce((sum, s) => sum + (s.duration || 0), 0);

    console.log(`   通过: ${passed}/${total}`);
    console.log(`   失败: ${failed}/${total}`);
    console.log(`   总耗时: ${totalTime}ms`);
    console.log("━".repeat(60) + "\n");

    if (failed === 0) {
      console.log("✅ 所有测试通过！");
    } else {
      console.log("❌ 部分测试失败，请查看截图");
    }
  }
}
