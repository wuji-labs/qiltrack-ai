# CAVR 报告：Hero CTA 并排布局

## Context

- Snapshot：`docs/decisions/2025-11-25-hero-cta-inline.md`（仓库未找到，按口头需求执行：Hero 区两颗 CTA 在所有视口同排）
- 范围：调整 `HeroSection` CTA 容器与按钮宽度，确保始终单行，保留现有文案与交互。
- 技术栈：Next.js App Router、React 19、TypeScript、Tailwind v4 inline tokens；不引入新依赖。

## Actions

- CTA 容器改为水平布局并统一间距（`gap-3 sm:gap-4`），移除小屏垂直堆叠。
- 两个 CTA 按钮使用 `flex-1 sm:flex-none min-w-[136px]`，移动端均分宽度保持同排，桌面端维持原有视觉与 hover 阴影。
- 保留原有文案与行为（主按钮触发 `onPrimaryCta`，次按钮链接 `/reports`），未改动 icon/动画。

## Verification

- `npm run lint`（通过，13 个既有 warning：app/(auth)/login/page.tsx 未用 `callbackUrl`；app/account/page.tsx 未用 `loading`；ProgressBar 未用 `activeIndex`/`pipPositions`；app/page.tsx 未用 `module2Items`/`module3Items`/`module4Items`/`quotaHintPrimary`/`quotaHintSecondary`；reports/[slug]/ClientReportContent.tsx 未用 `Link`；reports/[slug]/page.tsx 未用 eslint-disable；HeroSection 未用 `remainingQuota`；ReportGeneratorSection `useEffect` 依赖 warning）
- `npm run test:ci`（通过，34 测试）；stdout 仅有预期的 mock 错误日志：quota.test.ts “Not found/Service error”、report.history.test.ts “Database connection error”、report.supabase.test.ts chain mock ReferenceError。

## Risks

- 极窄视口或长文案语言下，136px 最小宽度可能接近极限，需实机确认 320px 以下设备是否挤压或溢出。
- 未做手动视觉验证，建议上线前在 320/375/768/1280 宽度确认按钮同排且无水平滚动。
