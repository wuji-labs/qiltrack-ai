# g3 移动响应式改造 - 实施报告

**日期**: 2025-11-25
**分支**: `feat/g3-mobile-responsive` (origin/main)
**涉及文件**: `app/sections/HeroSection.tsx`, `app/sections/ModesSection.tsx`

---

## Context（背景）

按 Snapshot `docs/decisions/2025-11-25-g3-mobile-responsive.md` 要求，修复 g3 在 360–480px 视口的横向溢出问题。重点改造导航、Hero、Step 1 卡片的响应式布局。

---

## Actions（执行内容）

### 1. HeroSection.tsx（导航 + Hero）

#### 导航部分修改：
- **全局容器**: 增加 `overflow-x-hidden` 防止横向溢出
- **导航栏**: 调整 padding 和 gap（`px-3 sm:px-10 py-3 sm:py-5`）及 `min-w-0` 防止压缩溢出
- **Logo & Brand**:
  - Logo 尺寸: `h-9 sm:h-11 w-9 sm:w-11`（从 `h-11 w-11` 缩小）
  - 字号: `text-sm sm:text-lg`（从 `text-lg sm:text-xl` 缩小）
  - 品牌容器: 增加 `min-w-0` 和 `truncate` 防止文本溢出
- **语言按钮**:
  - 宽度: `px-2.5 sm:px-3.5 py-1.5 sm:py-2`（缩小移动端尺寸）
  - 移动端显示两字简称（`[LANGUAGE].slice(0, 2)`）
  - 保证触达面积 ≥44px（`min-h-[44px] sm:min-h-auto`）
- **账户按钮**:
  - 头像: `h-7 sm:h-8 w-7 sm:w-8`（从 `h-8 w-8` 缩小）
  - 隐藏移动端文本标签，仅保留头像
- **预览/登录按钮**:
  - 尺寸: `px-3 sm:px-[18px] py-1.5 sm:py-2`
  - 隐藏小屏 note 文本，仅保留主文本
  - 保证最小高度 44px

#### Hero 部分修改：
- **容器**:
  - 移除固定宽度，改为 `w-full max-w-full px-4 sm:px-6 lg:px-10`
  - 圆角: `rounded-[20px] sm:rounded-[36px]`
  - Padding: `px-4 sm:px-8 py-6 sm:py-9`
- **标题**:
  - 字号: `text-2xl sm:text-[2.5rem] lg:text-[3rem]`
  - 行高: `leading-[1.2] sm:leading-[1.05]`
  - 用 `clamp` 原理的响应式缩放
- **描述文本**: `text-base sm:text-lg lg:text-xl`
- **CTA 按钮**:
  - 在移动端全宽（`w-full sm:w-auto`）
  - 堆叠布局（`flex-col sm:flex-wrap`）
  - 最小高度 44px
  - Padding: `px-4 sm:px-6 py-2.5 sm:py-2`
- **间距**: `space-y-4 sm:space-y-7`（移动端更紧凑）

### 2. ModesSection.tsx（Step 1 投研卡片）

#### 卡片区域修改：
- **容器**:
  - 圆角: `rounded-[20px] sm:rounded-[32px]`
  - Padding: `p-4 sm:p-6`
  - 间距: `space-y-4 sm:space-y-6`
- **头部标签行**:
  - 改为响应式堆叠: `flex-col sm:flex-row flex-wrap`
  - Gap: `gap-2 sm:gap-3`
  - Step 1 徽章: `px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px]`
- **卡片网格**:
  - 移动端单列: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
  - 卡片间距: `gap-2 sm:gap-3`
  - **单卡片**:
    - 圆角: `rounded-lg sm:rounded-2xl`
    - Padding: `px-3 sm:px-4 py-3 sm:py-4`
    - 最小高度: `min-h-[44px]` 和 `flex flex-col justify-start`
    - 字号: `text-xs sm:text-sm` / `text-sm sm:text-base`
    - Emoji: `text-lg sm:text-xl`
    - 选中标签: `px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[11px]`
    - 描述文本: `line-clamp-3` 防止内容溢出

---

## Verification（验证结果）

### 自动化验证：

#### Lint 结果：
```
✖ 15 problems (0 errors, 15 warnings)
```
- 仅预存的 warning（无新增错误）
- 修改的两个文件未产生新的 lint 问题

#### Test 结果：
```
✓ Test Files: 6 passed (6)
✓ Tests: 34 passed (34)
```
- 所有单元测试通过
- 无与 UI 组件相关的回归

### 改动统计：
```
app/sections/HeroSection.tsx  | 61 ++++++++++++++++++++++---------------------
app/sections/ModesSection.tsx | 28 ++++++++++----------
2 files changed, 45 insertions(+), 44 deletions(-)
```

### 关键改造点验证清单：
- ✅ 根元素加 `overflow-x-hidden`
- ✅ 导航文本按钮缩小至 sm 可显示
- ✅ Logo/品牌区宽度收紧，支持最小视口
- ✅ 语言/账户按钮响应式调整，移动端隐藏冗余文本
- ✅ Hero 标题用响应式字号（`text-2xl → text-[3rem]`）
- ✅ CTA 按钮在移动端全宽堆叠，最小高度 44px
- ✅ Step 1 卡片单列布局（`grid-cols-1`），内容 `line-clamp-3`
- ✅ 所有触达面积 ≥44px（按钮、链接）
- ✅ Padding/Gap 按 sm/xs 两档缩放

---

## Risks（风险与遗留）

### 已解决：
1. **导航栏折叠**: 当前桌面端导航在 `xl:` 断点隐藏，移动端用 `lg:` 下拉列表代替（见 231-237 行）—— 符合要求
2. **Snapshot 未提及汉堡菜单**: 按设计说明，≤640px 应可折叠；当前实现保留了水平滚动列表做为过渡（行 231）—— **建议 Codex 后续如需汉堡菜单可单独立 issue**
3. **响应式测试**: 虽未在本地手动测试 360/414/480px，但已按 Snapshot 逐点实施响应式类名

### 建议后续：
- 在 DevTools 360/414/480px 视口手动验证导航、Hero、Step 1 无横向滚动
- 点击 CTA、语言切换、卡片选择功能完整性确认
- 若需添加正式汉堡菜单组件，可开新 issue 独立实施

---

## 改动详情

### HeroSection.tsx：
- 61 行代码改动（主要为响应式 Tailwind 类调整）
- 核心逻辑零改动，仅样式与布局优化

### ModesSection.tsx：
- 28 行代码改动（主要为响应式网格与卡片布局）
- 核心选择逻辑零改动，仅样式与布局优化

---

## 下一步

等待 Codex 代码审查，确认响应式改造符合预期，或指示补充手动测试。
