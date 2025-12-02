# Footer Refresh - Implementation Plan

**Date:** 2025-11-28
**Status:** Ready for Implementation
**Dependencies:** All validated ✓

---

## 1. ENVIRONMENT & DEPENDENCY VALIDATION

### ✓ Confirmed Compatibility

| Component                  | Status        | Notes                                                                                   |
| -------------------------- | ------------- | --------------------------------------------------------------------------------------- |
| **Tailwind v4**            | ✓ Verified    | v4 with `@theme inline` + CSS variables already in use; supports `var()` in classes     |
| **CSS Variables**          | ✓ Available   | All 30+ variables pre-defined in `globals.css`; ready to extend                         |
| **i18n System**            | ✓ Ready       | React Context + `useLanguage()` hook; 5 languages (en, ja, ko, zh-Hant, zh-Hans)        |
| **Link Component**         | ✓ Standard    | Next.js `Link` + `aria-label` patterns established                                      |
| **SVG Assets**             | ✓ `/public`   | `globe.svg`, `file.svg` available; text "Investor AI" for wordmark (no custom logo yet) |
| **Responsive Breakpoints** | ✓ Defaults    | Tailwind v4 defaults (sm: 640px, md: 768px, lg: 1024px) align with design               |
| **a11y Patterns**          | ✓ Established | Focus rings, aria-labels, 44px min touch targets all in use                             |

### Libraries Already Imported in Project

```typescript
// Ready to use:
- next/link
- next/image (if needed for wordmark later)
- React Context API
- TypeScript with strict mode
```

### No New Dependencies Required ✓

- Tailwind v4 covers all styling needs
- CSS Utilities already defined (`glass-card`, `frosted-bar`, `btn-gradient`)
- i18n architecture supports complex nested structures

---

## 2. UI COMPONENT ARCHITECTURE SLICES

### Component Structure (Props-based, Composable)

```typescript
// app/sections/FooterSection.tsx - Root Component
interface FooterSectionProps {
  // Allow future page-specific customization
  brandTitle?: string; // Default: "Investor AI"
  brandCaption?: string; // Default: from i18n
  showBrand?: boolean; // Default: true
  showLinks?: boolean; // Default: true
  showDownload?: boolean; // Default: true
  showMeta?: boolean; // Default: true
  customLinks?: FooterLinks; // Optional override
}

interface FooterLinks {
  product?: LinkGroup;
  solutions?: LinkGroup;
  company?: LinkGroup;
  resources?: LinkGroup;
  compare?: LinkGroup;
}

interface LinkGroup {
  title: string;
  items: FooterLink[];
}

interface FooterLink {
  label: string;
  href: string;
  badge?: string; // e.g., "NEW" or "BETA"
}

interface FooterMeta {
  disclaimer: string;
  dataSource: string;
  legal: LegalLink[];
  social: SocialLink[];
}

interface SocialLink {
  platform: "instagram" | "youtube" | "twitter" | "linkedin" | "bilibili";
  href: string;
  label: string; // aria-label
}
```

### UI Component Breakdown

#### **Slice 1: Brand Block (Left, Desktop)**

```typescript
// Components/FooterBrand.tsx
<div className="flex flex-col gap-4">
  <div>
    <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
      {brandTitle}  {/* "Investor AI" text */}
    </h3>
    <p className="text-sm text-[var(--text-dim)] mt-2">
      {brandCaption}  {/* "用生成式 AI 自动撰写机构级投资研究" */}
    </p>
  </div>
  <button className="btn-gradient px-4 py-2 rounded-md text-sm font-medium">
    {ctaLabel}  {/* "体验报告生成器" or "Experience Report Generator" */}
  </button>
</div>
```

**Responsive Behavior:**

- Desktop (lg+): Fixed width ~240px, left column
- Tablet (md): Full width, moved above links
- Mobile: Full width, moved above links

---

#### **Slice 2: Link Columns (Center, All Sizes)**

