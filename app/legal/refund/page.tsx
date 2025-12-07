import Link from "next/link";

const sections = [
  {
    title: "退款政策概述",
    body: "Qiltrack AI 致力于提供优质的 AI 投研分析服务。我们理解有时情况会发生变化，因此制定了以下公平透明的退款政策。",
  },
  {
    title: "订阅取消",
    items: [
      "您可以随时取消订阅，取消后将在当前计费周期结束时生效。",
      "取消订阅后，您仍可在已付费周期内继续使用所有功能和积分。",
      "取消不会自动触发退款，已使用的服务费用不予退还。",
    ],
  },
  {
    title: "退款条件",
    items: [
      "首次订阅后 7 天内，如未消耗任何积分，可申请全额退款。",
      "若因技术故障导致服务完全无法使用超过 24 小时，可按比例申请退款。",
      "重复扣款或计费错误将在核实后全额退还。",
    ],
  },
  {
    title: "不予退款的情况",
    items: [
      "已消耗积分生成报告的订阅费用。",
      "因用户违反使用条款或可接受使用政策而终止的账户。",
      "免费试用期间的任何费用（免费试用本身无需付费）。",
      "因用户自身原因（如忘记取消）导致的续订费用。",
    ],
  },
  {
    title: "退款流程",
    items: [
      "发送邮件至 legal@qiltrack.com，主题注明「退款申请」。",
      "提供您的注册邮箱、订阅类型及退款原因。",
      "我们将在 3-5 个工作日内审核并回复。",
      "审核通过后，退款将在 5-10 个工作日内原路返还。",
    ],
  },
  {
    title: "积分政策",
    items: [
      "购买的积分有效期至订阅结束，取消订阅后未使用积分将失效。",
      "Ultra 套餐的积分可滚存 3 个月。",
      "积分不可转让、兑换现金或转移至其他账户。",
    ],
  },
  {
    title: "特殊情况处理",
    body: "对于本政策未涵盖的特殊情况，我们将根据具体情况酌情处理。如有争议，我们的客服团队将尽力寻求双方满意的解决方案。",
  },
];

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Qiltrack AI</p>
          <h1 className="mt-3 text-3xl font-semibold">退款政策</h1>
          <p className="mt-3 text-sm text-slate-400">
            本文档说明 Qiltrack AI 的退款条件、流程及相关规定。请在订阅前仔细阅读。
          </p>
          <p className="mt-2 text-xs text-slate-500">更新日期：2025-12-07</p>
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

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-medium text-emerald-300">联系我们</h3>
          <p className="text-sm text-slate-300">
            如有退款相关问题，请联系：
            <a className="text-emerald-300 ml-1" href="mailto:legal@qiltrack.com">
              legal@qiltrack.com
            </a>
          </p>
          <p className="text-xs text-slate-500">
            工作时间：周一至周五 9:00-18:00 (UTC+8)，通常在 48 小时内回复。
          </p>
        </div>

        <div className="text-xs text-slate-500 space-y-2">
          <p>
            本退款政策的最终解释权归 Qiltrack AI 所有。如有疑问，请邮件{" "}
            <a className="text-emerald-300" href="mailto:legal@qiltrack.com">
              legal@qiltrack.com
            </a>{" "}
            与我们联系。
          </p>
          <div className="inline-flex flex-wrap items-center gap-2 text-emerald-300 text-xs">
            <span aria-hidden className="text-sm opacity-80">
              ↩
            </span>
            <Link href="/legal" prefetch={false} className="underline underline-offset-2">
              返回法律页面
            </Link>
            <span className="text-slate-400">|</span>
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
