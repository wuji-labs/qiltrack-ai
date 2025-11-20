export type CompanyProfile = {
	name?: string;
	ticker?: string;
	exchange?: string;
	finnhubIndustry?: string;
	country?: string;
	currency?: string;
	ipo?: string;
	marketCapitalization?: number;
	weburl?: string;
};

export type CompanyQuote = {
	current?: number;
	change?: number;
	changePercent?: number;
	high?: number;
	low?: number;
	open?: number;
	prevClose?: number;
	timestamp?: number;
};

export type CompanyMetrics = {
	peTTM?: number;
	psTTM?: number;
	pbAnnual?: number;
	revenueGrowth3Y?: number;
	revenueGrowth5Y?: number;
	epsGrowth3Y?: number;
	epsGrowth5Y?: number;
	currentRatioQuarterly?: number;
	quickRatioAnnual?: number;
	roeTTM?: number;
	roaRfy?: number;
	dividendYieldIndicatedAnnual?: number;
	"52WeekHigh"?: number;
	"52WeekLow"?: number;
};

export type CompanyNewsItem = {
	category?: string;
	datetime?: number;
	headline?: string;
	id?: number;
	image?: string;
	related?: string;
	source?: string;
	summary?: string;
	url?: string;
};

export type CompanyData = {
	symbol: string;
	profile: CompanyProfile;
	quote: CompanyQuote;
	metrics: CompanyMetrics;
	recentNews: CompanyNewsItem[];
};

export type ReportResponse = {
	symbol: string;
	report: string;
	companyData: CompanyData;
	remainingQuota?: number;
};

export type SearchResult = {
	symbol: string;
	description: string;
	displaySymbol?: string;
	type?: string;
};

export type ReportTone = "baseline" | "buffett" | "musk" | "muddy";
