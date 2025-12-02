import Link from "next/link";

const allowedUses = [
  "将 Investor AI 用于研究、内部分析、报告撰写与合规的业务洞察。",
  "在遵守法律、合同与本政策的前提下，将生成的内容用于内部或对外合规披露（如注明来源）。",
  "合理频率调用接口与页面功能，不干扰其他用户体验或平台稳定性。",
];

const prohibitedUses = [
  "任何违法、侵权、欺诈、误导或骚扰行为；传播恶意、仇恨或暴力内容。",
  "尝试绕过认证、速率限制或安全机制；扫描端点、注入恶意代码或测试防护而未获授权。",
  "批量抓取、自动化爬取或使用脚本大规模生成请求，超出公平使用范围的流量攻击或滥用。",
  "将输出冒充为官方投资建议或对外提供未披露的金融服务；伪造、篡改或未注明来源地再分发内容。",
  "上传或处理受严格合规管控的敏感数据（如生物识别、健康、未脱敏的金融账户信息）除非已获合法授权并采取必要保护措施。",
  "利用模型进行模型抽取、越狱提示、生成恶意代码/钓鱼/垃圾信息或其他危害安全的用途。",
];

const enforcement = [
  "我们可能根据异常访问、速率或安全信号采取限制，包括临时或永久封禁、限速、撤销访问令牌或删除内容。",
  "若检测到合规或安全风险，可能要求补充验证、说明用途或签署额外协议。",
  "严重或重复违规可能被报告给相关机构；由此产生的责任和成本由违规方承担。",
];

export default function AcceptableUsePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Investor AI</p>
          <h1 className="mt-3 text-3xl font-semibold">可接受使用政策</h1>
          <p className="mt-3 text-sm text-slate-400">
            本政策明确允许与禁止的使用方式，以保护平台稳定、安全与合规。使用本服务即表示您同意遵守。
          </p>
          <p className="mt-2 text-xs text-slate-500">更新日期：2025-11-30</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">允许的用途</h2>
          <ul className="list-disc pl-5 text-sm text-slate-300 space-y-2">
            {allowedUses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">禁止的用途</h2>
          <ul className="list-disc pl-5 text-sm text-slate-300 space-y-2">
            {prohibitedUses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">配额与速率</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            为保证服务质量，我们可能实施配额或速率限制。请避免高频并发或自动化滥用；如需更高额度，请与我们联系。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">违规处置</h2>
          <ul className="list-disc pl-5 text-sm text-slate-300 space-y-2">
            {enforcement.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <div className="text-xs text-slate-500 space-y-2">
          <p>
            如需申诉或说明用途，请邮件{" "}
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
