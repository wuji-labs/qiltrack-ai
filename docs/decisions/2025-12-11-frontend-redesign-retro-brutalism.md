# Architecture Snapshot: 新粗野主义风格全面重构方案

> **创建日期**: 2025-12-11
> **架构师**: Claude (代理 Codex)
> **项目**: qiltrack-ai
> **分支**: g3/develop
> **优先级**: P0（核心视觉重构）

---

## 📋 执行摘要

### 重构目标
将 Qiltrack AI 前端从**现代极简风格** (Modern Minimal) 全面迁移到**新粗野主义/复古波普风格** (Retro Pop / Neo-Brutalism)，基于已验证的 demo 项目设计系统。

### 关键指标
- **影响范围**: 100% UI组件 + 所有页面
- **预计工作量**: 5-7天全职开发
- **破坏性程度**: 高（视觉层面完全重构，逻辑不变）
- **用户影响**: 显著提升品牌辨识度和视觉冲击力
- **技术债务**: 清除现有的过渡风格代码

### 成功标准
- ✅ 所有组件统一使用新粗野主义设计语言
- ✅ 通过视觉一致性检查清单（见附录A）
- ✅ 保持所有现有功能不受影响
- ✅ 性能不低于现有基线

---

## 🎨 设计系统对比

### 当前风格：现代极简 (Modern Minimal)

**核心特征**:
```css
/* 颜色系统 */
--accent-primary: #0070f3;          /* Vercel 蓝 */
--bg-base: #ffffff;                 /* 纯白背景 */
--text-primary: #0a0a0a;            /* 近黑文字 */

/* 边框与阴影 */
border: 1px solid var(--border-subtle);
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
border-radius: var(--radius-lg); /* 12px */

/* 过渡动画 */
transition: all 200ms ease;
```

**视觉效果**: 柔和、克制、专业但缺乏个性

---

### 目标风格：新粗野主义 (Neo-Brutalism)

**核心特征**:
```css
/* 颜色系统 */
--retro-bg: #FDF8F3;                /* 奶油色背景 */
--retro-orange: #F49D6E;            /* 主色调-橙 */
--retro-yellow: #FFD275;            /* 强调色-黄 */
--retro-blue: #AECBEB;              /* 辅助色-蓝 */
--retro-black: #18181b;             /* 近黑 */

/* 边框与阴影 */
border: 2-4px solid #000000;        /* 粗黑边框 */
box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);  /* 硬朗阴影 */
border-radius: 0;                   /* 直角或最小圆角 */

/* 悬停效果 */
hover: {
  box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
  transform: translate(2px, 2px);
}
```

**视觉效果**: 大胆、高对比度、强烈的品牌个性

---

## 🔧 技术实施方案

### Phase 1: Design Tokens 重构

**目标**: 替换整个颜色和样式系统

**文件**: `app/styles/tokens.css`

**操作**:
```css
/* 完全替换现有变量 */
:root {
  /* ====== 背景层级 ====== */
  --bg-base: #FDF8F3;           /* 奶油色背景 */
  --bg-subtle: #FFFFFF;         /* 卡片背景 */
  --bg-hover: #F5F5F0;          /* 悬停背景 */

  /* ====== 主色系 ====== */
  --accent-primary: #F49D6E;    /* 橙色（主按钮、强调） */
  --accent-secondary: #FFD275;  /* 黄色（次要元素） */
  --accent-tertiary: #AECBEB;   /* 蓝色（信息提示） */

  /* ====== 语义色 ====== */
  --semantic-success: #51CF66;  /* 绿色 */
  --semantic-error: #FF6B6B;    /* 红色 */
  --semantic-warning: #FFD275;  /* 黄色（复用） */
  --semantic-info: #AECBEB;     /* 蓝色（复用） */

  /* ====== 文本颜色 ====== */
  --text-primary: #18181b;      /* 近黑 */
  --text-secondary: #525252;    /* 中灰 */
  --text-tertiary: #a3a3a3;     /* 浅灰 */

  /* ====== 边框 ====== */
  --border-width: 2px;
  --border-color: #000000;      /* 纯黑边框 */

  /* ====== 阴影系统 - Retro Shadows ====== */
  --shadow-retro: 4px 4px 0px 0px rgba(0,0,0,1);
  --shadow-retro-lg: 8px 8px 0px 0px rgba(0,0,0,1);
  --shadow-retro-hover: 2px 2px 0px 0px rgba(0,0,0,1);
  --shadow-retro-blue: 4px 4px 0px 0px #AECBEB;
  --shadow-retro-orange: 4px 4px 0px 0px #F49D6E;
  --shadow-retro-yellow: 4px 4px 0px 0px #FFD275;

  /* ====== 圆角系统 ====== */
  --radius-none: 0px;           /* 主要使用 */
  --radius-sm: 2px;             /* 最小圆角（可选） */

  /* ====== 字体系统 ====== */
  --font-display: 'Anton', sans-serif;           /* 标题字体 */
  --font-mono: 'JetBrains Mono', monospace;      /* 数据字体 */
  --font-sans: 'Inter', sans-serif;              /* 正文字体 */

  /* ====== 过渡动画 ====== */
  --transition-retro: 200ms ease-out;
}
```

