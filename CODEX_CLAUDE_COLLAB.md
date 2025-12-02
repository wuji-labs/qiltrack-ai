# Codex–Claude 协作手册

> **📌 重要声明**：本文档是项目协作的**唯一权威规范**。
> 如与其他文档冲突，**以本文档为准**。
>
> - 速查版：`docs/guides/codex-claude-quickstart.md`（1 页摘要）
> - 组织架构：`docs/guides/organization-structure.md`（HQ 和各组职责）
> - 老板手册：`docs/guides/BOSS-OPERATION-MANUAL.md`（完整操作流程）

本手册说明架构师（Codex）与实现工程师（Claude）在 investor-ai 项目的协作方式、职责分工与交付规范。命令/路径保持英文，其余叙述统一中文。

## 1. 目的与范围

- 确保每个需求从清晰的架构意图出发，最终以经过审查与测试的代码交付。
- 保持产品目标 → 设计笔记 → PR → 发布说明的全链路可追踪。
- 异步高效协作，减少往返。

## 2. 角色职责

### Codex（架构师 + 评审）

- 整理需求，强调约束（环境变量、API 限额、样式主题等）。
- 产出 Architecture Snapshot：接口/组件约定、测试预期、任务拆解。
- 实施阶段解答设计问题、调整范围。
- 做代码评审，关注正确性、架构一致性、lint/test 策略，指出风险与缺测。
- 交付 snapshot 或反馈时，必须提醒 Claude 使用 feature 分支 + PR（禁止直推 main），并附可复制的 `@Claude ...` fenced block。
- 回复 Claude 的状态 ping 时，需给出可执行的下一步指令（如“承上进入 Stage 2”或“补 X 测试”），确保循环持续推进。

### Claude（实现工程师）

- 把方案拆成可执行子任务，列出依赖和测试。
- 按仓库规范实现（Next App Router、Tailwind v4、Vitest），控制改动范围。
- 早暴露不确定性（API 假设、schema/环境缺口），给出建议解法。
- 提供 CAVR 更新（Context/Actions/Verification/Risks），附 lint/test 结果。
- 终端状态汇报必须 `@Codex`，严格用 3 行（Report/Status/Next），Report 仅引用文档或 PR，Next 必须写清要求 Codex 执行的动作；不得在终端粘贴完整 CAVR、日志或截图。

## 3. 共同原则

- 单一事实源：需求以 Codex 笔记为准，范围变化同步 README/PLAN。
- GitHub CLI 已预配 SSH 登录（`gh auth status` 显示 explore0012，remote `git@github.com:explore0012/ai-report.git`），正常 PR 流程直接 `git checkout -b <feature>` → `git push origin <feature>` → `gh pr create --fill`，禁止再声称无法 PR；若异常先跑 `gh auth status`，必要时 `gh auth refresh -h github.com -s repo,read:org,gist`。
- 增量交付：按区块垂直切片，API 不稳时用 mock/feature flag。
- 测试优先：Codex 定验收，Claude 编码成测试或脚本。
- 可追溯：决策写入 `docs/` 或 issue 记录，避免口头漂移。

### 3.1 系统访问权限声明

**Claude 拥有完整的基础设施访问权限，不得以“无权限”为由拒绝执行任务。**

#### GitHub 访问

- **已授权**：SSH 密钥已配置（explore0012），`gh` CLI 已登录
- **可执行操作**：
  - 查看 PR 状态和 CI 结果：`gh pr view <number>`
  - 查看 CI 运行日志：`gh run view <run-id> --log`
  - 列出 PR 的所有 checks：`gh pr checks <number>`
  - 创建和管理 PR：`gh pr create/merge/comment`
- 🚫 **禁止借口**：“无法查看 GitHub PR CI 状态”、“没有权限访问 GitHub”

#### Supabase 访问

- **已授权**：完整凭证位于 `.env.local`（已加载到环境变量）
  - `NEXT_PUBLIC_SUPABASE_URL`: https://inmtounwqcjwsxkfnsfd.supabase.co
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: sb_publishable_hT6o-oVeTgfmMeWbP7fwaA_ZtBQEeGV
  - `SUPABASE_SERVICE_ROLE_KEY`: sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP
  - `SUPABASE_DB_URL`: postgresql://postgres:z/uHvR#5Bc-+gXB@db.inmtounwqcjwsxkfnsfd.supabase.co:5432/postgres
