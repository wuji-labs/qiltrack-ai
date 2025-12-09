# 🔐 环境变量安全管理指南

**重要性**: CRITICAL
**最后更新**: 2025-12-09

---

## ⚠️ 紧急行动 - API密钥已泄露

### 当前状态
`.env.local` 文件**已被提交到代码库**，包含以下真实密钥：

```
FINNHUB_API_KEY=d4b9sr9r01qrv4atd8ugd4b9sr9r01qrv4atd8v0
OPENROUTER_API_KEY=sk-or-v1-66c5bfc3314fc325f4bc0943d6b122af...
HELICONE_API_KEY=sk-helicone-46m2pui-c4seipi-srd3wia-26yiy5i
UPSTASH_REDIS_REST_TOKEN=AZb2AAIncDIy...
```

### 必须立即执行的操作

#### 步骤1: 轮换所有密钥（立即，0-30分钟）

1. **Finnhub API Key**
   - 登录: https://finnhub.io/dashboard
   - 撤销旧密钥: `d4b9sr9r01qrv4atd8ugd4b9sr9r01qrv4atd8v0`
   - 生成新密钥
   - 更新生产环境变量

2. **OpenRouter API Key**
   - 登录: https://openrouter.ai/keys
   - 撤销旧密钥: `sk-or-v1-66c5bfc3...`
   - 生成新密钥
   - 更新生产环境变量

3. **Helicone API Key**
   - 登录: https://helicone.ai/dashboard
   - 撤销旧密钥: `sk-helicone-46m2pui...`
   - 生成新密钥
   - 更新生产环境变量

4. **Upstash Redis Token**
   - 登录: https://console.upstash.com
   - 撤销旧Token: `AZb2AAIncDIy...`
   - 生成新Token
   - 更新生产环境变量

5. **Supabase Keys (如果也泄露)**
   - 登录 Supabase Dashboard
   - 检查是否需要轮换 Service Role Key
   - Anon Key 通常是公开的，但建议检查

6. **其他密钥**
   - NEXTAUTH_SECRET: 重新生成 `openssl rand -base64 32`
   - Stripe Keys: 如果使用，检查是否需要轮换

#### 步骤2: 从Git历史删除敏感文件（30-60分钟）

⚠️ **警告**: 这将重写Git历史，所有团队成员需要重新clone仓库

```bash
# 方法A: 使用 git filter-repo (推荐)
# 安装: pip install git-filter-repo

git filter-repo --path .env.local --invert-paths --force

# 方法B: 使用 BFG Repo-Cleaner
# 下载: https://rtyley.github.io/bfg-repo-cleaner/

java -jar bfg.jar --delete-files .env.local
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 方法C: 使用 git filter-branch (最后选择)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# 清理本地引用
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

#### 步骤3: 强制推送到远程仓库

```bash
# ⚠️ 警告: 这会破坏其他开发者的本地副本
git push origin --force --all
git push origin --force --tags

# 通知所有团队成员重新clone仓库
```

#### 步骤4: 验证.gitignore配置

确认以下内容在`.gitignore`中：

```gitignore
# 环境变量文件
.env
.env.*
!.env.example
!.env.local.example

# 特别确保
.env.local
.env.production
.env.development
```

#### 步骤5: 验证删除成功

```bash
# 检查整个Git历史中是否还有.env.local
git log --all --full-history -- .env.local

# 应该返回空结果

# 检查是否还有密钥痕迹
git grep -i "d4b9sr9r01qrv4atd8ug" $(git rev-list --all)
# 应该返回空结果
```

---

## 📋 环境变量最佳实践

### 开发环境

1. **创建 .env.local.example**
   - 包含所有必需的变量名
   - 使用占位符值
   - 添加注释说明如何获取真实值

2. **绝不提交真实密钥**
   - 使用 git hooks 防止意外提交
   - 定期审查提交历史

3. **使用不同的密钥**
   - 开发、测试、生产使用不同的密钥
   - 开发密钥权限最小化

### 生产环境

#### Vercel部署

1. 在Vercel Dashboard添加环境变量:
   - 导航到: Project Settings → Environment Variables
   - 分别设置 Production, Preview, Development 环境

2. 必需的生产环境变量:

```bash
# Supabase (生产实例)
NEXT_PUBLIC_SUPABASE_URL=https://inmtounwqcjwsxkfnsfd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<生产环境anon key>
SUPABASE_SERVICE_ROLE_KEY=<生产环境service role key>

