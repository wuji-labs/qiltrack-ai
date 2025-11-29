# Snapshot：高级报告排版 + 年费用户 PDF 导出（2025-11-29）

## 背景
- 当前报告页面以 Markdown 渲染，版式层级有限，未形成可复用的报告蓝图，导出仅有 DOCX 且排版简易。
- 年费用户缺少“可直接转发/存档”的高品质 PDF 报告，无法展示图表（价格走势、估值/财务指标对比等）。
- 现有数据结构（`ReportResponse` + `companyData`）未沉淀为结构化块，导致 Web 展示、导出样式无法统一，风格一致性不足。
- 需要一份“顶级”方案：在站内阅读体验升级的同时，提供品牌化、含图表、跨终端友好的 PDF，且仅对年费用户开放。

## 设计目标
1. **单一蓝图，多端渲染**：将 AI 文案 + 公司数据映射为统一的报告蓝图（封面、概览、KPI 卡片、图表、风险/结论），Web 与 PDF 共用。
2. **高级视觉与可读性**：加强标题层级、留白、表格/卡片化信息、品牌色穿插，图表需对齐视觉系统（渐变、圆角、阴影）。
3. **稳定的年费专享导出**：年费用户可获取带图表的 PDF，导出链路具备幂等、存储与分享能力（带签名 URL），断点/失败可重试。
4. **性能与可靠性**：生成时间 < 6s（P95），PDF 大小 < 2.5MB；无授权或配额不足时明确提示；提供 DOCX/Markdown 兜底。

## 技术约束
- 技术栈：Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS v4 `@theme inline`；前端已引入 `docx` / `jspdf`。
- 数据来源：Finnhub 实时行情 + 基本面（`companyData`），报告正文由 OpenRouter 模型生成 Markdown。
- 存储：Supabase `report-assets`（私有）已有路径规范 `{user_id}/{report_run_id}/document.{md|docx}`；需新增 `document.pdf`。
- 鉴权/计费：Supabase Auth + `profiles` / `report_credits`；需新增年费标记字段或沿用现有 `planLabel`，在 API 层硬性校验。
- PDF 渲染建议：服务端渲染（Node 环境）避免客户端打包膨胀；图表使用服务端 Canvas 生成 PNG，再嵌入 PDF。

## 文案 key（需同步 `lib/i18n.tsx`）
| key | zh-Hans | en | 说明 |
| --- | --- | --- | --- |
| `report.pdf.cta` | 导出高级 PDF | Export premium PDF | Web 按钮文案 |
| `report.pdf.badge.annual` | 年费专享 | Annual only | 按钮/徽标 |
| `report.pdf.status.preparing` | 正在生成 PDF… | Preparing PDF… | 生成态 |
| `report.pdf.chart.performance` | 价格与波动 | Price & volatility | 图表标题 |
| `report.pdf.chart.valuation` | 估值与盈利 | Valuation & earnings | 图表标题 |
| `report.pdf.error.plan` | 仅限年费用户 | Annual plan required | 权限提示 |

## 工作拆分
### G3（前端 + 导出链路）
**职责定位**：输出统一报告蓝图、升级站内版式、落地带图表的 PDF 导出，并接好年费鉴权/存储。

**任务清单**
- [ ] 报告蓝图抽象：新增 `lib/report/blueprint.ts`，将 `ReportResponse` + `companyData` 结构化为块（封面、概要、KPI、图表数据源、正文段落），供 Web/PDF 共用。
- [ ] 站内版式升级：基于蓝图重构 `ReportGeneratorSection` 的展示层（封面卡、三栏 KPI、要点列表、表格化关键指标、图表占位），采用品牌色渐变+留白。
- [ ] 图表数据与渲染：新增 `lib/report/charts.ts` 计算序列（价格 30D/180D、52 周高低、PE/PB/PS、增长率）。引入 `chartjs-node-canvas`（服务端）生成 PNG，Web 侧可用轻量 SVG/Canvas 组件。
- [ ] PDF 引擎：新增 `app/api/report/export/pdf/route.ts`（`POST {reportRunId}`），使用 `@react-pdf/renderer`（或 `pdf-lib` + 预先生成的 PNG/表格）服务端生成 PDF Buffer；返回下载 URL + Supabase 存储路径。失败兜底 DOCX。
- [ ] 年费校验与配额：在导出 API 内校验年费标记（`profiles.subscription_type === 'annual'` 或现有 `planLabel`），并写 `report_credit_events` 日志；非年费返回 403 + 友好文案。
- [ ] 存储与分享：PDF 按 `{user_id}/{run_id}/document.pdf` 写入 `report-assets`，返回签名 URL（有效期可配置）；前端按钮默认直接下载，提供“复制链接”。
- [ ] 性能与可观测性：为导出 API 增加 `duration_ms`、`chart_failures`、`pdf_size_bytes` 日志；超时或 Chart 失败自动降级为无图表 PDF。

**测试要求**
- 单测：`lib/report/blueprint` 结构化函数、`lib/report/charts` 数据计算（空数据/缺字段/异常值）。
- 端点测试（Vitest + supertest 或 msw）：`/api/report/export/pdf` 授权校验、成功返回、降级路径。
- 可视回归（人工）：生成一份 AAPL/TESLA 报告，确认封面、KPI、图表、风险段落布局；移动端预览不溢出。

**交付物**
- 设计稿（如需）：封面/内页组件的 Figma 或低保真 Wireframe。
- 变更文档：本 Snapshot + 后续 `docs/reports/<date>-g3-premium-pdf-cavr.md`。
- 若引入新依赖：更新 `README` 环境与 `npm run lint/test` 覆盖说明。

## 验收 / 验证
1. 通用：`npm run lint`、`npm test` 通过；`npm run build` 可用。
2. 功能：年费账号点击“导出高级 PDF”→ 后端生成 ≤6s → 自动下载且 PDF 内含封面、KPI 表、至少 2 张图表、风险/结论段；非年费账号获得权限提示。
3. 边界：行情缺失 / 指标缺失时图表空态优雅降级；Supabase 上传失败时回退为本地下载（不写存储）。
4. 集成：报告历史可显示 PDF 下载入口（若有存储路径）；DOCX 兜底可正常工作。

## 风险与对策
| 风险 | 影响 | 优先级 | 对策 |
| --- | --- | --- | --- |
| 服务端 PDF/Chart 生成耗时或 OOM | P95 超时、页面按钮体验差 | 高 | 限制图表尺寸/采样点，采用服务端 Canvas，超时降级为无图表版 |
| 年费标记缺口/字段不一致 | 导出被误拒或误放行 | 高 | 在 API 层统一读取 `profiles.subscription_type` + 前端 `planLabel` 双重判断，缺省时直接拒绝并提示补全 |
| Supabase 存储/签名异常 | 用户无法下载或分享 | 中 | 本地下载兜底 + 重试上传，签名失败时返回临时 Buffer 下载 |
| 视觉/品牌不一致 | “顶级”观感无法达成 | 中 | 提前产出样式 Token 与 Layout 栅格，Web/PDF 共用设计规范 |

## 参考资料
- 现有导出链路：`app/sections/ReportGeneratorSection.tsx`（DOCX 导出逻辑）
- 数据结构：`types/report.ts`、`lib/services/api.ts`
- 存储与鉴权：`supabase/migrations/`、`docs/decisions/2025-11-24-supabase-deployment.md`
