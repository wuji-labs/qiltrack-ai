# Home & Reports Motion Snapshot (2025-11-25)

## 背景
- 主页已有基础动效刷新（2025-11-23-motion-refresh），但 Hero 及部分区块动效不够统一/丰富，缺少视觉亮点。
- /reports 页面目前为静态卡片，缺少 hover/滚动动效和层次，观感与首页不一致。
- 需求：补齐首页关键区块与 /reports 页的动效，保持深色 + 蓝绿主题，不改文案与业务逻辑。

## 设计目标
1) 主页 Hero、导航、CTA、模板卡片等 hover/入场/交互动效统一节奏：160–220ms，ease-out/ease-in-out，轻浮层次+微光。
2) /reports 页 Hero、筛选 Chip、卡片 hover、分页按钮添加一致的动效与光泽，保留信息结构。
3) 敬畏性能与可访问性：优先 transform/opacity，`prefers-reduced-motion` 降级；避免大面积重影。

## 技术约束
- 不改文案、数据流、路由；仅在现有组件内添加/微调样式与动效。
- 复用既有色板：深色底、蓝绿（accent-emerald / accent-blue）；不新增高饱和色。
- 尽量使用 Tailwind class；必要时可在 `app/globals.css` 增少量 keyframes/utility，尊重 `prefers-reduced-motion`。
- 文件边界：主页相关（`app/page.tsx`、`app/sections/HeroSection.tsx` 等已有区块）；/reports（`app/reports/page.tsx`）。禁止更改文案、接口、hook 逻辑。

## 文案 key
- 不新增/改动 i18n key。可复用现有 key 渲染/标签，不写死新文案。

## 测试要求
- 视觉：桌面/移动检查 Hero CTA、导航 hover、卡片 hover、FAQ 展开是否平滑统一，无闪烁。
- 可访问性：`prefers-reduced-motion` 下动效降级；focus 状态可见。
- 性能：滚动/hover 无明显掉帧；未引入大面积 box-shadow。
- 自动化：至少运行 `npm run lint`；如未跑 `npm test` 需在报告中注明原因。