```typescript
// Components/FooterLinks.tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
  {Object.entries(linkGroups).map(([key, group]) => (
    <div key={key} className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold text-[var(--color-foreground)] uppercase tracking-wide">
        {group.title}
      </h4>
      <ul className="flex flex-col gap-2">
        {group.items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm text-[var(--text-dim)] hover:text-[var(--accent-emerald)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-emerald)]"
              aria-label={`${group.title}: ${item.label}`}
            >
              {item.label}
              {item.badge && <span className="ml-2 inline-block text-xs px-2 py-1 rounded-full bg-[var(--accent-emerald)] text-[var(--bg-base)]">{item.badge}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  ))}
</div>
```

**Responsive Behavior:**

- Desktop (lg+): 4 columns (Product, Solutions, Company, Resources, Compare = may wrap to 5)
- Tablet (md): 2 columns
- Mobile (sm): 1 column (unless stacked differently)
- Gap: 16px (sm), 24px (md+)

---

#### **Slice 3: Download/CTA Card (Right, Desktop)**

```typescript
// Components/FooterDownloadCard.tsx
<div className="rounded-lg bg-[var(--bg-layer)] border border-[var(--stroke-soft)] p-4 sm:p-6">
  {downloadTitle && (
    <h4 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">
      {downloadTitle}  {/* "下载应用" or "Download App" */}
    </h4>
  )}
  {downloadCaption && (
    <p className="text-xs text-[var(--text-subtle)] mb-3">
      {downloadCaption}  {/* "随时随地查看报告" */}
    </p>
  )}
  <div className="flex gap-2">
    <button className="btn-ghost px-3 py-2 rounded-md text-xs font-medium">
      App Store
    </button>
    <button className="btn-ghost px-3 py-2 rounded-md text-xs font-medium">
      Google Play
    </button>
  </div>
</div>
```

**Responsive Behavior:**

- Desktop (lg+): Right side, fixed width ~200px
- Tablet (md): Below links, full width
- Mobile: Below links, full width

---

#### **Slice 4: Meta Information Bar (Bottom)**

```typescript
// Components/FooterMeta.tsx
<div className="border-t border-[var(--stroke-soft)] pt-4 mt-6">
  {/* Disclaimer + Data Source (if shown) */}
  <div className="text-xs text-[var(--text-subtle)] space-y-2 mb-4">
    {disclaimer && <p>{disclaimer}</p>}
    {dataSource && <p>{dataSource}</p>}
  </div>

  {/* Legal Links + Social Icons */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    {/* Legal Links */}
    <nav className="flex flex-wrap gap-3 sm:gap-4 text-xs">
      {legal.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-[var(--text-subtle)] hover:text-[var(--accent-emerald)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-emerald)]"
          aria-label={item.label}
        >
          {item.label}
        </Link>
      ))}
    </nav>

    {/* Social Icons */}
    <div className="flex gap-3">
      {social.map((platform) => (
        <a
          key={platform.platform}
          href={platform.href}
          className="w-8 h-8 rounded-full bg-[var(--bg-layer)] border border-[var(--stroke-soft)] flex items-center justify-center text-xs font-bold text-[var(--text-dim)] hover:bg-[var(--bg-frosted)] hover:text-[var(--accent-emerald)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-emerald)]"
          aria-label={platform.label}
        >
          {platform.platform.charAt(0).toUpperCase()}  {/* "I", "Y", "T", "L", "B" */}
        </a>
      ))}
    </div>

    {/* Copyright */}
    <p className="text-xs text-[var(--text-subtle)] sm:ml-auto">
      © {new Date().getFullYear()} Investor AI. All rights reserved.
    </p>
  </div>
</div>
```

**Responsive Behavior:**

- Desktop: Horizontal layout (Legal left, Social + Copyright right)
- Mobile: Stacked vertical, centered

---

### Full FooterSection Layout Assembly

