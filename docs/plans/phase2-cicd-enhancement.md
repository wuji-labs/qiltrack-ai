# Phase 2 - GitHub Actions CI/CD 增强方案

> **任务 ID**: G4-4.5
> **优先级**: P2
> **预计时间**: 3-4 小时
> **负责人**: G4 Claude
> **创建日期**: 2025-12-02
> **状态**: 📋 前期调研

---

## 📋 目录

1. [当前状态分析](#当前状态分析)
2. [CI/CD 架构设计](#cicd-架构设计)
3. [Workflow 方案](#workflow-方案)
4. [通知机制](#通知机制)
5. [部署清单](#部署清单)
6. [测试验证](#测试验证)

---

## 当前状态分析

### ✅ 已完成部分

1. **数据库备份脚本** (Phase 1)
   - ✅ `scripts/backup-database.sh` (Bash 版本)
   - ✅ `scripts/backup-database.ps1` (PowerShell 版本)
   - ✅ 功能完善:
     - 环境检查（Supabase CLI）
     - 自动压缩（gzip）
     - 清理旧备份（30 天）
     - 统计信息展示
     - 云存储上传接口（已预留）

### ❌ 缺失部分

1. **自动化执行**
   - 无定时任务（需要手动运行 `npm run backup:db`）
   - 无 CI/CD 集成

2. **失败通知**
   - 备份失败时无告警
   - 无团队通知机制

3. **测试自动化**
   - 无自动化测试流水线
   - 测试只能本地手动运行

4. **部署检查**
   - 部署前无健康检查
   - 无部署后验证

5. **并行测试**
   - 测试串行执行，速度慢
   - 无缓存机制

---

## CI/CD 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─ Push to branch → CI Pipeline
                            ├─ Pull Request    → Test + Lint
                            ├─ Merge to main   → Deploy to Staging
                            └─ Schedule (Cron) → Auto Backup
                            │
            ┌───────────────┴────────────────┐
            │                                │
    ┌───────▼────────┐            ┌────────▼─────────┐
    │  GitHub Actions │            │  GitHub Actions  │
    │   CI Pipeline   │            │  Backup Workflow │
    └────────┬────────┘            └────────┬─────────┘
             │                              │
    ┌────────▼─────────┐           ┌───────▼──────────┐
    │  1. Lint & Type  │           │  1. Run Backup   │
    │  2. Unit Tests   │           │  2. Upload to S3 │
    │  3. Build        │           │  3. Notify Team  │
    └────────┬─────────┘           └───────┬──────────┘
             │                              │
    ┌────────▼─────────┐           ┌───────▼──────────┐
    │  Deploy to       │           │  Slack/Email     │
    │  Vercel          │           │  Notification    │
    └──────────────────┘           └──────────────────┘
```

### Workflow 列表

| Workflow 名称 | 触发条件 | 功能 | 优先级 |
|-------------|---------|-----|-------|
| `ci.yml` | Push/PR | 代码检查、测试、构建 | 🔴 P0 |
| `daily-backup.yml` | Cron (00:00 UTC) | 每日自动备份 | 🔴 P0 |
| `deploy-staging.yml` | Push to main | 部署到 Staging | 🟡 P1 |
| `deploy-production.yml` | Manual trigger | 部署到 Production | 🟡 P1 |
| `health-check.yml` | 部署后 | 健康检查 | 🟢 P2 |

---

## Workflow 方案

### Workflow 1: CI Pipeline (`ci.yml`)

#### 功能
- 代码格式检查（Prettier）
- 类型检查（TypeScript）
- 单元测试（Jest）
- 构建验证（Next.js build）
- 缓存优化（node_modules）

#### 实现

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

# 并发控制：同一 PR 只运行最新的 workflow
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-and-type-check:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Prettier
        run: npm run format:check

      - name: Run ESLint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15

    strategy:
      matrix:
        node-version: [20, 22]  # 测试多个 Node 版本

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci
        env:
          # 使用测试环境变量
          NODE_ENV: test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unittests
          fail_ci_if_error: false

  build:
    name: Build
    runs-on: ubuntu-latest
    timeout-minutes: 10
    needs: [lint-and-type-check, test]  # 依赖前面的 job

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          # 使用 dummy 环境变量避免构建失败
          NEXT_PUBLIC_SUPABASE_URL: https://dummy.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: dummy-key

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ github.sha }}
          path: .next
          retention-days: 7

  # 所有 job 成功后的总结
  ci-success:
    name: CI Success
    runs-on: ubuntu-latest
    needs: [lint-and-type-check, test, build]
    if: success()

    steps:
      - name: Success message
        run: echo "✅ All CI checks passed!"
```

**验收标准**:
- [ ] Push 代码后自动触发
- [ ] Lint/Type/Test/Build 全部通过
- [ ] 失败时 PR 无法合并
- [ ] 构建时间 < 5 分钟

---

### Workflow 2: 每日自动备份 (`daily-backup.yml`)

#### 功能
- 每天 UTC 00:00（北京时间 08:00）自动备份
- 上传到 AWS S3 / Azure Blob Storage
- 失败时发送 Slack 告警
- 支持手动触发

#### 实现

```yaml
# .github/workflows/daily-backup.yml
name: Daily Database Backup

on:
  schedule:
    # 每天 UTC 00:00 (北京时间 08:00)
    - cron: '0 0 * * *'

  # 支持手动触发
  workflow_dispatch:
    inputs:
      upload_to_cloud:
        description: 'Upload to cloud storage (S3/Azure)'
        required: false
        default: 'true'
        type: boolean

jobs:
  backup:
    name: Backup Supabase Database
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Supabase CLI
        run: |
          npm install -g supabase
          supabase --version

      - name: Create backup directory
        run: mkdir -p ./backups/db

      - name: Login to Supabase
        run: |
          echo "${{ secrets.SUPABASE_ACCESS_TOKEN }}" | supabase login --token
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}

      - name: Run backup script
        id: backup
        run: |
          bash scripts/backup-database.sh
          echo "backup_file=backups/db/backup_$(date +%Y%m%d_%H%M%S).sql.gz" >> $GITHUB_OUTPUT

      - name: Upload to AWS S3
        if: ${{ github.event.inputs.upload_to_cloud == 'true' || github.event_name == 'schedule' }}
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
        run: |
          aws s3 cp ${{ steps.backup.outputs.backup_file }} \
            s3://${{ secrets.S3_BACKUP_BUCKET }}/investor-ai/$(basename ${{ steps.backup.outputs.backup_file }})

      - name: Upload to GitHub Artifacts (fallback)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: backup-${{ github.run_number }}
          path: backups/db/*.sql.gz
          retention-days: 30

      - name: Notify Slack on Success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Database backup completed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Database Backup - Success*\n\n📦 Backup File: `${{ steps.backup.outputs.backup_file }}`\n🗓️ Date: $(date '+%Y-%m-%d %H:%M:%S')\n🔗 Workflow: <${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Run>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

      - name: Notify Slack on Failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "❌ Database backup failed!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Database Backup - Failed*\n\n⚠️ Action Required: Database backup failed\n🗓️ Date: $(date '+%Y-%m-%d %H:%M:%S')\n🔗 Workflow: <${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Run>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**验收标准**:
- [ ] 每天自动运行
- [ ] 备份文件上传到 S3
- [ ] 成功/失败都发送 Slack 通知
- [ ] 支持手动触发

---

### Workflow 3: 部署到 Staging (`deploy-staging.yml`)

#### 功能
- 合并到 main 分支后自动部署到 Staging
- 运行集成测试
- 部署后健康检查

#### 实现

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy to Vercel Staging
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          # 使用 Staging 环境变量
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'  # Deploy to production environment on Vercel
          working-directory: ./

      - name: Wait for deployment
        run: sleep 30  # 等待 Vercel 部署完成

      - name: Health check
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://staging.investor-ai.com/api/health)
          if [ "$response" != "200" ]; then
            echo "Health check failed: $response"
            exit 1
          fi
          echo "Health check passed: $response"

      - name: Notify team
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "${{ job.status == 'success' && '✅' || '❌' }} Staging deployment ${{ job.status }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Staging Deployment - ${{ job.status }}*\n\n🚀 Environment: Staging\n🔗 URL: https://staging.investor-ai.com\n📝 Commit: ${{ github.event.head_commit.message }}\n👤 Author: ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**验收标准**:
- [ ] 合并到 main 后自动触发
- [ ] 部署到 Vercel Staging
- [ ] 健康检查通过
- [ ] Slack 通知发送

---

### Workflow 4: 并行测试优化 (`test-parallel.yml`)

#### 功能
- 使用矩阵策略并行运行测试
- 缓存 node_modules 和 Jest cache
- 按模块分组测试

#### 实现

```yaml
# .github/workflows/test-parallel.yml
name: Parallel Test Suite

on:
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test - ${{ matrix.test-group }}
    runs-on: ubuntu-latest
    timeout-minutes: 10

    strategy:
      matrix:
        test-group:
          - unit-core      # lib/core/**/*.test.ts
          - unit-services  # lib/services/**/*.test.ts
          - unit-api       # lib/api/**/*.test.ts
          - integration    # __tests__/integration/**/*.test.ts

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Restore Jest cache
        uses: actions/cache@v4
        with:
          path: .jest-cache
          key: jest-${{ runner.os }}-${{ matrix.test-group }}-${{ hashFiles('**/*.test.ts') }}

      - name: Run tests
        run: |
          case "${{ matrix.test-group }}" in
            unit-core)
              npm run test -- lib/core --coverage
              ;;
            unit-services)
              npm run test -- lib/services --coverage
              ;;
            unit-api)
              npm run test -- lib/api --coverage
              ;;
            integration)
              npm run test -- __tests__/integration --coverage
              ;;
          esac
        env:
          NODE_ENV: test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: ${{ matrix.test-group }}
```

**验收标准**:
- [ ] 测试并行执行
- [ ] 总时间减少 50%+
- [ ] 缓存命中率 > 80%

---

## 通知机制

### Slack 集成

#### 1. 创建 Slack App

1. 访问 https://api.slack.com/apps
2. 创建新 App: "Investor AI CI/CD Bot"
3. 添加 Incoming Webhook
4. 选择频道: `#investor-ai-alerts`
5. 复制 Webhook URL

#### 2. 配置 GitHub Secrets

```bash
# Settings → Secrets and variables → Actions → New repository secret

SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

#### 3. 通知模板

**成功通知**:
```
✅ Daily Backup - Success

📦 Backup File: backup_20251202_000000.sql.gz
💾 Size: 1.2 GB (compressed)
☁️ Uploaded to: s3://backups/investor-ai/
🗓️ Date: 2025-12-02 08:00:00 UTC+8
🔗 View Run: https://github.com/.../actions/runs/...
```

**失败通知**:
```
❌ Daily Backup - Failed

⚠️ Action Required: Please check the workflow logs

📋 Error: Supabase CLI authentication failed
🗓️ Date: 2025-12-02 08:00:00 UTC+8
🔗 View Run: https://github.com/.../actions/runs/...
👥 Oncall: @infrastructure-team
```

### Email 备用通知（可选）

```yaml
- name: Send email on failure
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: ❌ Database Backup Failed - ${{ github.run_number }}
    to: infrastructure@investor-ai.com
    from: github-actions@investor-ai.com
    body: |
      Database backup failed at ${{ github.run_started_at }}.

      Please check: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

---

## 部署清单

### GitHub Secrets 配置

```bash
# Supabase
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_PROJECT_REF=inmtounwqcjwsxkfnsfd

# AWS S3 (备份存储)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BACKUP_BUCKET=investor-ai-backups

# Slack 通知
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXX

# Vercel 部署
VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_ORG_ID=team_xxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Staging 环境
STAGING_SUPABASE_URL=https://staging.supabase.co
STAGING_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 添加 Secrets 步骤

1. 进入 GitHub 仓库: https://github.com/explore0012/ai-report
2. Settings → Secrets and variables → Actions
3. 点击 "New repository secret"
4. 逐个添加上述 secrets

### package.json 脚本

```json
{
  "scripts": {
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "lint": "next lint",
    "backup:db": "bash scripts/backup-database.sh"
  }
}
```

---

## 测试验证

### 本地测试

#### 1. 测试 CI Pipeline（使用 act）

```bash
# 安装 act (本地运行 GitHub Actions)
brew install act  # macOS
# 或 choco install act  # Windows

# 测试 CI workflow
act pull_request -W .github/workflows/ci.yml

# 测试备份 workflow
act schedule -W .github/workflows/daily-backup.yml
```

#### 2. 测试备份脚本

```bash
# 本地运行备份
npm run backup:db

# 检查备份文件
ls -lh backups/db/

# 验证压缩文件
gunzip -t backups/db/backup_*.sql.gz
```

### 集成测试

#### 1. 创建测试 PR

```bash
git checkout -b test/ci-workflow
echo "# Test CI" >> README.md
git add README.md
git commit -m "test: trigger CI workflow"
git push origin test/ci-workflow
```

在 GitHub 上创建 PR，验证:
- [ ] CI workflow 自动触发
- [ ] Lint/Type/Test/Build 全部通过
- [ ] PR 显示绿色勾号

#### 2. 手动触发备份

1. 进入 GitHub Actions
2. 选择 "Daily Database Backup"
3. 点击 "Run workflow"
4. 验证:
   - [ ] 备份成功
   - [ ] 文件上传到 S3
   - [ ] Slack 收到通知

---

## 成本估算

### GitHub Actions 用量

**免费额度**:
- 公开仓库: 无限
- 私有仓库: 2,000 分钟/月

**当前项目用量估算**:
- CI Pipeline: 5 分钟/次 × 20 次/天 = 100 分钟/天
- 每日备份: 10 分钟/天
- 部署: 5 分钟/次 × 3 次/天 = 15 分钟/天

**总计**: 125 分钟/天 × 30 天 = **3,750 分钟/月**

**结论**: 需要付费（$0.008/分钟 × 1,750 分钟 = **$14/月**）

### AWS S3 存储成本

**假设**:
- 每日备份大小: 1 GB
- 保留 90 天备份

**成本**:
- 存储: 90 GB × $0.023/GB = **$2.07/月**
- 上传: 30 次 × $0.005/1000 requests = **$0.15/月**

**总计**: **$2.22/月**

### 总成本

**GitHub Actions**: $14/月
**AWS S3**: $2.22/月

**合计**: **$16.22/月** (~¥117/月)

---

## 相关文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [AWS S3 定价](https://aws.amazon.com/s3/pricing/)

---

## 附录：Workflow 调试技巧

### 1. 查看 Workflow 日志

```bash
# 使用 GitHub CLI
gh run list
gh run view <run-id> --log
```

### 2. 重新运行失败的 Job

```bash
gh run rerun <run-id> --failed
```

### 3. 本地调试 Workflow

```bash
# 使用 act
act -l  # 列出所有 jobs
act -j <job-name>  # 运行特定 job
act -j test --secret-file .secrets  # 使用本地 secrets
```

### 4. Workflow 语法验证

```bash
# 使用 actionlint
brew install actionlint
actionlint .github/workflows/*.yml
```

---

**文档状态**: 📋 前期调研完成，等待 Phase 2 启动

**下一步**:
1. 等待 HQ 确认云存储方案（S3 或 Azure）
2. 创建 Slack Webhook
3. 配置 GitHub Secrets

---

*最后更新: 2025-12-02*