**验收标准**:
- [ ] 所有旧变量名标记为 `@deprecated`
- [ ] 新变量覆盖所有设计需求（颜色、阴影、边框、字体）
- [ ] CSS变量在浏览器开发者工具中可正确查看

---

### Phase 2: 全局样式重写

**目标**: 添加新粗野主义的核心视觉元素

**文件**: `app/globals.css`

**新增样式**:

```css
/* ====== 点阵网格背景 ====== */
.bg-grid-dots {
  background-size: 40px 40px;
  background-image: radial-gradient(circle, #000000 1.5px, transparent 1.5px);
  opacity: 0.1;
}

/* ====== 3D 文字效果 ====== */
.text-3d {
  -webkit-text-stroke: 2px black;
  text-shadow:
    1px 1px 0 #000,
    2px 2px 0 #000,
    3px 3px 0 #000,
    4px 4px 0 #000;
}

.text-3d-sm {
  -webkit-text-stroke: 1px black;
  text-shadow:
    1px 1px 0 #000,
    2px 2px 0 #000;
}

.text-stroke {
  -webkit-text-stroke: 2px black;
  color: transparent;  /* 空心文字 */
}

/* ====== Retro 滚动条 ====== */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #FDF8F3;
  border-left: 2px solid black;
}

::-webkit-scrollbar-thumb {
  background: #F49D6E;
  border: 2px solid black;
}

::-webkit-scrollbar-thumb:hover {
  background: #FFD275;
}

/* ====== 全局背景 ====== */
body {
  background-color: #FDF8F3;
  color: #18181b;
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
}

/* ====== 浮动动画 ====== */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

@keyframes slideIn {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes fadeIn {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
```

**移除内容**:
```css
/* ⚠️ 需要删除或注释的旧样式 */
.glass-card { /* ... */ }
.frosted-bar { /* ... */ }
.hero-mesh { /* ... */ }
```

**验收标准**:
- [ ] `body` 背景色为奶油色 `#FDF8F3`
- [ ] 点阵网格在页面背景可见
- [ ] 3D文字类在标题中正确渲染
- [ ] 滚动条显示粗黑边框样式

---

### Phase 3: 核心 UI 组件改造

#### 3.1 Button 组件

**文件**: `app/components/ui/Button.tsx`

**改造前** (Modern Minimal):
```tsx
"bg-[var(--accent-primary)] text-white border border-transparent
hover:bg-[var(--accent-primary-hover)] rounded-[var(--radius-md)]"
```

**改造后** (Neo-Brutalism):
```tsx
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, ...props }, ref) => {
    const baseStyles = clsx(
      // 基础样式
      "relative inline-flex items-center justify-center",
      "border-2 border-black font-bold uppercase tracking-wider",
      "transition-all duration-200 focus:outline-none",
      "disabled:opacity-50 disabled:cursor-not-allowed",

      // 变体样式
      {
        // Primary - 橙色填充
        "bg-retroOrange text-black shadow-retro hover:shadow-retro-hover hover:translate-x-[2px] hover:translate-y-[2px]":
          variant === "primary",

        // Secondary - 白色边框
        "bg-white text-black shadow-retro hover:shadow-retro-hover hover:translate-x-[2px] hover:translate-y-[2px]":
          variant === "secondary",

        // Ghost - 透明
        "bg-transparent border-transparent hover:bg-black/5":
          variant === "ghost",

        // Danger - 红色
        "bg-retroRed text-black shadow-retro hover:shadow-retro-hover hover:translate-x-[2px] hover:translate-y-[2px]":
          variant === "danger",
      },

      // 尺寸样式
      {
        "px-4 py-2 text-sm": size === "sm",
        "px-6 py-3 text-base": size === "md",
        "px-8 py-4 text-lg": size === "lg",
      },

      className
    );

    return (
      <button ref={ref} className={baseStyles} disabled={loading || props.disabled} {...props}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);
```