```typescript
export default function FooterSection({
  disclaimer,
  dataSource,
  brandTitle,
  brandCaption,
  showBrand = true,
  showLinks = true,
  showDownload = true,
  showMeta = true,
}: FooterSectionProps) {
  return (
    <footer className="bg-[var(--bg-base)] border-t border-[var(--stroke-soft)] py-12 sm:py-16 px-4 sm:px-6 lg:px-10">
      {/* Optional: Gradient top border or accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-emerald)] to-transparent opacity-50"></div>

      {/* Main Grid: Brand | Links | Download */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 mb-8">
          {showBrand && (
            <div className="lg:col-span-1">
              <FooterBrand {...} />
            </div>
          )}

          {showLinks && (
            <div className="lg:col-span-3">
              <FooterLinks {...} />
            </div>
          )}

          {showDownload && (
            <div className="lg:col-span-1">
              <FooterDownloadCard {...} />
            </div>
          )}
        </div>

        {/* Meta Section */}
        {showMeta && (
          <FooterMeta disclaimer={disclaimer} dataSource={dataSource} {...} />
        )}
      </div>
    </footer>
  );
}
```

---

## 3. i18n STRUCTURE & TRANSLATION KEYS

### New i18n Keys to Add to `lib/i18n.tsx`

```typescript
// Footer Brand Section
"footer.brand.title": {
  en: "Investor AI",
  ja: "Investor AI",
  ko: "Investor AI",
  zh: "Investor AI",  // Same in all Chinese variants
},

"footer.brand.caption": {
  en: "Institutional-grade investment research powered by generative AI",
  ja: "生成AIが提供する機関向け投資リサーチ",
  ko: "생성형 AI로 구동되는 기관급 투자 리서치",
  zh: {
    hant: "用生成式 AI 自動撰寫機構級投資研究",
    hans: "用生成式 AI 自动撰写机构级投资研究",
  },
},

"footer.brand.cta.label": {
  en: "Experience Report Generator",
  ja: "レポート生成を試す",
  ko: "리포트 생성 체험",
  zh: {
    hant: "體驗報告生成器",
    hans: "体验报告生成器",
  },
},

"footer.brand.cta.href": "/generator",  // Static, not i18n'd

// Footer Link Groups
"footer.links.product.title": {
  en: "Product",
  ja: "プロダクト",
  ko: "제품",
  zh: {
    hant: "產品",
    hans: "产品",
  },
},

"footer.links.product.items": {
  // Should be structured as array in component logic
  en: [
    { label: "Report Generator", href: "#generator" },
    { label: "Templates", href: "/reports" },
    { label: "API Documentation", href: "/docs/api" },
    { label: "Integrations", href: "/integrations" },
    { label: "Pricing", href: "#pricing", badge: "NEW" },
  ],
  // ... other languages
},

"footer.links.solutions.title": {
  en: "Solutions",
  ja: "ソリューション",
  ko: "솔루션",
  zh: {
    hant: "解決方案",
    hans: "解决方案",
  },
},

"footer.links.solutions.items": {
  en: [
    { label: "For Analysts", href: "/solutions/analysts" },
    { label: "For Managers", href: "/solutions/managers" },
    { label: "Enterprise", href: "/solutions/enterprise" },
    { label: "Case Studies", href: "/case-studies" },
  ],
  // ... other languages
},

"footer.links.company.title": {
  en: "Company",
  ja: "企業",
  ko: "회사",
  zh: {
    hant: "公司",
    hans: "公司",
  },
},

"footer.links.company.items": {
  en: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  // ... other languages
},

"footer.links.resources.title": {
  en: "Resources",
  ja: "リソース",
  ko: "리소스",
  zh: {
    hant: "資源",
    hans: "资源",
  },
},

"footer.links.resources.items": {
  en: [
    { label: "Documentation", href: "/docs" },
    { label: "FAQ", href: "/faq" },
    { label: "Help Center", href: "/help" },
    { label: "Community", href: "/community" },
  ],
  // ... other languages
},

"footer.links.compare.title": {
  en: "Compare",
  ja: "比較",
  ko: "비교",
  zh: {
    hant: "比較",
    hans: "比较",
  },
},

"footer.links.compare.items": {
  en: [
    { label: "vs. Bloomberg Terminal", href: "/compare/bloomberg" },
    { label: "vs. FactSet", href: "/compare/factset" },
    { label: "vs. Manual Research", href: "/compare/manual" },
  ],
  // ... other languages
},

// Footer Download Section
"footer.download.title": {
  en: "Download App",
  ja: "アプリをダウンロード",
  ko: "앱 다운로드",
  zh: {
    hant: "下載應用",
    hans: "下载应用",
  },
},

"footer.download.caption": {
  en: "Access reports anywhere",
  ja: "どこからでもレポートにアクセス",
  ko: "어디서나 보고서에 접근",
  zh: {
    hant: "隨時隨地查看報告",
    hans: "随时随地查看报告",
  },
},

// Footer Meta Section
"footer.meta.legal.terms": {
  en: "Terms of Service",
  ja: "利用規約",
  ko: "이용약관",
  zh: {
    hant: "使用條款",
    hans: "使用条款",
  },
},

"footer.meta.legal.privacy": {
  en: "Privacy Policy",
  ja: "プライバシーポリシー",
  ko: "개인정보 보호정책",
  zh: {
    hant: "隱私政策",
    hans: "隐私政策",
  },
},

"footer.meta.legal.acceptable-use": {
  en: "Acceptable Use",
  ja: "利用可能な用途",
  ko: "승인된 사용",
  zh: {
    hant: "可接受使用政策",
    hans: "可接受使用政策",
  },
},

"footer.meta.legal.legal": {
  en: "Legal",
  ja: "法務",
  ko: "법률",
  zh: {
    hant: "法律",
    hans: "法律",
  },
},

// Social Platforms
"footer.social.instagram": {
  en: "Follow us on Instagram",
  ja: "Instagramでフォロー",
  ko: "Instagram에서 팔로우",
  zh: {
    hant: "在 Instagram 上關注我們",
    hans: "在 Instagram 上关注我们",
  },
},

"footer.social.youtube": {
  en: "Subscribe on YouTube",
  ja: "YouTubeで購読",
  ko: "YouTube에 구독",
  zh: {
    hant: "在 YouTube 上訂閱",
    hans: "在 YouTube 上订阅",
  },
},

"footer.social.twitter": {
  en: "Follow on X (Twitter)",
  ja: "X（Twitter）をフォロー",
  ko: "X(Twitter) 팔로우",
  zh: {
    hant: "在 X (Twitter) 上關注",
    hans: "在 X (Twitter) 上关注",
  },
},

"footer.social.linkedin": {
  en: "Connect on LinkedIn",
  ja: "LinkedInで接続",
  ko: "LinkedIn에서 연결",
  zh: {
    hant: "在 LinkedIn 上連接",
    hans: "在 LinkedIn 上连接",
  },
},

// Existing keys (keep these)
"footer.disclaimer": {
  en: "This tool is for learning, research, and information organization only...",
  // ... keep existing translations
},

"footer.dataSource": {
  en: "Market information is sourced from multiple third-party providers...",
  // ... keep existing translations
},
```