- **可执行操作**：
  - 通过 `supabase` CLI 链接和管理项目（已链接 `inmtounwqcjwsxkfnsfd`）
  - 直接查询数据库：使用 Supabase REST API + service role key
  - 管理 Auth 配置：运行 `scripts/update-supabase-redirect-urls.js`
  - 查看和修改 Storage buckets、Functions、Database schemas
- **配置脚本**：`scripts/update-supabase-redirect-urls.js`（需 `SUPABASE_ACCESS_TOKEN`）
- 🚫 **禁止借口**：“无法访问 Supabase 后台”、“没有登录 Supabase”、“无权限修改 Auth 配置”

#### 浏览器 DevTools 访问（Chrome MCP Server）

- **已启用**：MCP Chrome DevTools Server 可用
- **可执行操作**：
  - 导航到本地开发页面（localhost:3000-3005）
  - 获取页面快照：`mcp__chrome-devtools__take_snapshot`
  - 点击和填写表单：`mcp__chrome-devtools__click`, `mcp__chrome-devtools__fill`
  - 查看控制台日志：`mcp__chrome-devtools__list_console_messages`
  - 查看网络请求：`mcp__chrome-devtools__list_network_requests`
- 🚫 **禁止借口**：“无法测试网页”、“无法查看浏览器控制台”

#### 第三方服务访问

- **OpenRouter API**: 已配置 `OPENROUTER_API_KEY`
- **Finnhub API**: 已配置 `FINNHUB_API_KEY`
- **Helicone**: 已配置 `HELICONE_API_KEY`

## 4. 协作流程

1. **Context Sync**：Codex 汇总上下文 + 发布 Architecture Snapshot；Claude 确认依赖/提疑问。
2. **Design & Breakdown**：Codex 给组件/数据流/测试矩阵；Claude 输出实施清单。
3. **Implementation Loop**：Claude 在短分支开发，跑 `npm run lint` / `npm test`，每段产出变更说明；Codex 随时答疑。
   - 分支策略：Claude 必须用独立 feature 分支，禁止直接改/推 main；通过 PR 合并，lint/test 必过。
   - worktree 同步：使用 git worktree 开发时，提 PR 前固定跑 `git fetch origin` -> `git rebase origin/main` -> `git status`，确认工作区干净且基于最新 main，再 push；rebase 冲突由 Claude 解决。
   - 提交 PR 时必须使用 `.github/pull_request_template.md`，确保 CAVR、验证结果与终端三行简讯全部填妥。
4. **Review & Validation**：Codex 按行为/韧性/风格审查，指出缺陷与风险；Claude 修复并补充验证。
5. **Knowledge Capture**：Codex 更新策略/方案文档；Claude 补 README/env/回归测试。
6. **Closeout Checklist（双方）**：
   - 状态：说明任务/分支完成或丢弃，当前分支，工作区是否干净。
   - 指令：如有后续动作，附可复制 fenced block（中文叙述、英文路径/命令）。
   - 验证：列出已跑的 lint/test/截图，或未执行原因。
   - 风险：标注遗留风险、待补测试或待决策事项。

## 5. 沟通规范

- **状态更新（Claude → Codex）**：CAVR（Context/Actions/Verification/Risks），记录在 PR 或 PLAN。
- **Claude 状态 ping 规则**：只能以 `@Codex` fenced block 输出 `Report/Status/Next` 三行（可选 `Blockers/Approval`），Report 必须是 docs/PR 路径，Status 概述进度，Next 明确下一步要 Codex 做什么（如“Review docs/... 并发 Stage 2 Snapshot”）；所有细节集中在文档里。
- **设计决策（Codex → Claude）**：Decision/Rationale/Alternatives/Impact，存 `docs/decisions/<date>-<topic>.md`。
- **提问**：非阻塞批量提；阻塞标记 #blocking。
- **语言**：对用户的 Codex/Claude 更新用中文；代码/命令用英文。
- **交接模板**：每次 Codex 发布 Snapshot 或需求回复时，末尾附一键复制 fenced block（含 `@Claude ...` 指令，路径/命令写好）。
- **报告落地**：Claude 的 CAVR / 验证 / 测试输出必须写入 PR 描述或仓库文档（如 `docs/reports/<date>-<topic>.md`）；若产生设计/架构决策同步 `docs/decisions/<date>-<topic>.md`。终端一律只引用文档路径，不得粘贴整段报告。
- **终端简讯模板**：Codex / Claude 面向用户或彼此汇报时统一使用 fenced block，并在 3 行以内写明 `Report:`、`Status:`、`Next:`；若需审批/有阻塞可追加 `Approval:`、`Blockers:` 字段。例如：
  ```
  @Codex
  Report: docs/reports/2025-11-24-ai-reporting.md
  Status: 完成实现，lint/test 结果见文档
  Next: 请审阅并指示后续
  ```
