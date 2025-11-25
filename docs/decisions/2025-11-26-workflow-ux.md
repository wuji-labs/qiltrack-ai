# 2025-11-26 工作流程 UX 精简与状态联动

## 背景
- 首页“工作流程”区块为静态文案，步骤卡同时展示“同步中/已完成”徽章，缺少与真实生成状态的联动，用户直觉混乱。
- 真实进度仅存在于 ReportGeneratorSection + useProgress hook（以进度条和 skeleton 展示），存在双轨状态源。
- 文案 key 已有：workflow.status.* 和 generator.progress.*；现有 4 步故事线（workflow.step1-4）只是展示性说明。

## 设计目标
- 聚焦 3 个顶层状态：idle（等待输入）、running（同步/生成中）、done（报告可复制/导出）。
- 统一状态源：Workflow 区块与 ReportGenerator 使用同一 useProgress 状态，避免重复文案/徽章。
- 保留 4 步故事线，但仅标注“进行中/已完成”高亮，移除无意义的双状态 pill。
- 降噪：移除“同步数据/生成中”“报告已完成，可复制/导出”在同一卡片的重复展示，减少无效小模组。

## 范围与非目标
- 范围：Workflow 区块文案/布局调整；提取 useProgress 至更高层（page）并向下传递；复用现有翻译 key。
- 非目标：不改后端 API、不改生成逻辑、不新增订阅/配额逻辑、不改 Report 内容结构。

## 技术约束
- Next.js App Router + TS + React 19，Tailwind v4 token 体系保持。
- 复用现有翻译 key（workflow.status.*, workflow.step.status.*, generator.progress.*），避免新增文案；若必须新增需补全各语言。
- useProgress 仍控制自动重置（FINISH_HOLD），Workflow 区块显示需容忍该节奏。
- 保持 ProgressBar 组件接口不破坏；如需新增 props 需兼容原有调用。

## 方案概述
1) 状态提升：在 app/page.tsx 引入 useProgress，start/complete/fail/reset 下传至 ReportGeneratorSection；同时传递 progress 数值与 currentStep。ReportGeneratorSection 内不再独立创建 hook，直接使用传入的控制函数；其内部调用 start/complete/fail 时驱动全局状态。
2) Workflow 区块联动：
   - 顶部状态卡使用 progress.status 判定：idle -> workflow.status.idle；running -> workflow.status.syncing；done -> workflow.status.ready；步号用 workflow.status.step（pad 2）。
   - 步骤列表使用 workflow.step.status.running/done 标记 active/completed，其余保持默认样式；移除卡片内“同步中/报告完成”双徽章。
3) 展示收敛：保留 4 步故事线（workflow.step1-4 badge/title/detail），去除无关 pill/标签，避免重复“等待输入/生成中/完成”提示。
4) 回退处理：若 progress 为 0 且 status idle，Workflow 区块显示初始提示；complete 后在 FINISH_HOLD 期间仍显示 ready，重置后回到 idle；fail 时回到 idle 并可选展示 error 文案（复用 Report 区块 error）。

## 文案 key（复用）
- 状态条：workflow.status.idle / workflow.status.syncing / workflow.status.ready / workflow.status.step
- 步骤状态：workflow.step.status.running / workflow.step.status.done
- 故事线：workflow.step1-4（badge/title/detail）
- 进度标签：generator.progress.*（已有 stage1-8 与 ready/fetching/shaping/llm）用于进度条文本，避免新增。

## 验收与测试
- 手动：
  1) 初始进入：ProgressBar 隐藏或 0，Workflow 顶卡显示 idle 文案；步骤无 active 高亮。
  2) 输入有效 ticker 并生成：状态切为 syncing，ProgressBar 与 Workflow 同步；步骤高亮当前/已完成；列表不再出现双徽章。
  3) 生成完成：状态切为 ready，显示“报告已完成，可复制/导出”，按钮可用；FINISH_HOLD 后回到 idle。
  4) 错误场景：非法 ticker 或 quota/unauthorized 时状态回 idle，不残留 running 标签。
- 自动：`npm run lint`，`npm test`（Vitest）。

## 风险与缓解
- 进度重置时机与 UI 状态不同步：遵循 useProgress 现有 FINISH_HOLD，避免额外计时；必要时在 Workflow 中容忍短暂 ready 态。
- i18n 覆盖风险：严格复用现有 key，若新增需补全所有语言。
- 组件耦合：提升 useProgress 可能影响其他潜在调用者；确认当前仅 ReportGenerator 使用。
