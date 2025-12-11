# G4 Stage 1: 基础设施和设计系统（Week 1）

> **Task ID**: WS-REDESIGN Stage 1
> **Timeline**: 2025-12-10 ~ 2025-12-16 (7 days)
> **Priority**: P0
> **Assigned To**: G4-Claude
> **Branch**: g4/develop

---

## 背景

老板选择 **B 方案：深度架构重构**。

**老板原话**：
> "为啥感觉你们就是在哄骗敷衍我 这叫前端重构吗，这不过是换了一套配色而已"

之前的 Phase 1-2 计划只是"换配色"，已废弃。现在启动真正的深度架构重构。

**完整方案**: 请先阅读 `docs/decisions/2025-12-10-frontend-architecture-redesign.md`

---

## Stage 1 目标

**建立完整的现代化前端基础设施**，为后续页面重构做好准备。

### 交付物清单
- [ ] 完整的 Design Token 系统（颜色、排版、间距、阴影）
- [ ] shadcn/ui 组件库（15+ 核心组件）
- [ ] 布局组件系统（Container, Section, Grid）
- [ ] 工具函数和类型定义
- [ ] 首页 Hero 区域 POC（验证新设计系统可行性）

---

## Task Breakdown

### Day 1: Design Token 系统（2025-12-10）

#### 任务 1.1: 创建完整的 CSS 变量系统
**文件**: `app/styles/design-tokens.css`

```css
/* ====== Design Token System v2.0 ====== */
/* 基于 Apple/Tesla 极简美学 */

:root {
  /* ========== Colors ========== */

  /* Neutral Palette - 9-step Gray Scale */
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e1;
  --gray-400: #94a3b8;
  --gray-500: #64748b;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1e293b;
  --gray-900: #0f172a;

  /* Semantic Colors */
  --color-primary: var(--gray-900);       /* 主要动作 - 深灰 */
  --color-secondary: var(--gray-600);     /* 次要动作 - 中灰 */
  --color-tertiary: var(--gray-400);      /* 辅助元素 - 浅灰 */

  --color-success: #10b981;               /* 成功状态 - 翠绿 */
  --color-error: #ef4444;                 /* 错误状态 - 红色 */
  --color-warning: #f59e0b;               /* 警告状态 - 琥珀 */
  --color-info: #3b82f6;                  /* 信息状态 - 蓝色 */

  /* Surface Colors */
  --surface-base: #ffffff;                /* 基础背景 - 纯白 */
  --surface-raised: var(--gray-50);       /* 提升表面 - 微灰 */
  --surface-sunken: var(--gray-100);      /* 下沉表面 - 浅灰 */
  --surface-overlay: rgba(0, 0, 0, 0.5);  /* 遮罩层 */

  /* Border Colors */
  --border-default: var(--gray-200);      /* 默认边框 */
  --border-strong: var(--gray-300);       /* 强调边框 */
  --border-subtle: var(--gray-100);       /* 微妙边框 */

  /* Text Colors */
  --text-primary: var(--gray-900);        /* 主要文本 - 深色 */
  --text-secondary: var(--gray-600);      /* 次要文本 - 中色 */
  --text-tertiary: var(--gray-400);       /* 辅助文本 - 浅色 */
  --text-disabled: var(--gray-300);       /* 禁用文本 */
  --text-inverse: #ffffff;                /* 反色文本 - 白色 */

  /* ========== Typography ========== */

  /* Font Families */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI',
               'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', 'Monaco', 'Consolas',
               'Liberation Mono', monospace;

  /* Font Sizes - Major Third Scale (1.25x) */
  --text-xs: 0.64rem;     /* 10px - Metadata */
  --text-sm: 0.8rem;      /* 13px - Captions */
  --text-base: 1rem;      /* 16px - Body */
  --text-lg: 1.25rem;     /* 20px - Large Body */
  --text-xl: 1.563rem;    /* 25px - h4 */
  --text-2xl: 1.953rem;   /* 31px - h3 */
  --text-3xl: 2.441rem;   /* 39px - h2 */
  --text-4xl: 3.052rem;   /* 49px - h1 */
  --text-5xl: 3.815rem;   /* 61px - Hero */

  /* Line Heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  --leading-loose: 2;

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Letter Spacing */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;

  /* ========== Spacing ========== */

  /* 8px 基准间距系统 */
  --space-0: 0;
  --space-px: 1px;
  --space-0\.5: 0.125rem;  /* 2px */
  --space-1: 0.25rem;      /* 4px */
  --space-1\.5: 0.375rem;  /* 6px */
  --space-2: 0.5rem;       /* 8px */
  --space-2\.5: 0.625rem;  /* 10px */
  --space-3: 0.75rem;      /* 12px */
  --space-3\.5: 0.875rem;  /* 14px */
  --space-4: 1rem;         /* 16px */
  --space-5: 1.25rem;      /* 20px */
  --space-6: 1.5rem;       /* 24px */
  --space-7: 1.75rem;      /* 28px */
  --space-8: 2rem;         /* 32px */
  --space-9: 2.25rem;      /* 36px */
  --space-10: 2.5rem;      /* 40px */
  --space-11: 2.75rem;     /* 44px */
  --space-12: 3rem;        /* 48px */
  --space-14: 3.5rem;      /* 56px */
  --space-16: 4rem;        /* 64px */
  --space-20: 5rem;        /* 80px */
  --space-24: 6rem;        /* 96px */
  --space-28: 7rem;        /* 112px */
  --space-32: 8rem;        /* 128px */
  --space-36: 9rem;        /* 144px */
  --space-40: 10rem;       /* 160px */
  --space-44: 11rem;       /* 176px */
  --space-48: 12rem;       /* 192px */

  /* ========== Shadows ========== */

  /* 克制的阴影系统（无色彩） */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
               0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
               0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
               0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
               0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  /* ========== Border Radius ========== */

  --radius-none: 0;
  --radius-sm: 0.125rem;   /* 2px */
  --radius-base: 0.25rem;  /* 4px */
  --radius-md: 0.375rem;   /* 6px */
  --radius-lg: 0.5rem;     /* 8px */
  --radius-xl: 0.75rem;    /* 12px */
  --radius-2xl: 1rem;      /* 16px */
  --radius-3xl: 1.5rem;    /* 24px */
  --radius-full: 9999px;   /* 圆形/胶囊 */

  /* ========== Transitions ========== */

  /* Duration */
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-medium: 300ms;
  --duration-slow: 500ms;

  /* Timing Functions */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* ========== Z-Index ========== */

  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 1100;
  --z-fixed: 1200;
  --z-modal-backdrop: 1300;
  --z-modal: 1400;
  --z-popover: 1500;
  --z-tooltip: 1600;
}

/* Dark Mode (可选，后续实现) */
[data-theme="dark"] {
  /* TBD in Stage 3 */
}
```

