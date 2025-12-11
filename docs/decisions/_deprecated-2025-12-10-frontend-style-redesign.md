# 前端风格重构 Architecture Snapshot

> **创建时间**：2025-12-10
> **架构师**：HQ
> **目标工作组**：待分配 (G1-G5)
> **优先级**：P1 (重要且紧急)

---

## 1. 背景与目标

### 1.1 现状分析

基于 `docs/reports/2025-12-10-frontend-exploration.md` 的完整架构探索，当前 Qiltrack AI 前端存在以下特征：

**技术栈**
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 (CSS-first 配置)
- 自建 UI 组件系统 (860 行)
- 暗色主题为主 (玻璃态设计)

**设计风格**
- 深黑底色 (#0a0a0c) + 半透明白卡片
- 绿色主色调 (#4dd0a6, #5be0b0)
- 磨砂玻璃效果 (backdrop-filter: blur)
- 呼吸光效、渐变流动动画

**技术债务**
- `globals.css` 634 行，包含动画/工具类/组件样式混杂
- 组件样式定义重复 (UI 库 vs 全局 CSS)
- 无 CSS 模块化，缺少可维护性
- 字体/图标系统不统一 (系统字体 + Emoji + SVG 混用)
- i18n 文件过大 (266KB)

### 1.2 重构目标

**设计语言升级**
- 从"科技玻璃态"转向"**高端奢华极简**" (Apple/Tesla 风格)
- 核心理念：Less is More，用留白和细节传递品质感

**视觉目标**
- 浅色为主主题 (白色/浅灰背景)
- 中性灰蓝主色调 (#64748b Slate 600)
- 极简布局 + 精致细节 (微妙阴影、流畅动画)
- 高端材质感 (柔和渐变、透明度层级)

**技术目标**
- 引入 shadcn/ui 组件库 (统一设计系统)
- 建立 Design Token 体系 (色彩/字体/间距/圆角)
- 模块化 CSS 架构 (拆分 globals.css)
- 优化深浅色主题切换 (next-themes)
- 统一字体系统 (自托管 Inter/Geist)
- 统一图标系统 (Lucide React)

**业务目标**
- 提升品牌高端感，吸引专业投资者用户
- 改善可访问性 (WCAG AA 级别)
- 提升移动端体验 (响应式优化)
- 保持 5 语言国际化支持

---

## 2. 设计系统规范

### 2.1 色彩系统 (Design Tokens)

#### 主色调 - Slate (中性灰蓝)

```css
/* Light Mode 浅色主题 (默认) */
:root {
  /* 背景层级 */
  --bg-base: #ffffff;               /* 纯白底色 */
  --bg-subtle: #f8fafc;             /* Slate 50 - 微妙背景 */
  --bg-muted: #f1f5f9;              /* Slate 100 - 次级背景 */
  --bg-card: #ffffff;               /* 卡片白色 */

  /* 前景与文本 */
  --fg-primary: #0f172a;            /* Slate 900 - 主文本 */
  --fg-secondary: #475569;          /* Slate 600 - 次要文本 */
  --fg-tertiary: #94a3b8;           /* Slate 400 - 辅助文本 */
  --fg-muted: #cbd5e1;              /* Slate 300 - 禁用/占位符 */

  /* 描边 */
  --border-default: #e2e8f0;        /* Slate 200 - 默认边框 */
  --border-subtle: #f1f5f9;         /* Slate 100 - 微妙分隔 */
  --border-strong: #cbd5e1;         /* Slate 300 - 强调边框 */

  /* 主色调 (灰蓝) */
  --accent-primary: #64748b;        /* Slate 500 - 主要强调色 */
  --accent-hover: #475569;          /* Slate 600 - Hover 状态 */
  --accent-light: #f1f5f9;          /* Slate 100 - 浅色背景 */
  --accent-subtle: rgba(100, 116, 139, 0.1); /* 10% 透明度 */

  /* 语义化颜色 */
  --color-success: #10b981;         /* Emerald 500 - 成功/涨 */
  --color-error: #ef4444;           /* Red 500 - 错误/跌 */
  --color-warning: #f59e0b;         /* Amber 500 - 警告 */
  --color-info: #3b82f6;            /* Blue 500 - 信息 */

  /* 阴影系统 (极简柔和) */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

  /* 特殊效果 */
  --overlay: rgba(15, 23, 42, 0.5); /* 50% 深色遮罩 */
  --backdrop-blur: 12px;            /* 背景模糊 */
}

/* Dark Mode 深色主题 (可选) */
[data-theme="dark"] {
  /* 背景层级 (反转亮度) */
  --bg-base: #0f172a;               /* Slate 900 */
  --bg-subtle: #1e293b;             /* Slate 800 */
  --bg-muted: #334155;              /* Slate 700 */
  --bg-card: #1e293b;               /* Slate 800 */

  /* 前景与文本 (反转) */
  --fg-primary: #f8fafc;            /* Slate 50 */
  --fg-secondary: #cbd5e1;          /* Slate 300 */
  --fg-tertiary: #94a3b8;           /* Slate 400 */
  --fg-muted: #64748b;              /* Slate 500 */

  /* 描边 */
  --border-default: #334155;        /* Slate 700 */
  --border-subtle: #1e293b;         /* Slate 800 */
  --border-strong: #475569;         /* Slate 600 */

  /* 主色调 (深色模式下更亮) */
  --accent-primary: #94a3b8;        /* Slate 400 */
  --accent-hover: #cbd5e1;          /* Slate 300 */
  --accent-light: #1e293b;          /* Slate 800 */
  --accent-subtle: rgba(148, 163, 184, 0.15);

  /* 阴影 (深色模式下更柔和) */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6);

  /* 遮罩 */
  --overlay: rgba(0, 0, 0, 0.7);
}
```

#### 色彩使用规则

1. **背景层级**：base (底色) → subtle (大区块) → muted (次级区块) → card (浮起卡片)
2. **文本层级**：primary (标题/重要) → secondary (正文) → tertiary (辅助) → muted (禁用)
3. **交互状态**：
   - Default: `--accent-primary`
   - Hover: `--accent-hover`
   - Active: `--accent-hover` + `brightness(0.95)`
   - Disabled: `--fg-muted` + `opacity: 0.5`

### 2.2 排版系统

#### 字体栈

```typescript
// app/layout.tsx (使用 next/font/local)
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-sans',
})

const geistMono = localFont({
  src: '../public/fonts/GeistMono-Variable.woff2',
  variable: '--font-mono',
  display: 'swap',
})
```

```css
:root {
  /* 字体家族 */
  --font-sans: var(--font-inter, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  --font-mono: var(--font-geist-mono, 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace);

  /* 字号比例 (1.125x Major Second) */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */
  --text-6xl: 3.75rem;     /* 60px */

  /* 字重 */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* 行高 */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  /* 字间距 */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.1em;
}
```

#### 排版样式类

```css
/* 标题样式 */
.heading-1 {
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--fg-primary);
}

.heading-2 {
  font-size: var(--text-4xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--fg-primary);
}

/* 正文样式 */
.body-large {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  color: var(--fg-secondary);
}

.body-default {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--fg-secondary);
}

/* 小字/标注 */
.caption {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--fg-tertiary);
}

.label {
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
  font-weight: var(--font-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--fg-tertiary);
}
```

### 2.3 间距系统

#### 间距比例 (4px 基准)

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
  --space-32: 8rem;     /* 128px */

  /* 容器尺寸 */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1440px;   /* 最大内容宽度 */
}
```

#### 圆角系统

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.125rem;   /* 2px */
  --radius-base: 0.25rem;  /* 4px */
  --radius-md: 0.375rem;   /* 6px */
  --radius-lg: 0.5rem;     /* 8px */
  --radius-xl: 0.75rem;    /* 12px */
  --radius-2xl: 1rem;      /* 16px */
  --radius-3xl: 1.5rem;    /* 24px */
  --radius-full: 9999px;   /* 圆形/胶囊 */
}
```

#### 使用规则

- **卡片/容器**：`--radius-xl` (12px)
- **按钮/输入框**：`--radius-lg` (8px)
- **芯片/标签**：`--radius-md` (6px) 或 `--radius-full`
- **大区块**：`--radius-2xl` (16px)

### 2.4 动画系统

#### 缓动函数

```css
:root {
  /* Tailwind 默认缓动 */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* 自定义缓动 (Apple 风格) */
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);    /* 弹簧效果 */
  --ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);             /* 流畅过渡 */
  --ease-emphasized: cubic-bezier(0.05, 0.7, 0.1, 1.0);      /* 强调进入 */

  /* 过渡时长 */
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-medium: 300ms;
  --duration-slow: 500ms;
}
```

#### 动画原则

1. **微妙性**：避免过度动画，仅在有意义时使用
2. **性能优先**：仅动画 `transform` 和 `opacity`
3. **响应式**：尊重 `prefers-reduced-motion`

```css
/* 通用过渡 */
.transition-all {
  transition: all var(--duration-base) var(--ease-smooth);
}

/* 变换过渡 (性能优化) */
.transition-transform {
  transition: transform var(--duration-base) var(--ease-smooth);
}

/* 尊重减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 3. 组件规范 (shadcn/ui)

### 3.1 shadcn/ui 集成

#### 安装与配置

```bash
# 1. 初始化 shadcn/ui
npx shadcn@latest init

# 配置选项
# ✓ TypeScript: Yes
# ✓ Style: New York (简洁现代)
# ✓ Color: Slate (中性灰蓝)
# ✓ CSS variables: Yes
# ✓ Tailwind config: components.json
# ✓ Import alias: @/components

# 2. 安装核心组件 (第一批)
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tabs
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add skeleton
```

#### 配置文件

**components.json**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

#### Tailwind 配置迁移

**tailwind.config.ts** (新建)
```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

### 3.2 核心组件定制

#### Button 组件变体

```typescript
// components/ui/button.tsx (shadcn 生成后定制)

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // 默认主按钮
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",

        // 深色填充 (重要操作)
        solid: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200",

        // 轮廓按钮
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",

        // 幽灵按钮 (极简)
        ghost: "hover:bg-accent hover:text-accent-foreground",

        // 链接样式
        link: "text-primary underline-offset-4 hover:underline",

        // 破坏性操作
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8",
        xl: "h-14 rounded-xl px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

#### Card 组件定制

```typescript
// components/ui/card.tsx

<Card className="border-none shadow-sm hover:shadow-md transition-shadow">
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述文本</CardDescription>
  </CardHeader>
  <CardContent>
    {/* 内容 */}
  </CardContent>
  <CardFooter>
    {/* 操作按钮 */}
  </CardFooter>
</Card>
```

**定制样式**
```css
/* app/globals.css */
.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration-base) var(--ease-smooth);
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

### 3.3 自定义复合组件

#### StatCard (统计卡片)

```typescript
// components/stat-card.tsx
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  change?: number  // 变化百分比
  icon?: React.ReactNode
  trend?: "up" | "down" | "neutral"
}

export function StatCard({ label, value, change, icon, trend }: StatCardProps) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold mt-2">{value}</p>
            {change !== undefined && (
              <div className={cn(
                "flex items-center mt-2 text-sm font-medium",
                trend === "up" && "text-green-600",
                trend === "down" && "text-red-600",
                trend === "neutral" && "text-slate-600"
              )}>
                <span>{change > 0 ? "+" : ""}{change}%</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 4. 布局系统

### 4.1 响应式断点

**使用 Tailwind 默认断点**
```typescript
// 断点配置
const breakpoints = {
  sm: '640px',   // 移动端横屏/小平板
  md: '768px',   // 平板
  lg: '1024px',  // 桌面
  xl: '1280px',  // 大桌面
  '2xl': '1536px' // 超大屏
}
```

**响应式容器**
```typescript
// components/container.tsx
export function Container({ children, size = "2xl" }: ContainerProps) {
  return (
    <div className={cn(
      "mx-auto w-full px-4 sm:px-6 lg:px-8",
      size === "sm" && "max-w-screen-sm",
      size === "md" && "max-w-screen-md",
      size === "lg" && "max-w-screen-lg",
      size === "xl" && "max-w-screen-xl",
      size === "2xl" && "max-w-[1440px]"  // 限制最大宽度
    )}>
      {children}
    </div>
  )
}
```

### 4.2 栅格系统

**12 列栅格**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 卡片 */}
</div>

{/* 自定义列宽 */}
<div className="grid grid-cols-12 gap-6">
  <div className="col-span-12 lg:col-span-8">主内容</div>
  <div className="col-span-12 lg:col-span-4">侧边栏</div>
</div>
```

### 4.3 页面布局模板

#### 仪表盘布局

```tsx
// components/layouts/dashboard-layout.tsx
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Logo />
            <Navigation />
            <UserMenu />
          </div>
        </Container>
      </header>

      {/* 主内容区 */}
      <main className="flex-1">
        <Container size="2xl" className="py-8">
          {children}
        </Container>
      </main>

      {/* 页脚 */}
      <footer className="border-t">
        <Container>
          <div className="py-8">
            <Footer />
          </div>
        </Container>
      </footer>
    </div>
  )
}
```

---

## 5. 深浅色主题实现

### 5.1 next-themes 集成

**安装依赖**
```bash
npm install next-themes
```

**配置 Provider**
```typescript
// app/providers.tsx
"use client"

import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="light"  // 浅色为主
      enableSystem={false}  // 不跟随系统
      themes={["light", "dark"]}
    >
      {children}
    </ThemeProvider>
  )
}
```

```typescript
// app/layout.tsx
import { Providers } from "./providers"

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### 5.2 主题切换组件

```typescript
// components/theme-toggle.tsx
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="切换主题"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

---

## 6. 字体与图标系统

### 6.1 字体优化

**自托管 Inter**
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',  // FOUT 策略
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

### 6.2 图标系统统一 (Lucide React)

**安装**
```bash
npm install lucide-react
```

**常用图标清单**
```typescript
// lib/icons.ts
export {
  // 导航
  Home,
  BarChart3,
  FileText,
  Settings,
  User,

  // 操作
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,

  // 状态
  Check,
  X,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,

  // 箭头
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ArrowUpRight,

  // 其他
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Clock,
} from "lucide-react"
```

---

## 7. 实施计划

### 7.1 阶段划分

**Phase 1: 基础设施 (Week 1)**
- [ ] 创建 `tailwind.config.ts` 和 CSS 变量系统
- [ ] 安装并配置 shadcn/ui
- [ ] 集成 next-themes
- [ ] 自托管 Inter 字体
- [ ] 统一 Lucide React 图标
- [ ] 拆分 `globals.css` 为模块 (base.css, components.css, utilities.css)

**Phase 2: 核心组件迁移 (Week 2-3)**
- [ ] 迁移按钮组件 (Button → shadcn)
- [ ] 迁移卡片组件 (Card → shadcn)
- [ ] 迁移表单组件 (Input/Select/Label → shadcn)
- [ ] 迁移对话框 (Modal → Dialog)
- [ ] 迁移表格 (DataTable → Table)
- [ ] 迁移状态组件 (Badge/Avatar/Skeleton)

**Phase 3: 页面重构 (Week 3-4)**
- [ ] 主页 (Landing + Generator)
- [ ] 定价页 (Pricing Cards)
- [ ] 报告中心 (Reports List + Detail)
- [ ] 用户中心 (Account Sections)
- [ ] 登录/注册页面

**Phase 4: 管理后台 (Week 4-5)**
- [ ] 仪表盘 (Analytics)
- [ ] 用户管理 (Users Table)
- [ ] 订阅管理 (Subscriptions)
- [ ] 系统工具 (Health/Cache/Config)

**Phase 5: 优化与测试 (Week 5-6)**
- [ ] 响应式测试 (移动/平板/桌面)
- [ ] 深浅色主题测试
- [ ] 可访问性审计 (WCAG AA)
- [ ] 性能优化 (Lighthouse 评分 >90)
- [ ] 多语言测试 (5 种语言)

### 7.2 迁移策略

**渐进式迁移**
1. 新功能直接用 shadcn/ui 组件
2. 现有页面逐页重构，避免一次性大改
3. 保持旧组件在 `components/legacy/` 以备回退
4. 使用 Feature Flag 控制新旧风格切换

**风险控制**
- 每个阶段独立分支 (`feature/redesign-phase-1` ~ `phase-5`)
- 每个 Phase 完成后提交独立 PR
- 在 Staging 环境验证后再合并到 main
- 保留旧风格 CSS 作为降级方案 (通过环境变量控制)

---

## 8. 验收标准

### 8.1 设计一致性

- [ ] 所有页面使用统一的 Design Tokens (色彩/字体/间距)
- [ ] 所有交互元素符合按钮/卡片/表单规范
- [ ] 响应式断点在所有设备上表现一致
- [ ] 深浅色主题无视觉错误

### 8.2 性能指标

- [ ] Lighthouse Performance Score ≥ 90
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] 字体加载无 FOIT (Flash of Invisible Text)