### Implementation Notes for i18n

1. **Array Structure for Link Groups**: Since i18n keys are flat strings, use one of two approaches:

   ```typescript
   // Option A: Separate keys for each item (verbose but simple)
   "footer.links.product.item.generator": { en: "Report Generator", ... }

   // Option B: Store as JSON string and parse (compact)
   "footer.links.product.items": {
     en: JSON.stringify([
       { label: "Report Generator", href: "#generator" },
       ...
     ]),
     ...
   }
   // Then in component: JSON.parse(t("footer.links.product.items"))
   ```

   **Recommendation:** Option B (JSON string) to keep i18n organized

2. **Chinese Variants**: Use `withChineseVariants()` helper for Simplified/Traditional differences:

   ```typescript
   withChineseVariants({
     en: "Report Generator",
     ja: "レポート生成器",
     ko: "리포트 생성기",
     zh: {
       hant: "報告生成器",
       hans: "报告生成器",
     },
   });
   ```

3. **Social Platform Labels**: Store full aria-label text (not just platform name):
   ```typescript
   "footer.social.instagram": "Follow us on Instagram"  // Full label for a11y
   ```

---

## 4. RESPONSIVE LAYOUT BREAKPOINT PLAN

### Layout Modes

| Viewport                     | Grid Layout   | Link Columns | Brand Position  | Download Card | Vertical Stack |
| ---------------------------- | ------------- | ------------ | --------------- | ------------- | -------------- |
| **320–639px** (Mobile)       | 1-column flex | 1 column     | Full width, top | Full width    | Yes            |
| **640–767px** (Small Tablet) | 2-column grid | 2 columns    | Full width      | Full width    | Yes            |
| **768–1023px** (Tablet)      | 2-column grid | 2 columns    | Full width      | Full width    | Yes            |
| **1024px+** (Desktop)        | 5-column grid | 4 columns    | Left column     | Right column  | No             |

