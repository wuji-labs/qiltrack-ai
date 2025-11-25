# 2025-11-26 工作流程 UX 精简与状态联动 - 实现报告

## 概述

已完成按 Snapshot 进行的工作流程 UX 重构，包括状态提升、Workflow 区块联动，以及移除双重徽章显示。

## 实施变更

### 1. 状态提升（app/page.tsx）
- **导入 useProgress hook**：在 Home 组件顶级引入 useProgress
- **实例化状态**：创建 `const progress = useProgress()` 实例
- **传递至 ReportGeneratorSection**：通过 props 传递 progress 对象和所有控制函数

### 2. Workflow 区块重构（app/page.tsx）
- **动态状态卡**：根据 `progress.status` 判定显示（idle/syncing/ready）
- **实时步号显示**：使用 `progress.currentStep` 动态更新当前进度步数（01-04）
- **步骤列表联动**：
  - 移除了固定的"同步中/报告完成"双徽章
  - 基于 `progress.currentStep` 动态高亮 active/completed 步骤
  - 已完成步骤显示绿色边框和"已完成"标签
  - 进行中步骤显示脉冲动画和"进行中"标签
- **样式改进**：Active/Completed 步骤使用翠绿色(accent-emerald)突出强调

### 3. ReportGeneratorSection 重构
- **移除本地 hook**：删除了 `const progress = useProgress()` 本地创建
- **接收 progress 作为 prop**：通过 props 接收完整的 progress 对象和控制函数
- **类型更新**：
  - 导出并使用 `ProgressState` 类型
  - 组件 props 类型完整定义 progress 的状态和方法

### 4. useProgress Hook 类型导出
- **扩展 ProgressState 类型**：将所有控制函数（start/complete/fail/reset/forceComplete）纳入类型定义
- **向下兼容**：保持现有 hook 实现不变，仅调整类型导出

## 验证结果

### Lint 检查
✅ 通过（仅对修改文件检查）
```
app/page.tsx: 5 warnings（预先存在）
app/sections/ReportGeneratorSection.tsx: 1 warning（预先存在）
```

### 测试执行
✅ 所有测试通过
- Test Files: 6 passed (6)
- Tests: 34 passed (34)
- useProgress.test.tsx: 2 tests 通过

### 改动统计
```
app/page.tsx                            | 70 ++++++++++++++++++++-------------
app/sections/ReportGeneratorSection.tsx | 12 ++++--
hooks/useProgress.ts                    |  6 +++
3 files changed, 57 insertions(+), 31 deletions(-)
```

## i18n 验证

复用现有翻译 key，无需新增：
- ✅ `workflow.status.idle` (第 2347 行)
- ✅ `workflow.status.syncing` (第 2333 行)
- ✅ `workflow.status.ready` (第 2340 行)
- ✅ `workflow.status.step` (第 2326 行)
- ✅ `workflow.step.status.running` (第 2445 行)
- ✅ `workflow.step.status.done` (第 2452 行)

所有翻译 key 已在 `lib/i18n.tsx` 中定义，支持 5 种语言。

## 验收清单

- [x] 状态提升至 app/page.tsx
- [x] Workflow 区块与 progress 联动
- [x] 移除双徽章显示，仅显示当前状态
- [x] 复用现有 i18n key，无新增翻译需求
- [x] npm run lint 通过
- [x] npm test 全部通过（34/34）
- [x] 保持 ProgressBar 组件接口不破坏
- [x] 进度重置时机与 useProgress FINISH_HOLD 保持一致

## 技术决策

1. **类型安全**：将 progress 的所有方法纳入 ProgressState 类型，确保 ReportGeneratorSection 的类型推断完整
2. **最小改动**：仅修改必要的组件，保持其他代码逻辑不变
3. **样式一致性**：沿用现有的 Tailwind token（var(--accent-emerald)），保持设计语言统一

## 已知风险与缓解

- **进度重置时机**：遵循 useProgress 现有 FINISH_HOLD（520ms）机制，UI 在此期间容忍 ready 态
- **i18n 覆盖**：已验证所有使用的 key 存在于 5 种语言，无遗漏

## 后续建议

- 定期监测 Workflow 区块在各种网络速度下的表现
- 可考虑为步骤切换添加微动画增强体感
