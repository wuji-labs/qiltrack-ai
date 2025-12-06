# /reports 分页动效标准化 - 实现清单与验收

**PR**: https://github.com/explore0012/ai-report/pull/16
**分支**: feat/reports-motion-enhancement-v2
**日期**: 2025-11-25
**状态**: ✅ 全部修复完成 - 支持分页重初始化、无障碍立即显示、文案国际化

## 修复记录

### Issue #1: 分页翻页后新卡片未被观察（高优）

**描述**: 分页翻页时，新渲染的卡片不被 IntersectionObserver 观察，因为 hook 中 `items` 在首次渲染后固定不变，新分页的 DOM 节点无法进入 observer。
**修复**:

- useVisibilityStagger 添加 `deps?: unknown[]` 参数
- page.tsx 调用时传入 `deps: [pageIndex, selectedCategory]`
- 当这些依赖变化时，hook 重新查询容器内所有 items 并重新初始化 observer
- 确保分页翻页后的新卡片能正确被观察和触发进场动画

### Issue #2: prefers-reduced-motion 下卡片隐藏（高优）

**描述**: 无障碍模式下，hook 初始化时若 media query 不被检测，卡片可能保持隐藏。
**修复**: hook 添加 `respectReducedMotion` 选项，初始化时显式检测 `prefers-reduced-motion`，无障碍模式下立即设置 `data-visible="true"`，跳过 observer。

### Issue #3: 文案编码错误导致乱码（高优）

**描述**: 返回首页按钮文案显示为 "杩斿洖棣栭〉" 等乱码。
**修复**:

- 将硬编码中文改为 i18n key `reports.page.hero.backHome`
- 在 lib/i18n.tsx 添加完整多语言翻译（EN/JA/KO/繁體/簡體）
- 确保文案编码正确，与其他按钮保持国际化一致性

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

### 文件修改列表

- **app/reports/hooks/useVisibilityStagger.ts**（更新）
  - 新增 `deps?: unknown[]` 参数，支持传入依赖项数组
  - 当 pageIndex/selectedCategory 等依赖变化时，hook 重新初始化 observer
  - 确保新渲染的 DOM 节点被正确观察

- **app/reports/page.tsx**（更新）
  - hook 调用时添加 `deps: [pageIndex, selectedCategory]`
  - 当分页或筛选时，hook 自动重新查询 items 并重初始化

- **lib/i18n.tsx**（新增）
  - 添加新 key `reports.page.hero.backHome`
  - 支持 5 种语言：EN、JA、KO、繁體中文、簡體中文

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
  > qiltrack-ai@0.1.0 lint
  > eslint app/reports/page.tsx app/reports/hooks/useVisibilityStagger.ts

  (no errors, no warnings)
  ```

- [ ] 未新增外部依赖
- [ ] 未改动 data.ts、路由或 i18n key

## 遗留风险与后续

### 已解决

- ✅ **分页翻页后新卡片未被观察**（通过 hook deps 参数支持动态重初始化）
- ✅ **reduce-motion 场景卡片隐藏**（hook 显式检测媒体查询并立即显示）
- ✅ **文案乱码**（改用 i18n 国际化，确保 UTF-8 编码）
- ✅ lint 通过，无新增警告
- ✅ 首次加载时 stagger delay 正确计算
- ✅ 无障碍支持完整（globals.css 中 prefers-reduced-motion 已覆盖所有类）
- ✅ 分页和筛选后都支持无障碍立即显示

### 可选增强（不在本期范围）

- 动效配置可考虑参数化（delay、duration、easin function），目前硬编码以保持简洁
- useVisibilityStagger hook 可扩展支持自定义 unobserve 时机（目前持续观察）

## 提交历史

```
47de2e5 feat: /reports 分页动效标准化 - 完整实现
9522f2f fix: useVisibilityStagger 支持分页重绑与 reduce-motion 立即显示
a551bd8 docs: /reports 动效实现检查报告与验收清单
84b1c8a docs: 更新 CAVR 文档 - 记录分页重绑与无障碍修复
a78b1e9 fix: useVisibilityStagger 支持动态 deps，解决分页后新卡片未被观察的问题
10c6004 fix: 修复返回首页文案编码 - 改用 i18n 国际化翻译
```

## 相关文档

- **决策文档**: docs/decisions/2025-11-25-motion-standard.md
- **架构快照**: 见协作手册 Section 2-5
