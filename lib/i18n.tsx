"use client";

import { createContext, startTransition, useContext, useEffect, useMemo, useState } from "react";

import { CHINESE_VARIANTS, DEFAULT_LANGUAGE, LANGUAGE_ORDER, type Language } from "./i18n-config";

type TranslationEntry = { en: string } & Partial<Record<Exclude<Language, "en">, string>>;
type ChineseVariantInput =
	| string
	| {
			shared?: string;
			hant?: string;
			hans?: string;
	  };

function withChineseVariants(
	entry: Omit<TranslationEntry, "zh-Hant" | "zh-Hans"> & {
		"zh-Hant"?: string;
		"zh-Hans"?: string;
		zh?: ChineseVariantInput;
	}
) {
	const { zh, "zh-Hant": hantInput, "zh-Hans": hansInput, ...rest } = entry;
	let hant = hantInput;
	let hans = hansInput;
	if (typeof zh === "string") {
		hant = hant ?? zh;
		hans = hans ?? zh;
	} else if (typeof zh === "object" && zh) {
		const shared = zh.shared;
		hant = hant ?? zh.hant ?? shared;
		hans = hans ?? zh.hans ?? shared;
	}
	return {
		...rest,
		"zh-Hant": hant ?? hans ?? rest.en,
		"zh-Hans": hans ?? hant ?? rest.en,
	} as TranslationEntry;
}

