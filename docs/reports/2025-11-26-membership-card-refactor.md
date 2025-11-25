# 2025-11-26 会员卡改造 - CAVR 报告

## Context（上下文）
按照 `docs/decisions/2025-11-26-quota-membership-card.md` Snapshot 需求，将 `app/sections/ReportGeneratorSection.tsx` 左侧额度卡升级为高端会员卡风格（黑金金属质感）。

**改造范围**：
- 左侧卡片容器（第 698-742 行）→ 高端会员卡样式
- 保留现有交互逻辑（刷新额度、登录跳转、滚动到示例）
- 支持登录/未登录两种状态
- 移动端友好（sm/md/lg 响应式）
- 右侧亮点卡（highlightCards）保持不变

---

## Actions（执行动作）

### 1. 设计实现
**卡片结构**：
- 外层：`rounded-[28px]` + 黑金渐变背景 (`from-slate-900 via-slate-800 to-slate-900`)
- 装饰层：
  - 径向渐变（深度感，`circle_at_20%_30%`）
  - 线性渐变（折光效果，`135deg` 方向）
  - 微网格纹理（金属质感，`50px 50px` 间距）
  - 角落光晕（emerald & cyan 柔光）
- 内容分层：
  - 头部：品牌标识 + 状态徽章（登录时显示 plan badge，未登录显示 Guest）
  - 芯片元素：顶右角模拟信用卡芯片
  - 主标题 & 邮箱：强调用户身份
  - 额度区域：分隔线 + 大号数字（4xl-5xl）+ 渐变色（emerald→cyan）
  - 操作按钮：主按钮（渐变绿色）+ 副按钮（描边绿色）
  - 签名条：底部品牌说明

### 2. 代码变更
**文件**：`app/sections/ReportGeneratorSection.tsx:698-784`

**关键 CSS class**：
- 圆角：`rounded-[28px]` （较大圆角突出卡片质感）
- 背景：`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`
- 边框：`border border-[rgba(91,224,176,0.2)]` （绿色幽灵边框）
- 阴影：`shadow-[0_25px_80px_rgba(0,0,0,0.5)]` （深重）
- 按钮：
  - 主按钮：`bg-gradient-to-r from-[var(--accent-emerald)] via-emerald-300 to-cyan-300` + hover 浮动 `-translate-y-0.5`
  - 副按钮：`border border-[var(--accent-emerald)]/40` + transparent + hover 背景 `hover:bg-[var(--accent-emerald)]/5`

**状态处理**：
- 登录状态：显示 `auth.planLabel` badge + 用户邮箱 + 剩余额度数字 + 刷新按钮
- 未登录状态：显示 Guest badge + 解锁提示文案 + 登录按钮（同样触发 `onRequireLogin`）

### 3. 响应式设计
- **桌面（lg）**：卡片占 1 列，右侧亮点卡占 1.2 列
- **平板（sm-md）**：
  - 内部间距调整（`p-6`）
  - 按钮全宽堆叠（`w-full`）
  - 数字大小 `text-4xl` → `sm:text-5xl`
- **移动（<sm）**：
  - 文字尺寸自动缩小（`text-xs` / `text-sm`）
  - 无横向溢出（内容留出 padding）

---

## Verification（验证结果）

### 视觉检查
✅ **黑金金属质感**：
- 深色渐变背景 + 折光/网格纹理呈现金属感
- 边框透明度与内部装饰层配合得当
- 角落光晕（emerald & cyan）提供次级视觉焦点

✅ **登录/未登录状态**：
- 已登录：plan badge（绿色脉冲点） + 邮箱 + 大号额度 + 刷新按钮
- 未登录：Guest badge（琥珀色） + 解锁提示 + 登录按钮
- 两种状态卡片高度一致，无版式跳变

✅ **交互响应**：
- 主按钮 hover：`-translate-y-0.5` 浮动 + 阴影增强
- 副按钮 hover：背景淡出、边框更亮
- 焦点态：`focus-visible:ring-2` 对无障碍支持

✅ **响应式布局**：
- 桌面（1440px）：左卡固定宽，右卡弹性展开
- 移动（390px）：堆叠单列，按钮全宽，无横向滚动

### Lint 结果
```
npm run lint
✖ 13 problems (0 errors, 13 warnings)
  - 0 errors in ReportGeneratorSection.tsx（改造部分无新增 error）
  - 1 warning: React Hook useEffect 缺失依赖（pre-existing，与本次改造无关）
```

**结论**：改造代码符合 ESLint 规范，无新增错误。

### Test 结果
```
npm test -- --run

Test Files: 6 passed (6)
Tests:      34 passed (34)
Duration:   1.23s

✓ __tests__/api.test.ts (3 tests)
✓ lib/supabase/server.test.ts (9 tests)
✓ lib/services/quota.test.ts (9 tests)
✓ __tests__/api/report.history.test.ts (7 tests)
✓ __tests__/useProgress.test.tsx (2 tests)
✓ __tests__/api/report.supabase.test.ts (4 tests)
```

**结论**：所有单元测试通过，改造未破坏现有功能逻辑。

---

## Risks（遗留风险与建议）

### 已规避风险
1. ✅ **交互函数保留**：`auth.refreshSession()`、`onRequireLogin()`、滚动到 `#generator` 均保持原签名
2. ✅ **i18n 文案**：沿用现有 key（`quota.card.*`、`quota.banner.*`），未新增硬编码
3. ✅ **性能**：decoration layers 使用 `pointer-events-none`，不影响交互
4. ✅ **无障碍**：aria-hidden 标记装饰元素，保留焦点态样式

### 建议后续验证
1. **浏览器兼容性**：
   - CSS gradient + clip-text 在 Safari 14- 需 fallback（建议后续测试）
   - `prefers-reduced-motion` 尚未在改造中显式处理（hover 浮动动效可在系统设置中禁用）

2. **暗模式**：
   - 当前卡片背景固定为 `slate-900` 深色，假设应用全局为暗黑主题
   - 若未来支持亮色主题，需调整背景色与文字对比度

3. **主题 token 同步**：
   - 目前使用硬编码 `rgba(91,224,176,...)` 和 `slate-900`
   - 建议后续在全局 CSS 变量中定义 `--card-bg-gradient`、`--card-border-color`，便于主题统一管理

4. **浮动动效与 prefers-reduced-motion**：
   - 目前 hover 使用 `-translate-y-0.5`（轻微浮动）
   - 可在 CSS 中添加：
     ```css
     @media (prefers-reduced-motion: reduce) {
       .btn-primary { transform: none; }
     }
     ```

---

## 总结
✅ **改造完成**：左侧额度卡已升级为高端会员卡设计，视觉质感提升明显。
✅ **功能保留**：所有交互、状态判断、文案逻辑保持原状。
✅ **质量检查**：lint 无新增错误，test 全 34 通过。
✅ **响应式**：桌面/平板/移动端均无溢出，布局稳定。

**下一步**：待 Codex 审阅设计效果，确认是否需要微调（如数字大小、阴影深度、按钮圆角等）。
