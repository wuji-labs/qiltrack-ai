# G4 Phase 2: 核心组件样式迁移

## 指令来源
**From**: HQ Codex
**To**: G4-Claude
**Priority**: P0 - 老板要求立即看到视觉变化
**Branch**: g4/develop

---

## 背景
Phase 1 只建立了 Design Token 系统，但页面组件还在使用旧的青绿色硬编码值 (#5be0b0)。**老板反馈：网页一点变化没有**。

## Phase 2 目标
将首页可见的所有组件样式迁移到新 Slate 灰蓝色系，让视觉效果立即改变。

---

## 任务清单

### Step 1: 定位首页核心组件 (5 min)
- [ ] 找到首页 Hero 区域组件文件（app/page.tsx 或类似）
- [ ] 识别所有使用青绿色 (#5be0b0) 的地方
- [ ] 列出需要修改的组件清单

### Step 2: 标题和文本颜色迁移 (10 min)
**旧样式**: 青绿色标题 `text-[#5be0b0]`
**新样式**: Slate 主色调

修改目标：
- [ ] Hero 标题 "Understand a company in 3 minutes" → 使用 `text-foreground` (深灰)
- [ ] 副标题文本 → 使用 `text-muted-foreground` (中等灰)
- [ ] 所有硬编码的青绿色文本 → 改为 Design Token

### Step 3: 按钮组件迁移 (15 min)
**旧样式**: `.btn-gradient` (青绿色渐变)
**新样式**: Slate 风格极简按钮

修改规则：
- [ ] "Generate my first report" 按钮 → 改为 `bg-primary text-primary-foreground`
- [ ] "LOGIN" 按钮 → 改为 `bg-accent text-accent-foreground`
- [ ] 移除所有 `#5be0b0` 相关的阴影和发光效果
- [ ] 使用 `shadow-sm` `shadow-md` 等 Design Token 阴影

### Step 4: 卡片和容器迁移 (15 min)
**旧样式**: `.glass-card` (玻璃态 + 青绿色边框)
**新样式**: 极简卡片

修改目标：
- [ ] Research Model Selector 卡片 → `bg-card` + `border-border`
- [ ] 四个 Mode 选择卡片 → 移除青绿色强调，改用灰色 hover 效果
- [ ] 移除所有 backdrop-filter 玻璃态效果（改用实色背景）

### Step 5: 导航栏迁移 (10 min)
修改目标：
- [ ] 导航链接颜色 → `text-muted-foreground` hover 时 `text-foreground`
- [ ] LOGIN 按钮 → 使用 Slate 主色
- [ ] 导航背景 → `bg-background/80` + `backdrop-blur-sm`

---

## 技术要求

### 必须使用 Design Token（禁止硬编码）
```tsx
// ❌ 旧方式 - 硬编码
<h1 className="text-[#5be0b0]">Title</h1>
<button className="bg-[#5be0b0] shadow-[0_14px_42px_rgba(91,224,176,0.28)]">

// ✅ 新方式 - Design Token
<h1 className="text-foreground">Title</h1>
<button className="bg-primary text-primary-foreground shadow-md">
```

### 颜色映射表
| 旧颜色 | 新 Token | Tailwind Class |
|--------|---------|----------------|
| #5be0b0 (青绿主色) | `--accent-primary` | `bg-primary` `text-primary` |
| #04110c (深色文本) | `--fg-primary` | `text-foreground` |
| rgba(255,255,255,0.82) | `--fg-secondary` | `text-muted-foreground` |
| 玻璃态背景 | `--bg-card` | `bg-card` |

### 阴影映射
| 旧阴影 | 新 Token |
|--------|---------|
| `0 14px 42px rgba(91,224,176,0.28)` | `shadow-lg` |
| `0 4px 16px rgba(0,0,0,0.45)` | `shadow-md` |

---

## 验收标准

1. **视觉检查**：刷新 http://localhost:3006 后：
   - ✅ 标题从青绿色变为深灰色
   - ✅ 按钮从青绿色渐变变为灰蓝色实色
   - ✅ 卡片从玻璃态变为实色灰白背景
   - ✅ 整体风格符合 Apple/Tesla 极简美学

2. **代码检查**：
   - ✅ 所有 `#5be0b0` 硬编码已移除
   - ✅ 所有颜色使用 Tailwind 语义化 class
   - ✅ 无 TypeScript 类型错误

3. **构建检查**：
   - ✅ `npm run dev` 无错误
   - ✅ 页面热重载正常工作

---

## 完成后报告格式

提交 CAVR 报告到 `docs/reports/2025-12-10-g4-phase2-cavr.md`：

```markdown
## Context
Phase 2: 首页核心组件样式迁移完成

## Actions
1. 修改文件清单：
   - app/page.tsx (Hero 标题)
   - components/buttons/PrimaryButton.tsx
   - components/cards/ModeCard.tsx
   - ...

2. 颜色迁移统计：
   - 替换 #5be0b0 硬编码 × 12 处
   - 迁移到 Design Token × 12 处

## Verification
- 截图对比：Phase 1 vs Phase 2
- 构建通过：✅
- TypeScript 检查：✅

## Risks
无
```

---

## 开始执行
**@G4-Claude**: 立即开始 Phase 2，优先处理首页可见的视觉元素，确保老板能看到明显的颜色和风格变化。完成后截图对比并提交 CAVR 报告。
