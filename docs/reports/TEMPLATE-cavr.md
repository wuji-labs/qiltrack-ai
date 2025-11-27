# CAVR 报告：[功能名称]（G[X]）

**日期**：2025-XX-XX
**工作组**：G[X]-Claude
**分支**：`gX/feature-name`
**关联 Snapshot**：`docs/decisions/<date>-<topic>.md`

---

## C - Context（背景与目标）

### 任务来源
- **Snapshot**：`docs/decisions/<date>-<topic>.md`（HQ 分配）
- **组内计划**：`docs/plans/gX-<topic>.md`（Codex 细化）
- **本组职责**：简述本组在整个需求中的角色

### 目标概述
用 1-2 句话说明本次实施要达成什么效果。

**成功标准**：
- [ ] 标准 1：具体的可验证的标准
- [ ] 标准 2：...
- [ ] 标准 3：...

---

## A - Actions（实施内容）

### 1. 代码变更

#### 新增文件
| 文件路径 | 作用说明 | 行数 |
|----------|----------|------|
| `path/to/new-file.ts` | 实现 XXX 功能 | ~50 |
| `path/to/new-test.test.ts` | 单元测试 | ~30 |

#### 修改文件
| 文件路径 | 修改内容 | 影响范围 |
|----------|----------|----------|
| `path/to/existing.ts` | 增加 XXX 方法 | 仅内部调用 |
| `lib/i18n.tsx` | 添加 5 个新文案 key | 多语言支持 |

#### 删除文件
| 文件路径 | 删除原因 |
|----------|----------|
| `path/to/old-file.ts` | 功能已被新实现替代 |

### 2. 依赖变更
```bash
# 新增依赖
npm install package-name@version

# 升级依赖
npm update package-name
```

**说明**：为什么需要这个依赖？

### 3. 配置变更

#### 环境变量
在 `.env.local.example` 添加：
```env
NEW_ENV_VAR=example_value  # 用途说明
```

#### 其他配置
- `next.config.ts`：修改了什么
- `tsconfig.json`：调整了什么

### 4. 数据库 / Schema 变更
```sql
-- 如果有数据库变更，列出 migration 文件
-- supabase/migrations/YYYYMMDD_description.sql
```

---

## V - Verification（验证与测试）

### 1. 自动化测试

#### 单元测试
```bash
npm run test path/to/test-file.test.ts
```

**结果**：
```
✓ Test suite passed (X tests, Y assertions)
Coverage: XX%
```

#### 集成测试
```bash
npm run test:integration
```

**结果**：
```
✓ All integration tests passed
```

#### Lint 检查
```bash
npm run lint
```

**结果**：
```
✓ No linting errors
```

### 2. 手动测试

#### 测试场景 1：[场景名称]
**步骤**：
1. 操作步骤 1
2. 操作步骤 2
3. 操作步骤 3

**预期结果**：
- 应该看到 XXX
- 控制台没有报错
- 网络请求返回正确

**实际结果**：
✅ 符合预期 / ❌ 发现问题（描述问题）

#### 测试场景 2：边界情况
**步骤**：
1. 测试极限值（如空字符串、超长文本）
2. 测试错误处理（如网络断开、API 超时）

**实际结果**：
✅ 错误处理正常

#### 测试场景 3：跨浏览器兼容
| 浏览器 | 版本 | 结果 |
|--------|------|------|
| Chrome | 120+ | ✅ 通过 |
| Firefox | 121+ | ✅ 通过 |
| Safari | 17+ | ✅ 通过 |
| Edge | 120+ | ✅ 通过 |

### 3. 性能测试
```bash
npm run build
# 检查 bundle size

npm run dev
# 测试加载速度
```

**结果**：
- Bundle size: XX KB（比基线 +/- X%）
- 首屏加载: XXXms
- Time to Interactive: XXXms

### 4. 可访问性检查
- ✅ 键盘导航正常
- ✅ 屏幕阅读器可读
- ✅ 颜色对比度符合 WCAG 2.1 AA

### 5. 截图 / 录屏（如有 UI 变更）
存放位置：`docs/screenshots/<date>-gX-<topic>/`

- 功能演示：`demo.gif`
- 正常状态：`normal.png`
- 错误状态：`error.png`
- 移动端：`mobile.png`

---

## R - Risks（风险与遗留问题）

### 已知风险
1. **风险名称**
   - **描述**：具体的风险情况
   - **影响**：对用户/系统的影响程度（高/中/低）
   - **应对**：已采取或计划采取的措施

### 遗留问题
1. **问题名称**
   - **描述**：具体问题是什么
   - **原因**：为什么暂时没解决
   - **计划**：何时解决、由谁负责

### 技术债务
1. **债务描述**
   - **位置**：文件路径和行号
   - **原因**：为了快速交付做的妥协
   - **重构计划**：下个迭代优化

### 依赖其他组
1. **依赖 G[Y]**
   - **依赖内容**：需要 G[Y] 提供什么
   - **当前状态**：G[Y] 的进度如何
   - **影响**：如果 G[Y] 延期会怎样

### 后续优化建议
- 优化点 1：描述可以改进的地方
- 优化点 2：...

---

## 总结

### 完成度
- ✅ 核心功能：100%
- ✅ 测试覆盖：95%
- ✅ 文档更新：100%
- ⚠️ 性能优化：80%（待后续迭代）

### 向 Codex 的汇报
**三行模板**：
```
@GX-Codex
Report: docs/reports/<date>-gX-<topic>-cavr.md
Status: 实施完成，测试通过，已准备好审查
Next: 请审查代码并决定是否提交 PR
```

### 下一步行动
1. [ ] 等待 Codex 审查反馈
2. [ ] 根据反馈修改代码
3. [ ] 提交 PR（如 Codex 批准）
4. [ ] 向 HQ 汇报（如 Codex 要求）

---

## 附录

### 命令速查
```bash
# 运行开发服务器
npm run dev --prefix D:\Projects\investor-ai-gX

# 运行测试
npm run test --prefix D:\Projects\investor-ai-gX

# Lint 检查
npm run lint --prefix D:\Projects\investor-ai-gX

# 构建
npm run build --prefix D:\Projects\investor-ai-gX

# 提交代码
cd D:\Projects\investor-ai-gX
git add .
git commit -m "feat(scope): description"
git push origin gX/feature-name

# 创建 PR
gh pr create --title "feat: feature name" --body "$(cat docs/reports/<date>-gX-<topic>-cavr.md)"
```

### 关键文件清单
```
修改的文件：
  M  path/to/file1.ts
  M  path/to/file2.ts

新增的文件：
  A  path/to/new-file.ts
  A  path/to/new-test.test.ts

删除的文件：
  D  path/to/old-file.ts
```

---

**CAVR 编写说明**：
1. **Context**：提供足够背景，让审查者快速理解任务
2. **Actions**：详细记录所有变更，方便回溯
3. **Verification**：展示充分的测试证据，建立信任
4. **Risks**：诚实披露问题，避免后期爆雷

**记住**：好的 CAVR 能让 Codex 快速做出准确的审查决策！
