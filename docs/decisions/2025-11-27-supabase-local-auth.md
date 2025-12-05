# Snapshot：Supabase 本地注册切换（2025-11-27）

## 背景

- Stage 2 起所有登录/配额均依赖 Supabase（`hooks/useSupabaseAuth.ts`、`lib/supabase/server.ts`、`app/(auth)/login/page.tsx`），而本地 CLI stack（`supabase/config.toml`）已经提供 Inbucket（54324）来截获邮件，但只有在 `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` 时才会生效。
- `docs/guides/supabase-local-cli.md` 口头要求“把 `npx supabase status` 输出复制进 `.env.local`”，但 `.env.local.example` 仍默认写入托管 URL/密钥，`scripts/prep-group.ps1` 合并 env 时也继承了该配置，导致所有新 worktree 继续指向 Hosted。
- 团队虽然安装了 Supabase CLI，却没有一键切换命令，手动粘贴 3 个密钥既费时又容易遗漏；Auth 页面也没有任何提示，开发者在本地点击 “注册” 时依旧会触发托管项目的真实邮件发送。
- 现状缺少“我正在打到 Hosted”的可视信号，也没有脚本/文档指导多工作组如何同步 env，导致无法实现“npx supabase start → npm run dev → 本地注册”的预期闭环。

## 设计目标

1. **一键切换**：提供 `npm run supabase:env local|hosted`，自动更新 `.env.local` 中的 `NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_STORAGE_REPORT_BUCKET/TEST_REPORT_TOKEN`，避免手动复制。
2. **状态可视**：登录页与开发者控制台都能清晰显示当前 Supabase 实例（Hosted vs CLI），点击注册前即可知道是否会向真实邮箱发信。
3. **现有代码零侵入**：保留 `lib/supabase/server.ts` / `hooks/useSupabaseAuth.ts` 的对外接口；新的 env 解析只提供辅助 hook/util，不打破现有消费者。
4. **多 worktree 对齐**：`scripts/prep-group.ps1` / `docs/guides/worktree-multi-team.md` 补充 Supabase 部分，确保 G1/G2 切分后可独立跑 CLI。
5. **文档同步**：`docs/guides/supabase-local-cli.md`、`ENVIRONMENT.md`、`.env.local.example` 均需更新，避免再出现“只写托管值”的单点信息。

## 技术约束

- Supabase CLI 版本锁定为 ≥2.62（见 `ENVIRONMENT.md`），脚本必须兼容 `npx supabase status --format json`（若 CLI 未启动需提示 `npx supabase start`）。
- `.env.local` 中其它密钥（Finnhub/OpenRouter/Stripe）不可被脚本覆盖；只允许改写 Supabase 相关 key。
- 多环境密钥不能入库，因此 Hosted 值需放在 `.env.supabase.hosted`（新增、gitignored）或 `supabase/.secrets/hosted.env`，脚本从该文件读取。
- 新的 UI 文案需要在 `lib/i18n.tsx` 为 EN/JA/KO/繁/简 五套语言补全，遵循现有格式。
- Login Banner 不得依赖服务器 fetch，只能基于 `NEXT_PUBLIC_SUPABASE_URL` 和（可选）`NEXT_PUBLIC_SUPABASE_EXPECTED_DOMAIN` 来判定。
- `TEST_REPORT_TOKEN` 仍用于本地免登录生成报告；在 Hosted 模式必须保留现有值以避免误用。

## 文案 key

| key                          | zh-Hans                                                                       | en                                                                                 | 说明                           |
| ---------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------ |
| `auth.env.banner.local`      | `本地 Supabase CLI 已启用 · 魔法链接仅写入 Inbucket (http://127.0.0.1:54324)` | `Local Supabase CLI · Magic link is captured in Inbucket (http://127.0.0.1:54324)` | 绿色提示，附 Inbucket 链接按钮 |
| `auth.env.banner.hosted`     | `托管 Supabase · 将向真实邮箱发送魔法链接`                                    | `Hosted Supabase · Magic link will be delivered to your real inbox`                | 琥珀色警告                     |
| `auth.env.banner.switchHint` | `执行 npm run supabase:env local / hosted 切换目标`                           | `Run npm run supabase:env local / hosted to switch targets`                        | 解释如何切换                   |
| `auth.env.banner.openInbox`  | `打开 Inbucket`                                                               | `Open Inbucket`                                                                    | 本地模式按钮文案               |

（以上 key 需同步到其它语种）

## 工作拆解

### G1 – Auth Experience（分支：`g1/local-auth-signal`）