**关键变化**:
- ✅ 边框从 `1px` → `2px solid black`
- ✅ 阴影从柔和 → `shadow-retro`
- ✅ 悬停效果：阴影缩小 + 位移 `(2px, 2px)`
- ✅ 移除圆角（或使用极小圆角）
- ✅ 字体变为 `font-bold uppercase`
- ✅ 背景色使用高饱和度颜色（橙、黄、蓝）

---

#### 3.2 Card 组件

**文件**: `app/components/ui/Card.tsx`

**改造后**:
```tsx
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className, children, ...props }, ref) => {
    const cardStyles = clsx(
      // 基础样式
      "border-2 border-black",
      "transition-all duration-200",

      // 变体样式
      {
        // Default - 白色卡片
        "bg-white shadow-retro": variant === "default",

        // Elevated - 大阴影
        "bg-white shadow-retro-lg": variant === "elevated",

        // Interactive - 悬停效果
        "bg-white shadow-retro hover:shadow-retro-hover hover:translate-x-[2px] hover:translate-y-[2px] cursor-pointer":
          variant === "interactive",

        // Colored - 彩色背景（新增）
        "bg-retroOrange shadow-retro": variant === "orange",
        "bg-retroYellow shadow-retro": variant === "yellow",
        "bg-retroBlue shadow-retro": variant === "blue",
      },

      className
    );

    return (
      <div ref={ref} className={cardStyles} {...props}>
        {children}
      </div>
    );
  }
);
```

**关键变化**:
- ✅ 边框 `2px solid black`
- ✅ 移除圆角（`border-radius: 0`）
- ✅ 新增彩色背景变体
- ✅ 悬停时阴影缩小+位移

---

#### 3.3 Input & Select 组件

**文件**: `app/components/ui/Input.tsx`, `app/components/ui/Select.tsx`

**改造后**:
```tsx
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "w-full bg-white border-2 border-black px-4 py-3",
        "text-black placeholder:text-gray-400 font-bold",
        "focus:outline-none focus:ring-4 focus:ring-retroOrange/20 focus:border-black",
        "transition-all",
        className
      )}
      {...props}
    />
  )
);
```

**关键变化**:
- ✅ 边框 `2px solid black`
- ✅ 焦点时橙色光晕 `focus:ring-retroOrange/20`
- ✅ 移除圆角
- ✅ 字体加粗 `font-bold`

---

#### 3.4 Badge 组件

**文件**: `app/components/ui/Badge.tsx`

**改造后**:
```tsx
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  className
}) => {
  const styles = {
    success: "bg-emerald-300",
    warning: "bg-retroYellow",
    neutral: "bg-gray-200",
    blue: "bg-retroBlue",
    purple: "bg-purple-300",
    orange: "bg-retroOrange",
  };

  return (
    <span className={clsx(
      "px-3 py-1 text-xs font-bold uppercase",
      "border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
      "inline-flex items-center",
      styles[variant],
      className
    )}>
      {children}
    </span>
  );
};
```

**关键变化**:
- ✅ 硬朗小阴影 `2px 2px 0px 0px black`
- ✅ 全大写文字 `uppercase`
- ✅ 粗黑边框
- ✅ 高饱和度背景色

---

#### 3.5 其他核心组件

**需要改造的组件清单**:
- [ ] `ProgressBar` - 使用粗黑边框，分段显示
- [ ] `Avatar` - 圆形改为方形或最小圆角
- [ ] `Tabs` - 粗黑边框，当前tab高亮背景色
- [ ] `Select` - 与Input保持一致风格

---

### Phase 4: 页面组件改造

#### 4.1 HeroSection

**文件**: `app/sections/HeroSection.tsx`

**改造要点**:
```tsx
<div className="relative min-h-screen bg-retroBg">
  {/* 点阵网格背景 */}
  <div className="absolute inset-0 bg-grid-dots opacity-10" />

  {/* 主标题 - 3D文字效果 */}
  <h1 className="text-6xl md:text-8xl font-display text-3d text-black mb-6">
    QILTRACK AI
  </h1>

  {/* 副标题 - 描边效果 */}
  <p className="text-xl md:text-2xl text-stroke-sm text-black mb-8">
    3分钟，搞懂一家美股上市公司
  </p>

  {/* 浮动装饰卡片 - 橙色背景 */}
  <Card variant="orange" className="absolute top-20 left-10 animate-float-slow p-6">
    <div className="font-mono text-2xl font-bold">AAPL</div>
    <div className="text-sm">$182.45</div>
    <Badge variant="success">+2.3%</Badge>
  </Card>

  {/* CTA按钮 */}
  <Button variant="primary" size="lg" className="px-12 py-6">
    <Sparkles className="w-6 h-6 mr-2" />
    START ANALYZING
  </Button>
</div>
```

