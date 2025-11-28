# Snapshot：Why Section 精简（2025-11-29）

## 背景
- **当前问题**：Landing “Why/价值”区块原含双列（综合说明 + 付费收益），信息量与翻译 key 过多，排版拥挤且依赖 JSON 解析的文案数组。
- **影响范围**：`app/sections/WhySection.tsx` 组件与 `app/page.tsx` 调用、`lib/i18n.tsx` 文案 key；涉及多语言呈现与 Tailwind v4 变量背景。
- **现状分析**：`moduleCombined` 相关 key 仅用于该区块，维持两组布局导致重复叙事与移动端阅读负担。

## 设计目标
1. **核心目标**：收敛成单一价值叙事，突出“付费后得到什么”与 punchline。
2. **用户体验**：移动端减少滚动疲劳；桌面端保持层次和视觉焦点，编号条目清晰可扫读。
3. **技术要求**：保持函数式组件、现有 Tailwind token/渐变风格；移除冗余 JSON 解析逻辑。
4. **边界条件**：不改动其他 Section 结构，不新增依赖与路由。

## 技术约束
- **依赖版本**：Next.js App Router + React 19；Tailwind v4 `@theme inline` 变量需保持。
- **国际化**：统一使用 `lib/i18n.tsx` key，删除未用 `landing.moduleCombined.*`，保留 `landing.module6.*`。
- **样式**：继续使用 CSS 变量 `--bg-layer`、`--stroke-soft`、`--accent-emerald` 等；渐变与模糊背景效果保持。
- **可访问性**：编号列表需可被屏幕阅读器识别，避免纯装饰性字符。

## 文案 key
| key | 说明 |
| --- | --- |
| `landing.module6.title` | 价值段标题 |
| `landing.module6.caption` | 价值段摘要 |
| `landing.module6.punchline` | 强调语（付费价值） |
| `landing.module6.items` | 编号条目列表 |
| （删除）`landing.moduleCombined.*` | 不再使用，已从 i18n 移除 |

## 工作拆解（G3 / 分支：`g3/why-section-simplify`）
- [ ] 精简 WhySection 组件至单列，改用模块化 props（`punchline`, `label`）。
- [ ] 移除 `moduleCombined` 解析逻辑，更新 `app/page.tsx` 调用。
- [ ] 清理 `lib/i18n.tsx` 中 `landing.moduleCombined.*` 文案。
- [ ] 自查 UI：桌面/移动的编号列表与渐变背景正常展示。

## 测试 / 验收
1. **通用检查**：`npm run lint`、`npm test` 全部通过。
2. **功能验证**：在 `/` 页面 Why 区块：
   - 显示单一卡片，顶部标签为 module6 标题，punchline 文案存在。
   - 列表以数字徽章标记，序号递增且换行正常。
3. **边界测试**：翻译缺失时回退不报错（无 JSON.parse）；移动端宽度下无横向滚动。

## 风险与应对
| 风险 | 影响 | 概率 | 应对 |
| --- | --- | --- | --- |
| 旧 key 未清理导致死链 | 低 | 低 | 全局 grep 确认无引用，编译时检查 |
| 样式收敛导致对比度不足 | 中 | 低 | 保持现有颜色变量，手动验收暗/亮背景 |

## 参考资料
- 现有设计语言：`app/globals.css` & Tailwind token
- 国际化入口：`lib/i18n.tsx`
