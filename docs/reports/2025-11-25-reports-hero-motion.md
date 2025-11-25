# CAVR: /reports Hero 按钮动效实现（修订版）

**日期**: 2025-11-25
**分支**: feat/reports-hero-motion
**关联设计**: docs/decisions/2025-11-25-report-hero-motion.md

---

## Context（背景）

- /reports 页面 hero 区域需要轻量动效反馈
- **范围调整**：仅为三个按钮（查看报告/分享灵感/返回首页）添加 hover 动效，hero 背景和容器保持静态
- 需遵守 Motion Refresh 节奏：transform/opacity 优先，160–220ms ease-out

## Actions（执行动作）

### 1. globals.css 新增按钮动效定义（app/globals.css:492-521）

| Keyframe / Class | 用途 | 参数 |
|------------------|------|------|
| `glow-pulse` | 按钮悬停光晕 | 1.5s ease-in-out infinite，box-shadow 扩散 |
| `.motion-safe\:hover\:glow-pulse:hover` | 悬停触发光晕 | prefers-reduced-motion 保护 |
| `.motion-safe\:transition-transform` | transform 过渡 | 0.2s ease-out |
| `.motion-safe\:hover\:-translate-y-0\.5:hover` | 悬停上浮 | translateY(-0.125rem) |

所有动效均包裹在 `@media (prefers-reduced-motion: no-preference)` 中。

### 2. page.tsx 应用动效类（app/reports/page.tsx:68-81）

三个按钮统一添加：
- `motion-safe:transition-transform` - 平滑过渡
- `motion-safe:hover:-translate-y-0.5` - 悬停上浮
- `motion-safe:hover:glow-pulse` - 悬停光晕

**已移除**：hero section 容器和背景 mesh 的动效类（恢复静态）

## Verification（验证结果）

### Lint 检查
```
npm run lint
✖ 13 problems (0 errors, 13 warnings)
```
- 0 errors，全部通过
- 13 warnings 均为既有代码，非本次改动引入

### 手动测试清单
- [ ] 桌面端：三个按钮悬停时上浮 + 柔光脉冲
- [ ] 桌面端：hero 背景和容器保持静态
- [ ] 移动端：按钮点击反馈正常
- [ ] prefers-reduced-motion：开启后动画停用，按钮仍可点击
- [ ] 锚点行为：`#archive` / `mailto:` / `/` 链接正常

## Risks（风险与遗留）

1. **动效一致性**：三个按钮使用相同动效，主 CTA（btn-gradient）与次级按钮视觉权重一致，如需区分可后续调整
2. **既有 warnings**：13 个 lint warnings 为历史遗留，建议后续统一清理

---

## 变更文件清单

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| app/globals.css | 新增 | 1 个 keyframe + 3 个 utility classes（删除未使用的 mesh-drift/hero-float/hero-glow） |
| app/reports/page.tsx | 修改 | 三个按钮各添加 3 个 motion-safe class；移除容器/背景动效类 |
