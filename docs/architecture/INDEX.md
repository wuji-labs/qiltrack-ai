# 📚 架构文档索引

欢迎来到 Investor AI 架构文档中心。本目录包含了系统架构、API 开发、测试等核心文档。

---

## 🎯 快速导航

### 新成员必读（按顺序）

1. **[架构概览](./README.md)** ⭐️
   - 三层架构设计
   - 核心模块介绍
   - 数据流说明
   - 扩展性设计

2. **[API 开发指南](./api-development-guide.md)** ⭐️
   - 如何创建新 API
   - 错误处理规范
   - 认证和授权
   - 最佳实践

3. **[测试指南](./testing-guide.md)** ⭐️
   - 测试策略
   - 单元测试示例
   - 集成测试示例
   - E2E 测试

4. **[重构总结](../../REFACTOR_SUMMARY.md)**
   - v2.0 重构内容
   - 架构变更对比
   - 测试结果
   - 待办事项

---

## 📖 文档分类

### 架构设计

| 文档 | 说明 | 适用人群 |
|------|------|----------|
| [架构概览](./README.md) | 完整的系统架构文档 | 所有开发者 |
| [重构总结](../../REFACTOR_SUMMARY.md) | v2.0 架构重构总结 | Tech Lead |
| [错误处理](./error-handling.md) | 统一错误处理设计 | 后端开发者 |

### 开发指南

| 文档 | 说明 | 适用人群 |
|------|------|----------|
| [API 开发指南](./api-development-guide.md) | API 开发规范与示例 | 后端开发者 |
| [测试指南](./testing-guide.md) | 测试策略与最佳实践 | 所有开发者 |
| [Admin 操作手册](../guides/admin-operations-guide.md) | Admin 面板使用指南 | 管理员 |

### 部署运维

| 文档 | 说明 | 适用人群 |
|------|------|----------|
| [Supabase 部署](../guides/supabase-report-stage2-cavr.md) | Supabase 部署指南 | DevOps |
| [环境配置](../../ENVIRONMENT.md) | 环境要求与配置 | 所有开发者 |

---

## 🏗️ 架构层级

### 表现层 (Presentation Layer)
- Next.js App Router (用户前端)
- Refine Admin Panel (管理后台)

**相关文档**:
- [Admin 操作手册](../guides/admin-operations-guide.md)

### API 层 (API Layer)
- HTTP 请求处理
- 认证和授权
- 错误处理

**相关文档**:
- [API 开发指南](./api-development-guide.md)
- [错误处理](./error-handling.md)

### 业务逻辑层 (Business Logic Layer)
- `lib/core/reports/` - 报告生成
- `lib/core/credits/` - 积分管理
- `lib/core/users/` - 用户管理

**相关文档**:
- [架构概览](./README.md)
- [重构总结](../../REFACTOR_SUMMARY.md)

### 服务适配器层 (Service Adapter Layer)
- `lib/services/llm.ts` - LLM 服务
- `lib/services/market-data.ts` - 市场数据
- `lib/services/storage.ts` - 存储服务

**相关文档**:
- [API 开发指南](./api-development-guide.md#服务适配器)

---

## 🎓 学习路径

### 路径 1: 后端开发者

1. 阅读 [架构概览](./README.md) 理解整体设计
2. 学习 [API 开发指南](./api-development-guide.md) 掌握 API 开发规范
3. 阅读 [测试指南](./testing-guide.md) 学习如何编写测试
4. 查看 [重构总结](../../REFACTOR_SUMMARY.md) 了解最新变更

### 路径 2: 前端开发者

1. 阅读 [架构概览](./README.md) 了解后端结构
2. 学习 API 接口文档（待补充）
3. 了解错误响应格式（参考 [API 开发指南](./api-development-guide.md#错误响应格式)）

### 路径 3: Admin/运营人员

1. 阅读 [Admin 操作手册](../guides/admin-operations-guide.md)
2. 了解常见操作流程
3. 学习故障排查方法

### 路径 4: DevOps 工程师

1. 阅读 [Supabase 部署](../guides/supabase-report-stage2-cavr.md)
2. 了解 [环境配置](../../ENVIRONMENT.md)
3. 学习 CI/CD 配置（参考 [测试指南](./testing-guide.md#cicd-集成)）

---

## 📊 核心概念速查

### 三层架构

```
API Route (HTTP 处理)
    ↓
Core Service (业务逻辑)
    ↓
Service Adapter (外部服务)
```

### 错误处理

所有 API 统一返回格式：

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "积分不足",
    "details": { ... }
  }
}
```

### 积分系统

- **checkAndConsume()**: 原子性扣除积分
- **getBalance()**: 查询余额
- **grantCredits()**: 管理员授予积分
- **claimDailyReward()**: 每日签到

### 报告生成流程

```
1. 认证检查
2. 参数验证
3. 检查复用报告
4. 扣除积分
5. 生成报告
6. 保存到数据库
7. 后台生成嵌入
```

---

## 🔍 FAQ

### Q: 如何添加新的 API 端点?

参考 [API 开发指南 - 创建新 API](./api-development-guide.md#创建新-api)

### Q: 如何编写单元测试?

参考 [测试指南 - 单元测试](./testing-guide.md#单元测试)

### Q: 如何处理错误?

使用统一的错误类，参考 [API 开发指南 - 错误处理](./api-development-guide.md#错误处理)

### Q: 如何给用户授予积分?

参考 [Admin 操作手册 - 积分管理](../guides/admin-operations-guide.md#积分管理)

### Q: 部署时需要注意什么?

参考 [Supabase 部署指南](../guides/supabase-report-stage2-cavr.md)

---

## 🛠️ 开发工具

### 本地开发

```bash
npm run dev       # 启动开发服务器
npm run lint      # 代码检查
npm test          # 运行测试
npm run build     # 生产构建
```

### 测试

```bash
npm test                    # 运行所有测试
npm test -- --coverage      # 生成覆盖率
npm test -- --watch         # 监听模式
npx playwright test         # E2E 测试
```

### 数据库

```bash
npx supabase db push       # 推送迁移
npx supabase gen types     # 生成类型
npx supabase db reset      # 重置数据库
```

---

## 📝 文档维护

### 文档更新流程

1. 修改相应的 Markdown 文件
2. 更新「最后更新」日期
3. 如有重大变更，更新本索引页
4. 提交 PR 并标记 `docs` 标签

### 文档规范

- 使用中文编写
- 包含代码示例
- 包含「最后更新」日期
- 包含「相关文档」链接
- 使用 Markdown 格式

---

## 🔗 相关链接

### 外部文档

- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Refine 文档](https://refine.dev/docs)
- [Vitest 文档](https://vitest.dev)

### 项目文档

- [主 README](../../README.md)
- [环境配置](../../ENVIRONMENT.md)
- [计划文档](../plans/)
- [决策记录](../decisions/)

---

## 📧 反馈与贡献

- **Bug 反馈**: [GitHub Issues](https://github.com/your-org/investor-ai/issues)
- **功能建议**: [GitHub Discussions](https://github.com/your-org/investor-ai/discussions)
- **文档改进**: 直接提交 PR 到 `docs/` 目录

---

**文档维护者**: Architecture Team
**最后更新**: 2025-12-01
**版本**: v2.0