const translations: Record<string, TranslationEntry> = {
	"nav.product": withChineseVariants({
		en: "Product",
		ja: "プロダクト",
		ko: "제품",
		zh: {
			hant: "產品亮點",
			hans: "产品亮点",
		},
	}),
	"nav.generator": withChineseVariants({
		en: "Generator",
		ja: "レポート生成",
		ko: "리포트 생성",
		zh: {
			hant: "智慧報告",
			hans: "智能报告",
		},
	}),
	"nav.templates": withChineseVariants({
		en: "Templates",
		ja: "テンプレート",
		ko: "템플릿",
		zh: {
			hant: "模板與案例",
			hans: "模板与案例",
		},
	}),
	"nav.pricing": withChineseVariants({
		en: "Pricing",
		ja: "料金",
		ko: "가격",
		zh: {
			hant: "定價",
			hans: "定价",
		},
	}),
	"nav.faq": withChineseVariants({
		en: "FAQ",
		ja: "FAQ",
		ko: "FAQ",
		zh: {
			hant: "常見問題",
			hans: "常见问题",
		},
	}),
	"brand.title": withChineseVariants({
		en: "Investor AI",
		ja: "Investor AI",
		ko: "Investor AI",
		zh: "Investor AI",
	}),
	"brand.subtitle": withChineseVariants({
		en: "Research naturally",
		ja: "企業を理解し、呼吸するようにリサーチ",
		ko: "기업을 이해하고 숨 쉬듯 리서치",
		zh: {
			hant: "智能投研",
			hans: "智能投研",
		},
	}),
	"hero.tagline": withChineseVariants({
		en: "MVP Live · Powered by Finnhub + OpenRouter",
		ja: "MVP 版 · Finnhub + OpenRouter 連携",
		ko: "MVP 버전 · Finnhub + OpenRouter 연동",
		zh: "MVP 版本 · 已接入 Finnhub + OpenRouter",
	}),
	"hero.title": withChineseVariants({
		en: "Understand a listed company in three minutes.",
		ja: "3 分で上場企業を把握。",
		ko: "3분 만에 상장사를 이해하세요.",
		zh: {
			hant: "3 分鐘讀懂一家美股公司。",
			hans: "3分钟，搞懂一家美股上市公司。",
		},
	}),
	"hero.description": withChineseVariants({
		en: "Investor AI weaves scattered data, jargon, and complex structures into a company analysis that anyone can truly understand.",
		ja: "Investor AI は散在するデータや専門用語、複雑な構造を織り合わせ、誰でも理解できる企業分析へと整えます。",
		ko: "Investor AI는 흩어진 데이터와 전문 용어, 복잡한 구조를 엮어 누구나 이해할 수 있는 기업 분석으로 정리해 줍니다.",
		zh: {
			hant: "Investor AI 把分散的資訊、專業術語與複雜結構，整理成一份普通人也能看懂的公司分析。",
			hans: "Investor AI 把分散的资讯、专业术语与复杂结构，整理成一份普通人也能读懂的公司分析。",
		},
	}),
	"hero.brandline": withChineseVariants({
		en: "Understanding is the starting point of investing.",
		ja: "理解こそが投資の起点。",
		ko: "이해가 투자 시작의 모든 것입니다.",
		zh: "理解，是投資的起點。",
	}),
	"hero.positioning": withChineseVariants({
		en: "CodeX is a structured information assistant to help you understand companies; it never offers investment advice or trading guidance.",
		ja: "CodeX は企業理解のための情報整理ツールであり、投資助言や売買指示は行いません。",
		ko: "CodeX는 회사를 이해하기 위한 구조화 정보 도구이며, 투자 조언이나 매매 지침을 제공하지 않습니다.",
		zh: {
			hant: "CodeX 是協助理解公司的結構化資訊工具，不提供投資建議或交易指引。",
			hans: "CodeX 是帮助理解企业的结构化信息工具，不提供投资建议或交易指引。",
		},
	}),
	"hero.story": withChineseVariants({
		en: "We built a unified understanding engine: multi-source ingestion, knowledge frameworks, and structured templates work together to turn chaos into clarity.",
		ja: "複数の情報源と知識フレーム、構造化テンプレートを束ねた理解エンジンが、散らばった情報を一つの明確な物語へ整えます。",
		ko: "여러 데이터와 지식 프레임, 구조화 템플릿이 맞물린 ‘이해 엔진’이 혼란을 명료함으로 바꿉니다.",
		zh: {
			hant: "我們打造了一套「理解引擎」：多源資料、知識框架與結構化模板一起運作，把混亂轉成清楚。",
			hans: "我们打造了一套“理解引擎”：多源数据、知识框架与结构化模板一起运作，把混乱变成清晰。",
		},
	}),
	"landing.module1.title": {
		"en": "Why does this product exist?",
		"ja": "なぜこのプロダクトが必要なのか",
		"ko": "왜 이런 제품이 필요할까?",
		"zh-Hant": "為什麼會有這個產品？",
		"zh-Hans": "为什么会有这个产品？",
	},
	"landing.module1.body1": {
		"en": "Researching a company is never about showing off numbers—it is about seeing how it survives, how it grows stronger, and where it might break.",
		"ja": "企業研究は数字を並べるためではなく、その会社がどう生き、どう強くなり、どこが脆いのかを見抜く行為です。",
		"ko": "회사를 들여다보는 일은 숫자를 자랑하기 위해서가 아니라, 어떻게 버티고 강해지며 어디에서 무너질 수 있는지를 보는 일입니다.",
		"zh-Hant": "研究一家公司從來不是為了炫技，而是要看懂它靠什麼活著、靠什麼變強、哪裡可能出問題。",
		"zh-Hans": "研究一家公司从来不是为了炫技，而是要看懂它靠什么活着、靠什么变强、哪里可能出问题。",
	},
	"landing.module1.body2": {
		"en": "But reality is brutal: too much information, jargon everywhere, reports too long, news fragmented, opinions conflicting. You run out of time and energy before understanding anything. Investor AI exists for one simple reason—to translate complexity into clarity so ordinary people can rely on understanding, not luck or emotion.",
		"ja": "しかし現実は残酷です。情報は多すぎ、用語だらけ、レポートは長く、ニュースは細切れ、意見は衝突します。理解する前に時間も気力も尽きてしまう。Investor AI がある理由はただ一つ──複雑さを明解さに翻訳し、運や感情ではなく「理解」に頼れるようにするためです。",
		"ko": "현실은 가혹합니다. 정보는 넘쳐나고 전문 용어가 벽을 만들며, 리포트는 길고 뉴스는 쪼개져 있고 시각은 서로 충돌합니다. 이해하기도 전에 시간과 에너지가 고갈됩니다. Investor AI 가 존재하는 이유는 하나입니다. 복잡함을 명료함으로 번역해, 운이나 감정이 아니라 ‘이해’에 기반해 판단하도록 돕기 위해서입니다.",
		"zh-Hant": "但現實情況是：資訊多到塞不下、專有名詞擋在前面、研報太長、新聞太碎、觀點互相衝突。你沒時間，也不想被帶節奏，最後得到的不是理解，而是疲憊。Investor AI 出現的初衷很簡單：幫普通人把「複雜」翻成「明白」，讓你不靠運氣、不靠情緒，而是靠理解做決定。",
		"zh-Hans": "但现实情况是：资讯多到塞不下、专有名词挡在前面、研报太长、新闻太碎、观点互相冲突。你没时间，也不想被带节奏，最后得到的不是理解，而是疲惫。Investor AI 出现的初衷很简单：帮普通人把“复杂”翻成“明白”，让你不靠运气、不靠情绪，而是靠理解做决策。",
	},
	"landing.module2.title": {
		"en": "What does one report actually tell you?",
		"ja": "1 本のレポートで何が分かるのか",
		"ko": "하나의 리포트가 무엇을 알려주는가?",
		"zh-Hant": "一份報告到底告訴你什麼？",
		"zh-Hans": "一份报告到底会告诉你什么？",
	},
	"landing.module2.items": {
		"en": JSON.stringify([
			{ q: "What does this company really do?", a: "After one sentence you can explain it to someone else." },
			{ q: "How does it make money?", a: "Core businesses, key customers, revenue mix—all laid out." },
			{ q: "Why is it them, not someone else?", a: "Industry position, moat, and why the advantage exists." },
			{ q: "Where are the weak points?", a: "Industry shifts, policy moves, competitive threats, business-model cracks." },
			{ q: "What type does it resemble?", a: "Cash cow, cyclical, story stock, or high-growth explorer." },
		]),
		"ja": JSON.stringify([
			{ q: "この会社は何をしているのか？", a: "一言で説明できるようになります。" },
			{ q: "どのように稼いでいるのか？", a: "収益源や主要顧客、売上構成が一目で分かります。" },
			{ q: "なぜこの会社なのか？", a: "業界内での位置づけや優位性、護城河がどこにあるかを示します。" },
			{ q: "どんなリスクと脆さがあるのか？", a: "業界・政策の変化、競合、ビジネスモデルの弱点をチェックします。" },
			{ q: "どのタイプに近いのか？", a: "安定キャッシュカウ、サイクル株、ストーリー株、高成長挑戦者かを見極めます。" },
		]),
		"ko": JSON.stringify([
			{ q: "이 회사는 도대체 무엇을 하나요?", a: "한 문장으로 남에게 설명할 수 있게 됩니다." },
			{ q: "어떻게 돈을 버나요?", a: "핵심 사업, 주요 고객, 매출 구성이 한눈에 보입니다." },
			{ q: "왜 이 회사인가요?", a: "산업 내 위치와 강점, 소위 ‘모트’가 무엇인지 짚어줍니다." },
			{ q: "어떤 위험과 취약점이 있나요?", a: "산업 변화, 정책, 경쟁, 비즈니스 모델의 약점을 정리합니다." },
			{ q: "어떤 타입의 회사인가요?", a: "현금창출형, 경기민감형, 스토리형, 고성장 도전형인지 가늠합니다." },
		]),
		"zh-Hant": JSON.stringify([
			{ q: "這家公司到底在做什麼？", a: "一句話講完，你也能跟別人解釋。" },
			{ q: "它怎麼賺錢？錢從哪裡來？", a: "核心業務、主要客戶、收入構成一目了然。" },
			{ q: "為什麼是它，而不是別人？", a: "行業位置、優勢來源，有沒有所謂的護城河。" },
			{ q: "現在有什麼隱憂或風險？", a: "行業變化、政策、競爭、商業模式裡的脆弱點。" },
			{ q: "它更像哪一類公司？", a: "穩健現金牛、週期股、故事股還是高增長嘗試者。" },
		]),
		"zh-Hans": JSON.stringify([
			{ q: "这家公司到底是干什么的？", a: "一句话讲完，你也能跟别人复述。" },
			{ q: "它怎么赚钱？钱从哪儿来？", a: "核心业务、主要客户、收入构成一目了然。" },
			{ q: "为什么是它，而不是别人？", a: "行业位置、优势来源，有没有所谓的护城河。" },
			{ q: "现在有什么隐忧和风险？", a: "行业变化、政策、竞争、商业模式里的脆弱点。" },
			{ q: "它更像哪一类公司？", a: "稳健现金牛、周期股、故事股还是高增长尝试者。" },
		]),
	},
	"landing.module3.title": {
		"en": "Why can it be both professional and easy to read?",
		"ja": "なぜ「専門的なのに分かりやすい」のか",
		"ko": "왜 ‘전문적이면서도 잘 읽히는가’",
		"zh-Hant": "它為什麼能「既專業又好懂」？",
		"zh-Hans": "它为什么能“既专业又好懂”？",
	},
	"landing.module3.description": {
		"en": "Internally we call it an understanding engine, not just an AI model. It follows three rules:",
		"ja": "社内では単なる AI モデルではなく「理解エンジン」と呼び、3 つの原則に従います：",
		"ko": "우리는 이것을 AI 모델이 아닌 ‘이해 엔진’이라 부르며 세 가지 원칙을 따릅니다:",
		"zh-Hant": "我們稱它為「理解引擎」，而不是普通的 AI 模型，它遵循三條原則：",
		"zh-Hans": "我们称它为“理解引擎”，而不是普通 AI 模型，它遵循三条原则：",
	},
	"landing.module3.items": {
		"en": JSON.stringify([
			{ title: "Understand the business first", body: "No hype, no sentiment. We always start with what the company actually does each day." },
			{ title: "Every statement must be traceable", body: "Judgments are grounded in public information; no baseless guesses." },
			{ title: "Refine, never pile up", body: "People need the three to five essentials, not another avalanche of raw data." },
		]),
		"ja": JSON.stringify([
			{ title: "まず事業を理解する", body: "流行や感情に乗らず、会社が日々何をしているかから始めます。" },
			{ title: "判断は必ず根拠とペア", body: "公開情報で裏付けられない推測は書きません。" },
			{ title: "情報の山ではなく本質を抽出", body: "人が欲しいのは本質的な 3〜5 点であり、生データの堆積ではありません。" },
		]),
		"ko": JSON.stringify([
			{ title: "먼저 비즈니스를 이해", body: "유행이나 감정에 흔들리지 않고, 회사가 매일 무엇을 하는지부터 파악합니다." },
			{ title: "모든 판단은 근거와 함께", body: "공개 정보로 확인할 수 없는 추측은 쓰지 않습니다." },
			{ title: "쌓기보다 정제", body: "사람이 필요한 것은 본질적인 서너 가지지, 또 다른 데이터 산더미가 아닙니다." },
		]),
		"zh-Hant": JSON.stringify([
			{ title: "先理解業務，再談估值與敘事", body: "不以話題開頭、不被情緒帶路，先弄清楚公司每天在做什麼。" },
			{ title: "所有判斷都要有公開證據", body: "報告不會出現憑空推測或過度解讀。" },
			{ title: "不做資訊堆疊，只做理解提煉", body: "人真正需要的不是海量資訊，而是最本質的那三五件事。" },
		]),
		"zh-Hans": JSON.stringify([
			{ title: "先理解业务，再谈估值叙事", body: "不以热点开头，不被情绪带路，先搞清楚公司每天在干什么。" },
			{ title: "判断都要有公开证据", body: "报告不会出现凭空推测或过度解读。" },
			{ title: "不做复杂堆叠，只做理解提炼", body: "人真正需要的不是海量信息，而是那三五件最本质的事。" },
		]),
	},
	"landing.module4.title": {
		"en": "Who is it for?",
		"ja": "誰のためのプロダクトか",
		"ko": "누구에게 필요한가?",
		"zh-Hant": "適合誰？",
		"zh-Hans": "适合谁？",
	},
	"landing.module4.items": {
		"en": JSON.stringify([
			"People who want to quickly understand an unfamiliar company",
			"Those who want to step away from influencer takes and buzzwords",
			"Researchers building their own judgment frameworks",
			"Founders/operators/product folks studying competitors",
			"Anyone training long-term investing instincts",
			"In short: anyone who wants to sharpen their ability to read businesses",
		]),
		"ja": JSON.stringify([
			"未知の企業を短時間で理解したい人",
			"インフルエンサーの意見やバズワードから距離を置きたい人",
			"自分の判断モデルを組み立てたいリサーチャー",
			"競合を研究したい創業者・オペレーション・プロダクト担当",
			"長期投資家としての土台を養いたい人",
			"つまり「企業を読み解く力」を磨きたいすべての人",
		]),
		"ko": JSON.stringify([
			"낯선 회사를 빠르게 파악하고 싶은 사람",
			"블로거 관점과 유행어에서 벗어나고 싶은 사람",
			"자신만의 판단 모델을 만들고 싶은 리서치어",
			"경쟁사를 분석하려는 창업자/운영/프로덕트 담당자",
			"장기 투자자의 기초를 다지고 싶은 사람",
			"한마디로, 기업을 읽는 능력을 키우고 싶은 모두",
		]),
		"zh-Hant": JSON.stringify([
			"想用短時間看懂陌生公司",
			"想脫離博主觀點與概念詞彙",
			"想建立自己的判斷模型",
			"創業者、營運、產品人想研究同行",
			"想培養長期投資者底層認知",
			"一句話：適合所有想提升「看懂企業」能力的人",
		]),
		"zh-Hans": JSON.stringify([
			"想用短时间看懂陌生公司",
			"想脱离博主观点、概念词汇",
			"想建立自己的判断模型",
			"创业者、运营、产品人想研究同行",
			"想培养长期投资者底层认知",
			"一句话：适合所有想提升“看懂企业”能力的人",
		]),
	},
	"landing.module5.title": {
		"en": "What we deliberately refuse to do",
		"ja": "あえてやらないこと",
		"ko": "우리가 의도적으로 하지 않는 것",
		"zh-Hant": "我們刻意不做什麼",
		"zh-Hans": "我们刻意不做什么",
	},
	"landing.module5.items": {
		"en": JSON.stringify([
			"No price targets",
			"No buy/sell tips",
			"No ratings",
			"No emotional hype",
			"No exaggerated growth stories",
			"No “next 10x stock” promises",
		]),
		"ja": JSON.stringify([
			"株価予想はしない",
			"売買アドバイスはしない",
			"レーティングは付けない",
			"感情を煽らない",
			"成長ストーリーを誇張しない",
			"「次の10倍株」を謳わない",
		]),
		"ko": JSON.stringify([
			"목표가 제시하지 않음",
			"매수/매도 추천하지 않음",
			"등급 매기지 않음",
			"감정을 자극하지 않음",
			"성장 스토리를 과장하지 않음",
			"‘다음 10배 종목’ 같은 약속 없음",
		]),
		"zh-Hant": JSON.stringify([
			"不預測股價",
			"不推薦買賣",
			"不做評級",
			"不煽動情緒",
			"不誇大成長故事",
			"不給所謂「下一支 10 倍股」",
		]),
		"zh-Hans": JSON.stringify([
			"不预测股价",
			"不推荐买卖",
			"不做评级",
			"不煽动情绪",
			"不夸大增长故事",
			"不给所谓“下一支 10 倍股”",
		]),
	},
	"landing.module6.title": {
		"en": "Why is it worth paying for?",
		"ja": "なぜ費用を払う価値があるのか",
		"ko": "왜 비용을 지불할 가치가 있는가?",
		"zh-Hant": "為什麼值得付費？",
		"zh-Hans": "为什么值得付费？",
	},
	"landing.module6.items": {
		"en": JSON.stringify([
			"Save hours of manual digging",
			"Avoid being misled by noise",
			"Reach “I understand this company” faster",
			"Gain a repeatable structure you can reuse or share",
			"Make decisions based on clarity instead of instinct",
			"You are paying for usable, explainable, steady understanding—not raw data",
		]),
		"ja": JSON.stringify([
			"自分で調べる数時間を節約",
			"ノイズに振り回されない",
			"短時間で「この会社がわかった」に到達",
			"再利用・共有できる認知構造を得る",
			"直感ではなく明瞭さに基づいて判断",
			"支払うのはデータではなく、使えて語れてブレない理解です",
		]),
		"ko": JSON.stringify([
			"직접 파고드는 시간을 몇 시간 절약",
			"노이즈에 휘둘리지 않음",
			"‘이 회사를 알겠다’는 지점에 더 빨리 도달",
			"재사용·전달 가능한 인지 구조 확보",
			"직감이 아니라 명료함에 기반해 결정",
			"지불하는 가치는 데이터가 아니라 사용 가능하고 설명 가능하며 흔들리지 않는 이해력",
		]),
		"zh-Hant": JSON.stringify([
			"節省自己好幾小時的時間",
			"避免被噪音誤導",
			"更快達到「我大概知道這家公司在幹嘛」",
			"獲得可複盤、可轉述的認知結構",
			"讓決策不再依靠直覺或情緒",
			"你付費的不是資料，而是用得上、講得清、做得穩的理解能力",
		]),
		"zh-Hans": JSON.stringify([
			"节省自己几小时的时间",
			"避免被噪音误导",
			"更快达到“我知道这家公司在干嘛”",
			"获得可复盘、可转述的认知结构",
			"让决策不再依靠直觉或情绪",
			"你付费的不是信息，而是用得上、讲得清、做得稳的理解能力",
		]),
	},
	"hero.cta.primary": {
		"en": "Generate my first report",
		"ja": "最初のレポートを生成",
		"ko": "첫 리포트 만들기",
		"zh-Hant": "生成我的第一份報告",
		"zh-Hans": "生成我的第一份报告",
	},
	"hero.cta.secondary": {
		"en": "View example",
		"ja": "サンプルを見る",
		"ko": "예시 보기",
		"zh-Hant": "查看示例",
		"zh-Hans": "查看示例",
	},
	"hero.quota": {
		"en": "Quota / Sign-in",
		"ja": "クォータ / サインイン",
		"ko": "쿼터 / 로그인 안내",
		"zh-Hant": "額度 / 登入提醒",
		"zh-Hans": "额度 / 登录提醒",
	},
	"hero.highlight1.title": {
		"en": "Live fundamentals",
		"ja": "リアルタイムの基礎データ",
		"ko": "실시간 펀더멘털",
		"zh-Hant": "即時基本面",
		"zh-Hans": "实时基本面",
	},
	"hero.highlight1.description": {
		"en": "Search tickers and stream quotes, news, and filings from Finnhub in seconds.",
		"ja": "ティッカー検索で Finnhub の株価・ニュース・開示を秒単位で取得。",
		"ko": "티커를 검색하면 Finnhub 의 시세·뉴스·공시를 즉시 불러옵니다.",
		"zh-Hant": "輸入代號即可即時串接 Finnhub 行情、新聞與申報。",
		"zh-Hans": "搜索代码即可秒级接入 Finnhub 行情、新闻与申报。",
	},
	"hero.highlight2.title": {
		"en": "Structured workflow",
		"ja": "構造化ワークフロー",
		"ko": "구조화된 워크플로",
		"zh-Hant": "結構化流程",
		"zh-Hans": "结构化流程",
	},
	"hero.highlight2.description": {
		"en": "Four personas and principles keep reports consistent across teams.",
		"ja": "4 つのペルソナと三原則で、チーム全体のレポートを同じ骨子に。",
		"ko": "4가지 페르소나와 원칙으로 팀 간 리포트를 일정하게 유지합니다.",
		"zh-Hant": "四種人格與三原則讓不同團隊也能保持同樣骨幹。",
		"zh-Hans": "四种人格与三原则让团队输出保持一致。",
	},
	"hero.highlight3.title": {
		"en": "Export-ready",
		"ja": "すぐ使える書き出し",
		"ko": "즉시 내보내기",
		"zh-Hant": "隨時可匯出",
		"zh-Hans": "随时可导出",
	},
	"hero.highlight3.description": {
		"en": "Rich copy and Word exports slot directly into briefs and decks.",
		"ja": "リッチコピーと Word 出力で、そのまま資料や簡報に転用できます。",
		"ko": "리치 복사와 Word 내보내기로 바로 브리프와 데크에 붙여 넣습니다.",
		"zh-Hant": "支援富文本與 Word 匯出，直接貼進簡報 / 底稿。",
		"zh-Hans": "支持富文本复制和 Word 导出，可直接贴入简报/底稿。",
	},
	"workflow.step1.badge": {
		"en": "Step 01",
		"ja": "ステップ 01",
		"ko": "1단계",
		"zh-Hant": "步驟 01",
		"zh-Hans": "步骤 01",
	},
	"workflow.step1.title": {
		"en": "Search + pick persona",
		"ja": "銘柄とペルソナを選択",
		"ko": "티커 및 페르소나 선택",
		"zh-Hant": "搜尋代碼並選人格",
		"zh-Hans": "搜索代码并选人格",
	},
	"workflow.step1.detail": {
		"en": "Find a US ticker, choose the tone, and lock free quota.",
		"ja": "米国ティッカーを検索し、語り口を選んで無料枠を確保します。",
		"ko": "미국 티커를 검색하고 어조를 정한 뒤 무료 쿼터를 예약합니다.",
		"zh-Hant": "搜尋美股代碼、選擇語氣並鎖定免費額度。",
		"zh-Hans": "搜索美股代码、选择语气并锁定免费额度。",
	},
	"workflow.step2.badge": {
		"en": "Step 02",
		"ja": "ステップ 02",
		"ko": "2단계",
		"zh-Hant": "步驟 02",
		"zh-Hans": "步骤 02",
	},
	"workflow.step2.title": {
		"en": "Ingest market data",
		"ja": "マーケットデータを取得",
		"ko": "시장 데이터 수집",
		"zh-Hant": "匯入市場資料",
		"zh-Hans": "导入市场数据",
	},
	"workflow.step2.detail": {
		"en": "Sync Finnhub quotes, fundamentals, and recent headlines automatically.",
		"ja": "Finnhub から株価・財務・最新ニュースを自動同期します。",
		"ko": "Finnhub 시세, 펀더멘털, 최신 뉴스가 자동으로 동기화됩니다.",
		"zh-Hant": "自動同步 Finnhub 行情、財務與新聞。",
		"zh-Hans": "自动同步 Finnhub 行情、财务与新闻。",
	},
	"workflow.step3.badge": {
		"en": "Step 03",
		"ja": "ステップ 03",
		"ko": "3단계",
		"zh-Hant": "步驟 03",
		"zh-Hans": "步骤 03",
	},
	"workflow.step3.title": {
		"en": "Structure & generate",
		"ja": "構造化して生成",
		"ko": "구조화 후 생성",
		"zh-Hant": "結構化與生成",
		"zh-Hans": "结构化并生成",
	},
	"workflow.step3.detail": {
		"en": "Investor AI templates organize principles, moat, KPIs, and risk checks.",
		"ja": "Investor AI のテンプレが三原則・モート・KPI・リスクを整理します。",
		"ko": "Investor AI 템플릿이 원칙·모트·KPI·리스크 점검을 구조화합니다.",
		"zh-Hant": "Investor AI 模板將原則、護城河、KPI 與風險檢查串起來。",
		"zh-Hans": "Investor AI 模板会整理原则、护城河、KPI 和风险检查。",
	},
	"workflow.step4.badge": {
		"en": "Step 04",
		"ja": "ステップ 04",
		"ko": "4단계",
		"zh-Hant": "步驟 04",
		"zh-Hans": "步骤 04",
	},
	"workflow.step4.title": {
		"en": "Review & export",
		"ja": "レビューして書き出し",
		"ko": "리뷰 및 내보내기",
		"zh-Hant": "審閱與匯出",
		"zh-Hans": "审阅并导出",
	},
	"workflow.step4.detail": {
		"en": "Copy, export, or regenerate with another persona—always starting from English fallback.",
		"ja": "コピー / エクスポート / ペルソナ切替で再生成し、常に英語フォールバックを確保します。",
		"ko": "복사·내보내기·다른 페르소나로 재생성하며, 기본은 항상 영어입니다.",
		"zh-Hant": "可複製、匯出或換人格重生，英文永遠是安全備援。",
		"zh-Hans": "可复制、导出或换人格重生，英文永远是安全备援。",
	},
	"generator.sectionTitle": {
		"en": "Research model selector",
		"ja": "リサーチモデルの選択",
		"ko": "리서치 모델 선택",
		"zh-Hant": "投研模型選擇",
		"zh-Hans": "投研模型选择",
	},
	"generator.input.label": {
		"en": "Ticker / Company name",
		"ja": "ティッカー / 企業名",
		"ko": "티커 / 회사 이름",
		"zh-Hant": "股票代號 / 公司英文名",
		"zh-Hans": "股票代码 / 公司英文名",
	},
	"generator.input.placeholder": {
		"en": " Enter a US ticker or company, e.g. TSLA / NVDA / Apple",
		"ja": " 米国ティッカーや社名を入力（例: TSLA / NVDA / Apple）",
		"ko": " 미국 티커 또는 회사명을 입력하세요 (예: TSLA / NVDA / Apple)",
		"zh-Hant": " 請輸入美股代號或公司名，例如：TSLA / NVDA / Apple",
		"zh-Hans": " 输入美股代码或公司名，例如：TSLA / NVDA / Apple",
	},
	"generator.submit": {
		"en": "Generate AI report",
		"ja": "AI レポートを生成",
		"ko": "AI 리포트 생성",
		"zh-Hant": "生成 AI 投研報告",
		"zh-Hans": "生成 AI 投研报告",
	},
	"generator.searching": {
		"en": "Searching companies…",
		"ja": "企業を検索しています…",
		"ko": "기업을 검색하는 중…",
		"zh-Hant": "正在搜尋符合的公司…",
		"zh-Hans": "正在搜索匹配的公司…",
	},
	"generator.progress.fetching": {
		"en": "Syncing market and financial data …",
		"ja": "最新の株価と財務データを同期中…",
		"ko": "최신 시세와 재무 데이터를 동기화하는 중…",
		"zh-Hant": "正在同步最新行情與核心財務數據…",
		"zh-Hans": "正在同步最新行情与核心财务数据…",
	},
	"generator.progress.shaping": {
		"en": "Structuring the Investor AI outline (principles / moat / capital).",
		"ja": "三原則・参入障壁・資本効率など Investor AI の骨子を構築中…",
		"ko": "Investor AI 템플릿(삼원칙·모트·자본 효율)을 구성하는 중…",
		"zh-Hant": "正在整理 Investor AI 通用結構（投資三原則 / 護城河 / 資金效率）…",
		"zh-Hans": "正在整理 Investor AI 通用投研结构（原则 / 护城河 / 资金效率）…",
	},
	"generator.progress.llm": {
		"en": "Calling the model to craft insights…",
		"ja": "LLM を呼び出してインサイトを生成中…",
		"ko": "LLM을 호출해 인사이트를 작성하는 중…",
		"zh-Hant": "正在調度大模型生成觀點與排版…",
		"zh-Hans": "正在调度大模型生成分析结论与排版…",
	},
	"generator.progress.ready": {
		"en": "Report ready—copy or export.",
		"ja": "レポートが完成しました。コピーまたはエクスポートできます。",
		"ko": "리포트가 준비되었습니다. 복사하거나 내보내세요.",
		"zh-Hant": "報告已完成，可立即複製或匯出。",
		"zh-Hans": "报告生成完成，可复制/导出与分享结果。",
	},
	"generator.progress.done": {
		"en": "Analysis complete!",
		"ja": "分析が完了しました！",
		"ko": "분석이 완료되었습니다!",
		"zh-Hant": "分析完成！",
		"zh-Hans": "分析完成！",
	},
	"generator.progress.init": {
		"en": "Initializing the generation job…",
		"ja": "生成ジョブを初期化しています…",
		"ko": "생성 작업을 초기화하는 중…",
		"zh-Hant": "正在初始化生成工作…",
		"zh-Hans": "正在初始化生成任务…",
	},
	"generator.progress.preparing": {
		"en": "Preparing the report…",
		"ja": "レポートを準備中…",
		"ko": "리포트를 준비하는 중…",
		"zh-Hant": "正在準備報告…",
		"zh-Hans": "正在准备报告…",
	},
	"generator.loading": {
		"en": "Generating report…",
		"ja": "レポートを生成しています…",
		"ko": "리포트를 생성하는 중…",
		"zh-Hant": "正在生成報告…",
		"zh-Hans": "正在生成报告…",
	},
	"generator.alert.unregistered": {
		"en": "Please sign up to use the free quota. Click the Login / Sign up button to continue.",
		"ja": "無料クォータを使うには登録が必要です。右上の「ログイン / サインアップ」をクリックしてください。",
		"ko": "무료 쿼터를 사용하려면 가입이 필요합니다. 오른쪽 상단의 ‘로그인 / 가입’을 눌러 주세요.",
		"zh-Hant": "尚未註冊，無法生成報告。請點擊右上角「登入 / 註冊」領取首份免費額度。",
		"zh-Hans": "尚未注册，无法生成报告。请点击右上角「登录 / 注册」领取首份免费额度。",
	},
	"generator.alert.quota": {
		"en": "You've consumed the free trial. More quota will arrive with subscriptions.",
		"ja": "無料枠は使い切りました。追加クォータは近日公開のサブスクで提供します。",
		"ko": "무료 체험이 모두 소진되었습니다. 추가 쿼터는 곧 공개될 구독으로 제공됩니다.",
		"zh-Hant": "已用完註冊贈送的免費額度。訂閱方案上線後可解鎖更多次數。",
		"zh-Hans": "您已使用完注册赠送的 1 份免费报告额度。订阅计划上线后可解锁更多额度。",
	},
	"generator.empty.title": {
		"en": "👋 Tip",
		"ja": "👋 ヒント",
		"ko": "👋 팁",
		"zh-Hant": "👋 小提示",
		"zh-Hans": "👋 小提示",
	},
	"generator.empty.body": {
		"en": "Pick a US ticker (e.g. NVDA) and click Generate to see a reusable Investor AI report with positioning, principles, moat, and more.",
		"ja": "上部で米国ティッカー（例: NVDA）を選び「AI レポートを生成」を押すと、ポジショニングや三原則評価などを含む再利用可能なレポートが表示されます。",
		"ko": "위에서 미국 티커(예: NVDA)를 선택하고 ‘AI 리포트 생성’을 누르면 포지셔닝, 삼원칙 평가, 경쟁 구도 등을 담은 재사용 가능한 리포트를 볼 수 있습니다.",
		"zh-Hant": "選擇一檔美股（如 NVDA），點擊「生成 AI 投研報告」，即可看到包含定位、三原則評估、競爭格局等的可複用報告內容。",
		"zh-Hans": "上方选择一只美股（例如 NVDA），点击「生成 AI 投研报告」，这里会出现结构化、可复用的 Investor AI 通用公司分析：包含公司定位、三原则评估、竞争格局等内容。",
	},
	"highlight.default.1": {
		"en": "Investor AI links market data, financials, and news into markdown in three minutes.",
		"ja": "Investor AI は 3 分で相場・財務・ニュースをまとめた Markdown レポートを生成します。",
		"ko": "Investor AI는 3분 만에 시세·재무·뉴스를 엮어 마크다운 리포트를 만듭니다.",
		"zh-Hant": "Investor AI 在 3 分鐘內串聯行情、財報與新聞，輸出結構化 Markdown。",
		"zh-Hans": "Investor AI 在 3 分钟内串联行情、财报与新闻，输出结构化 Markdown。",
	},
	"highlight.default.2": {
		"en": "Each report covers the 3 principles, moat, risks, and bear case for reuse.",
		"ja": "三原則や参入障壁、リスク、ベアケースまで網羅した構造化レポートです。",
		"ko": "각 리포트에는 삼원칙, 모트, 리스크, 베어 케이스까지 담겨 재활용하기 좋습니다.",
		"zh-Hant": "報告涵蓋投資三原則、護城河、風險雷達與 Bear Case，方便直接複用。",
		"zh-Hans": "报告包含三原则评估、风险雷达与 Bear Case，方便直接复用到底稿。",
	},
	"highlight.default.3": {
		"en": "Rich copy + DOCX export today, more quota/templates via subscription soon.",
		"ja": "リッチコピーと DOCX 書き出しに対応。追加クォータとテンプレートはサブスクで順次開放。",
		"ko": "리치 텍스트 복사와 DOCX 내보내기를 지원하며, 추가 쿼터와 템플릿은 구독으로 제공될 예정입니다.",
		"zh-Hant": "支援富文本複製與 DOCX 匯出，更多額度與模板將透過訂閱解鎖。",
		"zh-Hans": "支持富文本复制与 DOCX 导出，后续可订阅解锁更多额度与模板。",
	},
	"persona.caption": {
		"en": "Four personas — {{tones}} — look at the same company from different worldviews while keeping Investor AI's structure.",
		"ja": "4 つのペルソナ（{{tones}}）が同じ企業を異なる視点で読み解き、Investor AI の構造を保ちます。",
		"ko": "4가지 페르소나({{tones}})가 서로 다른 관점으로 같은 회사를 해석하면서 Investor AI 구조를 유지합니다.",
		"zh-Hant": "四種投研人格（{{tones}}）以不同世界觀審視同一家公司，同步維持 Investor AI 的結構。",
		"zh-Hans": "四大投研人格：{{tones}}，从不同世界观审视同一家公司，输出同样结构化的 Investor AI 报告。",
	},
	"persona.galleryCaption": {
		"en": "Template gallery warm-up: {{tones}} shows how one company reads under each persona.",
		"ja": "テンプレートギャラリーの予告として、{{tones}} が同じ企業をそれぞれの声で表現します。",
		"ko": "템플릿 갤러리 예고: {{tones}} 페르소나가 하나의 회사를 각자 스타일로 보여줍니다.",
		"zh-Hant": "模板館搶先看：{{tones}} 展示同一家公司在不同人格下的筆法。",
		"zh-Hans": "提前预热模板市场：{{tones}} 四种视角，展示同一家公司在不同人格下的写法。",
	},
	"persona.selector": {
		"en": "Active",
		"ja": "選択中",
		"ko": "사용 중",
		"zh-Hant": "已啟用",
		"zh-Hans": "已启用",
	},
	"tone.baseline.title": {
		"en": "Baseline Mode",
		"ja": "ベースライン",
		"ko": "베이스라인 모드",
		"zh-Hant": "標準模式",
		"zh-Hans": "标准模式",
	},
	"tone.baseline.badge": {
		"en": "Neutral · Base · Macro",
		"ja": "ニュートラル · ベース · マクロ",
		"ko": "중립 · 베이스 · 매크로",
		"zh-Hant": "中性 · 基準 · 全局",
		"zh-Hans": "中性 · 基准 · 全局",
	},
	"tone.baseline.description": {
		"en": "See it clearly for what it is.",
		"ja": "ありのままをクリアに把握します。",
		"ko": "있는 그대로를 또렷하게 바라봅니다.",
		"zh-Hant": "看清它本來的樣子。",
		"zh-Hans": "看它本来的样子。",
	},
	"tone.buffett.title": {
		"en": "Buffett Mode",
		"ja": "バフェット",
		"ko": "버핏 모드",
		"zh-Hant": "巴菲特模式",
		"zh-Hans": "巴菲特模式",
	},
	"tone.buffett.badge": {
		"en": "Value · Moat · Long-Term",
		"ja": "バリュー · モート · 長期",
		"ko": "가치 · 모트 · 장기",
		"zh-Hant": "價值 · 護城河 · 長期",
		"zh-Hans": "价值 · 护城河 · 长期",
	},
	"tone.buffett.description": {
		"en": "See if it's worth 10 years.",
		"ja": "10 年持てるかを見極めます。",
		"ko": "10년 보유할 가치가 있는지 살펴봅니다.",
		"zh-Hant": "看它值不值得抱十年。",
		"zh-Hans": "看它值不值得拿十年。",
	},
	"tone.musk.title": {
		"en": "Musk Mode",
		"ja": "マスク",
		"ko": "머스크 모드",
		"zh-Hant": "馬斯克模式",
		"zh-Hans": "马斯克模式",
	},
	"tone.musk.badge": {
		"en": "Tech · Growth · Breakout",
		"ja": "テック · 成長 · ブレイクアウト",
		"ko": "테크 · 성장 · 폭발",
		"zh-Hant": "科技 · 成長 · 爆發",
		"zh-Hans": "科技 · 成长 · 爆发",
	},
	"tone.musk.description": {
		"en": "See if it can still 10×.",
		"ja": "まだ 10 倍の余地があるかを探ります。",
		"ko": "아직 10배 성장 여력이 있는지 살펴봅니다.",
		"zh-Hant": "看它還有沒有 10 倍空間。",
		"zh-Hans": "看它还有没有 10 倍空间。",
	},
	"tone.muddy.title": {
		"en": "Muddy Waters Mode",
		"ja": "マディーウォーターズ",
		"ko": "머디워터스 모드",
		"zh-Hant": "渾水模式",
		"zh-Hans": "浑水模式",
	},
	"tone.muddy.badge": {
		"en": "Short · Skeptic · Risk",
		"ja": "ショート · 懐疑 · リスク",
		"ko": "공매도 · 의심 · 리스크",
		"zh-Hant": "反向 · 拆雷 · 做空",
		"zh-Hans": "反向 · 拆雷 · 做空",
	},
	"tone.muddy.description": {
		"en": "See where it breaks.",
		"ja": "どこに歪みがあるかを炙り出します。",
		"ko": "어디에서 문제가 터지는지 찾아봅니다.",
		"zh-Hant": "看它哪裡不對勁。",
		"zh-Hans": "看它哪里不对劲。",
	},
	"workflow.title": {
		"en": "How Investor AI delivers a structured report in 4 steps",
		"ja": "Investor AI が 4 ステップで構造化レポートを作る方法",
		"ko": "Investor AI가 4단계로 구조화된 리포트를 만드는 방법",
		"zh-Hant": "Investor AI 如何用 4 個步驟交付結構化報告",
		"zh-Hans": "Investor AI 如何在 4 步内交付结构化报告？",
	},
	"workflow.caption": {
		"en": "Every step is wired to real-time data, governance, and export endpoints—no black boxes.",
		"ja": "各ステップがリアルタイムデータとガバナンス、エクスポート経路につながり、ブラックボックスを排除します。",
		"ko": "모든 단계가 실시간 데이터·거버넌스·내보내기 엔드포인트와 연결되어 블랙박스가 없습니다.",
		"zh-Hant": "每一步都接上即時數據、治理與匯出口，沒有黑箱。",
		"zh-Hans": "每个步骤都与实时数据、风控与导出入口打通，避免「一键」背后的黑箱。",
	},
	"workflow.sectionLabel": {
		"en": "Workflow",
		"ja": "ワークフロー",
		"ko": "워크플로우",
		"zh-Hant": "工作流程",
		"zh-Hans": "工作流程",
	},
	"case.nvidia.industry": {
		"en": "AI acceleration",
		"ja": "AI アクセラレーション",
		"ko": "AI 가속",
		"zh-Hant": "AI 加速",
		"zh-Hans": "AI 加速",
	},
	"case.nvidia.tonality": {
		"en": "Musk Mode · Tech · Growth · Breakout",
		"ja": "マスク · テック · 成長",
		"ko": "머스크 모드 · 테크 · 성장",
		"zh-Hant": "馬斯克模式 · 科技 · 成長 · 爆發",
		"zh-Hans": "马斯克模式 · 科技 · 成长 · 爆发",
	},
	"case.nvidia.tag1": {
		"en": "Data center",
		"ja": "データセンター",
		"ko": "데이터 센터",
		"zh-Hant": "資料中心",
		"zh-Hans": "数据中心",
	},
	"case.nvidia.tag2": {
		"en": "GPU",
		"ja": "GPU",
		"ko": "GPU",
		"zh-Hant": "GPU",
		"zh-Hans": "GPU",
	},
	"case.nvidia.tag3": {
		"en": "High beta",
		"ja": "高ベータ",
		"ko": "하이 베타",
		"zh-Hant": "高彈性",
		"zh-Hans": "高弹性",
	},
	"case.nvidia.snippet": {
		"en": "Highlight accelerating AI server CapEx and new revenue beyond gaming/Fintech.",
		"ja": "AI サーバー向け CapEx の加速と、ゲーム/フィンテック以外の新規収益源に注目。",
		"ko": "AI 서버 CapEx 가속과 게임·핀테크 외 신규 매출 구성을 강조합니다.",
		"zh-Hant": "強調 AI 伺服器 CapEx 上行，以及遊戲/Fintech 之外的新收入結構。",
		"zh-Hans": "重点强调 AI 服务器 CapEx 上行，以及 Fintech/游戏以外的新增收入结构。",
	},
	"case.nvidia.metric": {
		"en": "+28% YoY revenue",
		"ja": "+28% 売上成長",
		"ko": "+28% 연간 매출",
		"zh-Hant": "+28% 年增營收",
		"zh-Hans": "+28% YoY 收入",
	},
	"case.coke.industry": {
		"en": "Consumer staples",
		"ja": "生活必需品",
		"ko": "필수 소비재",
		"zh-Hant": "民生日常",
		"zh-Hans": "消费必需",
	},
	"case.coke.tonality": {
		"en": "Buffett Mode · Value · Moat",
		"ja": "バフェット · 価値 · モート",
		"ko": "버핏 모드 · 가치 · 모트",
		"zh-Hant": "巴菲特模式 · 價值 · 護城河",
		"zh-Hans": "巴菲特模式 · 价值 · 护城河",
	},
	"case.coke.tag1": {
		"en": "Dividend",
		"ja": "配当",
		"ko": "배당",
		"zh-Hant": "股息",
		"zh-Hans": "股息",
	},
	"case.coke.tag2": {
		"en": "Global reach",
		"ja": "グローバル流通",
		"ko": "글로벌 유통",
		"zh-Hant": "全球通路",
		"zh-Hans": "全球渠道",
	},
	"case.coke.snippet": {
		"en": "Evaluate pricing power, cash-flow coverage, and brand mix for defensive investors.",
		"ja": "値上げ力、キャッシュフローの余裕、ブランド構成を確認し、防御型ポートに適合させます。",
		"ko": "가격 결정력, 현금흐름 커버리지, 브랜드 믹스를 점검해 방어형 투자에 맞춥니다.",
		"zh-Hant": "關注提價能力、現金流覆蓋率與品牌組合，適合防禦型投資。",
		"zh-Hans": "关注提价能力、现金流覆盖率与多元品牌组合，适合防御型投资。",
	},
	"case.coke.metric": {
		"en": "60 years of dividends",
		"ja": "60 年連続配当",
		"ko": "60년 연속 배당",
		"zh-Hant": "60 年持續分紅",
		"zh-Hans": "60 年持续分红",
	},
	"case.coinbase.industry": {
		"en": "Crypto infrastructure",
		"ja": "暗号資産インフラ",
		"ko": "크립토 인프라",
		"zh-Hant": "加密基礎設施",
		"zh-Hans": "加密基础设施",
	},
	"case.coinbase.tonality": {
		"en": "Muddy Waters Mode · Short · Risk",
		"ja": "マディー · ショート · リスク",
		"ko": "머디워터스 · 숏 · 리스크",
		"zh-Hant": "渾水模式 · 反向 · 拆雷",
		"zh-Hans": "浑水模式 · 反向 · 拆雷",
	},
	"case.coinbase.tag1": {
		"en": "Regulation",
		"ja": "規制",
		"ko": "규제",
		"zh-Hant": "監管",
		"zh-Hans": "监管",
	},
	"case.coinbase.tag2": {
		"en": "Trading volume",
		"ja": "取引量",
		"ko": "거래량",
		"zh-Hant": "交易量",
		"zh-Hans": "交易量",
	},
	"case.coinbase.snippet": {
		"en": "Stress-test regulatory battles and volume swings to map dual risk factors.",
		"ja": "規制リスクと出来高の変動をストレステストし、ダブルリスクを可視化します。",
		"ko": "규제 이슈와 거래량 변동성을 스트레스 테스트해 이중 리스크를 파악합니다.",
		"zh-Hant": "突顯合規戰線與交易量波動，有助評估政策 / 市場雙重風險。",
		"zh-Hans": "突出合规战线与交易量波动，帮助评估政策/市场双重风险。",
	},
	"case.coinbase.metric": {
		"en": "β > 1.8",
		"ja": "β > 1.8",
		"ko": "β > 1.8",
		"zh-Hant": "β > 1.8",
		"zh-Hans": "β > 1.8",
	},
	"pricing.title": {
		"en": "Trial now, subscription quota coming soon",
		"ja": "まずはトライアル、サブスク枠は順次解放",
		"ko": "지금 체험, 구독 쿼터 곧 공개",
		"zh-Hant": "立即體驗，訂閱額度即將上線",
		"zh-Hans": "注册后首份体验，后续额度即将上线",
	},
	"pricing.caption": {
		"en": "Validate quality with the first report, then unlock team plans soon.",
		"ja": "最初のレポートで品質を確かめ、その後チームプランを順次公開します。",
		"ko": "첫 리포트로 품질을 확인한 뒤 곧 팀 요금제를 열어드립니다.",
		"zh-Hant": "先用首份報告驗證品質，接著釋出訂閱 / 團隊方案。",
		"zh-Hans": "先让用户验证生成质量，再逐步开放订阅 / 团队方案。",
	},
	"pricing.note1": {
		"en": "Prices include VAT",
		"ja": "価格は税込み",
		"ko": "가격에는 부가세가 포함됩니다",
		"zh-Hant": "所有價格均含增值稅",
		"zh-Hans": "所有价格均含增值税",
	},
	"pricing.note2": {
		"en": "You can migrate to future plans for free before launch",
		"ja": "正式リリース前であれば将来のプランへ無料で移行できます",
		"ko": "출시 전에는 향후 요금제로 무료 이동이 가능합니다",
		"zh-Hant": "正式上線前可免費移轉至新方案",
		"zh-Hans": "正式发布前可免费迁移到新方案",
	},
	"pricing.plan.free.name": {
		"en": "Free beta",
		"ja": "フリーベータ",
		"ko": "프리 베타",
		"zh-Hant": "免費測試",
		"zh-Hans": "免费体验",
	},
	"pricing.plan.free.badge": {
		"en": "Signup",
		"ja": "登録",
		"ko": "가입",
		"zh-Hant": "註冊即用",
		"zh-Hans": "注册即用",
	},
	"pricing.plan.free.price": {
		"en": "$0",
		"ja": "$0",
		"ko": "$0",
		"zh-Hant": "$0",
		"zh-Hans": "$0",
	},
	"pricing.plan.free.tagline": {
		"en": "Validate Investor AI with one report",
		"ja": "1 本のレポートで Investor AI を体験",
		"ko": "리포트 1개로 Investor AI 품질 확인",
		"zh-Hant": "用一份報告驗證 Investor AI",
		"zh-Hans": "用一份报告验证 Investor AI",
	},
	"pricing.plan.free.feature1": {
		"en": "1 AI report + DOCX export",
		"ja": "AI レポート 1 本 + DOCX 書き出し",
		"ko": "AI 리포트 1건 + DOCX 내보내기",
		"zh-Hant": "1 份 AI 報告 + DOCX 匯出",
		"zh-Hans": "1 份 AI 报告 + DOCX 导出",
	},
	"pricing.plan.free.feature2": {
		"en": "Rich copy & persona selector",
		"ja": "リッチコピーとペルソナ選択",
		"ko": "리치 복사와 페르소나 선택",
		"zh-Hant": "富文本複製與人格切換",
		"zh-Hans": "富文本复制与人格切换",
	},
	"pricing.plan.free.feature3": {
		"en": "Live Finnhub market + fundamentals",
		"ja": "Finnhub の株価・財務データ",
		"ko": "Finnhub 실시간 시세와 재무",
		"zh-Hant": "Finnhub 即時行情與基本面",
		"zh-Hans": "Finnhub 即时行情与基本面",
	},
	"pricing.plan.free.feature4": {
		"en": "Email delivery & quota sync",
		"ja": "メール送付とクォータ同期",
		"ko": "이메일 전송 + 쿼터 동기화",
		"zh-Hant": "Email 投遞與額度同步",
		"zh-Hans": "Email 投递与额度同步",
	},
	"pricing.plan.free.cta": {
		"en": "Claim free report",
		"ja": "無料レポートを受け取る",
		"ko": "무료 리포트 받기",
		"zh-Hant": "領取免費報告",
		"zh-Hans": "领取免费报告",
	},
	"pricing.plan.pro.name": {
		"en": "Pro (coming soon)",
		"ja": "Pro（近日公開）",
		"ko": "Pro (곧 출시)",
		"zh-Hant": "專業版（即將推出）",
		"zh-Hans": "专业版（即将推出）",
	},
	"pricing.plan.pro.badge": {
		"en": "Team-ready",
		"ja": "チーム対応",
		"ko": "팀 사용",
		"zh-Hant": "團隊方案",
		"zh-Hans": "团队方案",
	},
	"pricing.plan.pro.price": {
		"en": "$39 / seat",
		"ja": "$39 / 席",
		"ko": "$39 / 사용자",
		"zh-Hant": "$39 / 每席",
		"zh-Hans": "$39 / 每席",
	},
	"pricing.plan.pro.tagline": {
		"en": "More quota, templates, and governance controls",
		"ja": "クォータ・テンプレ・ガバナンスを拡張",
		"ko": "쿼터·템플릿·거버넌스를 확장",
		"zh-Hant": "更多額度、模板與治理控管",
		"zh-Hans": "更多额度、模板与治理控制",
	},
	"pricing.plan.pro.feature1": {
		"en": "Unlimited AI reports",
		"ja": "無制限の AI レポート",
		"ko": "무제한 AI 리포트",
		"zh-Hant": "不限量 AI 報告",
		"zh-Hans": "不限量 AI 报告",
	},
	"pricing.plan.pro.feature2": {
		"en": "Persona & template marketplace",
		"ja": "ペルソナ / テンプレ市",
		"ko": "페르소나·템플릿 마켓",
		"zh-Hant": "人格與模板市集",
		"zh-Hans": "人格与模板市集",
	},
	"pricing.plan.pro.feature3": {
		"en": "Team workspaces & approvals",
		"ja": "チーム用ワークスペースと承認フロー",
		"ko": "팀 워크스페이스와 승인 흐름",
		"zh-Hant": "團隊工作區與審批",
		"zh-Hans": "团队工作区与审批",
	},
	"pricing.plan.pro.feature4": {
		"en": "Priority support + API access",
		"ja": "優先サポート + API アクセス",
		"ko": "우선 지원 + API 접근",
		"zh-Hant": "優先客服 + API",
		"zh-Hans": "优先客服 + API",
	},
	"pricing.plan.pro.cta": {
		"en": "Join waitlist",
		"ja": "ウェイトリストに参加",
		"ko": "웨이팅 리스트 등록",
		"zh-Hant": "加入候補名單",
		"zh-Hans": "加入候补名单",
	},
	"faq.title": {
		"en": "FAQ & Safety",
		"ja": "FAQ と安全性",
		"ko": "FAQ 및 안전",
		"zh-Hant": "常見問題與安全提醒",
		"zh-Hans": "常见问题与安全提醒",
	},
	"faq.caption": {
		"en": "Investor AI outputs are for education only and not investment advice.",
		"ja": "Investor AI の出力は教育目的のみで、投資助言ではありません。",
		"ko": "Investor AI 결과물은 교육 목적이며 투자 조언이 아닙니다.",
		"zh-Hant": "Investor AI 僅提供教育資訊，不構成投資建議。",
		"zh-Hans": "Investor AI 不提供投资建议，所有内容仅供学习参考。",
	},
	"faq.q1.question": {
		"en": "Is Investor AI an investing advisor?",
		"ja": "Investor AI は投資アドバイザーですか？",
		"ko": "Investor AI가 투자 자문인가요?",
		"zh-Hant": "Investor AI 是投顧嗎？",
		"zh-Hans": "Investor AI 是投资顾问吗？",
	},
	"faq.q1.answer": {
		"en": "No. It summarizes public data for education only—you still own every decision.",
		"ja": "いいえ。公開データを教育目的で要約するだけで、投資判断は利用者に委ねられます。",
		"ko": "아닙니다. 공개 데이터를 교육 목적으로 요약할 뿐이며, 모든 의사결정은 사용자에게 달려 있습니다.",
		"zh-Hant": "不是。我們僅整理公開資料作為教育參考，投資決策仍由你自己掌握。",
		"zh-Hans": "不是。我们只整理公开数据用于学习，投资决策仍由你自己做。",
	},
	"faq.q2.question": {
		"en": "Which markets and tickers are supported?",
		"ja": "どの市場・ティッカーに対応していますか？",
		"ko": "어떤 시장과 티커를 지원하나요?",
		"zh-Hant": "目前支援哪些市場與代碼？",
		"zh-Hans": "目前支持哪些市场与股票代码？",
	},
	"faq.q2.answer": {
		"en": "The beta focuses on US listings from Finnhub. More regions arrive with subscriptions.",
		"ja": "ベータでは Finnhub の米国上場企業にフォーカスしています。追加地域はサブスク提供時に拡張します。",
		"ko": "베타 단계에서는 Finnhub 의 미국 상장사를 우선 지원하며, 구독 출시와 함께 지역을 확대합니다.",
		"zh-Hant": "測試版優先支援 Finnhub 的美股清單，未來會隨訂閱擴大市場。",
		"zh-Hans": "当前测试版聚焦 Finnhub 的美股清单，后续会随着订阅开放更多市场。",
	},
	"faq.q3.question": {
		"en": "How do you handle privacy and account data?",
		"ja": "プライバシーやアカウント情報はどう守られますか？",
		"ko": "개인정보와 계정 데이터는 어떻게 보호하나요?",
		"zh-Hant": "你們如何處理隱私與帳戶資料？",
		"zh-Hans": "你们如何处理隐私与账号数据？",
	},
	"faq.q3.answer": {
		"en": "We store only the email + quota metadata locally. No keys or broker data are required in beta.",
		"ja": "ベータではメールとクォータ情報のみをローカル保存し、鍵や証券口座データは扱いません。",
		"ko": "베타에서는 이메일과 쿼터 메타데이터만 로컬에 저장하며, 키나 브로커 데이터는 요구하지 않습니다.",
		"zh-Hant": "Beta 僅在本地保存 Email 與額度資訊，不需輸入金鑰或券商資料。",
		"zh-Hans": "Beta 只在本地保存邮箱与额度信息，不需要任何密钥或券商数据。",
	},
	"language.zh": {
		"en": "中文",
		"zh-Hant": "中文",
		"zh-Hans": "中文",
	},
	"language.en": {
		"en": "EN",
		"zh-Hant": "EN",
		"zh-Hans": "EN",
	},
	"cta.preview": {
		"en": "Login",
		"ja": "ログイン",
		"ko": "로그인",
		"zh-Hant": "登入",
		"zh-Hans": "登录",
	},
	"cta.workflow": {
		"en": "Workflow",
		"ja": "ワークフロー",
		"ko": "워크플로",
		"zh-Hant": "工作流程",
		"zh-Hans": "Workflow",
	},
	"quota.banner.title": {
		"en": "Free trial quota",
		"ja": "無料トライアル枠",
		"ko": "무료 체험 쿼터",
		"zh-Hant": "註冊即可領取免費報告",
		"zh-Hans": "注册领取首份免费报告",
	},
	"quota.banner.description": {
		"en": "Sign up with email to save quota and receive the report in your inbox.",
		"ja": "メール登録でクォータを保存し、レポートを受信箱にお届けします。",
		"ko": "이메일로 가입하면 쿼터가 저장되고 리포트가 메일함으로 전송됩니다.",
		"zh-Hant": "輸入 Email 註冊即可保留額度，報告也會寄到信箱。",
		"zh-Hans": "邮箱注册即可保存额度，报告会同步发送到你的收件箱。",
	},
	"quota.banner.hint.register": {
		"en": "Complete signup to unlock the first quota",
		"ja": "登録完了で 1 件分のクォータが解放されます",
		"ko": "가입을 완료하면 1건의 쿼터가 열립니다",
		"zh-Hant": "完成註冊即自動解鎖 1 份額度",
		"zh-Hans": "完成注册后自动解锁 1 份额度",
	},
	"quota.banner.hint.refresh": {
		"en": "Regenerate to refresh usage",
		"ja": "再生成で使用可能枠を更新",
		"ko": "다시 생성하면 사용량이 갱신됩니다",
		"zh-Hant": "重新生成即可刷新額度",
		"zh-Hans": "重新生成可继续刷新额度",
	},
	"gallery.subtitle": {
		"en": "Submit your summary to the daily spotlight",
		"ja": "デイリーハイライトに要約を投稿しよう",
		"ko": "데일리 스포트라이트에 요약을 보내주세요",
		"zh-Hant": "歡迎投稿到「每日一票」挑戰",
		"zh-Hans": "欢迎把自己的报告摘要投稿到 “每日一票” 挑战",
	},
	"gallery.description": {
		"en": "We'll feature great cases on the homepage",
		"ja": "優秀なケースはトップページで紹介します",
		"ko": "우수 사례는 홈페이지에 소개됩니다",
		"zh-Hant": "我們會在首頁展示優秀案例",
		"zh-Hans": "我们会把优秀案例展示在首页",
	},
	"gallery.cta": {
		"en": "✉️ Submit / build template",
		"ja": "✉️ 投稿 / テンプレート化",
		"ko": "✉️ 제출 / 템플릿 만들기",
		"zh-Hant": "✉️ 投稿 / 生成新模板",
		"zh-Hans": "✉️ 投稿 / 生成新模板",
	},
	"gallery.footer": {
		"en": "Send your summary or idea—we'll turn the best ones into templates for everyone.",
		"ja": "要約やアイデアを送ってください。厳選したものをみんなが使えるテンプレートにします。",
		"ko": "요약이나 아이디어를 보내주시면 우수한 내용을 모두가 쓸 수 있는 템플릿으로 만들겠습니다.",
		"zh-Hant": "投稿你的摘要或靈感，我們會挑選製作成共用模板。",
		"zh-Hans": "提交你的报告摘要，或把灵感发给我们，我们会把优质案例制作成模板，供所有投资人快速复用。",
	},
	"gallery.inspired": {
		"en": "Inspired by Pixelcut × SeaArt × Agent Opus",
		"ja": "Pixelcut × SeaArt × Agent Opus から着想",
		"ko": "Pixelcut × SeaArt × Agent Opus 에서 영감을 받았습니다",
		"zh-Hant": "靈感來自 Pixelcut × SeaArt × Agent Opus",
		"zh-Hans": "灵感来自 Pixelcut × SeaArt × Agent Opus",
	},
	"auth.email.invalid": {
		"en": "Please enter a valid email so we can send the report.",
		"ja": "レポートを送付できるよう、有効なメールアドレスを入力してください。",
		"ko": "리포트를 보내드릴 수 있도록 유효한 이메일을 입력해주세요.",
		"zh-Hant": "請輸入有效的電子郵件，我們會把報告寄到此信箱。",
		"zh-Hans": "请输入有效的邮箱地址，我们将把首份报告发送至该邮箱。",
	},
	"auth.signup.success": {
		"en": "Magic link sent. Please check your inbox to continue.",
		"ja": "マジックリンクを送信しました。メールを確認してください。",
		"ko": "매직 링크를 전송했습니다. 메일함을 확인해주세요.",
		"zh-Hant": "已寄出登入連結，請前往信箱完成驗證。",
		"zh-Hans": "已发送登录链接，请到邮箱完成验证。",
	},
	"auth.success.magicLink": {
		"en": "Magic link sent. Check your inbox to proceed.",
		"ja": "マジックリンクを送信しました。受信箱をご確認ください。",
		"ko": "매직 링크를 보냈습니다. 메일함을 확인해 주세요.",
		"zh-Hant": "已將登入連結寄到你的信箱，請盡快完成驗證。",
		"zh-Hans": "登录链接已发送至邮箱，请尽快完成验证。",
	},
	"auth.signup.error": {
		"en": "We couldn't send the email. Please try again or use Google Sign-In.",
		"ja": "メールを送信できませんでした。もう一度お試しになるか、Google ログインをご利用ください。",
		"ko": "이메일을 보낼 수 없습니다. 다시 시도하거나 Google 로그인으로 진행해 주세요。",
		"zh-Hant": "無法寄出登入郵件，請重試或改用 Google 登入。",
		"zh-Hans": "暂时无法发送邮件，请重试或改用 Google 登录。",
	},
	"auth.error.generic": {
		"en": "Login failed. Please try again or switch a provider.",
		"ja": "ログインに失敗しました。別の方法でお試しください。",
		"ko": "로그인에 실패했습니다. 다른 방식으로 다시 시도해 주세요.",
		"zh-Hant": "登入失敗，請重試或改用其他方式。",
		"zh-Hans": "登录失败，请重试或更换其它方式。",
	},
	"auth.cta.button": {
		"en": "Login / Sign up",
		"ja": "ログイン / 登録",
		"ko": "로그인 / 가입",
		"zh-Hant": "登入 / 註冊",
		"zh-Hans": "登录 / 注册",
	},
	"auth.cta.remaining": {
		"en": "Left {{count}}",
		"ja": "残り {{count}} 件",
		"ko": "잔여 {{count}} 건",
		"zh-Hant": "剩餘 {{count}} 份",
		"zh-Hans": "剩余 {{count}} 份",
	},
	"auth.session.fallback": {
		"en": "Signed in",
		"ja": "ログイン中",
		"ko": "로그인됨",
		"zh-Hant": "已登入",
		"zh-Hans": "已登录",
	},
	"auth.session.loginButton": {
		"en": "Email login (beta)",
		"ja": "メールログイン（ベータ）",
		"ko": "이메일 로그인 (베타)",
		"zh-Hant": "電子郵件登入（測試版）",
		"zh-Hans": "邮箱登录（测试版）",
	},
	"auth.page.title": {
		"en": "Login or Register",
		"ja": "ログイン / 登録",
		"ko": "로그인 또는 가입",
		"zh-Hant": "登入或註冊",
		"zh-Hans": "登录或注册",
	},
	"auth.page.subtitle": {
		"en": "Use a trusted account to get started instantly.",
		"ja": "お好きなアカウントですぐに開始できます。",
		"ko": "신뢰할 수 있는 계정으로 바로 시작하세요.",
		"zh-Hant": "使用第三方帳號快速啟動，或改用電子郵件。",
		"zh-Hans": "用第三方账号快速开始，或改用邮箱继续。",
	},
	"auth.google.button": {
		"en": "Continue with Google",
		"ja": "Google で続行",
		"ko": "Google로 계속하기",
		"zh-Hant": "使用 Google 登入",
		"zh-Hans": "使用 Google 登录",
	},
	"auth.provider.google": {
		"en": "Continue with Google",
		"ja": "Google で続行",
		"ko": "Google로 계속하기",
		"zh-Hant": "使用 Google 登入",
		"zh-Hans": "使用 Google 登录",
	},
	"auth.google.description": {
		"en": "Fastest verification channel. One click to unlock Investor AI.",
		"ja": "もっとも早い認証方法です。1 クリックで Investor AI にアクセスできます。",
		"ko": "가장 빠른 인증 방식입니다. 한 번 클릭으로 Investor AI를 사용하세요.",
		"zh-Hant": "最快速的驗證方式，一鍵解鎖 Investor AI。",
		"zh-Hans": "最快速的验证方式，一键解锁 Investor AI。",
	},
	"auth.provider.apple": {
		"en": "Continue with Apple",
		"ja": "Apple で続行",
		"ko": "Apple로 계속하기",
		"zh-Hant": "使用 Apple 登入",
		"zh-Hans": "使用 Apple 登录",
	},
	"auth.provider.microsoft": {
		"en": "Continue with Microsoft",
		"ja": "Microsoft で続行",
		"ko": "Microsoft로 계속하기",
		"zh-Hant": "使用 Microsoft 登入",
		"zh-Hans": "使用 Microsoft 登录",
	},
	"auth.email.button": {
		"en": "Continue",
		"ja": "続行",
		"ko": "계속하기",
		"zh-Hant": "繼續",
		"zh-Hans": "继续",
	},
	"cta.preview.note": {
		"en": "",
		"ja": "",
		"ko": "",
		"zh-Hant": "",
		"zh-Hans": "",
	},
	"auth.modal.title": {
		"en": "Sign up to unlock the first report",
		"ja": "登録して最初のレポートを受け取る",
		"ko": "가입하고 첫 리포트를 받아보세요",
		"zh-Hant": "註冊後即可領取首份免費報告",
		"zh-Hans": "注册后领取首份免费报告",
	},
	"auth.modal.description": {
		"en": "We'll email the report link and keep your quota synced.",
		"ja": "レポートのリンクをメールで送り、クォータも同期します。",
		"ko": "리포트 링크를 이메일로 보내고 쿼터를 동기화해 드립니다.",
		"zh-Hant": "我們會把報告連結寄到信箱並同步額度紀錄。",
		"zh-Hans": "我们会把报告链接发送到您的邮箱，并保留额度记录。",
	},
	"auth.modal.or": {
		"en": "or",
		"ja": "または",
		"ko": "또는",
		"zh-Hant": "或",
		"zh-Hans": "或",
	},
	"auth.modal.emailHint": {
		"en": "Prefer email? We'll send a magic link that expires in 10 minutes.",
		"ja": "メールで受け取りたい場合は、10 分で失効するマジックリンクを送ります。",
		"ko": "이메일을 선호한다면 10분 내 만료되는 매직 링크를 보내드립니다.",
		"zh-Hant": "若偏好 Email，我們會寄出 10 分鐘內有效的驗證連結。",
		"zh-Hans": "如果更习惯邮箱，我们会发送 10 分钟内有效的验证链接。",
	},
	"auth.form.loading": {
		"en": "Processing…",
		"ja": "処理中…",
		"ko": "처리 중…",
		"zh-Hant": "處理中…",
		"zh-Hans": "处理中…",
	},
	"auth.footer.prefix": {
		"en": "By continuing you agree to our",
		"ja": "続行すると、以下に同意したことになります：",
		"ko": "계속하면 다음에 동의하는 것입니다:",
		"zh-Hant": "登入代表你同意",
		"zh-Hans": "登录即表示你同意",
	},
	"auth.footer.connector": {
		"en": "and",
		"ja": "および",
		"ko": "및",
		"zh-Hant": "以及",
		"zh-Hans": "以及",
	},
	"auth.footer.terms": {
		"en": "Terms of Service",
		"ja": "利用規約",
		"ko": "서비스 약관",
		"zh-Hant": "服務條款",
		"zh-Hans": "服务条款",
	},
	"auth.footer.privacy": {
		"en": "Privacy Policy",
		"ja": "プライバシーポリシー",
		"ko": "개인정보 처리방침",
		"zh-Hant": "隱私政策",
		"zh-Hans": "隐私政策",
	},
	"auth.modal.close": {
		"en": "Close dialog",
		"ja": "ダイアログを閉じる",
		"ko": "창 닫기",
		"zh-Hant": "關閉視窗",
		"zh-Hans": "关闭注册弹窗",
	},
	"auth.form.email": {
		"en": "Email",
		"ja": "メールアドレス",
		"ko": "이메일",
		"zh-Hant": "電子郵件",
		"zh-Hans": "邮箱地址",
	},
	"auth.form.placeholder": {
		"en": "you@example.com",
		"ja": "you@example.com",
		"ko": "you@example.com",
		"zh-Hant": "you@example.com",
		"zh-Hans": "you@example.com",
	},
	"auth.form.submit": {
		"en": "Submit and start free trial",
		"ja": "送信して無料トライアルを開始",
		"ko": "제출하고 무료 체험 시작",
		"zh-Hant": "提交並開始免費體驗",
		"zh-Hans": "提交并开启免费体验",
	},
	"auth.account.label": {
		"en": "Account:",
		"ja": "アカウント：",
		"ko": "계정:",
		"zh-Hant": "目前帳號：",
		"zh-Hans": "当前账号：",
	},
	"auth.account.remaining": {
		"en": " · remaining:",
		"ja": " · 残り：",
		"ko": " · 잔여: ",
		"zh-Hant": " · 剩餘：",
		"zh-Hans": " · 剩余：",
	},
	"auth.account.signout": {
		"en": "Sign out / switch email",
		"ja": "サインアウト / メールを変更",
		"ko": "로그아웃 / 이메일 변경",
		"zh-Hant": "登出 / 更換信箱",
		"zh-Hans": "退出账号 / 切换邮箱",
	},
	"quota.status.badge": {
		"en": "Left {{count}}",
		"ja": "残り {{count}} 件",
		"ko": "잔여 {{count}} 건",
		"zh-Hant": "剩餘 {{count}} 份",
		"zh-Hans": "剩余 {{count}} 份",
	},
	"quota.status.heading": {
		"en": "Quota left: {{count}}",
		"ja": "残りクォータ：{{count}}",
		"ko": "남은 쿼터: {{count}}",
		"zh-Hant": "剩餘 {{count}} 份額度",
		"zh-Hans": "Quota left: {{count}}",
	},
	"quota.status.detail": {
		"en": "Account {{email}} · used {{used}}",
		"ja": "アカウント {{email}} · 使用済み {{used}} 件",
		"ko": "계정 {{email}} · 사용 {{used}} 건",
		"zh-Hant": "帳號 {{email}} · 已使用 {{used}} 份",
		"zh-Hans": "账号 {{email}} · 已使用 {{used}} 份",
	},
	"quota.plan.free": {
		"en": "free plan",
		"ja": "無料プラン",
		"ko": "무료 플랜",
		"zh-Hant": "免費方案",
		"zh-Hans": "免费方案",
	},
	"quota.status.session": {
		"en": "{{email}} · plan: {{plan}}",
		"ja": "{{email}} · プラン: {{plan}}",
		"ko": "{{email}} · 플랜: {{plan}}",
		"zh-Hant": "{{email}} · 方案：{{plan}}",
		"zh-Hans": "{{email}} · 方案：{{plan}}",
	},
	"error.submit.generic": {
		"en": "Server returned an error. Please try again or switch to another ticker.",
		"ja": "サーバーでエラーが発生しました。しばらくしてから、もしくは別のティッカーで再試行してください。",
		"ko": "서버에서 오류가 발생했습니다. 잠시 후 다시 시도하거나 다른 티커로 시도해 주세요.",
		"zh-Hant": "生成報告時伺服器出錯，請稍後重試或更換其他股票代碼。",
		"zh-Hans": "生成报告时服务器返回了错误，请稍后再试，或更换其他股票代码。",
	},
	"report.docx.fallbackTitle": {
		"en": "# [Investor AI] {{company}} ({{symbol}}) Investment Analysis Report",
		"ja": "# 【Investor AI】{{company}} ({{symbol}}) 投資分析レポート",
		"ko": "# [Investor AI] {{company}} ({{symbol}}) 투자 분석 리포트",
		"zh-Hant": "# 【Investor AI】{{company}} ({{symbol}}) 投資分析報告",
		"zh-Hans": "# 【Investor AI】{{company}} ({{symbol}}) 投资分析报告",
	},
	"generator.account.status": {
		"en": "Remaining quota · {{count}}",
		"ja": "残りクォータ：{{count}}",
		"ko": "남은 쿼터 · {{count}}",
		"zh-Hant": "當前免費額度：{{count}}",
		"zh-Hans": "当前免费额度：{{count}}",
	},
	"generator.account.cta": {
		"en": "Sign in to unlock structured reports and track your quota.",
		"ja": "ログインして構造化レポートとクォータ管理を有効化してください。",
		"ko": "로그인하면 구조화 리포트와 쿼터 관리를 사용할 수 있습니다.",
		"zh-Hant": "登入即可啟用結構化報告與額度管理。",
		"zh-Hans": "登录后即可生成结构化报告并同步额度。",
	},
	"disclaimer.source": {
		"en": "Powered by Finnhub + OpenRouter. Reports are for education only—",
		"ja": "Finnhub + OpenRouter 連携。レポートは教育目的です—",
		"ko": "Finnhub + OpenRouter 연동. 리포트는 교육용입니다—",
		"zh-Hant": "已接入 Finnhub + OpenRouter，內容僅供學習與資訊參考，",
		"zh-Hans": "当前：已接入 Finnhub + OpenRouter。报告仅用于学习和信息参考，",
	},
	"disclaimer.warning": {
		"en": "not investment advice.",
		"ja": "投資助言ではありません。",
		"ko": "투자 조언이 아닙니다.",
		"zh-Hant": "不構成任何投資建議。",
		"zh-Hans": "不构成任何投资建议。",
	},
	"footer.disclaimer": {
		"en": "This tool is for learning, research, and information organization only. No investment advice or securities business is provided.",
		"ja": "本ツールは学習・リサーチ・情報整理のみを目的としており、投資助言や証券関連業務は提供しません。",
		"ko": "이 도구는 학습·연구·정보 정리를 위한 것이며, 투자 조언이나 증권 관련 서비스를 제공하지 않습니다.",
		"zh-Hant": "本工具僅供學習、研究與資訊整理，不提供任何投資建議，也不開展證券、期貨、基金等業務。",
		"zh-Hans": "本工具仅用于学习、研究与信息整理，不提供任何投资建议，不开展证券、期货、基金等业务。",
	},
	"alert.error.title": {
		"en": "Error",
		"ja": "エラー",
		"ko": "오류",
		"zh-Hant": "出錯啦",
		"zh-Hans": "出错啦",
	},
	"report.quota.remaining": {
		"en": "Remaining quota:",
		"ja": "残りクォータ：",
		"ko": "남은 쿼터:",
		"zh-Hant": "當前帳號剩餘免費額度：",
		"zh-Hans": "当前账号剩余免费额度：",
	},
	"workflow.status.step": {
		"en": "Progress · step {{step}}",
		"ja": "進捗 · 第 {{step}} ステップ",
		"ko": "진행 상황 · {{step}} 단계",
		"zh-Hant": "當前進度 · 第 {{step}} 步",
		"zh-Hans": "当前进度 · 第 {{step}} 步",
	},
	"workflow.status.syncing": {
		"en": "Syncing data / generating…",
		"ja": "データ同期 / 生成中…",
		"ko": "데이터 동기화 / 생성 중…",
		"zh-Hant": "正在同步資料 / 生成中…",
		"zh-Hans": "正在同步数据/生成中…",
	},
	"workflow.status.ready": {
		"en": "Report ready—copy/export available.",
		"ja": "レポートが完成。コピー／書き出しできます。",
		"ko": "리포트가 완료되었습니다. 복사/내보내기가 가능합니다.",
		"zh-Hant": "報告已完成，可複製或導出。",
		"zh-Hans": "报告已完成，可复制/导出。",
	},
	"workflow.status.idle": {
		"en": "Enter a ticker to start.",
		"ja": "ティッカーを入力して開始してください。",
		"ko": "티커를 입력하면 시작합니다.",
		"zh-Hant": "等待輸入股票代碼以開始生成。",
		"zh-Hans": "等待输入股票代码开始生成。",
	},
	"error.submit.empty": {
		"en": "Please enter a US ticker such as NVDA / TSLA / AAPL.",
		"ja": "まず NVDA / TSLA / AAPL のような米国ティッカーを入力してください。",
		"ko": "먼저 NVDA / TSLA / AAPL 같은 미국 티커를 입력해주세요.",
		"zh-Hant": "請先輸入美股代碼，例如：NVDA / TSLA / AAPL。",
		"zh-Hans": "请先输入美股代码，例如：NVDA / TSLA / AAPL。",
	},
	"error.submit.format": {
		"en": "That doesn't look like a standard ticker. Pick from search results or input letters only (e.g. NVDA / TSLA / AAPL).",
		"ja": "標準的なティッカーではないようです。検索結果から選ぶか、英字のみで入力してください (例: NVDA / TSLA / AAPL)。",
		"ko": "표준 티커 형식이 아닌 것 같습니다. 검색 결과에서 선택하거나 영문 문자만 입력하세요 (예: NVDA / TSLA / AAPL).",
		"zh-Hant": "看起來不像標準美股代碼。請改為從搜尋結果選擇，或僅輸入字母（例：NVDA / TSLA / AAPL）。",
		"zh-Hans": "当前输入看起来不是标准美股代码。请先从下方搜索结果中选择公司，或只输入字母的股票代码（例如：NVDA / TSLA / AAPL）。",
	},
	"error.submit.notFound": {
		"en": "No valid company found for this ticker. Double-check the symbol such as NVDA / TSLA / AAPL.",
		"ja": "このティッカーに該当する企業が見つかりません。NVDA / TSLA / AAPL などを参考に再確認してください。",
		"ko": "해당 티커로 조회되는 기업이 없습니다. NVDA / TSLA / AAPL 등과 같이 기호를 다시 확인해주세요.",
		"zh-Hant": "資料來源中找不到此代碼的公司，請再次確認（例如：NVDA / TSLA / AAPL）。",
		"zh-Hans": "未在数据源中找到该股票的有效信息，请确认代码是否正确，例如：NVDA / TSLA / AAPL。",
	},
	"error.submit.network": {
		"en": "Network or server error. Check your connection and try again.",
		"ja": "ネットワークまたはサーバーエラーです。接続を確認してから再試行してください。",
		"ko": "네트워크 또는 서버 오류입니다. 연결 상태를 확인한 뒤 다시 시도해주세요.",
		"zh-Hant": "網路或伺服器異常，請檢查連線後再試。",
		"zh-Hans": "网络错误或服务器异常，请检查网络或稍后重试。",
	},
	"report.keyInsights.title": {
		"en": "Key Insights",
		"ja": "主要インサイト",
		"ko": "핵심 인사이트",
		"zh-Hant": "關鍵洞察",
		"zh-Hans": "关键洞察",
	},
	"report.keyInsights.subtitle": {
		"en": "Investor AI Highlights",
		"ja": "Investor AI ハイライト",
		"ko": "Investor AI 하이라이트",
		"zh-Hant": "Investor AI 快速摘要",
		"zh-Hans": "Investor AI 快速摘要",
	},
	"report.template.title": {
		"en": "Persona Info",
		"ja": "テンプレート情報",
		"ko": "페르소나 정보",
		"zh-Hant": "模板資訊",
		"zh-Hans": "模板信息",
	},
	"report.template.description": {
		"en": "This report was generated with the selected persona. Switch templates above to change the tone.",
		"ja": "このレポートは選択中のテンプレートで生成されています。上部で切り替えるとトーンも変化します。",
		"ko": "이 리포트는 선택한 페르소나로 생성되었습니다. 상단에서 템플릿을 바꾸면 어조가 달라집니다.",
		"zh-Hant": "本報告採用上述模板生成，如需切換語氣或產業重點，可於上方重新選擇。",
		"zh-Hans": "该报告使用上述模板生成。如需切换语气或行业重点，可在上方模板选择器中重新生成。",
	},
	"report.meta": {
		"en": "Report generated for {{symbol}} (education only, not investment advice).",
		"ja": "{{symbol}} 向けに生成されたレポートです（教育目的のみ、投資助言ではありません）。",
		"ko": "{{symbol}} 종목을 위한 리포트입니다 (교육용, 투자 조언 아님).",
		"zh-Hant": "本報告基於代碼 {{symbol}} 生成（僅作教育用途，不構成投資建議）。",
		"zh-Hans": "报告基于代码：{{symbol}} 生成（仅教育用途，不构成投资建议）。",
	},
	"report.tip.title": {
		"en": "Report tip",
		"ja": "レポートのヒント",
		"ko": "리포트 팁",
		"zh-Hant": "報告提示",
		"zh-Hans": "报告提示",
	},
	"report.tip.body": {
		"en": "Enter a ticker, pick a persona, and click generate so the AI can craft the report; this card explains that flow and will swap with the output once ready.",
		"ja": "ティッカーを入力し、テンプレートを選んで生成を押すとAIレポートが出来上がります。このカードがその手順を案内し、完了後は出力とコピー／エクスポート操作に切り替わります。",
		"ko": "티커를 입력하고 페르소나를 고른 다음 생성을 누르면 AI 리포트가 만들어집니다. 이 카드가 그 흐름을 안내하며 완료되면 리포트와 복사/내보내기 기능으로 교체됩니다。",
		"zh-Hant": "輸入代碼、選擇模板，點擊「生成」讓 AI 整理出報告。這個提示會說明步驟，報告一生成即替換成輸出與複製/匯出操作。",
		"zh-Hans": "选择模板、输入代码，点击“生成 AI 投研报告”。完成后即可复制/导出Word。",
	},
	"report.tip.action": {
		"en": "Follow the steps above to start the generation; after the report finishes, this same card will host the copy/export buttons.",
		"ja": "上の手順で生成を開始すると、レポート完成後はこのカード内にコピーとエクスポートのボタンが収まります。",
		"ko": "위 과정을 따라 생성시키면 리포트 완성 후 이 카드에서 복사와 내보내기 버튼을 사용할 수 있습니다。",
		"zh-Hant": "照著上述步驟觸發生成後，報告完成時這裡會出現複製與匯出按鈕。",
		"zh-Hans": "按照上述步骤触发生成后，报告完成时此处会出现复制与导出按钮。",
	},
	"report.debug": {
		"en": "View raw data used for generation (debug)",
		"ja": "生成に用いた生データを表示 (デバッグ)",
		"ko": "생성에 사용된 원본 데이터를 보기 (디버그)",
		"zh-Hant": "檢視用於生成的原始資料（除錯）",
		"zh-Hans": "查看用于生成报告的原始数据（调试用）",
	},
	"report.disclaimerNotice": {
		"en": "This report is generated by CodeX's structured analysis engine, blending multi-source market information and public disclosures. Data may lag or be incomplete; content is for study/reference only and never serves as investment advice.",
		"ja": "本レポートは CodeX の構造化分析エンジンが複数の市場データと公開開示を統合し自動生成したものです。データには遅延や欠損があり得るため、学習・参考目的にのみ用い、投資助言とはみなさないでください。",
		"ko": "이 리포트는 CodeX 구조화 분석 엔진이 여러 시장 정보와 공개 공시를 통합해 자동 생성한 것입니다. 데이터는 지연되거나 불완전할 수 있으므로 학습·참고 용도로만 사용하시고, 투자 조언으로 보지 마십시오.",
		"zh-Hant": "本報告由 CodeX 的結構化分析系統整合多源市場資訊與公開揭露後自動整理生成。數據可能存在延遲或不完整，僅供學習與參考，不構成任何投資建議。",
		"zh-Hans": "本报告基于 CodeX 的结构化分析体系整合多源市场数据及公开披露信息自动生成。数据可能存在延迟或不完整，仅用于学习与参考，不构成任何投资建议。",
	},
	"footer.dataSource": {
		"en": "Market information is sourced from multiple third-party providers; accuracy and timeliness remain with the respective vendors.",
		"ja": "市場情報は複数の第三者プロバイダーから取得しており、その正確性・タイムリーさは各提供者の責任に帰属します。",
		"ko": "시장 정보는 여러 제3자 제공사로부터 수집되며, 정확성과 시의성은 각 제공사에 귀속됩니다.",
		"zh-Hant": "市場資訊由多家境內外第三方資訊商提供，最終準確性與時效性由相應提供方負責。",
		"zh-Hans": "数据来自若干境内外第三方市场信息提供方，最终准确性由相应提供方负责。",
	},
	"report.loginReminder": {
		"en": "Sign in to keep quota and persona selections aligned.",
		"ja": "サインインするとクォータやテンプレートの選択が保存されます。",
		"ko": "로그인하면 쿼터와 템플릿 선택이 유지됩니다.",
		"zh-Hant": "登入後可同步保留額度與模板選擇。",
		"zh-Hans": "登录可保存额度与模板选择记录，保持体验一致。",
	},
	"workflow.step.status.running": {
		"en": "In progress",
		"ja": "進行中",
		"ko": "진행 중",
		"zh-Hant": "進行中",
		"zh-Hans": "进行中",
	},
	"workflow.step.status.done": {
		"en": "Done",
		"ja": "完了",
		"ko": "완료",
		"zh-Hant": "已完成",
		"zh-Hans": "已完成",
	},
	"alert.copy.missing": {
		"en": "No report content to copy.",
		"ja": "コピーするレポート内容がありません。",
		"ko": "복사할 리포트 내용이 없습니다.",
		"zh-Hant": "找不到可複製的報告內容。",
		"zh-Hans": "无法找到报告内容进行复制。",
	},
	"alert.copy.success": {
		"en": "Report copied to clipboard!",
		"ja": "レポートをクリップボードにコピーしました！",
		"ko": "리포트가 클립보드에 복사되었습니다!",
		"zh-Hant": "報告已複製到剪貼簿！",
		"zh-Hans": "报告已复制到剪贴板！",
	},
	"alert.copy.fallback": {
		"en": "Report copied (fallback mode).",
		"ja": "レポートをコピーしました（フォールバックモード）。",
		"ko": "리포트가 복사되었습니다(호환 모드).",
		"zh-Hant": "報告（含格式）複製成功（回退模式）",
		"zh-Hans": "报告（带格式）复制成功！(回退模式)",
	},
	"alert.copy.error": {
		"en": "Copy failed—your browser may not support rich clipboard, try manual copy.",
		"ja": "コピーできませんでした。リッチクリップボード非対応の可能性があるため、手動コピーを試してください。",
		"ko": "복사에 실패했습니다. 브라우저가 리치 클립보드를 지원하지 않을 수 있으니 수동 복사를 시도하세요.",
		"zh-Hant": "複製失敗，瀏覽器可能不支援富文本，可改用手動複製。",
		"zh-Hans": "复制失败，您的浏览器可能不支持富文本复制，请尝试手动复制纯文本内容。",
	},
	"alert.export.missing": {
		"en": "No report to export.",
		"ja": "書き出すレポートがありません。",
		"ko": "내보낼 리포트가 없습니다.",
		"zh-Hant": "沒有報告內容可供匯出。",
		"zh-Hans": "没有报告内容可以导出。",
	},
	"alert.export.success": {
		"en": "Report exported as Word (.docx).",
		"ja": "レポートを Word (.docx) で書き出しました。",
		"ko": "리포트를 Word (.docx) 파일로 내보냈습니다.",
		"zh-Hant": "報告已成功匯出為 Word (.docx)！",
		"zh-Hans": "报告已成功导出为 Word (.docx) 文件！",
	},
	"alert.export.error": {
		"en": "DOCX export failed—check the content or try again later.",
		"ja": "DOCX の書き出しに失敗しました。内容を確認してから再試行してください。",
		"ko": "DOCX 내보내기에 실패했습니다. 내용을 확인하거나 잠시 후 다시 시도하세요.",
		"zh-Hant": "DOCX 匯出失敗，請檢查內容或稍後再試。",
		"zh-Hans": "DOCX 导出失败，请检查报告内容或稍后再试。",
	},
	"report.action.copy": {
		"en": "📋 Copy report",
		"ja": "📋 レポートをコピー",
		"ko": "📋 리포트 복사",
		"zh-Hant": "📋 複製報告",
		"zh-Hans": "📋 复制报告",
	},
	"report.action.export": {
		"en": "⬇️ Export Word (.docx)",
		"ja": "⬇️ Word (.docx) に書き出す",
		"ko": "⬇️ Word (.docx) 내보내기",
		"zh-Hant": "⬇️ 匯出 Word (.docx)",
		"zh-Hans": "⬇️ 导出 Word (.docx)",
	},
	"report.action.exporting": {
		"en": "Exporting…",
		"ja": "書き出し中…",
		"ko": "내보내는 중…",
		"zh-Hant": "匯出中…",
		"zh-Hans": "导出中...",
	},
} as const satisfies Record<string, TranslationEntry>;