**验收标准**:
- [ ] 所有 Token 定义清晰
- [ ] 变量命名语义化
- [ ] 无重复定义

---

#### 任务 1.2: 更新 globals.css
**文件**: `app/globals.css`

```css
/* Tailwind Directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Design Tokens */
@import "./styles/design-tokens.css";

/* Base Styles */
@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-white text-gray-900 font-sans antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Typography Reset */
  h1, h2, h3, h4, h5, h6 {
    @apply font-semibold tracking-tight;
  }

  p {
    @apply leading-normal;
  }

  /* 锚点滚动补偿 */
  #generator,
  #overview,
  #pricing,
  #faq {
    scroll-margin-top: 80px;
  }
}

/* Utility Overrides */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

---

### Day 2-3: shadcn/ui 组件库安装（2025-12-11 ~ 2025-12-12）

#### 任务 2.1: 安装 shadcn/ui CLI 和依赖
```bash
# 确认 components.json 配置正确
npx shadcn@latest init

# 安装核心组件（按优先级）
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tabs
npx shadcn@latest add accordion
npx shadcn@latest add skeleton
npx shadcn@latest add toast
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add avatar
npx shadcn@latest add progress
npx shadcn@latest add hover-card
```

**验收标准**:
- [ ] 所有组件安装成功
- [ ] `components/ui/*` 目录结构正确
- [ ] 无 TypeScript 错误

---

#### 任务 2.2: 测试组件可用性
创建测试页面：`app/_test/components/page.tsx`

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function ComponentsTest() {
  return (
    <div className="container mx-auto py-12 space-y-8">
      <h1 className="text-3xl font-bold">shadcn/ui 组件测试</h1>

      {/* Button Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </CardContent>
      </Card>

      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
        </CardHeader>
        <CardContent>
          <Input placeholder="Enter company ticker..." />
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Error</Badge>
        </CardContent>
      </Card>
    </div>
  )
}
```

**访问**: `http://localhost:3006/_test/components`

**验收标准**:
- [ ] 页面正常渲染
- [ ] 所有组件显示正确
- [ ] 样式符合预期

---

### Day 4: 布局组件系统（2025-12-13）

#### 任务 3.1: Container 组件
**文件**: `components/layout/Container.tsx`

```tsx
import { cn } from "@/lib/utils"

interface ContainerProps {
  children: React.ReactNode
  size?: "default" | "narrow" | "wide"
  className?: string
}

export function Container({
  children,
  size = "default",
  className
}: ContainerProps) {
  return (
    <div className={cn(
      "mx-auto w-full px-4 sm:px-6 lg:px-8",
      size === "default" && "max-w-7xl",
      size === "narrow" && "max-w-4xl",
      size === "wide" && "max-w-[1440px]",
      className
    )}>
      {children}
    </div>
  )
}
```

---

#### 任务 3.2: Section 组件
**文件**: `components/layout/Section.tsx`

```tsx
import { cn } from "@/lib/utils"

interface SectionProps {
  children: React.ReactNode
  spacing?: "default" | "tight" | "loose" | "none"
  className?: string
  id?: string
}

export function Section({
  children,
  spacing = "default",
  className,
  id
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        spacing === "default" && "py-16 lg:py-24",
        spacing === "tight" && "py-12 lg:py-16",
        spacing === "loose" && "py-24 lg:py-32",
        spacing === "none" && "py-0",
        className
      )}
    >
      {children}
    </section>
  )
}
```

---

#### 任务 3.3: Grid 组件
**文件**: `components/layout/Grid.tsx`

```tsx
import { cn } from "@/lib/utils"

interface GridProps {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
  className?: string
}

export function Grid({
  children,
  cols = { default: 1, md: 2, lg: 4 },
  gap = 6,
  className
}: GridProps) {
  return (
    <div className={cn(
      "grid",
      cols.default === 1 && "grid-cols-1",
      cols.default === 2 && "grid-cols-2",
      cols.default === 3 && "grid-cols-3",
      cols.sm && `sm:grid-cols-${cols.sm}`,
      cols.md && `md:grid-cols-${cols.md}`,
      cols.lg && `lg:grid-cols-${cols.lg}`,
      cols.xl && `xl:grid-cols-${cols.xl}`,
      `gap-${gap}`,
      className
    )}>
      {children}
    </div>
  )
}
```

**验收标准**:
- [ ] 三个布局组件创建成功
- [ ] TypeScript 类型定义完整
- [ ] 响应式断点正确

---

### Day 5-7: 首页 Hero POC（2025-12-14 ~ 2025-12-16）

#### 任务 4.1: 重写首页 Hero 区域
**目标**: 验证新设计系统的可行性，展示给老板看

**文件**: `app/(marketing)/_components/HeroNew.tsx`

```tsx
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/Container"
import { Section } from "@/components/layout/Section"

export function HeroNew() {
  return (
    <Section spacing="loose" className="text-center">
      <Container size="narrow">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6
                        text-sm rounded-full bg-gray-100 text-gray-700
                        transition-colors hover:bg-gray-200">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">AI-Powered Research</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold
                       text-gray-900 mb-6 tracking-tight leading-tight">
          Understand companies in{' '}
          <span className="text-gray-600">3 minutes</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-600 mb-12
                      leading-relaxed max-w-2xl mx-auto">
          Transform complex data and reports into clear, structured analysis.
          Understanding is the foundation of investing.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            Generate your first report
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="hover:bg-gray-50"
          >
            View sample report
          </Button>
        </div>

        {/* Social Proof (可选) */}
        <div className="mt-12 text-sm text-gray-500">
          Trusted by 1,000+ investors worldwide
        </div>
      </Container>
    </Section>
  )
}
```

---

#### 任务 4.2: 临时替换首页 Hero
**文件**: `app/(marketing)/page.tsx`

找到当前的 Hero 组件，临时注释掉，引入新的 `HeroNew`:

```tsx
import { HeroNew } from "./_components/HeroNew"

