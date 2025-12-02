# CAVR 报告：Hero 区次级 CTA 跳转 /reports

## Context

- **Snapshot**：`docs/decisions/2025-11-25-hero-cta-link.md`
- **范围**：将 HeroSection.tsx 中的次级 CTA（"View example/查看示例"）从锚点链接 `#generator` 改为路由链接 `/reports`
- **技术约束**：
  - Next.js App Router + TypeScript + Tailwind v4
  - 使用 `next/link` 取代裸 `<a>` 元素
  - 保留原有样式类名与文案 Key `hero.cta.secondary`（已有多语言支持）
- **依赖**：无前置依赖；`/reports` 路由已存在

## Actions

- [x] 修改 `app/sections/HeroSection.tsx:264` 将 `<a href="#generator">` 改为 `<Link href="/reports">`
- [x] 保留 className `btn-ghost px-5 py-2 text-base transition-all duration-200 ease-out hover:-translate-y-0.5`
- [x] 保留文案与箭头图标 `↗`
- [x] 验证改动未引入新 lint 错误

## Verification

- [x] **npm run lint**：通过

  ```
  ✖ 15 problems (0 errors, 15 warnings)
  ```

  - HeroSection.tsx 无新增警告；现有警告 `remainingQuota` 为预存代码
  - 所有其他警告均为预存

- [ ] **npm test**：暂未运行（无新增逻辑需测试）

- [ ] **手动验证**：
  - 桌面视口点击"View example"→ 应跳转至 `/reports`
  - 移动视口点击→ 应跳转至 `/reports`
  - 无控制台报错

## Risks

- 无架构风险；改动受限于样式层
- `/reports` 路由可访问性需在部署前确认
- 建议 Codex 在最终审阅时补充手动验证确认跳转行为

---

**分支**：`g2/report-ai`
**改动文件**：

- `app/sections/HeroSection.tsx`（1 行修改）
- `docs/decisions/2025-11-25-hero-cta-link.md`（新增决策文档）
