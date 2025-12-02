# Worktree Port & Environment Management

## 🚨 重要：每个 Worktree 必须固定端口

### 问题

Next.js 的 `next dev` 会自动选择可用端口（3000 → 3001 → 3002...），导致：

- **邮件链接跳转错乱**：g2 邮件跳到 g1，g1 邮件跳到 g2
- **Session 混乱**：不同 worktree 的认证相互干扰

### 解决方案：固定端口

#### 方法 1：使用脚本（推荐）

```powershell
# 为每个 worktree 设置固定端口
.\scripts\set-worktree-port.ps1 -Name g1 -Port 3001
.\scripts\set-worktree-port.ps1 -Name g2 -Port 3002
.\scripts\set-worktree-port.ps1 -Name g3 -Port 3003
.\scripts\set-worktree-port.ps1 -Name g4 -Port 3004
```

#### 方法 2：手动修改

编辑每个 worktree 的 `package.json`：

```json
// D:\Projects\investor-ai-g1\package.json
{
  "scripts": {
    "dev": "next dev -p 3001"  // ← 固定 3001
  }
}

// D:\Projects\investor-ai-g2\package.json
{
  "scripts": {
    "dev": "next dev -p 3002"  // ← 固定 3002
  }
}
```

#### 端口分配建议

| Worktree    | 端口 | 说明    |
| ----------- | ---- | ------- |
| 总部 (main) | 3000 | 总部 HQ |
| g1          | 3001 | Group 1 |
| g2          | 3002 | Group 2 |
| g3          | 3003 | Group 3 |
| g4          | 3004 | Group 4 |
| g5          | 3005 | Group 5 |

---

## Reset Worktree 与环境变量管理

## 问题

`scripts/reset-worktree.ps1` 会从总部（`D:\Projects\investor-ai`）复制 `.env.local` 到各 worktree，可能覆盖本地配置。

## 解决方案

### 1. **推荐方案**：使用智能端口检测（无需配置）

我们的认证系统已支持自动端口检测，**无需在 `.env.local` 设置 `NEXT_PUBLIC_SITE_URL`**。

**工作原理**：

- 从 3001 访问 → 邮件链接自动返回 3001
- 从 3002 访问 → 邮件链接自动返回 3002
- 从 3003 访问 → 邮件链接自动返回 3003

**优点**：

- ✅ g1, g2, g3... 无需任何配置
- ✅ `reset-worktree.ps1` 不影响功能
- ✅ 开箱即用

### 2. **可选方案**：需要固定 URL 时

如果你需要所有 worktree 共享同一个认证 session（不推荐），可以在**总部** `.env.local` 设置：

```bash
# D:\Projects\investor-ai\.env.local（总部）
NEXT_PUBLIC_SITE_URL=http://localhost:3001  # 或其他固定端口
```

这样 `reset-worktree.ps1` 会同步到所有 worktree。

**缺点**：

- ❌ 所有邮件链接都返回固定端口（如 3001）
- ❌ 从 3002 触发的邮件点击后会跳到 3001

### 3. **Worktree 特定配置**（不推荐）

如果非要每个 worktree 用不同配置：

1. 在 worktree 创建 `.env.local.override`（自定义文件名）
2. 修改 `reset-worktree.ps1` 跳过 `.env.local` 复制
3. 手动管理每个 worktree 的配置

**不推荐**，因为维护成本高且容易出错。

---

## 最佳实践总结

### 开发环境（g1, g2, g3...）

1. **不设置** `NEXT_PUBLIC_SITE_URL`（或注释掉）
2. 让代码自动检测端口
3. 随时运行 `reset-worktree.ps1` 无影响

### 生产环境

在 Vercel/部署平台设置环境变量：

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 检查当前配置

```powershell
# 在 worktree 中检查
cat .env.local | grep NEXT_PUBLIC_SITE_URL

# 如果输出显示：
# NEXT_PUBLIC_SITE_URL=http://localhost:3002
# 建议注释掉或删除该行，让其自动检测
```

---

## FAQ

**Q: 运行 `reset-worktree.ps1 -Name g2` 会清除我的配置吗？**
A: 会覆盖 `.env.local`，但我们的方案不依赖该配置，所以不影响功能。

**Q: 我想让 g2 固定用 3002，g3 固定用 3003，怎么办？**
A: 不需要配置！代码会自动检测：访问 3002 → 返回 3002，访问 3003 → 返回 3003。

**Q: 什么时候需要设置 `NEXT_PUBLIC_SITE_URL`？**
A: 仅在以下场景：

- 生产环境（必须）
- 需要所有 worktree 共享 session（不推荐）
- 本地开发时想固定某个端口（极少数情况）

**Q: 如果我在总部（main）的 `.env.local` 设置了 `NEXT_PUBLIC_SITE_URL`？**
A: 所有 worktree 在 reset 后会继承该配置，邮件链接会固定跳转到总部设置的 URL。**不推荐**开发环境这样做。

**Q: 生产环境应该怎么配置？**
A: 在部署平台（Vercel/Railway/AWS 等）设置环境变量，不要依赖 `.env.local`：

```
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

---

## 相关文件

- `hooks/useSupabaseAuth.ts` - 智能端口检测逻辑
- `scripts/reset-worktree.ps1` - Worktree 重置脚本
- `.env.local.example` - 环境变量模板
- `docs/guides/worktree-multi-team.md` - Worktree 使用指南
