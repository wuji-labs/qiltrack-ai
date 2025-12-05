/**
 * Tone-specific system prompts for report generation
 *
 * Each tone has a completely independent system prompt with:
 * - Unique role definition
 * - Specific analysis philosophy
 * - Custom chapter output formats
 * - Tailored evaluation frameworks
 *
 * @version 2.0.0
 */

import type { Language } from "@/lib/i18n-config";
import type { ReportTone } from "../types";

import { buildSystemPrompt as buildBaselinePrompt } from "./baseline";
import { buildSystemPrompt as buildBuffettPrompt } from "./buffett";
import { buildSystemPrompt as buildMuskPrompt } from "./musk";
import { buildSystemPrompt as buildMuddyPrompt } from "./muddy";

const PROMPT_BUILDERS: Record<ReportTone, (lang: Language) => string> = {
  baseline: buildBaselinePrompt,
  buffett: buildBuffettPrompt,
  musk: buildMuskPrompt,
  muddy: buildMuddyPrompt,
};

/**
 * Build a complete system prompt for the specified tone and language
 *
 * @param tone - The report tone/style
 * @param language - The output language
 * @returns Complete system prompt string
 */
export function buildSystemPrompt(
  tone: ReportTone,
  language: Language
): string {
  return PROMPT_BUILDERS[tone](language);
}
