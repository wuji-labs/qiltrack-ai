# Snapshot：法律页面拆分 (2025-11-30)

## 背景
- 当前 Footer 已暴露 Terms/Privacy/AUP 链接但仅有 /legal 汇总页，且内容编码异常；需分拆独立页面保证合规、可读。
- 影响首页 Footer、Legal 路由体系、法务文案一致性和多语言。

## 设计目标
1. 提供 /legal/terms、/legal/privacy、/legal/acceptable-use 独立页面，内容清晰、分组可扫读，移动端可读性良好。
2. 统一法务声明：不构成投资建议、数据源/准确性免责声明、责任限制、联络方式。
3. 复用现有 App Router + Tailwind v4 样式体系，风格与当前 legal 页一致但编码正确。
4. 便于后续扩展/国际化：文案结构化、可插入锚点导航。

## 技术约束
- Next.js App Router + TypeScript + Tailwind v4 @theme inline；保持客户端静态内容，无数据请求。
- 现有 `useLanguage` 主要驱动 Footer 文案；法务页目前静态中文，可先用静态文案，不新增依赖。
- 路由：`app/legal/page.tsx` 为索引或概览，新增子路由文件不得破坏。
- 无新后端/API；需保证可通过 `npm run lint`。

## 文案 key（若需要 i18n）
| key | zh-Hans | en | 说明 |
| --- | --- | --- | --- |
| `legal.common.backHome` | 返回首页 | Back to home | 页脚跳转 |
| `legal.common.contact` | 有问题请邮件 legal@investor.ai | Contact legal@investor.ai | 统一联系文案 |
| `legal.terms.title` | 使用条款 | Terms of Service | 页面标题 |
| `legal.privacy.title` | 隐私政策 | Privacy Policy | 页面标题 |
| `legal.aup.title` | 可接受使用政策 | Acceptable Use Policy | 页面标题 |

（本次可先用静态文案，视实现决定是否落库 i18n。）

## 工作拆分（g3）
- [ ] 创建 `app/legal/terms/page.tsx`：范围、许可/限制、投资免责、责任限制、账户/年龄/合规、终止与适用法律、更新声明、联系邮箱。
- [ ] 创建 `app/legal/privacy/page.tsx`：收集的数据、用途、共享、存储/保留、安全、用户权利、Cookie/第三方、跨境传输、联系。
- [ ] 创建 `app/legal/acceptable-use/page.tsx`：允许用途、禁止行为（安全绕过、自动化滥用、抓取/批量调用、违法/侵权/欺诈/仇恨/骚扰、LLM 滥用）、配额/速率、违规处置。
- [ ] 优化 `app/legal/page.tsx`：索引化/跳转卡片指向三个子页，修正乱码文案。
- [ ] Footer 验证：链接指向新路由并加载成功。

## 测试要求
- `npm run lint`
- 手动验证 `/legal`、`/legal/terms`、`/legal/privacy`、`/legal/acceptable-use` 在桌面/移动宽度下排版正常，链接返回首页正常。

## 风险
- 法务文案准确性（需保持“非投资建议”与数据源免责声明），避免暗示投资回报。
- 多语言尚未完全覆盖；如后续需要 i18n，需另行补齐 keys。
- 路由/样式若直接复制现有文件可能保留乱码；需重写文本。
