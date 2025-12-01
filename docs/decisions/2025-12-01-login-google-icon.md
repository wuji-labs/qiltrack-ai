# 登录页 Google 图标缺失 Architecture Snapshot

## 背景
- `/login` 页面 Google CTA 使用 `<Image src="/providers/google.svg">`。
- 当前 worktree 的 sparse-checkout 仅包含 `app docs hooks lib supabase types __tests__ scripts`，排除了 `public`，导致 `public/providers/google.svg` 不会被检出。
- 使用 `scripts/prep-group.ps1` / `scripts/reset-worktree.ps1` 重置后，`public` 再次被剔除，Google 图标反复 404，形成“修了又坏”。

## 设计目标
- 确保所有新建/重置的 worktree 默认包含 `public` 目录，静态登录图标不再缺失。
- 保持登录页使用现有资源路径 `/providers/google.svg`，避免额外代码修改或路径漂移。

## 技术约束
- Next.js App Router 静态资源需位于 `public`，路径区分大小写。
- 现有脚本（prep/reset）负责设置 sparse-checkout；需在脚本层面纳入 `public`，避免人工漏配。
- 不能破坏 node_modules/.next 缓存保留策略（脚本仍需跳过它们的 clean）。

## 文案 / 资源 key
- 静态资源：`public/providers/google.svg`（保持文件名与路径不变）。
- UI 文案 key：`auth.provider.google`（无需改动，仅确保图标可加载）。

## 测试要求
- 在新 worktree 执行 `git sparse-checkout list` 应包含 `public`。
- 登录页手动打开 `/login`，Google 按钮应显示彩色 Google 图标，无 404 请求。
- 脚本幂等：重复运行 reset/prep 后，`public/providers/google.svg` 仍存在。
