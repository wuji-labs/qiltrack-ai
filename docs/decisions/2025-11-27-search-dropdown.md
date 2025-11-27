# Snapshot：搜索下拉重复触发修复（2025-11-27）

## 背景
- **当前问题**：ReportGeneratorSection 的模糊搜索下拉在用户点击候选项后仍会重新触发一次 API 搜索，列表闪烁并重新展开。
- **影响范围**：`app/sections/ReportGeneratorSection.tsx` 的输入交互、`lib/services/api.ts` 的 searchSymbols 调用频次、相关 Vitest 测试。
- **现状分析**：当前使用 `suppressNextSearch` state 在选择候选项后短暂阻止 effect，但 state 的往复切换又触发第二次 effect，清空 `selectedSymbol` 并重新搜索，造成体验抖动和配额浪费。

## 设计目标
1. **核心目标**：用户点击建议后立即锁定 ticker，不再重复搜索或重新展开 dropdown。
2. **用户体验**：输入-点击-提交流程需在 1 秒内完成，选中后仅保留被选值并关闭列表。
3. **技术要求**：维持 400ms debounce；避免无意义 state 刷新；不增加外部依赖；保持 hooks 可测试。
4. **边界条件**：输入长度 <2 时仍需清空；支持手动输入 + Enter；后端 API 行为不变。

## 技术约束
- **依赖版本**：沿用 Next.js 14 / React 19 / TypeScript 5；Vitest 1.x。
- **环境限制**：前端仅可访问 `/api/search`，Finnhub 限流 60/min，需要减少重复调用。
- **兼容性**：桌面/移动均需关闭 dropdown；保持输入框焦点与 `aria-expanded` 一致（若实现）。
- **安全规范**：无新增敏感数据；继续遵循 auth/quota 校验流程。
- **性能指标**：一次输入交互最多触发一次网络请求；dropdown 收起渲染 <=16ms。

## 文案 key
| key | zh-Hans | en | 说明 |
| --- | --- | --- | --- |
| （沿用现有文案） | - | - | 本次不新增 UI 文案 |

## 工作拆解

### G3 – 搜索交互修复（分支：`g3/search-dropdown-fix`）
**职责概述**：更新 ReportGeneratorSection 的搜索 effect 与状态管理，确保点击结果不会触发二次搜索，同时补齐测试与文档。

**任务清单**
- [ ] 用 `useRef`（如 `skipNextSearchRef`）替换 state 抑制逻辑，点击候选项时置 `true`，effect 检测后直接 return 并复位。
- [ ] 只有真实输入变更才 `setSelectedSymbol(null)`；点击候选项后保留 symbol，并立刻清空 dropdown。
- [ ] 扩充 `__tests__/ReportGeneratorSection.test.tsx`：模拟搜索 -> 点击候选项 -> 断言 `searchSymbols` 仅调用一次且 dropdown 关闭。
- [ ] 复查 `lib/services/api.ts` 是否需要额外防抖（若无需更改，将结论写入 CAVR）。

**技术细节**
- 使用 `skipNextSearchRef` 控制 effect，只在 ref 为假且输入长度 ≥2 时才触发远程搜索。
- 事件处理需在点击候选项后同步调用 `setSearchResults([])` 与 `setSearching(false)`，避免 cleanup 再次改写。
- 保留 `selectedSymbol` 用于提交校验；若未来放宽校验另开任务。
- 可选：输入框 `aria-expanded` 与 `hasDropdown` 绑定，改善可访问性。

**测试要求**
- 单元：Vitest + Testing Library 覆盖“候选项只触发一次 searchSymbols”与 dropdown 状态。
- 手动：`npm run dev`，输入 `NV` → 等候建议 → 点击 `NVDA`，确认列表不再闪烁，继续回车生成报告。

**交付文档**
- 组内计划：`docs/plans/g3-search-dropdown.md`。
- 实施 CAVR：`docs/reports/2025-11-27-g3-search-dropdown-cavr.md`。

## 测试 / 验收
1. `npm run lint`、`npm test` 全部通过。
2. 功能验证：
   - 输入 `ap`，等待候选出现。
   - 点击 `AAPL` 后 dropdown 应关闭，输入框保持 `AAPL`。
   - 观察 network 仅有一次 `/api/search?q=ap` 请求；点击后无新请求。
   - 直接 Enter 生成报告，流程无阻塞。
3. 边界：输入单字符 dropdown 不出现；清空输入时搜索列表为空。

## 里程碑
- **T0（2025-11-27 15:00）**：G3-Codex 输出组内计划。
- **T1（2025-11-27 20:00）**：完成 ref 重构与测试。
- **T2（2025-11-28 12:00）**：手动验证 & CAVR，准备 PR。

## 风险与应对
| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| ref 逻辑处理不当导致 effect 永久跳过 | 搜索无法触发 | 中 | 单测覆盖“输入新字符后会触发搜索”，并在 CAVR 记录验证步骤 |
| 手动输入未经过候选导致提交被判 invalid | 用户无法提交 | 低 | 保持现有“需匹配候选项”校验，若需放宽另起任务 |
| 缺乏移动端验证 | Mobile 仍闪烁 | 中 | 手动验证需包含 DevTools 触屏模拟 | 

## 参考资料
- `app/sections/ReportGeneratorSection.tsx`
- `__tests__/ReportGeneratorSection.test.tsx`
- `docs/guides/BOSS-OPERATION-MANUAL.md`
- `docs/guides/worktree-multi-team.md`