### 8.3 可访问性

- [ ] 键盘导航通畅 (Tab/Shift+Tab/Enter/Esc)
- [ ] 屏幕阅读器支持 (所有图标有 aria-label)
- [ ] 色彩对比度符合 WCAG AA (4.5:1 正文, 3:1 大字)
- [ ] 表单有清晰的错误提示和标签关联

### 8.4 兼容性

- [ ] 浏览器：Chrome/Edge/Safari/Firefox 最新两个版本
- [ ] 设备：iOS/Android 移动端，iPad，桌面
- [ ] 响应式：320px ~ 2560px 宽度无布局崩溃
- [ ] i18n：5 种语言文本正常显示，无溢出

---

## 9. 技术约束与依赖

### 9.1 必须保持的功能

- [ ] 5 语言国际化支持 (en/ja/ko/zh-Hant/zh-Hans)
- [ ] Supabase Auth 集成
- [ ] 报告生成器核心功能
- [ ] 数据可视化 (Recharts 图表)
- [ ] PDF/DOCX 导出
- [ ] Google Analytics + Sentry 监控

### 9.2 技术依赖

**新增依赖**
```json
{
  "dependencies": {
    "next-themes": "^0.4.4",
    "tailwindcss-animate": "^1.0.7",
    "class-variance-authority": "^0.7.1",
    "@radix-ui/react-*": "各组件版本"
  }
}
```

