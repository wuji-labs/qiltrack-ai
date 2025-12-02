# CI/CD 配置指南

> **创建日期**: 2025-12-02
> **负责团队**: G4 - 基础设施与工具链组
> **状态**: ✅ 已完成

---

## 📋 目录

1. [概述](#概述)
2. [Workflows 说明](#workflows-说明)
3. [环境变量配置](#环境变量配置)
4. [使用指南](#使用指南)
5. [故障排查](#故障排查)
6. [最佳实践](#最佳实践)

---

## 概述

本项目配置了三个 GitHub Actions workflows,实现了完整的 CI/CD 流程:

| Workflow | 文件 | 触发条件 | 主要功能 |
|----------|------|----------|----------|
| **CI** | `ci.yml` | Push/PR | 自动化测试、构建验证 |
| **Code Quality** | `code-quality.yml` | Push/PR | 代码质量检查、安全审计 |
| **Deploy** | `deploy.yml` | Main push/手动 | 自动部署到 Vercel |

---

## Workflows 说明

### 1. CI Workflow (`ci.yml`)

**目标**: 确保所有代码变更通过测试和构建

**Jobs**:

#### 1.1 Test Job
- 运行环境检查 (`npm run env:check`)
- 执行单元测试 (`npm run test:ci`)
- 上传测试覆盖率报告

**触发条件**:
```yaml
on:
  push:
    branches: [main, develop, g[1-4]/**]
  pull_request:
    branches: [main, develop]
```

#### 1.2 Lint Job
- 运行 ESLint 检查代码规范

#### 1.3 Build Job
- 构建 Next.js 应用
- 验证构建产物
- 上传构建缓存

**运行时间**: ~5-8 分钟

---

### 2. Code Quality Workflow (`code-quality.yml`)

**目标**: 保障代码质量和安全性

**Jobs**:

#### 2.1 Type Check
- 运行 TypeScript 编译器检查类型错误
- 确保类型安全

#### 2.2 Security Audit
- 运行 `npm audit` 检查依赖漏洞
- 阻止高危漏洞合并

#### 2.3 Dependency Review (仅 PR)
- 检查新增依赖的安全性
- 防止引入恶意包

#### 2.4 PR Checks (仅 PR)
- 验证 PR 标题格式: `[G1/Phase1] Description`
- 检查 Conventional Commits 规范
- 统计新增 TODO 数量(>5 个会警告)

#### 2.5 PR Ready Check
- 汇总所有质量检查结果
- 所有检查通过才允许合并

**运行时间**: ~3-5 分钟

---

### 3. Deploy Workflow (`deploy.yml`)

**目标**: 自动化部署到 Vercel

**Jobs**:

#### 3.1 Pre-deploy Checks
- 运行完整测试套件
- 执行 Linter 和类型检查
- 确保部署前代码质量

#### 3.2 Deploy Production
**触发条件**:
- Push to `main` 分支
- 手动触发 (选择 production 环境)

**步骤**:
1. 安装 Vercel CLI
2. 拉取生产环境配置
3. 构建项目
4. 部署到生产环境
5. 创建部署摘要

#### 3.3 Deploy Staging
**触发条件**:
- 手动触发 (选择 staging 环境)

**特点**:
- 部署到预览环境
- 不影响生产环境
- 用于测试新功能

#### 3.4 Post-deploy
- 为 Git tag 创建 Release Notes
- 自动生成 GitHub Release
- 发送部署成功通知

#### 3.5 Rollback
- 部署失败时触发
- 自动创建 Issue 记录事故
- 标记为 `critical` 优先处理

**运行时间**: ~8-12 分钟

---

## 环境变量配置

### 必需的 GitHub Secrets

在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中配置:

#### 1. Supabase 配置
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

#### 2. LLM 提供商 (至少配置一个)
```bash
HELICONE_API_KEY=sk-helicone-xxx
OPENROUTER_API_KEY=sk-or-xxx
```

#### 3. 市场数据
```bash
FINNHUB_API_KEY=xxx
```

#### 4. 认证
```bash
NEXTAUTH_SECRET=<32字符随机字符串>
NEXTAUTH_URL=https://your-domain.com
```

#### 5. 可观测性 (可选)
```bash
LANGFUSE_PUBLIC_KEY=pk-lf-xxx
LANGFUSE_SECRET_KEY=sk-lf-xxx
```

#### 6. Vercel 部署
```bash
VERCEL_TOKEN=xxx                # Vercel Personal Access Token
VERCEL_ORG_ID=xxx               # 组织 ID
VERCEL_PROJECT_ID=xxx           # 项目 ID
```

---

### 获取 Vercel Token 和 IDs

#### 1. 获取 Vercel Token
1. 访问 https://vercel.com/account/tokens
2. 点击 "Create Token"
3. 命名为 `GitHub Actions CI/CD`
4. 选择 Scope: **Full Account**
5. 复制 Token 并保存到 GitHub Secrets

#### 2. 获取 Vercel Org ID 和 Project ID
```bash
# 在本地项目目录运行
npx vercel link

# Org ID 和 Project ID 会保存在 .vercel/project.json
cat .vercel/project.json
```

输出示例:
```json
{
  "orgId": "team_xxx",
  "projectId": "prj_xxx"
}
```

---

## 使用指南

### 场景 1: 提交代码到功能分支

**操作**:
```bash
git checkout -b g1/phase1-feature-x
git add .
git commit -m "feat(g1): add new feature X"
git push origin g1/phase1-feature-x
```

**触发的 Workflows**:
- ✅ CI Workflow (测试 + 构建)
- ✅ Code Quality Workflow (类型检查 + 安全审计)

**预期结果**:
- 所有检查通过 ✅
- 可以创建 PR

---

### 场景 2: 创建 Pull Request

**操作**:
```bash
# PR 标题格式示例:
[G1/Phase1] 拆分 ReportGeneratorSection 组件
```

**触发的 Workflows**:
- ✅ CI Workflow
- ✅ Code Quality Workflow
  - PR Title 格式检查
  - Conventional Commits 检查
  - Dependency Review
  - TODO 数量检查

**预期结果**:
- 所有检查通过后才能合并
- Review 完成后合并到 main

---

### 场景 3: 合并到 Main (自动部署生产)

**操作**:
```bash
git checkout main
git merge g1/phase1-feature-x
git push origin main
```

**触发的 Workflows**:
- ✅ CI Workflow (再次验证)
- ✅ Code Quality Workflow
- ✅ **Deploy Workflow** (自动部署到生产环境)

**部署流程**:
1. Pre-deploy Checks (5分钟)
2. Deploy to Production (8分钟)
3. Post-deploy Tasks (1分钟)

**查看部署状态**:
- GitHub Actions 页面: https://github.com/你的仓库/actions
- Vercel Dashboard: https://vercel.com/dashboard

---

### 场景 4: 手动部署到 Staging

**操作**:
1. 访问 GitHub Actions 页面
2. 选择 **Deploy to Vercel** workflow
3. 点击 **Run workflow**
4. 选择分支: `develop` 或功能分支
5. 选择环境: **staging**
6. 点击 **Run workflow**

**用途**:
- 测试新功能
- 演示给客户
- 验证修复

---

### 场景 5: 发布新版本

**操作**:
```bash
# 创建版本 tag
git tag -a v1.2.0 -m "Release v1.2.0: Add token tracking feature"
git push origin v1.2.0
```

**触发的 Workflows**:
- ✅ Deploy Workflow (部署 + 创建 GitHub Release)

**自动生成**:
- GitHub Release 页面
- Release Notes (从 commit 历史生成)
- 版本归档

---

## 故障排查

### 问题 1: CI Workflow 失败 - 测试超时

**错误信息**:
```
Error: Test timeout of 30000ms exceeded
```

**解决方案**:
1. 检查测试代码中是否有未 mock 的异步调用
2. 增加测试超时时间
3. 优化慢速测试

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 60000  // 增加到 60 秒
  }
})
```

---

### 问题 2: Deploy Workflow 失败 - Vercel Token 无效

**错误信息**:
```
Error: Invalid token
```

**解决方案**:
1. 检查 `VERCEL_TOKEN` 是否配置正确
2. Token 是否过期
3. 重新生成 Token:
   ```bash
   # 访问 https://vercel.com/account/tokens
   # 删除旧 Token,创建新 Token
   ```

---

### 问题 3: Code Quality Workflow 失败 - PR 标题格式错误

**错误信息**:
```
❌ PR title must follow format: [G1/Phase1] Description
```

**解决方案**:
修改 PR 标题,确保格式正确:
```
✅ [G1/Phase1] 拆分 ReportGeneratorSection 组件
✅ [G2/Phase2] 添加 Redis 缓存层
✅ [HQ/Phase3] 更新架构文档

❌ Add new feature
❌ Fix bug
❌ G1: 添加功能
```

---

### 问题 4: Deploy 失败 - 环境变量缺失

**错误信息**:
```
Configuration validation failed: Missing required environment variable
```

**解决方案**:
1. 检查 GitHub Secrets 是否配置完整
2. 对比 [环境变量配置](#环境变量配置) 章节
3. 确保所有必需变量都已设置

---

### 问题 5: 类型检查失败

**错误信息**:
```
Type 'string | undefined' is not assignable to type 'string'
```

**解决方案**:
1. 本地运行类型检查:
   ```bash
   npx tsc --noEmit
   ```
2. 修复类型错误
3. 使用类型断言或可选链:
   ```typescript
   // 修改前
   const value: string = process.env.API_KEY

   // 修改后
   const value: string = process.env.API_KEY || ''
   // 或
   const value = process.env.API_KEY!
   ```

---

## 最佳实践

### 1. Commit Message 规范

**格式**: `type(scope): description`

**类型**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式 (不影响功能)
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建/工具配置
- `ci`: CI/CD 配置

**示例**:
```bash
git commit -m "feat(reports): add PDF export functionality"
git commit -m "fix(credits): handle insufficient credits error"
git commit -m "docs(architecture): update CI/CD guide"
git commit -m "test(llm): add token tracking tests"
```

---

### 2. PR 创建清单

在创建 PR 前,确保:

- [ ] 本地运行 `npm run pr:ready` 通过
- [ ] PR 标题符合 `[G1/Phase1]` 格式
- [ ] 所有 commits 遵循 Conventional Commits
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] TODO 数量 ≤ 5 个

---

### 3. 部署前检查清单

部署到生产环境前,确保:

- [ ] 所有测试通过
- [ ] 类型检查无错误
- [ ] 安全审计通过 (无高危漏洞)
- [ ] 在 Staging 环境验证过
- [ ] 数据库迁移已执行 (如有)
- [ ] 环境变量已更新 (如有新增)

---

### 4. 分支保护规则

建议在 GitHub 中配置以下规则:

**Main 分支**:
- ✅ 要求 PR 审查 (至少 1 人)
- ✅ 要求通过状态检查:
  - CI Workflow
  - Code Quality Workflow
- ✅ 要求分支最新
- ✅ 禁止直接 push

**Develop 分支**:
- ✅ 要求通过状态检查
- ✅ 允许直接 push (仅限团队成员)

---

### 5. 性能优化建议

#### 5.1 加速 CI 运行

**缓存依赖**:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20.x
    cache: 'npm'  # 缓存 node_modules
```

**并行运行 Jobs**:
```yaml
jobs:
  test:
    # ...
  lint:
    # 不依赖 test,可并行
  build:
    # 不依赖 test,可并行
```

#### 5.2 减少测试时间

**使用 `test:ci` 脚本**:
```json
{
  "scripts": {
    "test:ci": "cross-env CI=true vitest run"
  }
}
```

**跳过慢速测试** (仅 CI):
```typescript
describe.skipIf(process.env.CI)('Slow integration tests', () => {
  // 这些测试在 CI 中跳过
})
```

---

## 监控与告警

### GitHub Actions 监控

**查看运行历史**:
```
https://github.com/你的仓库/actions
```

**关键指标**:
- 成功率: >95%
- 平均运行时间: <10 分钟
- 失败原因分布

---

### 配置失败告警

**Slack 集成** (可选):
1. 创建 Slack Incoming Webhook
2. 添加到 GitHub Secrets: `SLACK_WEBHOOK_URL`
3. 在 workflow 中添加通知步骤:

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "❌ CI/CD Pipeline Failed",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Workflow*: ${{ github.workflow }}\n*Status*: Failed\n*Branch*: ${{ github.ref_name }}"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## 维护建议

### 定期任务

**每周**:
- [ ] 检查 workflow 运行状态
- [ ] 审查失败的构建
- [ ] 更新依赖版本

**每月**:
- [ ] 审查 GitHub Actions 使用额度
- [ ] 优化慢速 workflow
- [ ] 更新文档

**每季度**:
- [ ] 评估 CI/CD 效率
- [ ] 收集团队反馈
- [ ] 规划改进项

---

## 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [Conventional Commits 规范](https://www.conventionalcommits.org/)
- [项目架构文档](./ARCHITECTURE.md)
- [Worktree 并行推进方案](../plans/architecture-evolution-workstreams.md)

---

## 变更日志

| 日期 | 版本 | 变更内容 | 负责人 |
|------|------|---------|--------|
| 2025-12-02 | v1.0 | 初始版本,创建 3 个 workflows | G4-Codex |

---

**文档维护**: G4 团队
**最后更新**: 2025-12-02
**审查周期**: 每月一次