- 新增 `lib/config/supabaseEnv.ts`（或同名 util）解析 `process.env.NEXT_PUBLIC_SUPABASE_URL`，暴露 `getSupabaseStack(): { mode: "local" | "hosted"; host: string; isLocal: boolean; inbucketUrl?: string }`，同时在 dev 环境且检测到 Hosted 时 `console.warn`。
- 在 `app/(auth)/login/page.tsx` 引入该 util，在表单上方渲染带 icon 的提示条：本地模式显示绿色 Inbucket 提示 + “打开 Inbucket” 链接，Hosted 模式显示琥珀色警告与切换说明。
- 在 `hooks/useSupabaseAuth.ts` 中，当 `process.env.NODE_ENV === "development"` 且判定为 Hosted 时，初次调用 `signInWithEmail` 之前输出一次 `console.warn("You are pointing to hosted Supabase ...")`，防止 CLI 没启动的情况误导。
- 更新 `lib/i18n.tsx` 5 种语言的上述文案；新增相应 Vitest（例如 `lib/config/supabaseEnv.test.ts`）覆盖 URL 判定 & banner 渲染（可 snapshot）。
- 交付文档：`docs/reports/<date>-g1-local-auth-cavr.md`（记录 UI 变化 + 截图 + lint/test 结果）。

### G2 – Platform Automation（分支：`g2/supabase-env-sync`）

- 新增 `scripts/supabase-env.mjs`（Node ESM），支持 `--mode local|hosted` 参数：
  - `local`：调用 `npx supabase status --format json` 读取 `api.url`、`api.anonKey`、`api.serviceRoleKey`，若 CLI 未启动则提示 `npx supabase start`。
  - `hosted`：从 `.env.supabase.hosted`（gitignore、新模板 `.env.supabase.hosted.example` ）读取对应 key。
  - 脚本仅更新 `.env.local` 中上述 5 个 key，并保留原有顺序（可借助 `dotenv`/正则）。操作前输出 diff 并要求 `--force` 或 Y/N 确认。
- 在 `package.json` 增加：`"supabase:env:local": "node scripts/supabase-env.mjs --mode local", "supabase:env:hosted": "node scripts/supabase-env.mjs --mode hosted"`，并在 README/ENVIRONMENT 中引用。
- `.env.local.example` 加入双模板块（Hosted / Local），附注“建议通过 npm run supabase:env 填充”；新增 `.env.supabase.hosted.example`。
- 更新 `docs/guides/supabase-local-cli.md`（新增“一键切换”章节）、`ENVIRONMENT.md`（Checklist + 故障排查）、`docs/guides/worktree-multi-team.md`（提醒新建 worktree 后运行 `npm run supabase:env local`），并在 `scripts/prep-group.ps1` 完成 env 合并后输出“记得执行 supabase:env”提示。
- 交付文档：`docs/reports/<date>-g2-supabase-env-cavr.md`（含脚本示例输出、lint/test 结果、`supabase status` 截图说明）。

## 测试 / 验收

1. **通用**：`npm run lint`、`npm run test`。
2. **G2 脚本**：`node scripts/supabase-env.mjs --mode local`（CLI 运行中）应更新 `.env.local`；随后 `npm run supabase:env hosted` 恢复托管值，确认仅 5 个 key 变化。
3. **本地链路**：`npx supabase start` → `npm run supabase:env local` → `npm run dev` → 在 `/login` 输入邮箱，验证浏览器 Network 调用 `http://127.0.0.1:54321`，并在 `http://127.0.0.1:54324` Inbucket 收到邮件。
4. **Hosted 提示**：运行 `npm run supabase:env hosted` 后访问 `/login`，确认呈现琥珀警告与切换指南，不再误导。
5. **脚本幂等性**：连续运行 `npm run supabase:env local` 两次不应重复追加；`git status` 仅显示 `.env.local` 变化。
6. **多组协作**：在新 worktree（例如 `qiltrack-ai-g1`）执行脚本，验证 `GROUP.md` / plan 中指向的流程可独立完成。

## 里程碑

- **T0（11/27 中午）**：G2 完成 `scripts/supabase-env.mjs` 与 `.env` 模板更新，文档草稿 ready，供 G1 先行验证。
- **T1（11/27 晚）**：G1 合并 login banner + i18n，输出 CAVR，等待 CLI 脚本稳定。
- **T2（11/28 中午）**：联合验证（CLI+UI），在 `docs/reports/<date>-supabase-local-auth-validation.md` 记录操作截图，之后进入 PR 合流阶段。
- **依赖关系**：两组可并行开发；但发布前需使用 G2 新脚本复测，否则仍可能指向 Hosted。

本 Snapshot 为 G1/G2 执行的唯一真值，请在组内文档/计划中引用此文件。