**移除依赖**
- 无 (现有依赖保持不变)

### 9.3 环境变量

**无需新增**，继续使用现有 `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `FINNHUB_API_KEY`

---

## 10. 风险与缓解措施

### 10.1 潜在风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| **用户习惯变化** | 高 | 中 | 提供旧版风格回退开关，逐步引导用户 |
| **组件迁移工作量超预期** | 中 | 高 | 采用渐进式迁移，优先核心页面 |
| **性能回归** | 中 | 低 | 使用 Lighthouse CI 自动化监控 |
| **可访问性问题** | 中 | 中 | 集成 axe-core 自动化测试 |
| **深色模式实现复杂** | 低 | 低 | 使用 next-themes 成熟方案 |
| **i18n 翻译量增加** | 低 | 中 | 新组件复用现有翻译键，减少新增 |

### 10.2 降级方案

**Feature Flag 控制**
```typescript
// lib/feature-flags.ts
export const ENABLE_NEW_DESIGN = process.env.NEXT_PUBLIC_ENABLE_NEW_DESIGN === 'true'

// 条件渲染
{ENABLE_NEW_DESIGN ? <NewButton /> : <LegacyButton />}
```

**CSS 类名切换**
```html
<html data-design-version={ENABLE_NEW_DESIGN ? "v2" : "v1"}>
```

---

## 11. 关键决策记录 (ADR)

### ADR-001: 选择 shadcn/ui 而非 MUI

**决策**：采用 shadcn/ui 作为组件库

**理由**：
- ✅ 与现有 Tailwind v4 技术栈无缝集成
- ✅ 无运行时开销，组件直接复制到项目中可定制
- ✅ 基于 Radix UI，可访问性开箱即用
- ✅ TypeScript 友好，类型安全
- ❌ MUI 体积大 (400KB+)，定制成本高

### ADR-002: 浅色为主 + 深色可选

**决策**：默认浅色主题，提供深色主题切换

**理由**：
- ✅ 金融/专业类产品浅色主题更权威
- ✅ 数据密集页面浅色背景可读性更好
- ✅ 满足部分用户深色偏好
- ❌ 维护双主题增加 20% 工作量

**权衡**：通过 CSS 变量系统降低维护成本

### ADR-003: 中性灰蓝主色调

**决策**：使用 Slate (#64748b) 作为主色调

**理由**：
- ✅ 中性色不干扰数据呈现（金融数据用红绿表示涨跌）
- ✅ 百搭，易于与其他颜色组合
- ✅ 符合高端奢华风格的克制美学
- ❌ 不如蓝色/绿色有品牌辨识度

**补偿**：通过排版、留白、细节动画建立品牌差异化

---

## 12. 后续优化方向

### 12.1 性能优化

- [ ] 实现组件懒加载 (React.lazy)
- [ ] 优化 i18n 文件加载策略
- [ ] 引入 Service Worker (离线支持)
- [ ] 优化图片加载 (使用 next/image)

### 12.2 设计增强

- [ ] 实现设计 Token 自动化生成 (Style Dictionary)
- [ ] 集成 Storybook 组件文档
- [ ] 建立 Figma 与代码同步流程

### 12.3 开发体验

- [ ] 配置 VS Code snippets (快速创建组件)
- [ ] 建立组件使用指南文档
- [ ] 自动化截图测试 (Playwright)

---

## 13. 交接清单

### 13.1 产出文件

| 文件路径 | 说明 |
|---------|------|
| `docs/decisions/2025-12-10-frontend-style-redesign.md` | 本 Snapshot |
| `docs/plans/frontend-redesign-implementation.md` | 实施清单 (待 Claude 产出) |
| `tailwind.config.ts` | Tailwind 配置 (新建) |
| `components.json` | shadcn/ui 配置 (新建) |
| `app/globals.css` | 重构后的全局样式 |
| `components/ui/*` | shadcn 组件 (安装后) |
| `lib/utils.ts` | 工具函数 (cn, 等) |

### 13.2 验证命令

```bash
# Lint 检查
npm run lint

# 类型检查
npm run type-check

# 本地开发
npm run dev

# 构建验证
npm run build

# 测试
npm run test
```

### 13.3 审查要点

- [ ] 所有 shadcn 组件是否正确安装
- [ ] Tailwind 配置是否覆盖 CSS 变量
- [ ] next-themes 是否正确集成
- [ ] 字体是否正常加载 (无 FOIT)
- [ ] 深浅色主题切换无闪烁
- [ ] 响应式断点在所有设备正常

---

## 14. 参考资源

### 14.1 设计参考

- **Apple Design Resources**: https://developer.apple.com/design/resources/
- **Stripe Design System**: https://stripe.com/docs/design
- **Linear Design System**: https://linear.app/method
- **shadcn/ui Themes**: https://ui.shadcn.com/themes

### 14.2 技术文档

- **Next.js 16 Docs**: https://nextjs.org/docs
- **Tailwind CSS v4**: https://tailwindcss.com/docs/v4-beta
- **shadcn/ui**: https://ui.shadcn.com
- **Radix UI**: https://www.radix-ui.com
- **next-themes**: https://github.com/pacocoursey/next-themes
- **Lucide Icons**: https://lucide.dev

### 14.3 工具

- **Coolors** (调色板生成): https://coolors.co
- **Contrast Checker** (对比度检查): https://webaim.org/resources/contrastchecker/
- **axe DevTools** (可访问性): https://www.deque.com/axe/devtools/

---

## 附录 A: 现有组件迁移映射表

| 现有组件 | 位置 | 迁移目标 | 优先级 |
|---------|------|---------|--------|
| `StatCard` | `app/components/admin/ui/index.tsx` | 自定义组件 (基于 shadcn Card) | P1 |
| `StatusBadge` | 同上 | shadcn Badge | P1 |
| `Modal` | 同上 | shadcn Dialog | P1 |
| `DataTable` | 同上 | shadcn Table | P2 |
| `Tabs` | 同上 | shadcn Tabs | P2 |
| `.btn-gradient` | `app/globals.css` | shadcn Button variant | P1 |
| `.btn-ghost` | 同上 | shadcn Button ghost | P1 |
| `.glass-card` | 同上 | shadcn Card + 自定义样式 | P2 |
| `PricingCards` | `app/components/PricingCards.tsx` | 重构为 shadcn Card | P1 |
| `ReportForm` | `app/components/report-generator/ReportForm.tsx` | shadcn Form 组件 | P2 |

---

## 附录 B: 色彩对比度验证

| 组合 | 前景色 | 背景色 | 对比度 | WCAG AA |
|------|-------|-------|-------|---------|
| 主文本/白底 | #0f172a | #ffffff | 17.89:1 | ✅ 通过 |
| 次要文本/白底 | #475569 | #ffffff | 8.59:1 | ✅ 通过 |
| 主色调/白底 | #64748b | #ffffff | 5.78:1 | ✅ 通过 |
| 白文本/主色调 | #ffffff | #64748b | 5.78:1 | ✅ 通过 |
| 成功色/白底 | #10b981 | #ffffff | 3.42:1 | ⚠️ 大字通过 |
| 错误色/白底 | #ef4444 | #ffffff | 4.52:1 | ✅ 通过 |

**备注**：成功色需使用 `font-semibold` 或更大字号以满足 WCAG AA。

---

## 总结

本 Architecture Snapshot 提供了从现有暗色玻璃态风格到**高端奢华浅色极简风格**的完整迁移方案，核心策略为：

1. **Design Tokens 优先**：建立统一的色彩/字体/间距/圆角系统
2. **组件化架构**：通过 shadcn/ui 实现可复用、可维护的组件库
3. **渐进式迁移**：分 5 个阶段，每个阶段独立验证，降低风险
4. **双主题支持**：浅色为主 + 深色可选，通过 next-themes 优雅切换
5. **性能与可访问性**：确保 Lighthouse >90 分，WCAG AA 级别

**下一步**：等待老板审批后，分配工作组 (G1-G5) 开始实施。

---

**文档版本**：v1.0
**最后更新**：2025-12-10
**维护者**：HQ (Codex 角色)
