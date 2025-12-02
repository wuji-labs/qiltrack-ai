# CI/CD 快速参考

## 🚀 Workflows 总览

| Workflow | 触发时机 | 主要功能 | 运行时间 |
|----------|---------|---------|---------|
| **CI** | Push/PR | 测试 + 构建 | ~5-8 min |
| **Code Quality** | Push/PR | 类型检查 + 安全审计 | ~3-5 min |
| **Deploy** | Main push/手动 | 自动部署 | ~8-12 min |

---

## 📝 常用命令

### 本地验证
```bash
# 完整检查 (PR 前必做)
npm run pr:ready

# 单独运行
npm run lint              # ESLint
npm run test             # 单元测试
npx tsc --noEmit         # 类型检查
npm run env:check        # 环境变量检查
```

---

## 🏷️ PR 标题格式

```
[G1/Phase1] 拆分 ReportGeneratorSection 组件
[G2/Phase2] 添加 Redis 缓存层
[HQ/Phase3] 更新架构文档
```

---

## 💬 Commit Message 格式

```bash
feat(scope): 新功能
fix(scope): Bug 修复
docs(scope): 文档更新
test(scope): 测试
chore(scope): 工具/配置
```

---

## 🔧 必需的 GitHub Secrets

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### LLM (至少一个)
- `HELICONE_API_KEY`
- `OPENROUTER_API_KEY`

### 其他
- `FINNHUB_API_KEY`
- `NEXTAUTH_SECRET` (≥32 字符)
- `NEXTAUTH_URL`

### Vercel 部署
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

## 🎯 部署流程

### 自动部署 (生产)
```bash
git push origin main
# ✅ 自动触发部署到生产环境
```

### 手动部署 (Staging)
1. GitHub Actions 页面
2. Deploy to Vercel → Run workflow
3. 选择 branch + staging 环境
4. Run workflow

---

## ❌ 常见问题速查

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| 测试超时 | 异步调用未 mock | 增加 `testTimeout` |
| Token 无效 | Vercel Token 过期 | 重新生成 Token |
| PR 标题错误 | 格式不正确 | 使用 `[G1/Phase1]` 格式 |
| 类型错误 | TypeScript 类型不匹配 | 运行 `npx tsc --noEmit` |
| 环境变量缺失 | Secrets 未配置 | 检查 GitHub Secrets |

---

## 📊 质量门禁

### PR 合并条件
- ✅ 所有测试通过
- ✅ 类型检查无错误
- ✅ ESLint 通过
- ✅ 安全审计通过
- ✅ PR 标题格式正确
- ✅ 至少 1 人审查

---

## 🔗 相关资源

- [完整文档](./ci-cd-setup.md)
- [架构文档](./ARCHITECTURE.md)
- [Worktree 方案](../plans/architecture-evolution-workstreams.md)

---

**创建**: G4-Codex | **日期**: 2025-12-02