### Tailwind Classes for Responsive Design

```typescript
// Main footer container
className="
  bg-[var(--bg-base)]
  border-t border-[var(--stroke-soft)]
  py-6 sm:py-8 md:py-12 lg:py-16
  px-4 sm:px-6 md:px-8 lg:px-10
"

// Brand section (left column on lg+)
className="
  flex flex-col gap-4
  lg:col-span-1
"

// Link columns
className="
  grid
  grid-cols-1        // 1 column on mobile
  sm:grid-cols-2     // 2 columns on sm+
  md:grid-cols-2     // 2 columns on md+
  lg:grid-cols-4     // 4 columns on lg+
  gap-4 sm:gap-6 lg:gap-8
  lg:col-span-3
"

// Each link group
className="
  flex flex-col gap-3
  min-w-0  // Prevent text overflow
"

// Download card (right column on lg+)
className="
  rounded-lg
  bg-[var(--bg-layer)]
  border border-[var(--stroke-soft)]
  p-4 sm:p-6
  lg:col-span-1
"

// Meta section (full width)
className="
  border-t border-[var(--stroke-soft)]
  pt-4 sm:pt-6 mt-6 sm:mt-8
"

// Legal links + Social (responsive flex)
className="
  flex
  flex-col                    // Stack on mobile
  sm:flex-row                 // Horizontal on sm+
  sm:items-center
  sm:justify-between
  gap-4 sm:gap-6
"
```

### Breakpoint-Specific Details

**Mobile (320-639px)**

- All sections stack vertically
- Full width content
- Touch targets: min 44px height
- Padding: 16px horizontal, 24px vertical

**Small Tablet (640-767px)**

- 2-column link grid appears
- Brand section still full width
- Download card still full width (below links)
- Increased gap between sections (24px)

**Tablet (768-1023px)**

- Same as small tablet
- Slightly larger padding (24px horizontal)
- Increased vertical padding (48px)

**Desktop (1024px+)**

- 5-column grid: Brand(1) | Links(3) | Download(1)
- Horizontal layout activated
- Gap between sections: 32px
- Meta bar spans full width below

### Key CSS Custom Properties Used

```css
/* Colors */
--bg-base: #0a0a0c /* Footer background */ --bg-layer: rgba(255, 255, 255, 0.03)
  /* Card backgrounds */ --bg-frosted: rgba(255, 255, 255, 0.07) /* Hover states */
  --color-foreground: #f4f4f7 /* Headings */ --text-dim: rgba(244, 244, 247, 0.76) /* Body text */
  --text-subtle: rgba(244, 244, 247, 0.54) /* Secondary text */
  --stroke-soft: rgba(255, 255, 255, 0.08) /* Borders */ --accent-emerald: #5be0b0 /* CTAs, hover */
  /* Spacing (Tailwind units) */ gap-4: 16px gap-6: 24px gap-8: 32px py-6 / py-12 / py-16: 24px /
  48px / 64px px-4 / px-6 / px-10: 16px / 24px / 40px /* Typography (Tailwind scales) */
  text-xs: 12px text-sm: 14px text-base: 16px text-lg: 18px font-semibold: 600 weight
  font-medium: 500 weight;
```

---

## 5. ACCESSIBILITY & TESTING VERIFICATION CHECKLIST

