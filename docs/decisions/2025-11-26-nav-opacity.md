# 导航栏透明度调整 Snapshot

## 背景
- HeroSection 顶部导航使用 `bg-[var(--bg-frosted)]/85`，而 `--bg-frosted` 本身是 `rgba(255,255,255,0.07)`，有效不透明度约 6%。滚动时底部文字和卡片透出过多，影响可读性。
- 用户反馈「导航栏透明度太透明」，需在保持磨砂/悬浮质感的同时提高遮挡度。

## 设计目标
- 提升导航栏文本与控件的可读性，对比度明显优于当前状态。
- 保留现有毛玻璃感（backdrop blur + 轻微透光）与边框/阴影层次，不引入布局变化。
- 将影响限定在导航容器，不破坏其他 frosted 卡片或全局 token。
- 桌面与移动端一致：桌面固定导航、移动抽屉视觉不倒退。

## 技术约束
- App Router + Tailwind v4；避免修改共享 `--bg-frosted` 以免影响通用 frosted-bar/卡片。
- 导航容器在 `app/sections/HeroSection.tsx` 内，需保持 `backdrop-blur-xl`、边距/对齐容器不变。
- 移动抽屉背景已是 `bg-[var(--bg-base)]/95`，无需更动。
- 保持现有滚动锚点偏移（`--nav-offset`）与平滑滚动逻辑。

## 方案（建议）
- 目标：仅调整桌面导航容器背景不透明度。
- Option A（优先，局部改动）：将导航容器背景改为深色基底高透明度，例：`bg-[var(--bg-base)]/92`，并保留 `backdrop-blur-xl` 与现有边框/阴影。可叠加一个 `before` 伪元素或额外类，提供轻微白色线性渐变（如 `from-white/6 via-white/5 to-white/4`）以维持磨砂高光。
- Option B（可选，需加 token）：在 `:root` 定义 `--bg-frosted-strong: rgba(255,255,255,0.14)`，在导航容器使用 `bg-[var(--bg-frosted-strong)]/90`；不改动原 `--bg-frosted` 以免影响其他卡片。若新增 token，记得在 `@theme inline` 暴露。
- 保持边框 `border-[var(--stroke-soft)]`（可移除 `/80` 稀释）与现有阴影；导航内链接 hover 颜色/下划线效果不改。
- 不改移动抽屉与语言/账户菜单背景。

## 文案 Key
- 无新增文案，纯视觉调整。

## 测试要求
- 桌面：导航置于 Hero 上方与滚动至下方区块时，文字与图标对比度充分（肉眼不再看到正文透出），毛玻璃质感仍在。
- 锚点跳转：导航链接平滑滚动与 `scroll-margin-top` 行为保持正常，无定位偏移。
- 移动：汉堡菜单开启/关闭背景遮挡度不变；无闪烁或抖动。
- 可访问性：导航文案/按钮对背景的对比度接近或优于 4.5:1；焦点态可见。

## 对 Claude 的实施清单
- 在 `app/sections/HeroSection.tsx` 调整导航容器背景，优先采用 Option A（局部调不透明度+可选渐变高光）；如需全局 token，则按 Option B 新增 `--bg-frosted-strong` 并在导航引用。
- 保留 `backdrop-blur-xl`、边框/阴影和排版尺寸；不触碰移动抽屉。
- 调整后做视觉回归（截图/肉眼）；无需新增文案或逻辑变更。
