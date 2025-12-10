# G4 组内计划：前端风格重构

> **任务 ID**：WS-REDESIGN
> **工作组**：G4
> **Worktree**：`D:\Projects\qiltrack-ai-g4`
> **分支**：`g4/develop`（固定工作分支）
> **负责人**：HQ (Codex 角色)
> **执行者**：G4-Claude
> **创建时间**：2025-12-10
> **截止时间**：2025-12-31

---

## 1. 任务概述

**来源**：老板需求 - "我的前端想完整换一套风格"

**目标**：将 Qiltrack AI 前端从当前的"暗色玻璃态"风格重构为"**高端奢华浅色极简风**"，提升品牌高端感和用户体验。

**核心架构文档**：
- Architecture Snapshot: `docs/decisions/2025-12-10-frontend-style-redesign.md`
- 前端探索报告: `docs/reports/2025-12-10-frontend-exploration.md`（由 Explore 代理生成）

**关键决策**：
- ✅ 视觉风格：Apple/Tesla 极简主义（Less is More）
- ✅ 主色调：中性灰蓝 Slate (#64748b)
- ✅ 主题策略：浅色为主 + 深色可选（next-themes）
- ✅ 组件库：引入 shadcn/ui (Radix UI + Tailwind)
- ✅ 字体：自托管 Inter
- ✅ 图标：统一 Lucide React

---

## 2. 实施阶段（5 Phases）

### Phase 1: 基础设施搭建 (Week 1)

**目标**：建立 Design Token 体系，集成核心依赖

**子任务清单**：
- [ ] **P1.1** 确认当前在 `g4/develop` 分支，同步最新代码
- [ ] **P1.2** 创建 `tailwind.config.ts`（迁移 PostCSS 配置）
- [ ] **P1.3** 重构 `app/globals.css`：
  - [ ] 拆分为 `base.css` (CSS 变量 + reset)
  - [ ] 拆分为 `components.css` (复用组件样式)
  - [ ] 拆分为 `utilities.css` (工具类)
  - [ ] 定义完整 Design Tokens（色彩/字体/间距/圆角/阴影）
- [ ] **P1.4** 安装并配置 shadcn/ui：
  ```bash
  npx shadcn@latest init
  # 选择：New York 风格, Slate 色调, CSS variables
  ```
- [ ] **P1.5** 集成 next-themes：
  ```bash
  npm install next-themes
  ```
  - [ ] 创建 `app/providers.tsx`（ThemeProvider）
  - [ ] 更新 `app/layout.tsx`（包裹 Providers）
- [ ] **P1.6** 自托管 Inter 字体：
  ```typescript
  import { Inter } from 'next/font/google'
  ```
- [ ] **P1.7** 统一 Lucide React 图标（创建 `lib/icons.ts` 导出常用图标）
- [ ] **P1.8** 安装第一批 shadcn 组件：
  ```bash
  npx shadcn@latest add button card input label select dialog badge avatar skeleton
  ```

**验收标准**：
- [ ] Tailwind 配置正确，`npm run dev` 无报错
- [ ] CSS 变量在浅/深色主题下正确切换
- [ ] next-themes 主题切换无闪烁
- [ ] Inter 字体正常加载（无 FOIT）
- [ ] shadcn 组件可导入使用

**CAVR 输出位置**：`docs/reports/2025-12-10-g4-phase1-cavr.md`

---

### Phase 2: 核心组件迁移 (Week 2-3)

**目标**：将自建组件替换为 shadcn 组件

**子任务清单**：
- [ ] **P2.1** 迁移按钮组件：
  - [ ] 替换 `.btn-gradient` → shadcn Button `variant="solid"`
  - [ ] 替换 `.btn-ghost` → shadcn Button `variant="ghost"`
  - [ ] 更新所有使用按钮的组件
- [ ] **P2.2** 迁移卡片组件：
  - [ ] 替换 `.glass-card` → shadcn Card + 自定义样式
  - [ ] 更新 `StatCard` 使用 shadcn Card
- [ ] **P2.3** 迁移表单组件：
  - [ ] 替换 `<input>` → shadcn Input
  - [ ] 替换 `<select>` → shadcn Select
  - [ ] 添加 shadcn Label
- [ ] **P2.4** 迁移对话框：
  - [ ] 替换 `Modal` → shadcn Dialog
  - [ ] 更新 `ReuseDialog.tsx`
- [ ] **P2.5** 迁移状态组件：
  - [ ] 替换 `StatusBadge` → shadcn Badge
  - [ ] 更新 `LoadingState` 使用 shadcn Skeleton
- [ ] **P2.6** 创建自定义复合组件：
  - [ ] `StatCard` (基于 shadcn Card)
  - [ ] `DataTable` (基于 shadcn Table + pagination)
  - [ ] `ThemeToggle` (Sun/Moon 图标切换)

**验收标准**：
- [ ] 所有核心组件使用 shadcn 或基于 shadcn 构建
- [ ] 无遗留 `app/components/admin/ui/index.tsx` 的旧组件
- [ ] 样式一致性（符合 Design Tokens）
- [ ] Lint 通过，无 TypeScript 错误

**CAVR 输出位置**：`docs/reports/2025-12-15-g4-phase2-cavr.md`

---

### Phase 3: 页面重构（用户侧）(Week 3-4)

**目标**：重构用户可见页面，应用新风格

**子任务清单**：
- [ ] **P3.1** 主页（Landing + Generator）：
  - [ ] `app/page.tsx`
  - [ ] `app/sections/HeroSection.tsx`（导航 + Hero）
  - [ ] `app/sections/ReportGeneratorSection.tsx`（核心生成器）
  - [ ] `app/sections/ModesSection.tsx`（模式选择器）
  - [ ] `app/sections/WhySection.tsx`（价值主张）
  - [ ] `app/sections/FooterSection.tsx`（页脚）
- [ ] **P3.2** 定价页：
  - [ ] `app/pricing/page.tsx`
  - [ ] `app/components/PricingCards.tsx`（使用 shadcn Card）
- [ ] **P3.3** 报告中心：
  - [ ] `app/reports/page.tsx`（列表页）
  - [ ] `app/reports/[slug]/page.tsx`（详情页）
  - [ ] `app/components/ReportCharts.tsx`（图表样式更新）
- [ ] **P3.4** 用户中心：
  - [ ] `app/account/page.tsx`
  - [ ] `app/account/sections/*`（6 个 Section 组件）
  - [ ] `app/account/history/page.tsx`
  - [ ] `app/account/change-password/page.tsx`
- [ ] **P3.5** 登录/注册：
  - [ ] `app/(auth)/login/page.tsx`
  - [ ] `app/components/GoogleSignInButton.tsx`
  - [ ] `app/components/GoogleOneTap.tsx`

**验收标准**：
- [ ] 所有页面符合新设计规范（浅色主题 + Slate 色调）
- [ ] 响应式在移动/平板/桌面正常
- [ ] 深浅色主题切换无异常
- [ ] 多语言测试通过（5 种语言）
- [ ] Lighthouse Performance ≥ 85

**CAVR 输出位置**：`docs/reports/2025-12-20-g4-phase3-cavr.md`

---

### Phase 4: 管理后台重构 (Week 4-5)

**目标**：重构管理后台，统一设计系统

**子任务清单**：
- [ ] **P4.1** 仪表盘：
  - [ ] `app/admin/page.tsx`
  - [ ] `app/admin/analytics/page.tsx`
  - [ ] `app/components/admin/MetricsDashboard.tsx`
- [ ] **P4.2** 用户管理：
  - [ ] `app/admin/users/page.tsx`
  - [ ] `app/admin/users/[id]/page.tsx`
  - [ ] DataTable 使用 shadcn Table
- [ ] **P4.3** 订阅管理：
  - [ ] `app/admin/subscriptions/page.tsx`
  - [ ] `app/admin/credits/page.tsx`
- [ ] **P4.4** 系统工具：
  - [ ] `app/admin/system/health/page.tsx`
  - [ ] `app/admin/system/cache/page.tsx`
  - [ ] `app/admin/system/config/page.tsx`
  - [ ] `app/admin/system/audit-logs/page.tsx`
- [ ] **P4.5** 批量操作/导出工具：
  - [ ] `app/admin/tools/batch/page.tsx`
  - [ ] `app/admin/tools/export/page.tsx`

**验收标准**：
- [ ] 管理后台与用户侧风格一致
- [ ] 表格组件支持排序/分页/筛选
- [ ] 表单验证和错误提示清晰
- [ ] 权限控制正常（Supabase Auth）

**CAVR 输出位置**：`docs/reports/2025-12-25-g4-phase4-cavr.md`

---

### Phase 5: 优化与测试 (Week 5-6)

**目标**：全面测试、性能优化、可访问性审计

**子任务清单**：
- [ ] **P5.1** 响应式测试：
  - [ ] 移动端（375px, 414px）
  - [ ] 平板（768px, 1024px）
  - [ ] 桌面（1280px, 1440px, 1920px）
- [ ] **P5.2** 深浅色主题测试：
  - [ ] 所有页面在浅色主题无异常
  - [ ] 所有页面在深色主题无异常
  - [ ] 主题切换无闪烁/布局偏移
- [ ] **P5.3** 可访问性审计：
  - [ ] 运行 axe DevTools 检查
  - [ ] 键盘导航测试（Tab/Shift+Tab/Enter/Esc）
  - [ ] 屏幕阅读器测试（NVDA/VoiceOver）
  - [ ] 色彩对比度验证（WCAG AA）
- [ ] **P5.4** 性能优化：
  - [ ] Lighthouse 审计（目标 Performance ≥ 90）
  - [ ] 优化 LCP/FCP/CLS
  - [ ] 字体加载策略优化
  - [ ] 代码分割检查
- [ ] **P5.5** 多语言测试：
  - [ ] 测试 5 种语言文本显示
  - [ ] 检查文本溢出问题
  - [ ] 验证 RTL 语言（如需支持阿拉伯语）
- [ ] **P5.6** 浏览器兼容性测试：
  - [ ] Chrome/Edge 最新版
  - [ ] Safari 最新版
  - [ ] Firefox 最新版
  - [ ] iOS Safari
  - [ ] Android Chrome

**验收标准**：
- [ ] Lighthouse Performance Score ≥ 90
- [ ] 无 WCAG AA 级别可访问性问题
- [ ] 所有浏览器/设备测试通过
- [ ] 多语言无布局崩溃

**CAVR 输出位置**：`docs/reports/2025-12-31-g4-phase5-cavr.md`

---

## 3. 技术约束

### 3.1 必须保持的功能

✅ **国际化**：5 语言支持不变（en/ja/ko/zh-Hant/zh-Hans）
✅ **认证**：Supabase Auth 集成不变
✅ **报告生成**：核心功能保持
✅ **图表**：Recharts 继续使用
✅ **导出**：PDF/DOCX 功能保持
✅ **监控**：Vercel Analytics + Sentry 保持

### 3.2 禁止的操作

❌ **禁止切换分支**：固定在 `g4/develop` 工作，不创建子分支
❌ **禁止改动其他 worktree**：仅在 `qiltrack-ai-g4` 工作
❌ **禁止删除旧组件**：Phase 1-2 先创建新组件，Phase 3-5 逐步替换
❌ **禁止破坏性重构**：渐进式迁移，保留降级方案

### 3.3 Git 工作流

**分支策略**：
```bash
# 1. 确认在 g4/develop 分支
git status  # 应显示 "On branch g4/develop"

# 2. 每次开始工作前同步最新代码
git pull origin g4/develop

# 3. 提交前确认
git status  # 工作区干净
npm run lint  # Lint 通过
npm run type-check  # 类型检查通过
npm run build  # 构建成功

# 4. 提交到 g4/develop
git add .
git commit -m "feat(phase1): 建立 Design Token 体系和 shadcn 集成"
git push origin g4/develop
```

**提交规范**：
```
feat(phase1): 建立 Design Token 体系和 shadcn 集成
feat(phase2): 迁移按钮和卡片组件到 shadcn
feat(phase3): 重构主页和定价页
fix(theme): 修复深色模式下的色彩对比度问题
```

**PR 策略**：
- 每个 Phase 完成后，从 `g4/develop` 向 `main` 提交 PR
- PR 标题：`[G4] Phase X: 功能描述`
- PR 描述包含完整 CAVR 报告

---

## 4. 质量门槛

### 4.1 每个 Phase 必须通过

- [ ] `npm run lint` 无错误
- [ ] `npm run type-check` 无 TypeScript 错误
- [ ] `npm run build` 构建成功
- [ ] `npm run dev` 本地运行无崩溃
- [ ] 视觉回归：截图对比无重大布局偏移

### 4.2 PR 合并前必须

- [ ] CAVR 报告已完成（写入 `docs/reports/`）
- [ ] 代码审查通过（HQ 审查）
- [ ] 功能测试通过（核心流程无破坏）
- [ ] 无遗留 TODO/FIXME 注释

---

## 5. 风险管理

### 5.1 潜在风险

| 风险                 | 缓解措施                                     |
| -------------------- | -------------------------------------------- |
| 组件迁移工作量超预期 | 优先核心页面，边缘页面可后续优化             |
| 性能回归             | 每个 Phase 跑 Lighthouse，及时发现问题       |
| 深色模式 Bug         | 每次提交前测试深浅色主题切换                 |
| 多语言布局崩溃       | 使用 `text-wrap: balance` 和合理 max-width   |
| 用户习惯变化         | 保留旧风格 CSS（通过 Feature Flag 控制）     |

### 5.2 降级方案

**Feature Flag 配置**：
```typescript
// lib/feature-flags.ts
export const ENABLE_NEW_DESIGN = process.env.NEXT_PUBLIC_ENABLE_NEW_DESIGN === 'true'
```

**条件渲染**：
```tsx
{ENABLE_NEW_DESIGN ? <NewButton /> : <LegacyButton />}
```

**回滚策略**：
- 保留旧组件在 `components/legacy/`
- 保留旧 CSS 在 `app/globals-legacy.css`
- 环境变量快速切换新旧风格

---

## 6. 沟通与汇报

### 6.1 进度汇报频率

**每完成一个 Phase**：
- 更新 `docs/plans/workstreams.md` 的 Progress 列
- 输出 CAVR 报告到 `docs/reports/`
- 向 HQ 汇报（三行简讯）

**阻塞时立即汇报**：
- 技术难题（如 CSS 变量不生效）
- 设计决策疑问（如色彩对比度不达标）
- 功能冲突（如新组件破坏旧功能）

### 6.2 汇报模板

```
@HQ
Report: docs/reports/2025-12-15-g4-phase2-cavr.md
Status: Phase 2 完成，已迁移所有核心组件到 shadcn，lint/test 通过
Next: 请审查 Phase 2 代码并批准进入 Phase 3
```

---

## 7. 参考文档

### 7.1 项目文档

- **协作手册**：`CODEX_CLAUDE_COLLAB.md`
- **Architecture Snapshot**：`docs/decisions/2025-12-10-frontend-style-redesign.md`
- **前端探索报告**：`docs/reports/2025-12-10-frontend-exploration.md`
- **Worktree 指南**：`docs/guides/worktree-multi-team.md`

### 7.2 外部资源

- **shadcn/ui 文档**：https://ui.shadcn.com
- **Tailwind CSS v4 文档**：https://tailwindcss.com/docs/v4-beta
- **next-themes 文档**：https://github.com/pacocoursey/next-themes
- **Radix UI 文档**：https://www.radix-ui.com
- **Lucide Icons**：https://lucide.dev
- **WCAG 2.1 指南**：https://www.w3.org/WAI/WCAG21/quickref/

---

## 8. 成功标准

### 8.1 功能层面

- [ ] 所有现有功能正常（无功能回归）
- [ ] 新组件库完整集成（shadcn/ui）
- [ ] 深浅色主题无缝切换
- [ ] 5 语言正常显示

### 8.2 设计层面

- [ ] 所有页面符合新设计规范
- [ ] 色彩系统一致（Slate 主色调）
- [ ] 排版清晰（Inter 字体，合理行高）
- [ ] 留白舒适（符合极简美学）

### 8.3 技术层面

- [ ] Lighthouse Performance ≥ 90
- [ ] WCAG AA 级别无重大问题
- [ ] 代码质量（无 Lint/TS 错误）
- [ ] 可维护性（模块化 CSS，组件化）

### 8.4 交付层面

- [ ] 所有 CAVR 报告已产出
- [ ] PR 已提交并合并到 `g4/develop`
- [ ] 文档已更新（README/CHANGELOG）
- [ ] 老板审批通过

---

## 9. 时间节点

| Milestone          | 目标日期   | 产出物                                    |
| ------------------ | ---------- | ----------------------------------------- |
| Phase 1 完成       | 2025-12-13 | 基础设施 + shadcn 集成                    |
| Phase 2 完成       | 2025-12-17 | 核心组件迁移                              |
| Phase 3 完成       | 2025-12-23 | 用户侧页面重构                            |
| Phase 4 完成       | 2025-12-27 | 管理后台重构                              |
| Phase 5 完成       | 2025-12-31 | 全面测试 + 优化                           |
| **最终交付**       | 2025-12-31 | PR 合并，老板验收                         |

---

## 10. 下一步行动

**G4-Claude 立即执行**：

1. **确认环境**：
   ```bash
   git status  # 确认在 g4/develop 分支
   git pull origin g4/develop  # 同步最新代码
   pwd  # 确认在 D:\Projects\qiltrack-ai-g4
   ```

2. **阅读架构文档**：
   - 阅读 `docs/decisions/2025-12-10-frontend-style-redesign.md`
   - 理解 Design Token 体系（色彩/字体/间距）
   - 查看 shadcn/ui 集成步骤

3. **开始 Phase 1.2**：
   - 创建 `tailwind.config.ts`
   - 定义 CSS 变量系统
   - 安装 shadcn/ui

4. **遇到问题时**：
   - 先查阅 Architecture Snapshot
   - 仍有疑问向 HQ 汇报（@HQ + 三行简讯）

---

**文档版本**：v1.0
**最后更新**：2025-12-10
**维护者**：HQ (Codex 角色)