**关键变化**:
- ✅ 背景使用点阵网格
- ✅ 主标题使用3D文字效果
- ✅ 浮动卡片使用彩色背景
- ✅ 所有文字全大写或使用粗体

---

#### 4.2 PricingPage

**文件**: `app/pricing/page.tsx`

**改造要点**:
```tsx
<div className="grid md:grid-cols-3 gap-8">
  {plans.map((plan) => (
    <Card
      key={plan.id}
      variant={plan.id === "pro" ? "yellow" : "default"}
      className="p-8 relative"
    >
      {/* "MOST POPULAR" 标签 */}
      {plan.id === "pro" && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge variant="warning" className="text-xs px-4 py-2">
            MOST POPULAR
          </Badge>
        </div>
      )}

      {/* 计划名称 */}
      <h3 className="font-display text-3xl uppercase mb-4">
        {plan.name}
      </h3>

      {/* 价格 */}
      <div className="text-5xl font-bold mb-6">
        ${plan.price}<span className="text-xl">/月</span>
      </div>

      {/* 特性列表 */}
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Check className="w-5 h-5 text-black" />
            <span className="font-medium">{feature}</span>
          </li>
        ))}
      </ul>

      {/* 订阅按钮 */}
      <Button
        variant={plan.id === "pro" ? "primary" : "secondary"}
        className="w-full"
      >
        {plan.id === user?.plan ? "CURRENT PLAN" : "UPGRADE"}
      </Button>
    </Card>
  ))}
</div>
```

**关键变化**:
- ✅ Pro计划卡片使用黄色背景
- ✅ "MOST POPULAR" 标签使用Badge
- ✅ 文字全大写
- ✅ 所有卡片使用粗黑边框

---

#### 4.3 AccountSettings

**文件**: `app/account/sections/*.tsx`

**改造要点**:
- ✅ 侧边栏导航：黑色背景 + 橙色高亮
- ✅ 统计卡片：使用不同彩色背景（橙、黄、蓝）
- ✅ 表单字段：粗黑边框 + 橙色焦点光晕
- ✅ 危险操作按钮：红色背景

---

### Phase 5: 字体加载

**文件**: `app/layout.tsx`

**添加字体导入**:
```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-inter",
});

// 在 <head> 中添加额外字体
<link
  href="https://fonts.googleapis.com/css2?family=Anton&family=JetBrains+Mono:wght@500;700&display=swap"
  rel="stylesheet"
/>
```

**验收标准**:
- [ ] Anton 字体成功加载（标题使用）
- [ ] JetBrains Mono 字体成功加载（数据使用）
- [ ] Inter 字体保留（正文使用）

---

## 🎯 实施计划

### Stage 1: 基础设施 (1天)
- [x] 解决Git冲突
- [ ] 更新 `tokens.css`（颜色、阴影、字体变量）
- [ ] 重写 `globals.css`（3D文字、点阵背景、滚动条）
- [ ] 添加字体加载

**输出**: 设计系统基础设施完成

---

### Stage 2: 核心组件 (2天)
- [ ] 改造 `Button` 组件
- [ ] 改造 `Card` 组件
- [ ] 改造 `Input` 组件
- [ ] 改造 `Select` 组件
- [ ] 改造 `Badge` 组件
- [ ] 改造 `ProgressBar` 组件
- [ ] 改造 `Avatar` 组件
- [ ] 改造 `Tabs` 组件

**输出**: 所有UI组件符合新风格

---

### Stage 3: 页面组件 (2天)
- [ ] 改造 `HeroSection`
- [ ] 改造 `PricingPage`
- [ ] 改造 `AccountSettings`
- [ ] 改造 `ReportGeneratorSection`
- [ ] 改造 `ModesSection`
- [ ] 改造 `FooterSection`

**输出**: 所有页面符合新风格

---

### Stage 4: 测试与优化 (1-2天)
- [ ] 视觉一致性检查（见附录A）
- [ ] 功能回归测试
- [ ] 性能测试（Lighthouse）
- [ ] 响应式测试（移动端、平板）
- [ ] 无障碍测试（键盘导航、对比度）

**输出**: 通过所有质量门槛

---

## ⚠️ 风险评估与缓解

