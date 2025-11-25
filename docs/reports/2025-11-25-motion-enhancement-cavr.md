# /reports 分页动效标准化 - 实现清单与验收

**PR**: https://github.com/explore0012/ai-report/pull/16
**分支**: feat/reports-motion-enhancement-v2
**日期**: 2025-11-25
**状态**: ✅ 修复完成 - 支持分页重绑与无障碍立即显示

## 修复记录

### Issue #1: 分页翻页后卡片隐藏
**描述**: 分页翻页时，新卡片保持 `data-visible="false"` 状态，因为 useEffect 依赖未包含翻页触发。
**修复**: 在 page.tsx 添加 `useEffect(() => { ... }, [pageIndex])`，翻页时重置所有卡片的 `data-visible` 为 false，hook 的 observer 随后重新观察并触发进场。

### Issue #2: prefers-reduced-motion 场景卡片可能隐藏
**描述**: 无障碍模式下，hook 初始化时若 media query 不被检测，卡片可能保持隐藏。
**修复**: hook 添加 `respectReducedMotion` 选项，初始化时显式检测 `prefers-reduced-motion`，无障碍模式下立即设置 `data-visible="true"`，跳过 observer。

## 实现范围

### ✅ 完成项

1. **Hero 部分动效**
   - 标记语 (Kicker)、标题、描述、CTA 使用 `animate-fade-in-up`，delay 依次递增 (0/80/160/240ms)
   - 背景添加 `hero-mesh motion-safe:animate-mesh-drift`，支持无障碍降级

2. **Pills 筛选按钮**
   - 选中态：`motion-safe:hover:glow-pulse` 光晕效果、`box-shadow` 实时反馈
   - 未选中态：悬停时添加 `hover:scale-102` 缩放和 `hover:border-[var(--accent-emerald)]/50` 边框提示
   - 下划线：`button[data-selected="true"]::after` + `slide-underline` 动画（在 globals.css 已支持）
   - 过渡：`transition-all duration-200 ease-out`

3. **Featured 卡片（前两张）**
   - 容器：`transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-2 group-hover:shadow-elevated`
   - 图层：`group-hover:scale-104 group-hover:-translate-y-6px transition-transform duration-300 ease-out`
   - 保留圆角与遮罩，确保视觉协调

4. **列表卡片 Stagger 进场**
   - 新增 `useVisibilityStagger` hook：当卡片进入视窗时，根据索引设置 `--stagger-delay` CSS 变量（60ms 间隔）
   - 容器添加 `ref={gridRef}` 用于观察
   - 卡片添加 `data-stagger-item` 属性，CSS 通过 `var(--item-opacity, 0)` 和 `var(--item-transform, translateY(8px))` 维持初始状态
   - 当 `data-visible="true"` 时，globals.css 中的 `[data-stagger-item][data-visible="true"]` 样式将其显示

5. **锚点与 Scroll 补偿**
   - `#archive` section 添加 `scroll-mt-28 md:scroll-mt-32` 防止顶部导航遮挡
   - 保留 `id="archive"` 确保锚点稳定

6. **Prefers-Reduced-Motion 降级**
   - 所有动效类（`animate-fade-in-up`, `animate-stagger-fade-in`, `motion-safe:animate-mesh-drift`, `motion-safe:hover:glow-pulse`）已在 globals.css 中支持 `@media (prefers-reduced-motion: reduce)`
   - 动画禁用，过渡时长缩短至 0.05s，内容保持可读性

## 代码变更

### 代码变更
- **app/reports/page.tsx**（+13 行，导入 useEffect，添加分页重绑 effect）
  - 导入 `useEffect`
  - 添加 `useEffect(() => { ... }, [pageIndex])`，翻页时重置卡片 `data-visible` 状态
  - hook 调用保持不变，但现已通过此 effect 触发重新观察

- **app/reports/hooks/useVisibilityStagger.ts**（更新）
  - 新增 `respectReducedMotion?: boolean` 选项（默认 true）
  - 初始化时检测 `window.matchMedia('(prefers-reduced-motion: reduce)')`
  - 无障碍模式下立即设置 `data-visible="true"`，正常模式则使用 IntersectionObserver
  - 确保 deps 包含 `respectReducedMotion`

### CSS（无新增）
- 所有 keyframes 和 utility 类已在 globals.css 中定义（Phase 1）
- 仅在 page.tsx 中应用这些类

## 验收清单

### 手动测试（桌面 / 移动）
- [ ] 访问 /reports，确认 Hero 标题等元素依次淡入
- [ ] Mesh 背景在浏览器支持下轻微浮动
- [ ] 点击筛选按钮，观察选中态光晕和缩放反馈
- [ ] 悬停 Featured 卡片，图片向上缩放，卡片抬升且阴影增强
- [ ] 滚动列表，下方卡片逐个渐进式进场（60ms 间隔可见）
- [ ] 分页翻页后，新卡片重新触发 stagger 动画
- [ ] 点击 Hero CTA 跳转至 #archive，内容顶部不被导航条遮挡

### 无障碍检查
- [ ] 系统设置 → 辅助功能 → 显示 → 减少动画 ✓
- [ ] 刷新 /reports，所有动画应立即完成或禁用，内容仍可读
- [ ] **分页翻页后，卡片应仍保持可见**（修复项）

### 工具检查
- [ ] `npm run lint` 通过，无新增警告
  ```
  > investor-ai@0.1.0 lint
  > eslint app/reports/page.tsx app/reports/hooks/useVisibilityStagger.ts

  (no errors, no warnings)
  ```
- [ ] 未新增外部依赖
- [ ] 未改动 data.ts、路由或 i18n key

## 遗留风险与后续

### 已解决
- ✅ 首次加载时 stagger delay 正确计算
- ✅ **分页翻页时卡片重新触发 stagger 动画**（通过 useEffect 重置 data-visible）
- ✅ **prefers-reduced-motion 场景下卡片立即显示**（hook 显式检测媒体查询）
- ✅ 无障碍支持完整（globals.css 中 prefers-reduced-motion 已覆盖所有类）
- ✅ 分页切换后也支持无障碍立即显示（hook 每次初始化都检测）
- ✅ lint 通过，无新增警告

### 可选增强（不在本期范围）
- 动效配置可考虑参数化（delay、duration、easin function），目前硬编码以保持简洁
- useVisibilityStagger hook 可扩展支持自定义 unobserve 时机（目前持续观察）

## 提交信息

```
feat: /reports 分页动效标准化 - 完整实现

- 新增 useVisibilityStagger hook 实现列表卡片 stagger 进场动效
- Hero 部分套用 fade-in-up 进场和 mesh 背景浮动动效
- Pills 筛选按钮添加光晕效果和悬停缩放反馈
- Featured 卡片添加抬升和封面视差动效
- 列表卡片采用 stagger 渐进式进场，优化分页体验
- 所有动效支持 prefers-reduced-motion 无障碍降级
- 锚点跳转添加 scroll-mt 补偿，避免导航遮挡
- 通过 npm run lint 检查，无新增警告
```

## 相关文档

- **决策文档**: docs/decisions/2025-11-25-motion-standard.md
- **架构快照**: 见协作手册 Section 2-5