export type TranslationKey = keyof typeof translations;


type LanguageContextValue = {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: (key: TranslationKey, vars?: Record<string, string>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "investor-ai-language";
function interpolate(template: string, vars?: Record<string, string>) {
	if (!vars) return template;
	return template.replace(/\{\{(.*?)\}\}/g, (_, key) => vars[key.trim()] ?? "");
}

function isLanguage(value: string | null): value is Language {
	return value !== null && LANGUAGE_ORDER.includes(value as Language);
}

function normalizeLanguage(value: string | null): Language | null {
	if (!value) return null;
	if (value === "zh") return "zh-Hans";
	return isLanguage(value) ? (value as Language) : null;
}

function detectBrowserLanguage(): Language | null {
	if (typeof window === "undefined") return null;
	const locale = window.navigator.language.toLowerCase();
	if (locale.startsWith("ja")) return "ja";
	if (locale.startsWith("ko")) return "ko";
	if (locale.startsWith("zh")) {
		if (locale.includes("tw") || locale.includes("hk") || locale.includes("mo") || locale.includes("hant")) {
			return "zh-Hant";
		}
		return "zh-Hans";
	}
	return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
	const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const saved = normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
		if (saved) {
			startTransition(() => {
				setLanguageState(saved);
			});
			return;
		}
		const resolved = detectBrowserLanguage();
		if (!resolved) return;
		if (CHINESE_VARIANTS.includes(resolved)) return;
		if (resolved === DEFAULT_LANGUAGE) return;
		startTransition(() => {
			setLanguageState(resolved);
		});
		window.localStorage.setItem(STORAGE_KEY, resolved);
	}, []);

	const setLanguage = (lang: Language) => {
		setLanguageState(lang);
		if (typeof window !== "undefined") {
			window.localStorage.setItem(STORAGE_KEY, lang);
		}
	};

	const value = useMemo(() => {
		return {
			language,
			setLanguage,
			t: (key: TranslationKey, vars?: Record<string, string>) => {
				const entry = translations[key];
				const template = entry?.[language] ?? entry?.en ?? key;
				return interpolate(template, vars);
			},
		};
	}, [language]);

	return (
		<LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
	);
}

export function useLanguage() {
	const ctx = useContext(LanguageContext);
	if (!ctx) {
		throw new Error("useLanguage must be used within LanguageProvider");
	}
	return ctx;
}
