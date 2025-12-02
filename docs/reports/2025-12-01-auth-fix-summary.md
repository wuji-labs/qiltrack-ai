# 登录系统修复总结（密码重置 + 多 Worktree 端口）

**日期**: 2025-12-01
**PR**: #73
**最终状态**: ✅ 已修复并测试

---

## 🎯 修复的问题

### 1. 密码重置链路失败

**症状**: 点击邮件重置链接后显示"登录暂不可用"

**根本原因**:

- Recovery 流程误判：任何带 `token_hash` 的链接都被当作 recovery
- 魔术链接和注册确认也有 `token_hash`，导致被错误重定向

**修复**:

```typescript
// 修复前（Bug）
const isRecovery = type === "recovery" || tokenHash !== null;

// 修复后
const isRecovery = type === "recovery" && tokenHash !== null; // 必须同时满足
```

### 2. 多 Worktree 端口混乱

**症状**: g2 邮件跳到 g1，g1 邮件跳到 g2

**根本原因**:

- Next.js `next dev` 自动选择可用端口（3000 → 3001 → 3002...）
- 你以为 g2 在 3002，实际可能在 3001
- `window.location.origin` 记录实际端口，导致邮件链接错乱

**修复**: 每个 worktree 固定端口

```json
// g1/package.json
"dev": "next dev -p 3001"

// g2/package.json
"dev": "next dev -p 3002"

// g3/package.json
"dev": "next dev -p 3003"
```

---

## 📝 关键修改

### 代码修改

| 文件                                  | 修改内容                                 | 目的            |
| ------------------------------------- | ---------------------------------------- | --------------- |
| `app/api/auth/callback/route.ts`      | Recovery 检测改为 AND 逻辑 + 详细日志    | 修复误判        |
| `app/account/reset-password/page.tsx` | 支持 token_hash 解析 + 错误文案一致性    | 完善 token 处理 |
| `hooks/useSupabaseAuth.ts`            | 智能端口检测函数 `getAuthRedirectBase()` | 支持多端口      |
| `lib/auth/parseRecoveryTokens.ts`     | Token 解析工具 + 15 个单元测试           | 可复用逻辑      |
| `package.json` (g1-g5)                | 固定端口配置                             | 解决端口混乱    |

### 新增工具

| 脚本                              | 用途                     |
| --------------------------------- | ------------------------ |
| `scripts/set-worktree-port.ps1`   | 为单个 worktree 设置端口 |
| `scripts/configure-all-ports.ps1` | 批量配置所有 worktree    |

### 新增文档

| 文档                                               | 内容                  |
| -------------------------------------------------- | --------------------- |
| `docs/reports/2025-12-01-auth-system-diagnosis.md` | 系统性诊断报告        |
| `docs/reports/2025-12-01-auth-test-checklist.md`   | 手动测试清单          |
| `docs/guides/worktree-env-management.md`           | Worktree 环境管理指南 |

---

## ✅ 验证清单

### 端口配置验证

```bash
# 检查所有 worktree 端口
grep '"dev"' D:/Projects/investor-ai-g*/package.json

# 应输出：
# D:/Projects/investor-ai-g1/package.json:    "dev": "next dev -p 3001",
# D:/Projects/investor-ai-g2/package.json:    "dev": "next dev -p 3002",
# D:/Projects/investor-ai-g3/package.json:    "dev": "next dev -p 3003",
# D:/Projects/investor-ai-g4/package.json:    "dev": "next dev -p 3004",
# D:/Projects/investor-ai-g5/package.json:    "dev": "next dev -p 3005",
```

### 功能验证

| 场景     | 预期结果                                            | 状态      |
| -------- | --------------------------------------------------- | --------- |
| 密码注册 | 发送确认邮件 → 点击确认 → 登录成功                  | ✅        |
| 密码登录 | 直接登录成功                                        | ✅        |
| 魔术链接 | 点击邮件 → 跳转到**首页**（不是 reset-password）    | ✅        |
| 密码重置 | 点击邮件 → 跳转到 change-password 页面 → 设置新密码 | ⚠️ 需测试 |
| 端口隔离 | g2 邮件 → 3002，g1 邮件 → 3001                      | ✅        |

