# 接口契约与模块化执行方案（架构快照）

## 背景
需要在多 worktree 并行开发的情况下，保持代码清晰、减少冲突与 AI 交互成本。现有模块包含鉴权、报告生成/配额、行情搜索、UI 组合与样式。

## 设计目标
- 定清接口/类型契约，先合小 PR，作为并行开发基线。
- 模块边界清晰：服务层与 UI 解耦，公共类型/错误结构统一。
- 主干随时可运行：未完功能用 flag/独立路由隔离。
- PR 小步快跑，lint/test 必过，减少重复沟通与 token 消耗。

## 技术约束
- Next.js App Router，TypeScript + React 19。
- Tailwind v4 `@theme inline`；全局样式 `app/globals.css`。
- 测试使用 Vitest (`npm test -- --run`)，lint 使用 ESLint (`npm run lint`)。
- 环境变量示例在 `.env.local.example`，新增变量必须同步。

## 契约速览（接口/类型/错误/flag）
1) 鉴权（Supabase）
   - Hook：`useSupabaseAuth` 暴露 `{ user, session, isAuthenticated, loading, signInWithEmail, signInWithProvider, signOut, refreshSession, getUserProfile, getReportCredits }`
   - 错误：统一返回 `{ success: false, error: string }`；日志内部打。
2) 报告生成/历史/配额
   - API：`generateReport(params) -> Promise<{ id, status, content?, error? }>`
   - 历史：`getReportHistory(userId)` 返回列表，错误格式 `{ message }`
   - 配额：`getRemainingCredits(userId)` 返回数字；错误时返回 0 并附日志。
3) 行情/搜索
   - `searchTickers(query)` 返回 `{ symbol, name }[]`
   - `getQuote(symbol)` 返回 `{ symbol, price, change, changePercent, ts }`
   - 错误格式 `{ message }`
4) UI Section Props（示例）
   - `HeroSection`：消费用户信息/文案/cta 回调，不直接调服务。
   - `ReportGeneratorSection`：消费 `onSearch`, `onGenerate`, `loading`, `error`，数据由上层注入。
5) Flag
   - 未完成功能用布尔 flag；默认关。新 flag 写入 `.env.local.example` 并说明默认值与影响。

## 模块拆分与文件落点
- 鉴权与用户域：`hooks/useSupabaseAuth.ts`、`lib/supabase/*`、`app/api/auth/*`、`types/database.ts`
- 报告生成与配额：`app/api/report/*`、`app/api/report/history`、`lib/services/quota.ts`、`lib/services/api.ts`、`types/report.ts`
- 行情/搜索：`app/api/search`、`app/api/quote`、`lib/services/api.ts`（对应方法）、`types/quote.ts`（如需新建）
- UI 组合：`app/sections/*`、`app/page.tsx`；公共组件 `app/components/*`
- 样式与主题：`app/globals.css`、`@theme` token、`app/components/ProgressBar.tsx` 等
- 配置：`.env.local` / `.env.local.example`、feature flags
- 测试：`__tests__/*`、`lib/**.test.ts`

## 执行步骤（程序员可直接跟）
1) **先合契约 PR（小）**
   - 创建 `docs/contracts.md`（可直接复用本快照内容）并在 `types/`、`lib/services/` 写 stub/type，对应接口签名与错误结构。
   - 提 PR，合入 `main`，作为后续分支的基线。
2) **模块开发（可并行，自行领任务）**
   - 只改对应模块文件，消费/实现契约，避免跨层调用。
   - 公共组件/样式改动前先同步，减少冲突。
3) **质量门槛**
   - 每个 PR 必跑：`npm run lint`、`npm test -- --run`，并在 PR 模板填验证结果。
   - 未完成功能用 flag 或独立路由隔离，确保 `main` 可跑。
4) **合流策略**
   - 类型/接口/配置类 PR 优先合；UI/样式随后，减少 rebase 冲突。
   - 需要联调时，临时建 `integration/<topic>` 分支合相关分支验证，通过后各自回去继续。
5) **节奏与同步**
   - 每天/半天从 `main` rebase 各自分支。
   - 新增 env/flag 同步 `.env.local.example` 并在 README/注释写用途与默认值。
6) **常见自查（减少问答/token）**
   - 端口占用/无法访问：确认 dev 进程在跑；`netstat -ano | findstr <port>`。
   - env 缺失：检查 `.env.local` 是否复制到当前 worktree，`NEXTAUTH_URL` 是否匹配端口。
   - lint warning：清未用变量，补齐 useEffect 依赖。
   - 测试日志中的错误信息多为模拟错误路径，无需处理，除非用例失败。

## 测试要求
- 新增/修改接口应有对应单测或补现有用例；至少保证 `npm run lint`、`npm test -- --run` 通过。
- UI 改动做基本可访问性自查（键盘可达、对比度）。

## 后续扩展（可选）
- 若多方案并存，可在各分支实验，最终用短暂 `integration/<topic>` 分支选优合入。
- 需要更细待办时，可按模块再拆文件级 checklist。