### 风险1: 品牌认知度变化
**描述**: 用户可能不适应新的视觉风格
**影响**: 中
**缓解措施**:
- 在首页添加可选的"经典模式"开关（保留现有风格）
- 逐步推出（A/B测试）

---

### 风险2: 性能回退
**描述**: 3D文字和复杂阴影可能影响渲染性能
**影响**: 低
**缓解措施**:
- 使用CSS `will-change` 优化动画元素
- 限制同时显示的浮动元素数量
- 使用 `transform` 而非 `top/left` 做动画

---

### 风险3: 无障碍性下降
**描述**: 高饱和度配色可能影响色盲用户
**影响**: 中
**缓解措施**:
- 确保文字对比度 ≥ 4.5:1（WCAG AA标准）
- 不单纯依赖颜色传递信息（使用图标辅助）
- 保留高对比度模式支持

---

### 风险4: 旧代码残留
**描述**: 过渡期间可能出现样式冲突
**影响**: 高
**缓解措施**:
- 完全移除旧变量和样式类（标记为 `@deprecated`）
- 使用 ESLint 规则检测旧类名使用
- 在 `globals.css` 中添加警告注释

---

## 📊 验收标准

### 设计一致性检查清单

#### A. 核心视觉元素
- [ ] 所有卡片使用 `border: 2px solid black`
- [ ] 所有按钮使用 `shadow-retro` 阴影
- [ ] 主标题使用 `.text-3d` 效果
- [ ] 背景色为 `#FDF8F3`（奶油色）
- [ ] 无未授权的圆角（除非 ≤ 2px）

#### B. 交互效果
- [ ] 按钮悬停时阴影缩小 + 位移 `(2px, 2px)`
- [ ] 卡片悬停时同样效果（interactive variant）
- [ ] 输入框焦点时显示橙色光晕

#### C. 颜色使用
- [ ] 主按钮使用 `bg-retroOrange`
- [ ] 成功状态使用 `bg-retroGreen`
- [ ] 错误状态使用 `bg-retroRed`
- [ ] 警告状态使用 `bg-retroYellow`
- [ ] 信息提示使用 `bg-retroBlue`

#### D. 排版
- [ ] 标题使用 `font-display` (Anton)
- [ ] 数据使用 `font-mono` (JetBrains Mono)
- [ ] 正文使用 `font-sans` (Inter)
- [ ] 重要文字使用 `font-bold` + `uppercase`

#### E. 功能完整性
- [ ] 所有表单可正常提交
- [ ] 所有链接可点击
- [ ] 报告生成功能正常
- [ ] 导出功能（DOCX/PDF）正常
- [ ] 登录/登出功能正常

#### F. 性能指标
- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s

---

## 📝 交付物清单

### 代码
- [ ] `app/styles/tokens.css` - 新设计系统变量
- [ ] `app/globals.css` - 全局样式（3D文字、点阵背景）
- [ ] `app/components/ui/*.tsx` - 8个核心组件
- [ ] `app/sections/*.tsx` - 6个页面section组件
- [ ] `app/layout.tsx` - 字体加载

### 文档
- [ ] 本文档 - Architecture Snapshot
- [ ] `docs/reports/2025-12-11-g3-neobrutalism-cavr.md` - CAVR报告
- [ ] `README.md` - 更新设计系统说明
- [ ] 视觉一致性检查清单（附录A）

### 测试
- [ ] 功能回归测试报告
- [ ] 性能测试报告（Lighthouse）
- [ ] 无障碍测试报告

---

## 🎓 参考资料

### 设计灵感
- Demo项目：`D:\Projects\Qiltrack-AI-GOOGLE`
- [Neo-Brutalism设计趋势](https://dribbble.com/tags/neo-brutalism)
- [Brutalist Web Design](https://brutalistwebsites.com/)

### 技术文档
- [Tailwind CSS 自定义配置](https://tailwindcss.com/docs/configuration)
- [CSS text-shadow 技术](https://developer.mozilla.org/en-US/docs/Web/CSS/text-shadow)
- [WCAG 对比度要求](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

## 📞 联系与审批

**架构师**: Claude (代理 Codex)
**审批流程**:
1. 老板审阅本 Snapshot
2. 确认设计方向和实施计划
3. 批准后开始 Stage 1 实施

**下一步行动** (等待老板指令):
```
@Claude
Report: docs/decisions/2025-12-11-frontend-redesign-retro-brutalism.md
Status: Architecture Snapshot 已完成，等待审批
Next: 请审阅并批准，或提出修改意见
```

---

**文档版本**: v1.0
**最后更新**: 2025-12-11
**维护者**: G3-Codex (Claude)
