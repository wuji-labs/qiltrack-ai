# Implementation Checklist: 前端现代极简改版

> **项目**: qiltrack-ai 前端全面改版
> **负责人**: G3-Claude
> **分支**: `feature/redesign-modern-minimal`
> **参考**: `docs/decisions/2025-12-10-frontend-redesign-modern-minimal.md`

---

## ✅ 准备工作

- [ ] 创建 worktree: `.\scripts\worktree-manager.ps1 -Action Create -Group g3 -Branch feature/redesign-modern-minimal`
- [ ] 切换到 g3 工作区: `cd D:\Projects\qiltrack-ai-g3`
- [ ] 创建并切换分支: `git checkout -b feature/redesign-modern-minimal`
- [ ] 确认依赖安装: `npm install` (在总部执行)

---

## 🎨 Phase 1: 基础设施 (2-3h)

### 1.1 CSS Tokens 定义
- [ ] 创建 `app/styles/tokens.css`
  - [ ] 浅色模式配色变量
  - [ ] 深色模式配色变量 (可选)
  - [ ] 圆角系统
  - [ ] 间距系统
  - [ ] 阴影系统

### 1.2 全局样式更新
- [ ] 更新 `app/globals.css`
  - [ ] 引入 `tokens.css`
  - [ ] 移除旧的 CSS 变量
  - [ ] 移除不必要的 @keyframes
  - [ ] 保留必要的基础动画 (fade-in, slide-in-up, spin)
  - [ ] 添加 `prefers-reduced-motion` 支持

### 1.3 组件目录结构
- [ ] 创建 `app/components/ui/` 目录
- [ ] 创建 `app/components/ui/index.ts` (统一导出)

**验证**:
```bash
npm run lint
npm run dev  # 确认页面能正常加载
```

---

## 🧩 Phase 2: 核心 UI 组件 (4-5h)

### 2.1 Button 组件
- [ ] 创建 `app/components/ui/Button.tsx`
  - [ ] Primary variant
  - [ ] Secondary variant
  - [ ] Ghost variant
  - [ ] 加载态
  - [ ] 禁用态
  - [ ] 尺寸变体 (sm, md, lg)

### 2.2 Input 组件
- [ ] 创建 `app/components/ui/Input.tsx`
  - [ ] 基础输入框
  - [ ] Textarea
  - [ ] 聚焦态样式
  - [ ] 错误态样式
  - [ ] Label 集成

### 2.3 Card 组件
- [ ] 创建 `app/components/ui/Card.tsx`
  - [ ] 基础卡片
  - [ ] 悬停效果
  - [ ] 高亮变体
  - [ ] 内间距变体

### 2.4 Select 组件
- [ ] 创建 `app/components/ui/Select.tsx`
  - [ ] 下拉选择器
  - [ ] 选项列表
  - [ ] 搜索功能 (可选)

### 2.5 Badge 组件
- [ ] 创建 `app/components/ui/Badge.tsx`
  - [ ] 默认徽章
  - [ ] 语义色变体 (success, warning, error, info)

### 2.6 Progress 组件
- [ ] 更新 `app/components/ProgressBar.tsx`
  - [ ] 使用新的配色
  - [ ] 简化动画

### 2.7 Avatar 组件
- [ ] 创建 `app/components/ui/Avatar.tsx`
  - [ ] 图片头像
  - [ ] 占位符
  - [ ] 尺寸变体

### 2.8 Tabs 组件
- [ ] 创建 `app/components/ui/Tabs.tsx`
  - [ ] 标签页导航
  - [ ] 内容区域
  - [ ] 激活态样式

**验证**:
```bash
# 创建 Storybook 或测试页面展示所有组件
npm run lint
npm run dev
```

---

## 🏗️ Phase 3: 布局改造 (3-4h)

### 3.1 导航栏
- [ ] 更新 `app/sections/HeroSection.tsx`
  - [ ] 白色背景
  - [ ] 底部边框分割
  - [ ] 移除毛玻璃效果
  - [ ] 优化移动端菜单

### 3.2 根布局
- [ ] 更新 `app/layout.tsx`
  - [ ] 引入新的全局样式
  - [ ] 确认主题切换逻辑 (如实现)

### 3.3 首页
- [ ] 更新 `app/page.tsx`
  - [ ] 使用新的 Section 组件
  - [ ] 移除背景网格
  - [ ] 增加留白

### 3.4 账户页面布局
- [ ] 更新 `app/account/layout.tsx`
  - [ ] 左侧边栏导航
  - [ ] 使用 Tabs 组件