### 5.1 Accessibility Requirements

#### **Color Contrast (WCAG AA)**

- [ ] All text vs. background meets 4.5:1 ratio
  - Verify `text-[var(--text-dim)]` on `bg-[var(--bg-base)]`: **4.5+** ✓
  - Verify `text-[var(--text-subtle)]` on `bg-[var(--bg-base)]`: **3.2** ⚠️ (May need lightening for small text)
  - Verify links `text-[var(--accent-emerald)]` on background: **4.8+** ✓
- [ ] Hover/focus states maintain 4.5:1 ratio

#### **Keyboard Navigation**

- [ ] All interactive elements focusable:
  - Links have visible focus ring (2px ring with `focus-visible:ring-[var(--accent-emerald)]`)
  - Buttons have visible focus ring
  - Social icon buttons (circular) have focus ring
  - Download card buttons have focus ring
- [ ] Tab order logical (left-to-right, top-to-bottom)
- [ ] Focus ring visible at all zoom levels (up to 200%)

#### **Semantics & ARIA**

- [ ] Proper heading hierarchy:
  - Footer title: Could use `<h2>` or stay div + semantic nav
  - Link group titles: `<h4>` with `uppercase tracking-wide`
  - CTA button: `<button>` or `<a role="button">`
- [ ] Section landmarks:
  - Wrap in `<footer>` (already done)
  - Link groups in `<nav>` or `<section>` if multiple
- [ ] aria-label on social icons (no visible text):
  ```typescript
  <a aria-label="Follow us on Instagram" href="...">I</a>
  <a aria-label="Subscribe on YouTube" href="...">Y</a>
  ```
- [ ] aria-label on icon-only buttons (Download card):
  ```typescript
  <button aria-label="Download from App Store">App Store</button>
  ```

#### **Mobile & Touch**

- [ ] Touch targets ≥ 44px (height + width recommended)
  - Links: Add `min-h-[44px] flex items-center` if needed
  - Social buttons: `w-10 h-10` = 40px (slightly below, ok if padding adds height)
  - CTA buttons: `px-4 py-2` + base text = ~44px height minimum
- [ ] Clickable area doesn't overlap other targets
- [ ] No hover-only content

#### **Dynamic Content & i18n**

- [ ] Text doesn't overflow on long translations:
  - German (long): Test with `overflow-hidden` or `truncate`
  - Chinese (compact): No issues expected
  - Test at max font size (200% zoom)
- [ ] Images/SVG have alt text (if used)
- [ ] Social platform icons have aria-label, not alt

### 5.2 Responsive Testing Checklist

#### **Viewport Sizes to Test**

```
[x] 320px   (iPhone SE)
[x] 375px   (iPhone 12)
[x] 540px   (Mobile landscape)
[x] 768px   (iPad portrait)
[x] 1024px  (iPad landscape / Desktop tablet)
[x] 1440px  (Desktop standard)
[x] 1920px  (Ultra-wide)
[x] Zoom: 100%, 125%, 150%, 200%
```

#### **Layout Checks by Breakpoint**

**Mobile (320px)**

- [ ] Brand section visible, full width
- [ ] Link columns: 1 column, no horizontal scroll
- [ ] Download card: Below links, full width
- [ ] Meta bar: Stacked, centered text
- [ ] No overflow on longest text
- [ ] 16px padding respected (not crushed)

**Tablet (768px)**

- [ ] Link columns: 2 columns
- [ ] Brand + Links + Download: All visible, no overflow
- [ ] Gap spacing: 24px between sections
- [ ] Download card: Beside or below links (check design)

**Desktop (1024px+)**

- [ ] 5-column grid: Brand | Links(4 cols) | Download
- [ ] Left-right balance: Brand width ~240px, Links stretch, Download ~200px
- [ ] Gap: 32px between sections
- [ ] Meta bar: Horizontal (Legal left, Social/Copyright right)

#### **Text & Font Checks**

