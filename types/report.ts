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
  reportRunId?: string;
};

export type SearchResult = {
  symbol: string;
  description: string;
  displaySymbol?: string;
  type?: string;
};

export type ReportTone = "baseline" | "buffett" | "musk" | "muddy";

export type ReportSummary = {
  symbol: string;
  title: string;
  snippet: string;
  date: string;
  author: string;
  theme: string;
  url: string;
  tags: string[];
  cover: string;
  readTime: string;
  body: string[];
};

export type SimilarReport = {
  report_run_id: string;
  symbol: string;
  created_at: string;
  similarity: number;
};

export type ReportPost = {
  id?: string;
  slug: string;
  title: string;
  summary?: string | null;
  body?: string | string[] | null;
  cover?: string | null;
  theme?: string | null;
  tags?: string[];
  lang?: string | null;
  status?: "draft" | "published" | null;
  version?: number | null;
  author?: string | null;
  authorId?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  // snake_case fields returned by API
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  author_id?: string | null;
  cover_signed_url?: string | null;
};

export type ReportCard = {
  id?: string;
  slug: string;
  title: string;
  snippet: string;
  date: string;
  author: string;
  theme: string;
  tags: string[];
  cover: string;
  readTime: string;
  body: string[];
  lang?: string | null;
  status?: "draft" | "published" | null;
  version?: number | null;
};

export type ReportPagination = {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
};

export type ReportPostsResponse = {
  posts: ReportPost[];
  pagination: ReportPagination;
};

export type ReportPostResponse = {
  post: ReportPost;
};

export type AdminReportPostPayload = {
  id?: string;
  slug?: string;
  title?: string;
  summary?: string | null;
  body?: string | string[] | null;
  cover?: string | null;
  theme?: string | null;
  tags?: string[];
  lang?: string | null;
  status?: "draft" | "published" | null;
  version?: number | null;
  publishedAt?: string | null;
};

export type AdminUploadResult = {
  upload: {
    id: string;
    user_id: string;
    title: string;
    file_path: string;
    status: string;
    version: number | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  signedUrl: string;
};
