import Link from "next/link";

const links = [
  {
    title: "使用条款",
    description: "了解服务范围、许可与限制、责任边界，以及适用法律与争议解决方式。",
    href: "/legal/terms",
  },
  {
    title: "隐私政策",
    description: "了解我们如何收集、使用、存储和保护您的信息，以及您可行使的权利。",
    href: "/legal/privacy",
  },
  {
    title: "可接受使用政策",
    description: "了解允许与禁止的使用方式、配额要求以及违规处置流程。",
    href: "/legal/acceptable-use",
  },
];

const notices = [
  "Investor AI 提供自动化信息整理和生成式报告，不构成投资、法律、税务或财务建议。",
  "数据可能来自公开市场、第三方提供商或用户输入，可能存在延时、缺漏或误差，仅供参考。",
  "如需专业意见，请咨询具备资质的专业人士；使用本服务即表示您接受相关条款与政策。",
];

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Investor AI</p>
          <h1 className="mt-3 text-3xl font-semibold">法律与合规</h1>
          <p className="mt-3 text-sm text-slate-400">
            以下文档说明使用 Investor AI 时的权利义务、隐私保护与可接受使用范围。请根据需要查阅详细条款。
          </p>
          <p className="mt-2 text-xs text-slate-500">最近更新：2025-11-30</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group border border-slate-800 rounded-lg p-4 bg-slate-900/50 hover:border-emerald-400/60 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-50">{link.title}</h2>
                <span className="text-emerald-300 text-sm group-hover:translate-x-1 transition-transform">→</span>
              </div>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">{link.description}</p>
            </Link>
          ))}
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">重要声明</h2>
          <ul className="list-disc pl-5 text-sm text-slate-300 space-y-2">
            {notices.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <div className="text-xs text-slate-500 space-y-2">
          <p>
            如对上述条款或政策有疑问，请邮件 <a className="text-emerald-300" href="mailto:legal@investor.ai">legal@investor.ai</a> 与我们联系。
          </p>
          <Link href="/" prefetch={false} className="inline-flex items-center gap-2 text-emerald-300 underline">
            <span aria-hidden>↩</span>
            <span>返回首页</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
