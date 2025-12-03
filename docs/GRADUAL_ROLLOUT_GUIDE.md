# 报告生成系统重构 - 灰度发布指南

本文档描述如何安全地发布新的报告生成系统。

## 前置条件

1. 所有代码已合并到 `main` 分支
2. CI 测试全部通过
3. Staging 环境验证完成
4. 已配置 Feature Flag 环境变量

## 灰度发布步骤

### 第 1 天: 部署新代码 (0% 灰度)

```bash
# 1. 确保 Feature Flag 为 false
export NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM=false

# 2. 部署到生产环境
git push origin main
vercel deploy --prod

# 3. 验证部署成功
curl https://your-domain.com/api/health
```

**目标**: 新代码在生产环境运行,但未启用新功能

**验证**:
- [ ] 旧系统运行正常
- [ ] 无错误日志
- [ ] 用户无感知

---

### 第 2 天: 启用 10% 灰度

```bash
# 启用新系统
./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM true
```

**监控 (24小时)**:

```bash
# 实时监控
./scripts/monitor-metrics.sh
```

**关键指标**:
- Success Rate > 99.5% ✅
- P95 Latency < 45s ✅
- Error Rate < 0.1% ✅
- No Critical Errors ✅

**决策点**:
- ✅ 所有指标正常 → 继续下一步
- ❌ 任何指标异常 → 回滚 (见下方)

---

### 第 3-7 天: 观察期

继续监控以下内容:

1. **性能指标**
   - Inngest Dashboard: embeddings 任务成功率
   - Vercel Analytics: API 响应时间
   - Database: 查询性能

2. **错误日志**
   - Sentry / Vercel Logs
   - Inngest 失败任务
   - Database 错误

3. **用户反馈**
   - Support tickets
   - User reports
   - Customer satisfaction

---

### 第 8 天: 决策

#### 场景 A: 所有指标正常 ✅

```bash
# 100% 全量启用
# (已经启用,无需额外操作)
echo "✅ New system running at 100%"
```

#### 场景 B: 发现问题 ❌

```bash
# 立即回滚
./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM false

# 等待部署完成 (~2分钟)
# 验证旧系统恢复
curl https://your-domain.com/api/report?symbol=AAPL&testToken=xxx
```

---

## 回滚计划

### 快速回滚 (秒级)

```bash
# 关闭 Feature Flag
./scripts/toggle-feature-flag.sh NEW_REPORT_SYSTEM false
```

**时间**: ~2 分钟 (Vercel 重新部署)

**影响**:
- 新系统立即停止
- 旧系统接管
- 进行中的任务可能失败 (可接受)

---

### 完全回滚 (分钟级)

如果 Feature Flag 回滚不够:

```bash
# 1. 回滚代码
git revert <commit-hash>
git push origin main

# 2. 部署旧版本
vercel deploy --prod

# 3. 验证
curl https://your-domain.com/api/report?symbol=AAPL&testToken=xxx
```

---

### 数据库回滚 (慎用!)

**仅在数据库 schema 损坏时使用**:

```bash
# 1. 恢复数据库备份
psql $DATABASE_URL < backup-prod-YYYYMMDD.sql

# 2. 验证数据完整性
psql $DATABASE_URL -c "SELECT COUNT(*) FROM report_posts;"
```

⚠️ **警告**: 会丢失备份时间之后的所有数据

---

## 监控指标定义

### SLO (Service Level Objectives)

| 指标 | 目标 | 测量窗口 |
|------|------|----------|
| 可用性 | 99.9% | 30天 |
| P50 延迟 | < 25s | 实时 |
| P95 延迟 | < 45s | 实时 |
| P99 延迟 | < 60s | 实时 |
| 成功率 | 99.5% | 24小时 |

### 告警阈值

| 指标 | 警告 | 严重 |
|------|------|------|
| 错误率 | > 0.5% | > 1% |
| P95 延迟 | > 50s | > 60s |
| Inngest 失败率 | > 5% | > 10% |

---

## 检查清单

### 发布前

- [ ] 所有 PR 已合并
- [ ] CI 测试通过
- [ ] Staging 环境验证
- [ ] Feature Flag 配置为 `false`
- [ ] 数据库备份完成
- [ ] 回滚脚本测试通过
- [ ] 团队成员已通知

### 发布中

- [ ] 新代码部署成功 (0% 灰度)
- [ ] 旧系统运行正常
- [ ] Feature Flag 启用 (10% 灰度)
- [ ] 监控仪表板正常
- [ ] 无严重错误

### 发布后

- [ ] 所有指标在 SLO 范围内
- [ ] Inngest 任务正常运行
- [ ] 用户反馈正面
- [ ] 文档已更新
- [ ] 团队分享会议

---

## 常见问题

### Q: 如何知道哪些用户使用了新系统?

A: 查看 Vercel Analytics 或 Langfuse,筛选 `useNewSystem: true` 标签。

### Q: Inngest 任务失败了怎么办?

A:
1. 检查 Inngest Dashboard
2. 手动重试失败的任务
3. 如果持续失败,考虑回滚

### Q: 如何验证 Feature Flag 是否生效?

A:
```bash
# 调用 API 并查看响应头
curl -v https://your-domain.com/api/report?symbol=AAPL&testToken=xxx | grep "x-feature-flag"
```

---

## 联系人

- **技术负责人**: [Name]
- **On-call Engineer**: [Name]
- **Slack Channel**: #deployments
- **Incident Response**: [Runbook Link]

---

**最后更新**: 2025-12-03
**版本**: v1.0
