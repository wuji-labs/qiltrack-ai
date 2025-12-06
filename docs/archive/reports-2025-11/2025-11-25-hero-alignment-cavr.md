# 2025-11-25 Hero Alignment CAVR

## Context

- 问题：Hero 容器 `max-w-full` 与主体 `max-w-6xl` 不一致，导航 `max-w-7xl` 与两者均不对齐
- 目标：统一导航、Hero、主体 sections 为 `max-w-6xl` 宽度，保持同一中心线
- 约束：保留现有视觉效果（mesh 背景、圆角卡片）、保持移动端全宽体验

## Actions

- [x] 分析现有 HeroSection 和 page.tsx 布局结构
- [x] 提取公共容器类常量 `pageContainer = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10"`
- [x] 修改导航容器：从 `max-w-7xl` 改为使用 `pageContainer`
- [x] 修改 Hero 卡片外层容器：从 `max-w-full` 改为使用 `pageContainer`
- [x] 验证主体 sections 容器已使用一致的 `max-w-6xl px-4 sm:px-6 lg:px-10`（无需修改）

## Verification

- [x] `npm run lint` → 0 errors, 13 warnings（均为既有 unused vars，非本次变更引入）
- [x] `npm test` → 6 test files, 34 tests passed
- [ ] 手动验证待执行：1280/1440/1920 宽度下 Hero 与 generator/pricing 边缘对齐；390/768 宽度无横向滚动

## Risks

- 移动端抽屉定位使用 `right-4` 绝对定位，与容器宽度无直接关联，预期无影响
- 导航宽度收窄后，极端内容可能挤压中间导航项（现有 xl:flex-nowrap 应可处理）

## Changed Files

- `app/sections/HeroSection.tsx`: 导航和 Hero 容器统一为 `max-w-6xl`