export default function HomePage() {
  return (
    <main>
      {/* 新 Hero（POC） */}
      <HeroNew />

      {/* 暂时保留旧的其他区域 */}
      {/* <ModelSelector /> */}
      {/* ... */}
    </main>
  )
}
```

---

#### 任务 4.3: 截图对比
**对比内容**:
- 旧 Hero（青绿色、玻璃态、浮夸）
- 新 Hero（灰色系、实色、极简）

**交付**:
- 截图保存到 `docs/assets/hero-comparison.png`
- 在 CAVR 报告中展示对比

---

## Stage 1 验收标准

### 视觉验收
- [ ] Hero 区域风格完全改变（青绿→灰色，玻璃态→实色）
- [ ] 大量留白，不拥挤
- [ ] 按钮简洁，无浮夸渐变和阴影
- [ ] 字体排版清晰，层级分明

### 技术验收
- [ ] Design Token 系统完整
- [ ] shadcn/ui 15+ 组件安装成功
- [ ] 布局组件创建完成
- [ ] TypeScript 无错误
- [ ] 构建通过（`npm run build`）

### 文档验收
- [ ] CAVR 报告提交到 `docs/reports/2025-12-16-g4-stage1-cavr.md`
- [ ] 包含 Hero 对比截图
- [ ] 列出所有创建/修改的文件

---

## 完成后

1. **提交 CAVR 报告** 到 `docs/reports/2025-12-16-g4-stage1-cavr.md`
2. **向 HQ 汇报**: "@Codex Stage 1 完成，请审阅"
3. **等待 HQ 审阅** 后进入 Stage 2

---

**Last Updated**: 2025-12-10
**Assigned To**: G4-Claude
**Branch**: g4/develop
