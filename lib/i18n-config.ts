"use strict";

export type Language = "en" | "ja" | "ko" | "zh-Hant" | "zh-Hans";

export const DEFAULT_LANGUAGE: Language = "en";

export const LANGUAGE_ORDER: readonly Language[] = [
	"en",
	"ja",
	"ko",
	"zh-Hant",
	"zh-Hans",
];

export const LANGUAGE_LABEL: Readonly<Record<Language, string>> = {
	en: "English",
	ja: "日本語",
	ko: "한국어",
	"zh-Hant": "繁體中文",
	"zh-Hans": "简体中文",
};

export const LANGUAGE_OPTIONS = LANGUAGE_ORDER.map((value) => ({
	value,
	label: LANGUAGE_LABEL[value],
})) as ReadonlyArray<{ value: Language; label: string }>;

export const CHINESE_VARIANTS: readonly Language[] = ["zh-Hant", "zh-Hans"];
