import Link from "next/link";

const sections = [
  {
    title: "我们收集的信息",
    items: [
      "您在使用 Investor AI 时提交的账号信息、偏好设置与与服务交互产生的日志（例如访问时间、功能使用记录）。",
      "生成报告所需的输入内容、选择的模板、生成结果及相关元数据，仅用于提供和改进服务。",
      "必要的技术信息（设备、浏览器、IP 近似位置、Cookie/本地存储标识）用于安全、防滥用与性能监测。",
    ],
  },
  {
    title: "我们如何使用",
    items: [
      "提供、维护和改进核心功能，包括报告生成、界面性能优化与可靠性监测。",
      "安全目的：检测异常访问、滥用或潜在违规，并采取限速、拦截等保护措施。",
      "合规与沟通：向您发送与服务相关的通知、重要政策变更或必要的运营信息。",
    ],
  },
  {
    title: "共享与第三方",
    items: [
      "必要时与受信任的服务提供商（如云托管、日志与安全供应商）合作，但仅限履行服务所需。",
      "在法律要求或为保护合法权益（安全、合规、反欺诈）时可能披露必要信息。",
      "不会出售您的个人信息，也不会将输出用于未授权的广告或画像用途。",
    ],
  },
  {
    title: "数据存储与保留",
    items: [
      "数据存储在受控的云环境中，并采用访问控制、加密等措施减少未授权访问风险。",
      "我们根据提供服务所需、法律要求或安全目的保留数据；过期或无须保留的数据会被删除或匿名化。",
    ],
  },
  {
    title: "您的权利与选择",
    items: [
      "您可更新账户信息，或通过联系邮箱提出访问、更正或删除请求（受法律与技术限制）。",
      "可调整浏览器设置管理 Cookie/本地存储；部分功能可能依赖相关技术令体验受限。",
      "若您位于具有特定数据保护法规的地区，请在联系时说明，我们将根据适用法律处理。",
    ],
  },
  {
    title: "安全与跨境传输",
    items: [
      "我们采用行业惯例的安全措施，但无法保证绝对安全；请勿上传受监管或高度敏感的个人数据。",
      "数据可能在全球范围内处理或存储，跨境传输将依据适用法律和合同保障措施执行。",
    ],
  },
  {
    title: "更新",
    body: "我们可能不时更新本隐私政策，重大变更将通过产品内提示或公告告知。更新后继续使用即视为接受修订。",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Investor AI</p>
          <h1 className="mt-3 text-3xl font-semibold">隐私政策</h1>
          <p className="mt-3 text-sm text-slate-400">
            本政策说明我们如何收集、使用、存储和保护您的信息，以及您可行使的权利与选择。
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
            如对隐私政策有疑问或需行使权利，请邮件{" "}
            <a className="text-emerald-300" href="mailto:legal@investor.ai">
              legal@investor.ai
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
            <span className="text-slate-400">investor-ai.com</span>
          </div>
        </div>
      </div>
    </main>
  );
}