### 3.5 管理后台布局
- [ ] 更新 `app/admin/layout.tsx`
  - [ ] 侧边栏优化
  - [ ] 使用新的卡片组件

**验证**:
```bash
npm run dev
# 浏览器访问: localhost:3000, /account, /admin
```

---

## 📦 Phase 4: 业务组件 (5-6h)

### 4.1 报告生成器
- [ ] 更新 `app/components/report-generator/ReportForm.tsx`
  - [ ] 使用新的 Input 组件
  - [ ] 使用新的 Select 组件
  - [ ] 使用新的 Button 组件
  - [ ] 表单布局优化

- [ ] 更新 `app/components/report-generator/ReportResult.tsx`
  - [ ] 使用新的 Card 组件
  - [ ] 内容排版优化

- [ ] 更新 `app/components/report-generator/ExportButtons.tsx`
  - [ ] 使用新的 Button 组件

- [ ] 更新 `app/components/report-generator/CreditsDisplay.tsx`
  - [ ] 使用新的 Badge 组件

- [ ] 更新 `app/components/report-generator/ErrorAlert.tsx`
  - [ ] 使用新的配色

### 4.2 图表组件
- [ ] 更新 `app/components/ReportCharts.tsx`
  - [ ] 统一配色为蓝色系
  - [ ] 去除渐变
  - [ ] 优化图例

### 4.3 定价卡片
- [ ] 更新 `app/components/PricingCards.tsx`
  - [ ] 使用新的 Card 组件
  - [ ] 使用新的 Button 组件
  - [ ] 高亮推荐方案

### 4.4 管理后台仪表板
- [ ] 更新 `app/components/admin/MetricsDashboard.tsx`
  - [ ] 使用新的 Card 组件
  - [ ] 统一配色

- [ ] 更新 `app/components/admin/CacheMonitor.tsx`
  - [ ] 使用新的 Card 组件

- [ ] 更新 `app/components/admin/QueueMonitoring.tsx`
  - [ ] 使用新的 Card 组件

### 4.5 账户页面组件
- [ ] 更新 `app/account/sections/ProfileSection.tsx`
  - [ ] 使用新的 Input 组件
  - [ ] 使用新的 Avatar 组件

- [ ] 更新 `app/account/sections/SecuritySection.tsx`
  - [ ] 使用新的 Button 组件

- [ ] 更新 `app/account/sections/MembershipSection.tsx`
  - [ ] 使用新的 Card 组件
  - [ ] 使用新的 Badge 组件

**验证**:
```bash
npm run lint
npm run test  # 如有测试
npm run dev
# 完整功能测试: 报告生成、导出、支付等
```

---

## 🎬 Phase 5: 动画优化 (1-2h)

- [ ] 审查并移除不必要的 @keyframes
  - [ ] `glow-pulse`
  - [ ] `gradient-shift`
  - [ ] `sheen-move`
  - [ ] `spark-move`
  - [ ] `stack-bounce`
  - [ ] `marquee-float`

- [ ] 优化保留动画的时长和缓动函数
  - [ ] `fade-in`: 200ms ease-out
  - [ ] `slide-in-up`: 250ms cubic-bezier(0.4, 0, 0.2, 1)
  - [ ] `spin`: 1s linear infinite

- [ ] 添加 `prefers-reduced-motion` 支持
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

- [ ] 运行 Lighthouse 测试
  - [ ] Performance > 90
  - [ ] Accessibility > 95

**验证**:
```bash
# Chrome DevTools -> Lighthouse
npm run dev
```

---

## 📱 Phase 6: 响应式适配 (2-3h)

### 6.1 移动端 (375px - 768px)
- [ ] 导航栏适配
- [ ] 报告生成器适配 (表单全宽)
- [ ] 账户页面适配 (侧边栏收起)
- [ ] 管理后台适配 (侧边栏收起)
- [ ] 图表适配 (响应式宽度)

### 6.2 平板端 (768px - 1024px)
- [ ] 栅格布局调整 (2 列)
- [ ] 导航栏优化
- [ ] 卡片宽度适配

### 6.3 桌面端 (> 1024px)
- [ ] 栅格布局 (3 列)
- [ ] 最大宽度限制 (1280px)
- [ ] 大屏适配 (> 1440px)

**验证**:
```bash
npm run dev
# Chrome DevTools -> Device Toolbar
# 测试设备: iPhone SE, iPad, Desktop 1920x1080
```

---

## 🧪 Phase 7: 测试与修复 (2-3h)

### 7.1 视觉回归测试
- [ ] 首页完整截图对比
- [ ] 报告生成器截图对比
- [ ] 账户页面截图对比
- [ ] 管理后台截图对比

