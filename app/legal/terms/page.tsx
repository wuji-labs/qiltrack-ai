import Link from "next/link";

const sections = [
  {
    title: "适用范围",
    body: "本使用条款约束您对 Qiltrack AI 网站、应用及相关生成式报告功能的访问和使用。进入或使用即表示您已阅读并同意全部条款。",
  },
  {
    title: "服务性质（非投资建议）",
    items: [
      "Qiltrack AI 提供的是基于公开或授权数据的自动化信息整理与可视化，不构成任何投资、法律、税务或财务建议。",
      "本服务不提供证券买卖、投资组合管理或受监管的投顾服务，所有决策由您自行判断并承担后果。",
    ],
  },
  {
    title: "使用许可与限制",
    items: [
      "您可将本服务用于个人或企业内部的信息参考，不得用于任何违法或监管限制的用途。",
      "禁止逆向工程、绕过安全控制、批量抓取或未授权地复制、再分发内容。",
      "不得以误导性方式使用品牌标识，或宣称与 Qiltrack AI 存在未获授权的合作关系。",
    ],
  },
  {
    title: "账户、合规与年龄",
    items: [
      "您应遵守所在地的适用法律法规并确保拥有所需的资质与许可。",
      "若需登录，您负责账户安全与凭证保管，授权他人使用产生的行为由您承担。",
      "您确认已年满 18 周岁或具备所在司法辖区要求的完全民事行为能力。",
    ],
  },
  {
    title: "数据与准确性",
    items: [
      "本服务可能使用公开市场数据、第三方数据提供商或用户输入，数据可能存在延时、缺漏或误差。",
      "Qiltrack AI 不对数据的完整性、准确性、时效性或可用性作出担保，结果仅供参考。",
      "因依赖本服务数据或输出而产生的任何损失、延误或成本，Qiltrack AI 不承担责任。",
    ],
  },
  {
    title: "费用与服务变更",
    items: [
      "我们可能不时更新功能、接口或付费方案，并通过产品内提示或公告进行说明。",
      "如涉及收费或订阅，具体价格、周期与退款规则以对应的订阅协议或订单为准。",
    ],
  },
  {
    title: "责任限制",
    items: [
      "在法律允许的最大范围内，Qiltrack AI 对任何间接、附带、后果性或惩罚性损失不承担责任。",
      "若适用法律要求承担责任，则总责任以您在触发责任前一计费周期已支付的服务费用（如有）为上限。",
    ],
  },
  {
    title: "终止与生效",
    items: [
      "若您违反本条款或存在安全/合规风险，Qiltrack AI 可暂停或终止对服务的访问。",
      "您可随时停止使用；继续使用即视为接受更新后的条款，我们会在重要变更时提供提示。",
    ],
  },
  {
    title: "适用法律与争议解决",
    items: [
      "本条款在不与当地强制性法律冲突的前提下，适用 Qiltrack AI 主要经营地的法律。",
      "如有争议，双方应先行友好协商；协商不成的，提交有管辖权的法院解决。",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Qiltrack AI</p>
          <h1 className="mt-3 text-3xl font-semibold">使用条款</h1>
          <p className="mt-3 text-sm text-slate-400">
            本文档说明您在使用 Qiltrack AI 时的权利与义务。请仔细阅读并定期查看更新。
          </p>
          <p className="mt-2 text-xs text-slate-500">更新日期：2025-11-30</p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              {section.body && (
                <p className="text-sm text-slate-300 leading-relaxed">{section.body}</p>
              )}
              {section.items && (
                <ul className="list-disc pl-5 text-sm text-slate-300 space-y-2">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="text-xs text-slate-500 space-y-2">
          <p>
            如对条款有疑问，请邮件{" "}
            <a className="text-emerald-300" href="mailto:legal@qiltrack.com">
              legal@qiltrack.com
            </a>{" "}
            与我们联系。
          </p>
          <div className="inline-flex flex-wrap items-center gap-2 text-emerald-300 text-xs">
            <span aria-hidden className="text-sm opacity-80">
              ↩
            </span>
            <Link href="/" prefetch={false} className="underline underline-offset-2">
              返回首页
            </Link>
            <span className="text-slate-400">qiltrack.com</span>
          </div>
        </div>
      </div>
    </main>
  );
}
