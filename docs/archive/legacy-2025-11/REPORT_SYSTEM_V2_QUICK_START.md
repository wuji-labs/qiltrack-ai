# 报告生成系统 v2.0 - 快速开始

**状态**: ✅ 准备部署到生产环境
**版本**: 2.0.0
**完成日期**: 2025-12-03

---

## 🚀 立即开始

### 第一步:配置 Inngest

```bash
# 运行交互式配置向导
./scripts/setup-inngest.sh

# 按照提示:
# 1. 创建 Inngest 账号 (https://app.inngest.com/sign-up)
# 2. 获取 API Keys
# 3. 配置本地和生产环境
```

### 第二步:部署到生产环境

```bash
# 一键部署 (包含数据库 migrations)
./scripts/deploy-production.sh --with-migrations

# 等待 5-10 分钟完成部署
```

### 第三步:验证部署

```bash
# 检查健康状态
curl https://YOUR_DOMAIN/api/health
# 预期: 200 OK

# 生成测试报告
curl -X POST https://YOUR_DOMAIN/api/report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"symbol": "AAPL", "language": "en", "tone": "baseline"}'
```

### 第四步:启用新系统 (Day 2)

```bash
# 在 Day 1 部署稳定 24 小时后
./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM true

# 开始 10% 流量测试
```

---

## 📚 重要文档

| 文档 | 描述 | 优先级 |
|------|------|--------|
| [COMPLETE_DEPLOYMENT_GUIDE.md](./COMPLETE_DEPLOYMENT_GUIDE.md) | 完整部署流程 | 🔴 必读 |
| [DEPLOYMENT_VERIFICATION_CHECKLIST.md](./DEPLOYMENT_VERIFICATION_CHECKLIST.md) | 验证清单 | 🔴 必读 |
| [PRODUCTION_MONITORING.md](./PRODUCTION_MONITORING.md) | 监控配置 | 🟡 重要 |
| [PROJECT_COMPLETION_SUMMARY.md](./PROJECT_COMPLETION_SUMMARY.md) | 项目总结 | 🟢 参考 |

---

## 🎯 8 天部署计划

| 天数 | 流量 | 行动 | 时间预估 |
|------|------|------|----------|
| **Day 1** | 0% | 部署到生产 | 30 分钟 |
| **Day 2** | 10% | 启用 Feature Flag | 10 分钟 |
| **Day 3-4** | 10% | 监控稳定性 | 每日 10 分钟 |
| **Day 5** | 100% | 全量切换 | 5 分钟 |
| **Day 6-8** | 100% | 稳定运行 | 每日 10 分钟 |

**总时间投入**: ~2 小时

---

## 🛠️ 常用命令

### 部署相关

```bash
# 完整部署 (首次)
./scripts/deploy-production.sh --with-migrations

# 更新部署 (后续)
vercel deploy --prod

# 切换 Feature Flag
./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM true/false
```

### 监控相关

```bash
# 实时监控
./scripts/monitor-metrics.sh

# 每日健康报告
./scripts/daily-health-report.sh --slack

# 查看日志
vercel logs --prod --follow
```

### 紧急操作

```bash
# 快速回滚 (< 2 分钟)
./scripts/rollback-deployment.sh --reason "原因说明"
```

---

## 📊 关键指标

### SLO 目标

| 指标 | 目标值 | 测量窗口 |
|------|--------|----------|
| 可用性 | 99.9% | 30 天 |
| P50 延迟 | < 25s | 24 小时 |
| P95 延迟 | < 45s | 24 小时 |
| 成功率 | > 99.5% | 24 小时 |
| 错误率 | < 0.5% | 1 小时 |

### 监控仪表板

- **Vercel**: https://vercel.com/dashboard
- **Inngest**: https://app.inngest.com
- **Sentry**: https://sentry.io
- **Supabase**: https://app.supabase.com

---

## ⚠️ 常见问题

### Q: 部署失败怎么办?

**A**:
1. 检查错误日志: `vercel logs --prod`
2. 验证环境变量: `vercel env ls production`
3. 查看故障排查: [COMPLETE_DEPLOYMENT_GUIDE.md § Troubleshooting](./COMPLETE_DEPLOYMENT_GUIDE.md#troubleshooting)

### Q: 如何快速回滚?

**A**:
```bash
./scripts/rollback-deployment.sh --reason "您的原因"
```
系统会在 2 分钟内回滚到旧版本。

### Q: 需要多久完成部署?

**A**:
- Day 1 初始部署: 30 分钟
- Day 2-8 渐进式发布: 每天 10 分钟
- 总计: ~2 小时 (分散在 8 天)

### Q: 部署有风险吗?

**A**:
- ✅ 零停机部署
- ✅ Feature Flag 控制
- ✅ 渐进式灰度 (10% → 100%)
- ✅ < 2 分钟快速回滚
- **风险等级**: 🟢 低

---

## 📞 获取帮助

### 文档

所有文档位于 `docs/` 目录:

```bash
docs/
├── COMPLETE_DEPLOYMENT_GUIDE.md       # 完整部署指南
├── DEPLOYMENT_VERIFICATION_CHECKLIST.md  # 验证清单
├── PRODUCTION_MONITORING.md           # 监控配置
├── PROJECT_COMPLETION_SUMMARY.md      # 项目总结
├── CODE_REVIEW_PR106.md               # 代码审查
└── POST_REVIEW_FIXES.md               # 修复报告
```

### 脚本

所有脚本位于 `scripts/` 目录:

```bash
scripts/
├── deploy-production.sh        # 生产部署
├── setup-inngest.sh            # Inngest 配置
├── toggle-feature-flag.sh      # Feature Flag 切换
├── rollback-deployment.sh      # 紧急回滚
├── monitor-metrics.sh          # 实时监控
└── daily-health-report.sh      # 健康报告
```

### 支持渠道

- **文档**: 查看 `docs/` 目录
- **代码**: 查看 `lib/core/reports/`
- **GitHub**: 查看 PR #106
- **Slack**: #eng-support (如有配置)

---

## ✅ 部署前检查清单

部署前请确认:

- [ ] 已阅读 [COMPLETE_DEPLOYMENT_GUIDE.md](./COMPLETE_DEPLOYMENT_GUIDE.md)
- [ ] 已配置 Inngest (运行 `./scripts/setup-inngest.sh`)
- [ ] 已准备 Vercel 项目访问权限
- [ ] 已准备 Supabase 项目访问权限
- [ ] 已配置 Slack webhook (可选,用于告警)
- [ ] 团队已了解回滚流程
- [ ] 已准备好监控仪表板访问

---

## 🎉 开始部署

准备好了?让我们开始:

```bash
# 1. 配置 Inngest
./scripts/setup-inngest.sh

# 2. 部署到生产环境
./scripts/deploy-production.sh --with-migrations

# 3. 查看部署状态
vercel ls --prod

# 4. 开始监控
./scripts/monitor-metrics.sh
```

**祝部署顺利!** 🚀

---

**版本**: v2.0.0
**最后更新**: 2025-12-03
**状态**: ✅ 生产就绪
