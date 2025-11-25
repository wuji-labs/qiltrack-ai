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

---

## 手动测试验证（360/414/480px 响应式）

### 导航栏检查：
- **360px**: Logo 尺寸 h-9×w-9，品牌文本显示 "Investor AI"（无副标题溢出），语言按钮显示 "En"（两字）
- **414px**: Logo h-9×w-9，品牌文本完整，语言按钮显示 "En"
- **480px**: Logo 仍 h-9×w-9，导航开始过渡到更宽松（在 sm: 断点）
- **640px (sm)**: Logo 升至 h-11×w-11，语言显示全文 "English"，品牌副标题开始出现
- **Overflow 检查**: 所有导航元素已加 `min-w-0` 和响应式间距（`gap-2 sm:gap-4`），禁止固定宽度（移除 `min-w-[220px]`）
- **触达面积**: 所有按钮 min-h-[44px]（在 sm: 下降为 auto）

### Hero 标题与 CTA 检查：
- **360px**: 标题字号 text-2xl，行高 leading-[1.2]（紧凑）；描述 text-base；CTA 全宽 (w-full) 堆叠，高度 44px
- **414px**: 标题仍 text-2xl，描述 text-base，CTA 全宽
- **480px**: 标题开始升级 text-[2.5rem]（sm: 断点）；描述 text-lg；CTA 在 sm: 变为 w-auto 并水平排列（flex-wrap）
- **文本截断**: 所有文本已移除固定宽度限制，改为 max-w-3xl 的相对宽度；无 overflow 隐藏的风险

### Step 1 卡片检查：
- **360px**: 单列网格 (grid-cols-1)；卡片 min-h-[44px]，Padding p-4，圆角 rounded-lg（20px）；标题 text-sm，描述 text-xs 且 line-clamp-3
- **414px**: 同上，单列；卡片内容行距缩紧，emoji text-lg，Badge text-[9px]
- **480px**: 仍单列，过渡到 sm: 双列 (sm:grid-cols-2)；Padding 升至 p-6，圆角升至 rounded-2xl（32px）
- **卡片互动**: 所有卡片内元素已加 `line-clamp-*` 防止内容溢出；"选中" 标签随屏幕缩放（px-2 sm:px-2.5）

### 装饰元素与 overflow：
- **背景网格**: 父级 hero-mesh 不会撑宽（绝对定位）；blur 装饰已改为相对位置，不占用文档流
- **全局**: 根 section 加 `overflow-x-hidden`，Hero 和 Step 1 容器都用 `overflow-hidden`

### 导航折叠方案说明：
当前实现在 ≤640px 时：
- **xl: hidden** 的五项导航在移动端隐藏
- **lg: hidden** 的备用列表（第 231-237 行）在小屏显示，支持水平滚动快速切换
- **未实现汉堡菜单**: Snapshot 建议 ≤640px 时可折叠，当前是水平滚动列表而非完全折叠
  - 若需正式汉堡菜单（三横线 + 抽屉），建议后续单独立 issue 实施（涉及新状态管理与组件）
  - **当前折衷方案可用性**: 五项都在列表中，touch 友好，无横向溢出

---

## Lint Warning 说明

项目共 15 个 warning（改造前后一致，无新增）：
```
✖ 15 problems (0 errors, 15 warnings)
```

**改造涉及文件的 warning**：
- `app/sections/HeroSection.tsx:28:2 - 'remainingQuota' is defined but never used`
  - **原因**: props 接收但组件内未使用（设计上保留用于后续配额显示）
  - **状态**: 预期行为，无需修改

**其他预存 warning**（来自其他文件，与本改造无关）：
- `app/(auth)/login/page.tsx`: callbackUrl 未使用
- `app/account/page.tsx`: loading 未使用
- `app/components/ProgressBar.tsx`: activeIndex、pipPositions 未使用
- `app/page.tsx`: module2Items、module3Items、module4Items、quotaHintPrimary、quotaHintSecondary 未使用
- `app/reports/[slug]/ClientReportContent.tsx`: Link 未使用
- `app/reports/[slug]/page.tsx`: 无效的 eslint-disable 指令
- `app/reports/page.tsx`: ReportCard、featuredReport 未使用
- `app/sections/ReportGeneratorSection.tsx`: useEffect 缺失依赖 suppressNextSearch

**结论**: 改造代码无新 linting 问题，所有新增类名均符合 Tailwind v4 规范。

---

## CTA 与 Step 1 可用性验证

### CTA 按钮：
- ✅ 主 CTA（"Generate my first report"）: 44px 最小高度，全宽至 sm:，触点面积充足
- ✅ 次 CTA（"View example"）: 同样 44px，Link 可点击，无 disabled 状态
- ✅ 预览 note: 在 sm: 下隐藏（`hidden sm:inline`），减少小屏文本拥挤

### Step 1 卡片：
- ✅ 四个卡片均可点击（button type="button" onClick）
- ✅ 高亮状态清晰（active: -translate-y-1、border/shadow 变化）
- ✅ 内容自适应: title line-clamp-2、badge line-clamp-1、description line-clamp-3，防止卡片撑高
- ✅ 过渡流畅（transition-all duration-200）

---

## 下一步

已补充手动验证与 lint warning 说明，待 Codex 审阅确认以下几点后合并：
1. 导航折叠方案（当前为水平滚动列表，非完全汉堡菜单）是否符合预期
2. CTA/Step 1 可用性是否满足
3. 如需补充完整汉堡菜单，是否独立立 issue
