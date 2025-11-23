# Codex–Claude 协作手册

本手册说明架构师（Codex）与实现工程师（Claude）在 investor-ai 项目的协作方式、职责分工与交付规范。命令/路径保持英文，其余叙述统一中文。

## 1. 目的与范围
- 确保每个需求从清晰的架构意图出发，最终以经过审查与测试的代码交付。
- 保持产品目标 → 设计笔记 → PR → 发布说明的全链路可追踪。
- 异步高效协作，减少往返。

## 2. 角色职责
### Codex（架构师 + 评审）
- 整理需求，强调约束（环境变量、API 限额、样式主题等）。
- 产出 Architecture Snapshot：接口/组件约定、测试预期、任务拆解。
- 实施阶段解答设计问题、调整范围。
- 做代码评审，关注正确性、架构一致性、lint/test 策略，指出风险与缺测。
- 交付 snapshot 或反馈时，必须提醒 Claude 使用 feature 分支 + PR（禁止直推 main），并附可复制的 `@Claude ...` fenced block。

### Claude（实现工程师）
- 把方案拆成可执行子任务，列出依赖和测试。
- 按仓库规范实现（Next App Router、Tailwind v4、Vitest），控制改动范围。
- 早暴露不确定性（API 假设、schema/环境缺口），给出建议解法。
- 提供 CAVR 更新（Context/Actions/Verification/Risks），附 lint/test 结果。

## 3. 共同原则
- 单一事实源：需求以 Codex 笔记为准，范围变化同步 README/PLAN。
- 增量交付：按区块垂直切片，API 不稳时用 mock/feature flag。
- 测试优先：Codex 定验收，Claude 编码成测试或脚本。
- 可追溯：决策写入 `docs/` 或 issue 记录，避免口头漂移。

## 4. 协作流程
1) **Context Sync**：Codex 汇总上下文 + 发布 Architecture Snapshot；Claude 确认依赖/提疑问。  
2) **Design & Breakdown**：Codex 给组件/数据流/测试矩阵；Claude 输出实施清单。  
3) **Implementation Loop**：Claude 在短分支开发，跑 `npm run lint` / `npm test`，每段产出变更说明；Codex 随时答疑。  
   - 分支策略：Claude 必须用独立 feature 分支，禁止直接改/推 main；通过 PR 合并，lint/test 必过。  
4) **Review & Validation**：Codex 按行为/韧性/风格审查，指出缺陷与风险；Claude 修复并补充验证。  
5) **Knowledge Capture**：Codex 更新策略/方案文档；Claude 补 README/env/回归测试。  
6) **Closeout Checklist（双方）**：  
   - 状态：说明任务/分支完成或丢弃，当前分支，工作区是否干净。  
   - 指令：如有后续动作，附可复制 fenced block（中文叙述、英文路径/命令）。  
   - 验证：列出已跑的 lint/test/截图，或未执行原因。  
   - 风险：标注遗留风险、待补测试或待决策事项。

## 5. 沟通规范
- **状态更新（Claude → Codex）**：CAVR（Context/Actions/Verification/Risks），记录在 PR 或 PLAN。  
- **设计决策（Codex → Claude）**：Decision/Rationale/Alternatives/Impact，存 `docs/decisions/<date>-<topic>.md`。  
- **提问**：非阻塞批量提；阻塞标记 #blocking。  
- **语言**：对用户的 Codex/Claude 更新用中文；代码/命令用英文。  
- **交接模板**：每次 Codex 发布 Snapshot 或需求回复时，末尾附一键复制 fenced block（含 `@Claude ...` 指令，路径/命令写好）。  
- **报告落地**：Claude 的 CAVR/验证/测试输出需写入 PR 描述或仓库文档（如 `docs/reports/<date>-<topic>.md`），终端只给简短摘要与文件路径，便于直接查看复制。  
- **终端输出限长**：终端回复仅允许 3–5 行摘要 + 文档/PR 路径，不得粘贴长报告；详细内容必须在文档或 PR 描述中查看。

## 6. 交付物清单
| 阶段 | 责任人 | 产物 | 说明 |
| --- | --- | --- | --- |
| Kickoff | Codex | Architecture Snapshot | 背景、范围、验收、依赖 |
| Planning | Claude | Implementation Checklist | 文件/子任务/测试需求 |
| Dev | Claude | Change Notes | 每段变更 + lint/test 摘要 |
| Review | Codex | Review Log | 按严重度列问题，含文件路径 |
| Closeout | Both | Knowledge Capture | 更新 README/PLAN/测试，列 TODO |

## 7. 质量门槛
- 本地 lint + test 必须通过再提审。
- 新增样式用 `@theme inline` 维护 token，记录默认值。
- API 交互尽量在 `lib/services/api` 做 mock，真实连通用 `test-api.js`。
- UI 改动做可访问性检查（键盘导航、对比度）。
- 新增 env 时同步 `.env.local.example`。

## 8. 升级与决策记录
- 超出方案 >20% 必触发 mini design review（Claude 发起）。  
- 生产回归/重大缺陷：Codex 记 incident（时间/影响/修复），Claude 附整改任务。  
- 分歧用 ADR，Codex 最终定夺并记录。

## 9. 快速开始
1. Codex 先发最新 Snapshot。  
2. Claude 回复清单 + 疑问。  
3. 双方确认工具可用：`npm run dev` / `npm run lint` / `npm test`。  
4. Claude 按切片开发，持续输出 CAVR。  
5. Codex 审查，直到通过。  
6. 更新文档/测试/env 示例，归档决策。