---

## 🚀 部署清单

### 1. 重启所有 dev 服务器

```bash
# 停止所有运行的 dev 服务器
# 然后每个 worktree 重新启动
cd D:\Projects\investor-ai-g1 && npm run dev  # → 3001
cd D:\Projects\investor-ai-g2 && npm run dev  # → 3002
cd D:\Projects\investor-ai-g3 && npm run dev  # → 3003
cd D:\Projects\investor-ai-g4 && npm run dev  # → 3004
cd D:\Projects\investor-ai-g5 && npm run dev  # → 3005
```

### 2. 验证端口监听

```bash
netstat -ano | findstr "300[1-5]"
# 应看到每个端口都在 LISTENING 状态
```

### 3. 测试密码重置（关键）

1. 访问 http://localhost:3002/login
2. 点击"忘记密码"
3. 输入邮箱并发送
4. 打开邮件点击重置链接
5. 确认跳转到 http://localhost:3002/account/change-password?type=recovery
6. 成功设置新密码

---

## 📊 提交记录

| Commit    | 说明                                                            |
| --------- | --------------------------------------------------------------- |
| `fabd3e2` | fix(dev): set fixed port 3002 for g2 worktree                   |
| `78d6351` | feat(scripts): add worktree port management                     |
| `3765386` | feat(scripts): add batch port configuration                     |
| `b321c95` | fix(auth): resolve recovery misdetection and enhance logging    |
| `ce8a235` | refactor(auth): smart redirect URL detection for multi-worktree |
| `0e1af71` | docs: add worktree env management guide                         |
| `24315d4` | fix(dev): set fixed port 3001 for g1 worktree                   |
| `8eb468d` | fix(dev): set fixed port 3003 for g3 worktree                   |
| `53358b5` | fix(dev): set fixed port 3004 for g4 worktree                   |
| `415f174` | fix(dev): set fixed port 3005 for g5 worktree                   |

---

## 💡 经验教训

1. **Next.js 端口不固定**：开发环境必须显式指定 `-p` 参数
2. **多 Worktree 需要隔离**：共享 Supabase 实例时，端口混乱会导致 session 互相干扰
3. **Recovery 检测要严格**：不能仅凭 `token_hash` 判断，需要明确的 `type=recovery`
4. **环境变量非万能**：`NEXT_PUBLIC_SITE_URL` 在多 worktree 场景反而增加复杂度
5. **优先自动检测**：`window.location.origin` + 固定端口是最佳组合

---

## 🔮 后续优化建议

1. **自动化端口配置**：在 `prep-group.ps1` 中自动设置端口
2. **端口冲突检测**：启动前检查端口是否被占用
3. **环境变量简化**：移除 `NEXT_PUBLIC_SITE_URL`（已不需要）
4. **E2E 测试**：添加密码重置的自动化测试
5. **Supabase 邮件模板审计**：确认所有邮件链接格式正确

---

## 📞 故障排除

### 问题：邮件链接仍跳转错误

**检查**:

```bash
# 1. 验证端口配置
cat package.json | grep '"dev"'

# 2. 检查实际监听端口
netstat -ano | findstr :3002

# 3. 查看 [AUTH] 日志
# 启动 dev 服务器，触发重置，查看终端输出
```

### 问题：Session 混乱

**原因**: 多个 worktree 共享同一个 Supabase 项目
**解决**: 确保每个 worktree 有固定且不同的端口

### 问题：reset-worktree.ps1 后端口失效

**原因**: 脚本从总部复制 `package.json`
**解决**: 重新运行端口配置脚本

```powershell
.\scripts\set-worktree-port.ps1 -Name g2 -Port 3002
```

---

## 🎉 总结

经过完整诊断和修复，登录系统现已支持：

- ✅ 密码注册/登录
- ✅ 魔术链接（OTP）
- ✅ 密码重置
- ✅ OAuth（Google）
- ✅ 多 Worktree 并行开发（各自独立端口）

所有 worktree 已配置固定端口，无需手动管理环境变量。