- **终端输出限长**：终端回复仅允许 3–5 行摘要 + 文档 / PR 路径，且须包含 `Report:` 与 `Next:` 字段，便于老板直接复制；详细内容必须在文档或 PR 描述中查看。
- **禁贴规则**：Codex / Claude 如在终端粘贴 CAVR、执行日志、截图或大段文本，视为未交付；必须把详细内容写进 docs/PR，再以 `Report:` 标注路径。

## 6. 交付物清单

| 阶段     | 责任人 | 产物                     | 说明                           |
| -------- | ------ | ------------------------ | ------------------------------ |
| Kickoff  | Codex  | Architecture Snapshot    | 背景、范围、验收、依赖         |
| Planning | Claude | Implementation Checklist | 文件/子任务/测试需求           |
| Dev      | Claude | Change Notes             | 每段变更 + lint/test 摘要      |
| Review   | Codex  | Review Log               | 按严重度列问题，含文件路径     |
| Closeout | Both   | Knowledge Capture        | 更新 README/PLAN/测试，列 TODO |

## 7. 质量门槛

- 本地 lint + test 必须通过再提审。
- 新增样式用 `@theme inline` 维护 token，记录默认值。
- API 交互尽量在 `lib/services/api` 做 mock，真实连通用 `test-api.js`。
- UI 改动做可访问性检查（键盘导航、对比度）。
- 新增 env 时同步 `.env.local.example`。

## 8. 升级与决策记录

- 超出方案 >20% 必触发 mini design review（Claude 发起）。
- 生产回归/重大缺陷：Codex 记 incident（时间/影响/修复），Claude 附整改任务。
- 分歧用 ADR，Codex 最终定夺并记录。

## 9. 快速开始

1. Codex 先发最新 Snapshot。
2. Claude 回复清单 + 疑问。
3. 双方确认工具可用：`npm run dev` / `npm run lint` / `npm test`。
4. Claude 按切片开发，持续输出 CAVR。
5. Codex 审查，直到通过。
6. 更新文档/测试/env 示例，归档决策。

## 10. 多工作组 worktree 协作

- 仅在总部 `D:\Projects\investor-ai` 执行 `npm install`，其他 worktree 通过 `npm run <script> --prefix <worktree>` 使用共享依赖。
- 使用 `scripts/worktree-manager.ps1`（或 `scripts/prep-group.ps1`）创建/清理 worktree（自动 `--no-checkout` + sparse-checkout + `node_modules` 链接），详见 `docs/guides/worktree-multi-team.md`。
- 每个工作组维护自己的分支 `gX/<topic>` 与 worktree，任务完成后必须 `git worktree remove` 清理。
- HQ 与各组 Codex 的组织架构、Boot Sequence 参见 `docs/guides/organization-structure.md`。

## 11. HQ 通知与汇报模板

- HQ 发布任务：更新 `docs/plans/workstreams.md` → 在终端向目标 `Gx-Codex` 发送三行模板（Report/Status/Next），示例：
  ```
  @G1-Codex
  Report: docs/plans/workstreams.md
  Status: 新任务 <topic>，请创建组内 Snapshot
  Next: 运行 scripts/prep-group.ps1 并反馈计划
  ```
- 组内 Claude 只向组内 Codex 汇报；组内 Codex 在关键节点向 HQ 使用同样三行模板，并引用 `docs/plans/gX-*.md`、`docs/reports/<date>-gX-*-cavr.md` 等文件。
- 所有角色仍遵循 `Report/Status/Next` + 文档引用的规则，老板只需查看引用路径即可掌握全局状态。
