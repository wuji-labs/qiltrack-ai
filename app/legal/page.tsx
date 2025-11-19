import Link from "next/link";

const sections = [
  {
    title: "产品定位",
    body:
      "CodeX (Investor AI) 是一款自动化信息整理工具，负责把公开数据与结构化分析方法呈现为易读报告。系统不提供投资建议、买卖指令或个性化判断，仅帮助用户加速理解企业信息。",
  },
  {
    title: "非投资咨询声明",
    body:
      "本工具不是证券投资顾问、资产管理人或交易信号系统。所有输出仅供一般信息参考，不构成任何买卖建议、风险敞口方案、资金托管或其他金融服务。",
  },
  {
    title: "功能范围",
    items: [
      "自动化分析结构生成、模板使用权、报告额度管理、数据调用与功能解锁。",
      "不包含收益承诺、调仓指引、策略服务或胜率提升等表述。",
    ],
  },
  {
    title: "数据来源与准确性",
    body:
      "本系统可能使用包括但不限于若干境内外专业金融数据提供方、公开监管文件及市场信息服务接口。平台不对数据的准确性、及时性、可用性做保证，最终解释权由各提供方承担；系统不接触、存储或传播任何内幕信息。",
  },
  {
    title: "用户责任",
    items: [
      "投资风险由用户自行承担，市场状况可能随时变化。",
      "用户需结合自身风险承受能力、资产状况与投资期限作出独立判断。",
      "如需投资建议，请咨询取得合法资质的专业机构。",
    ],
  },
  {
    title: "使用条款",
    items: [
      "禁止将本工具输出用于违法或违规用途，包括但不限于散布虚假信息、操纵市场等行为。",
      "用户须遵守所在地的全部适用法律法规。",
      "如用户违反条款导致任何损失或纠纷，由用户自行承担责任。",
    ],
  },
];

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">CodeX / Investor AI</p>
          <h1 className="mt-3 text-3xl font-semibold">Legal · 使用条款</h1>
          <p className="mt-3 text-sm text-slate-400">
            以下条款旨在说明本工具的定位、责任范围以及用户义务。使用本产品即表示你同意这些条款。
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              {section.body && <p className="text-sm text-slate-300 leading-relaxed">{section.body}</p>}
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

        <div className="text-xs text-slate-500">
          <p>
            如对条款有疑问，可随时通过 <a className="text-emerald-300" href="mailto:legal@investor.ai">legal@investor.ai</a> 联系我们。
          </p>
          <p className="mt-2">
            返回主页：
            <Link href="/" className="text-emerald-300 underline">
              investor-ai.com
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