- [ ] All fonts load (Geist Sans as fallback)
- [ ] Line height sufficient (1.5x for body text)
- [ ] Heading sizes match design:
  - Brand title: lg font (~18px)
  - Link group titles: sm font uppercase
  - Regular links: sm font (~14px)
- [ ] No text truncation (except intentional)

#### **Interactive Element Checks**

- [ ] CTA button:
  - Clickable on mobile (touch target ≥ 44px)
  - Hover state visible (background lightens to `var(--bg-frosted)`)
  - Focus ring visible
  - Links to correct href (default `#generator`)
- [ ] Links:
  - Hover: Color changes to `var(--accent-emerald)`, no underline unless specified
  - Focus: Ring visible
  - Visited state (browser default, can customize if needed)
- [ ] Download buttons (App Store, Google Play):
  - Same as links (button appearance)
  - Hrefs: To be defined (e.g., `https://apps.apple.com/...`, `https://play.google.com/...`)
- [ ] Social icons:
  - Click opens social profile (href provided)
  - Hover: Background lightens to `var(--bg-frosted)`, text color changes
  - Focus: Ring visible (2px ring with emerald)
  - Icon letter visible (I, Y, T, L, B)

### 5.3 i18n Regression Testing

#### **Language Switch Coverage**

- [ ] **English**: All keys display, no truncation
- [ ] **Japanese (ja)**: Shorter text, verify no weird spacing
- [ ] **Korean (ko)**: Check text wrapping in narrow columns
- [ ] **Traditional Chinese (zh-Hant)**: Full text, verify layout
- [ ] **Simplified Chinese (zh-Hans)**: Full text, verify layout

#### **Specific i18n Tests**

- [ ] Legal link titles appear (Terms, Privacy, Acceptable Use, Legal)
- [ ] Social platform aria-labels correct for each language
- [ ] Download section: Title + Caption both appear
- [ ] Link group titles: Product, Solutions, Company, Resources, Compare
- [ ] Badge text (if used): "NEW", "BETA" (same in all languages or localized?)
- [ ] CTA button text: Matches `footer.brand.cta.label`

#### **Edge Cases**

- [ ] Very long translation (German "Datenschutzerklärung"): Doesn't overflow
- [ ] Very short translation (Chinese ideographs): Verifies alignment
- [ ] RTL languages (if ever added): Test structure

### 5.4 Visual & Performance Checks

#### **Visual Verification**