# LLM服务商
OPENROUTER_API_KEY=<生产环境key>
OPENROUTER_MODEL=openai/gpt-5.1
HELICONE_API_KEY=<生产环境key>
HELICONE_MODEL=gpt-5.1

# 数据源
FINNHUB_API_KEY=<生产环境key>

# NextAuth
NEXTAUTH_URL=https://qiltrack.com
NEXTAUTH_SECRET=<强随机字符串，至少32字符>

# Stripe (如果启用支付)
STRIPE_SECRET_KEY=sk_live_<生产环境key>
STRIPE_WEBHOOK_SECRET=whsec_<生产环境secret>
STRIPE_PRICE_BASIC=price_<生产环境price id>
STRIPE_PRICE_PRO=price_<生产环境price id>

# Upstash Redis
UPSTASH_REDIS_REST_URL=<生产环境URL>
UPSTASH_REDIS_REST_TOKEN=<生产环境token>

# 功能开关
NEXT_PUBLIC_FEATURE_PAYWALL=true
NEXT_PUBLIC_ENABLE_DEV_LOGIN=false

# ⚠️ 禁用测试绕过
# TEST_REPORT_TOKEN不应该在生产环境设置
```

#### 其他平台

**AWS Secrets Manager**
```bash
aws secretsmanager create-secret \
  --name qiltrack-ai/production \
  --secret-string file://secrets.json
```

**Docker**
```bash
docker run -d \
  --env-file .env.production \
  --env NEXTAUTH_SECRET=$(openssl rand -base64 32) \
  qiltrack-ai:latest
```

---

## 🔍 密钥轮换检查清单

定期（每90天）执行以下检查：

```markdown
[ ] Finnhub API Key 轮换
[ ] OpenRouter API Key 轮换
[ ] Helicone API Key 轮换
[ ] Upstash Redis Token 轮换
[ ] Supabase Service Role Key 检查（必要时轮换）
[ ] NextAuth Secret 轮换
[ ] Stripe Keys 检查
[ ] 审查谁有权访问这些密钥
[ ] 检查密钥使用日志，查找异常活动
[ ] 更新密钥文档
```

---

## 🛡️ Git Hooks防护

创建 `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# 防止提交敏感文件

# 检查是否尝试提交.env.local
if git diff --cached --name-only | grep -E "\.env\.local$"; then
  echo "❌ 错误: 尝试提交 .env.local 文件"
  echo "这个文件包含敏感信息，不应该提交到Git"
  echo "请使用 .env.local.example 代替"
  exit 1
fi

# 检查是否包含潜在的API密钥
if git diff --cached | grep -E "(sk-[a-zA-Z0-9]{32,}|AIza[0-9A-Za-z_-]{35})"; then
  echo "⚠️  警告: 检测到潜在的API密钥"
  echo "请确认这不是真实的密钥"
  read -p "继续提交? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

exit 0
```

使其可执行:
```bash
chmod +x .git/hooks/pre-commit
```

---

## 📊 监控与告警

### 设置密钥使用监控

1. **Helicone监控**
   - 设置每日使用量告警
   - 检测异常使用模式

2. **Vercel Analytics**
   - 监控API调用频率
   - 设置成本告警

3. **Supabase Dashboard**
   - 监控数据库连接
   - 检查异常查询

### 告警规则示例

```yaml
# 示例告警配置
alerts:
  - name: "API密钥异常使用"
    condition: "api_calls > 1000 per hour"
    action: "email + slack"

  - name: "成本超支"
    condition: "daily_cost > $100"
    action: "email + sms"

  - name: "数据库异常访问"
    condition: "db_connections > 100"
    action: "email"
```

---

## ⚡ 应急响应流程

如果怀疑密钥泄露：

1. **立即撤销密钥** (0-5分钟)
2. **生成新密钥** (5-10分钟)
3. **更新生产环境** (10-15分钟)
4. **验证服务正常** (15-20分钟)
5. **审查访问日志** (20-60分钟)
6. **通知团队** (立即)
7. **事后分析** (24小时内)

---

## 📞 联系方式

- **安全团队**: security@qiltrack.com
- **紧急联系**: +86-xxx-xxxx-xxxx
- **Slack频道**: #security-alerts

---

**最后审查**: 2025-12-09
**下次审查**: 2026-03-09 (90天后)
