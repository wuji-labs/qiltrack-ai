import { type Language, DEFAULT_LANGUAGE } from "@/lib/i18n-config";

/**
 * Language-specific disclaimers
 */
const LANGUAGE_CONFIG: Record<
  Language,
  {
    disclaimer: string;
  }
> = {
  en: {
    disclaimer: `This report is auto-generated from public data and common analytical frameworks. The content is for general information only and never constitutes investment advice, trading guidance, or personalized judgment. Market conditions may change and information may lag. Consult licensed professionals before making investment decisions.`,
  },
  ja: {
    disclaimer: `本レポートは公開データと一般的な分析手法をもとに自動生成された一般参考情報であり、投資助言や売買指示ではありません。市場環境は変化し得るため、情報には遅延や偏りが含まれる可能性があります。投資判断が必要な場合は、必ず有資格の専門家に相談してください。`,
  },
  ko: {
    disclaimer: `이 리포트는 공개 데이터와 일반적인 분석 방법을 기반으로 자동 생성된 일반 참고 정보이며, 투자 자문이나 매매 지침이 아닙니다. 시장 상황은 언제든 변할 수 있고 정보에는 지연이나 편차가 있을 수 있습니다. 투자 결정을 내리기 전에 반드시 자격을 갖춘 전문가와 상담하세요.`,
  },
  "zh-Hant": {
    disclaimer: `本報告內容由系統基於公開數據與通用分析方法自動生成,僅供一般資訊參考,不構成任何投資建議、買賣意見或個人化判斷。市場情勢可能變動,資訊亦可能存在延遲或偏差。如需投資建議,請諮詢具備合法資質的專業機構。`,
  },
  "zh-Hans": {
    disclaimer: `本报告内容由系统基于公开数据和通用分析方法自动生成,仅供一般信息参考,不构成任何投资建议、买卖意见或个性化判断。市场状况可能变化,信息可能存在延迟或偏差。如需投资建议,请咨询取得合法资质的专业机构。`,
  },
};

/**
 * Word replacements to sanitize sensitive content
 */
const WORD_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /买入/gi, replacement: "分析视角" },
  { pattern: /卖出/gi, replacement: "分析视角" },
  { pattern: /建仓/gi, replacement: "分析视角" },
  { pattern: /加仓/gi, replacement: "分析视角" },
  { pattern: /减仓/gi, replacement: "分析视角" },
  { pattern: /清仓/gi, replacement: "分析视角" },
  { pattern: /仓位/gi, replacement: "风险敞口" },
  { pattern: /建议/gi, replacement: "一般参考" },
  { pattern: /目标价/gi, replacement: "市场预期讨论" },
  { pattern: /预测/gi, replacement: "假设情景" },
  { pattern: /必买/gi, replacement: "主流观点讨论" },
  { pattern: /调仓/gi, replacement: "风险敞口调整讨论" },
];

/**
 * Content Sanitizer handles report content sanitization
 *
 * Replaces sensitive words and adds disclaimers to comply with regulations
 */
export class ContentSanitizer {
  /**
   * Sanitize report content
   *
   * @param content - Raw report content
   * @param language - Target language
   * @returns Sanitized content with disclaimer
   */
  sanitize(content: string, language: Language = DEFAULT_LANGUAGE): string {
    const langConfig = LANGUAGE_CONFIG[language] ?? LANGUAGE_CONFIG.en;

    // Normalize line breaks
    const paragraphs = content.split(/\n{2,}/);
    let sanitized = paragraphs.join("\n\n");

    // Replace sensitive words
    for (const { pattern, replacement } of WORD_REPLACEMENTS) {
      sanitized = sanitized.replace(pattern, replacement);
    }

    // Add disclaimer at the beginning
    return `${langConfig.disclaimer}\n\n${sanitized}`.trim();
  }

  /**
   * Get disclaimer for a specific language
   *
   * @param language - Target language
   * @returns Disclaimer text
   */
  getDisclaimer(language: Language = DEFAULT_LANGUAGE): string {
    const langConfig = LANGUAGE_CONFIG[language] ?? LANGUAGE_CONFIG.en;
    return langConfig.disclaimer;
  }

  /**
   * Check if content contains sensitive words (before sanitization)
   *
   * @param content - Content to check
   * @returns Array of detected sensitive patterns
   */
  detectSensitiveWords(content: string): string[] {
    const detected: string[] = [];

    for (const { pattern, replacement } of WORD_REPLACEMENTS) {
      if (pattern.test(content)) {
        detected.push(replacement);
      }
    }

    return detected;
  }

  /**
   * Normalize language code
   *
   * @param value - Language code or name
   * @returns Normalized language code
   */
  normalizeLanguage(value: string | null): Language {
    const key = (value || "").trim().toLowerCase();

    if (key === "ja" || key === "ja-jp") return "ja";
    if (key === "ko" || key === "ko-kr") return "ko";
    if (key === "zh-hant" || key === "zh-hk" || key === "zh-tw") return "zh-Hant";
    if (key === "zh-hans" || key === "zh-cn" || key === "zh") return "zh-Hans";

    return DEFAULT_LANGUAGE;
  }
}