- [ ] Footer background: `--bg-base` (#0a0a0c), darker than main content
- [ ] Top border: Thin line with `--stroke-soft`, possibly gradient accent
- [ ] Card borders: `--stroke-soft` on download card
- [ ] Text hierarchy: Headings darker/bolder than body text
- [ ] Spacing: 6-8% brightness difference from main body (appears distinct)
- [ ] No harsh contrast (blacks + whites OK, grays properly toned)

#### **Performance Checks**

- [ ] Lighthouse Performance score ≥ 90
- [ ] No layout shifts (CLS = 0)
- [ ] Images/SVGs optimized (if any added)
- [ ] No console errors or warnings
- [ ] Bundle size: Footer component < 5KB minified

#### **Browser Compatibility**

- [ ] Chrome / Edge (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Mobile Safari (iOS 15+)
- [ ] Chrome Mobile (Android 10+)

#### **Print & PDF**

- [ ] Footer doesn't break across pages
- [ ] Links readable in print (no hidden colors)
- [ ] QR codes (if any) clear in print

### 5.5 Testing Execution Plan

```typescript
// Test 1: Manual Responsive Testing
// Tools: Chrome DevTools, Firefox DevTools
// Steps:
// 1. Open site at each breakpoint (320, 375, 768, 1024, 1440px)
// 2. Verify layout stacking/columns match design
// 3. Scroll footer into view, check visual alignment
// 4. Test touch targets (use DevTools mobile emulation)

// Test 2: Keyboard Navigation
// Steps:
// 1. Press Tab starting from footer area
// 2. Verify focus ring visible on all links, buttons, social icons
// 3. Press Shift+Tab to go backwards
// 4. Verify Enter key activates buttons/links
// 5. Verify focus order is logical (LTR, top-to-bottom)

// Test 3: Screen Reader Testing
// Tools: NVDA (Windows), JAWS (Windows), VoiceOver (Mac/iOS)
// Steps:
// 1. Navigate to footer
// 2. Verify heading structure announced correctly
// 3. Verify link destinations announced
// 4. Verify aria-labels for social icons read correctly
// 5. Verify button purposes clear

// Test 4: Color Contrast Verification
// Tools: WebAIM Contrast Checker, axe DevTools
// Steps:
// 1. Run axe scan on footer section
// 2. Fix any AA violations (< 4.5:1 for normal text)
// 3. Fix any AAA violations if targeting AAA compliance
// 4. Re-run scan to verify

// Test 5: i18n Language Switch
// Steps:
// 1. Open site, toggle each language
// 2. Verify all footer text switches
// 3. Check for text overflow on each language
// 4. Verify links navigate to correct localized pages (if applicable)

// Test 6: Visual QA
// Steps:
// 1. Compare rendered footer with design mockup
// 2. Verify spacing: Brand gap 16px, Links gap 24px, Meta gap 32px
// 3. Verify colors match CSS variables
// 4. Verify font sizes: Headings lg, body sm, meta xs
// 5. Verify hover/focus states work
```

---

## NEXT STEPS (Implementation Sequence)

### Phase 1: Foundation

1. [ ] Update `lib/i18n.tsx` with all new footer keys
2. [ ] Create Footer sub-components (Brand, Links, DownloadCard, Meta)
3. [ ] Update `FooterSection.tsx` with new structure & props

### Phase 2: Styling

4. [ ] Add Tailwind classes for responsive layout
5. [ ] Verify CSS variable usage (no hardcoded colors)
6. [ ] Test gradient top border effect

### Phase 3: Testing

7. [ ] Run responsive tests at 5 breakpoints
8. [ ] Verify a11y: focus rings, aria-labels, contrast
9. [ ] Run axe DevTools scan, fix issues
10. [ ] Test all 5 languages, verify text fit

### Phase 4: Refinement

11. [ ] Adjust spacing/sizing based on visual QA
12. [ ] Optimize for mobile touch targets
13. [ ] Final accessibility audit
14. [ ] Performance check (Lighthouse)

### Phase 5: Deployment

15. [ ] Create PR with all changes
16. [ ] Request design review
17. [ ] Merge to main branch

---

## APPENDIX: Reference Files

**Files to Read Before Starting:**

- `app/sections/FooterSection.tsx` (current, 20 lines)
- `app/sections/HeroSection.tsx` (responsive pattern reference)
- `lib/i18n.tsx` (translations, 2600+ lines)
- `app/globals.css` (CSS variables, 584 lines)
- `docs/decisions/2025-11-28-footer-refresh.md` (design requirements)

**Files to Create/Modify:**

- `app/sections/FooterSection.tsx` (replace current, ~200-250 lines)
- `lib/i18n.tsx` (add ~40-50 new keys)

**Optional Components (split for reusability):**

- `app/components/FooterBrand.tsx`
- `app/components/FooterLinks.tsx`
- `app/components/FooterDownloadCard.tsx`
- `app/components/FooterMeta.tsx`

---

## Summary Table: Status ✓

| Item         | Status      | Notes                                                   |
| ------------ | ----------- | ------------------------------------------------------- |
| Environment  | ✓ Ready     | Tailwind v4, i18n, CSS vars all in place                |
| Design       | ✓ Clear     | 5-slice architecture, 3+ breakpoints, a11y requirements |
| i18n         | ✓ Planned   | 40-50 new keys, 5 languages, structured data            |
| Components   | ✓ Designed  | 4 sub-slices + root component, prop-based               |
| Testing      | ✓ Checklist | 50+ test items across a11y, responsive, i18n, visual    |
| **GO/NO-GO** | **✓ GO**    | **Ready to implement**                                  |

---

**Document Version:** 1.0
**Last Updated:** 2025-11-28
**Author:** Claude Code
**Status:** Approved for Implementation