### 7.2 无障碍测试 (WCAG AA)
- [ ] 使用 axe DevTools 扫描
- [ ] 键盘导航测试
- [ ] 对比度测试 (4.5:1 文本, 3:1 UI)
- [ ] 屏幕阅读器测试 (NVDA/JAWS)

### 7.3 浏览器兼容性
- [ ] Chrome 最新版
- [ ] Firefox 最新版
- [ ] Safari 15+
- [ ] Edge 最新版

### 7.4 功能测试
- [ ] 用户登录/登出
- [ ] 报告生成流程
- [ ] 报告导出 (PDF/Word/Markdown)
- [ ] 支付流程 (Stripe)
- [ ] 管理后台操作
- [ ] 账户设置修改

### 7.5 性能测试
- [ ] Lighthouse Performance > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Total Blocking Time < 200ms

**验证**:
```bash
npm run lint
npm run test
npm run build  # 确认无构建错误
```

---

## 🚀 Phase 8: 提交与合并

### 8.1 代码提交
- [ ] 清理调试代码
- [ ] 整理 Git 提交历史 (可选 squash)
- [ ] 提交信息规范

```bash
git add .
git commit -m "feat: 前端全面改版为现代极简风格

- 全新配色系统 (浅色主题 + 深色主题)
- 重构所有核心 UI 组件
- 优化布局和响应式设计
- 简化动画效果，提升性能
- 符合 WCAG AA 无障碍标准

BREAKING CHANGE: 旧的样式类 (.glass-card, .frosted-bar) 已移除
"
```

### 8.2 创建 Pull Request
```bash
git push origin feature/redesign-modern-minimal
gh pr create --title "feat: 前端全面改版 - 现代极简风格" --body "$(cat <<'EOF'
## 📋 Summary
完整重构前端视觉系统，从深色毛玻璃风格升级为现代极简风格。

## 🎨 改动范围
- ✅ 配色系统 (浅色 + 深色主题)
- ✅ 核心 UI 组件 (Button, Input, Card, Badge, Select, Tabs, Avatar)
- ✅ 布局结构 (导航栏、首页、账户页、管理后台)
- ✅ 业务组件 (报告生成器、图表、定价卡片)
- ✅ 动画优化 (移除不必要动画，性能提升)
- ✅ 响应式适配 (移动端、平板、桌面)

## ✅ 验收清单
- [x] Lint 通过: \`npm run lint\`
- [x] 测试通过: \`npm run test\`
- [x] 构建成功: \`npm run build\`
- [x] Lighthouse Performance > 90
- [x] WCAG AA 无障碍标准
- [x] 所有现有功能正常工作

## 📸 截图
(待添加)

## 🔗 相关文档
- Architecture Snapshot: \`docs/decisions/2025-12-10-frontend-redesign-modern-minimal.md\`
- Implementation Checklist: \`docs/plans/g3-frontend-redesign-checklist.md\`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 8.3 Code Review
- [ ] 等待 Codex/HQ 审查
- [ ] 根据反馈修改
- [ ] 最终审批通过

### 8.4 合并与发布
- [ ] 合并 PR 到 main
- [ ] 删除 feature 分支
- [ ] 清理 worktree: `.\scripts\worktree-manager.ps1 -Action Remove -Group g3`

---

## 📊 进度追踪

| Phase | 状态 | 预估工时 | 实际工时 | 完成日期 |
|-------|------|---------|---------|---------|
| Phase 1: 基础设施 | ⏳ 待开始 | 2-3h | - | - |
| Phase 2: 核心组件 | ⏳ 待开始 | 4-5h | - | - |
| Phase 3: 布局改造 | ⏳ 待开始 | 3-4h | - | - |
| Phase 4: 业务组件 | ⏳ 待开始 | 5-6h | - | - |
| Phase 5: 动画优化 | ⏳ 待开始 | 1-2h | - | - |
| Phase 6: 响应式 | ⏳ 待开始 | 2-3h | - | - |
| Phase 7: 测试修复 | ⏳ 待开始 | 2-3h | - | - |
| Phase 8: 提交合并 | ⏳ 待开始 | 1h | - | - |
| **总计** | **0%** | **20-27h** | **0h** | **-** |

---

## 🔄 日志

### 2025-12-10
- ✅ 创建 Architecture Snapshot
- ✅ 创建 Implementation Checklist
- ⏳ 等待老板批准启动

---

**最后更新**: 2025-12-10
**负责人**: G3-Claude
**状态**: 待审批 ✋
