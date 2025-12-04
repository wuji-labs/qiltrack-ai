/**
 * Industry-based cover gradient mappings
 * Maps report themes/industries to visually distinct gradient backgrounds
 */

export type IndustryTheme =
  | "Cloud + AI"
  | "Semiconductor"
  | "Defense & Aerospace"
  | "Mobility"
  | "Healthtech"
  | "Media"
  | "Fintech"
  | "Energy"
  | "Retail"
  | "General";

/**
 * Gradient definitions for each industry
 * Each gradient is designed to be visually distinct and professional
 */
export const industryGradients: Record<IndustryTheme, string> = {
  // Cloud + AI - Deep blue tech feel
  "Cloud + AI":
    "linear-gradient(135deg, rgba(20,100,150,0.85), rgba(50,140,200,0.75))",

  // Semiconductor - NVIDIA-style green (as shown in q24.png)
  Semiconductor:
    "linear-gradient(135deg, rgba(30,80,30,0.9), rgba(100,180,50,0.75))",

  // Defense & Aerospace - Military orange/red
  "Defense & Aerospace":
    "linear-gradient(135deg, rgba(180,60,20,0.85), rgba(220,120,60,0.75))",

  // Mobility - Purple/magenta for automotive/EV
  Mobility:
    "linear-gradient(135deg, rgba(80,30,100,0.9), rgba(180,100,200,0.75))",

  // Healthtech - Teal/cyan medical feel
  Healthtech:
    "linear-gradient(135deg, rgba(20,120,120,0.85), rgba(100,200,180,0.75))",

  // Media - Deep red entertainment
  Media:
    "linear-gradient(135deg, rgba(180,20,20,0.85), rgba(100,50,50,0.75))",

  // Fintech - Gold/amber financial
  Fintech:
    "linear-gradient(135deg, rgba(150,100,30,0.85), rgba(200,160,80,0.75))",

  // Energy - Orange/yellow power
  Energy:
    "linear-gradient(135deg, rgba(200,100,20,0.85), rgba(255,180,50,0.75))",

  // Retail - Purple commerce
  Retail:
    "linear-gradient(135deg, rgba(100,50,150,0.85), rgba(180,100,220,0.75))",

  // General/Default - Neutral dark
  General:
    "linear-gradient(135deg, rgba(40,40,40,0.85), rgba(80,100,80,0.75))",
};

/**
 * Symbol to industry mapping for common stocks
 * Used when theme is not explicitly provided
 */
export const symbolIndustryMap: Record<string, IndustryTheme> = {
  // Cloud + AI
  MSFT: "Cloud + AI",
  GOOGL: "Cloud + AI",
  GOOG: "Cloud + AI",
  AMZN: "Cloud + AI",
  META: "Cloud + AI",
  AAPL: "Cloud + AI",
  CRM: "Cloud + AI",
  SNOW: "Cloud + AI",
  DDOG: "Cloud + AI",
  CRWD: "Cloud + AI",
  PLTR: "Cloud + AI",
  AI: "Cloud + AI",
  PATH: "Cloud + AI",
  MDB: "Cloud + AI",
  NET: "Cloud + AI",
  ZS: "Cloud + AI",
  PANW: "Cloud + AI",
  OKTA: "Cloud + AI",
  TWLO: "Cloud + AI",
  DOCU: "Cloud + AI",

  // Semiconductor
  NVDA: "Semiconductor",
  AMD: "Semiconductor",
  INTC: "Semiconductor",
  TSM: "Semiconductor",
  QCOM: "Semiconductor",
  AVGO: "Semiconductor",
  TXN: "Semiconductor",
  MU: "Semiconductor",
  MRVL: "Semiconductor",
  SMCI: "Semiconductor",
  AMAT: "Semiconductor",
  LRCX: "Semiconductor",
  KLAC: "Semiconductor",
  ASML: "Semiconductor",
  ARM: "Semiconductor",
  SSNLF: "Semiconductor",
  ON: "Semiconductor",
  ADI: "Semiconductor",

  // Defense & Aerospace
  RTX: "Defense & Aerospace",
  LMT: "Defense & Aerospace",
  NOC: "Defense & Aerospace",
  GD: "Defense & Aerospace",
  BA: "Defense & Aerospace",
  HII: "Defense & Aerospace",
  LHX: "Defense & Aerospace",
  LDOS: "Defense & Aerospace",

  // Mobility / Automotive
  TSLA: "Mobility",
  RIVN: "Mobility",
  LCID: "Mobility",
  NIO: "Mobility",
  XPEV: "Mobility",
  LI: "Mobility",
  GM: "Mobility",
  F: "Mobility",
  TM: "Mobility",
  BYDDY: "Mobility",
  UBER: "Mobility",
  LYFT: "Mobility",
  GRAB: "Mobility",

  // Healthtech / Biotech
  NVAX: "Healthtech",
  MRNA: "Healthtech",
  PFE: "Healthtech",
  JNJ: "Healthtech",
  LLY: "Healthtech",
  NVO: "Healthtech",
  NOVO: "Healthtech",
  UNH: "Healthtech",
  ABBV: "Healthtech",
  AMGN: "Healthtech",
  GILD: "Healthtech",
  VRTX: "Healthtech",
  REGN: "Healthtech",
  BMY: "Healthtech",
  BIIB: "Healthtech",
  ISRG: "Healthtech",
  DXCM: "Healthtech",
  TDOC: "Healthtech",

  // Media / Entertainment
  NFLX: "Media",
  DIS: "Media",
  WBD: "Media",
  PARA: "Media",
  CMCSA: "Media",
  SPOT: "Media",
  ROKU: "Media",
  TME: "Media",
  BILI: "Media",
  RBLX: "Media",
  TTWO: "Media",
  EA: "Media",
  ATVI: "Media",

  // Fintech
  COIN: "Fintech",
  SQ: "Fintech",
  PYPL: "Fintech",
  SOFI: "Fintech",
  UPST: "Fintech",
  AFRM: "Fintech",
  V: "Fintech",
  MA: "Fintech",
  AXP: "Fintech",
  GS: "Fintech",
  JPM: "Fintech",
  BAC: "Fintech",
  C: "Fintech",
  WFC: "Fintech",
  HOOD: "Fintech",
  NU: "Fintech",

  // Energy
  XOM: "Energy",
  CVX: "Energy",
  COP: "Energy",
  EOG: "Energy",
  SLB: "Energy",
  HAL: "Energy",
  BKR: "Energy",
  OXY: "Energy",
  ENPH: "Energy",
  SEDG: "Energy",
  FSLR: "Energy",
  RUN: "Energy",
  PLUG: "Energy",
  NEE: "Energy",

  // Retail
  WMT: "Retail",
  TGT: "Retail",
  COST: "Retail",
  HD: "Retail",
  LOW: "Retail",
  BABA: "Retail",
  JD: "Retail",
  PDD: "Retail",
  MELI: "Retail",
  SE: "Retail",
  SHOP: "Retail",
  ETSY: "Retail",
  EBAY: "Retail",
  NKE: "Retail",
  LULU: "Retail",
};

/**
 * Get the gradient for a given theme or symbol
 * @param theme - The industry theme
 * @param symbol - Optional stock symbol for fallback lookup
 * @returns CSS gradient string
 */
export function getIndustryGradient(
  theme?: string | null,
  symbol?: string | null
): string {
  // First try to match by theme
  if (theme && theme in industryGradients) {
    return industryGradients[theme as IndustryTheme];
  }

  // Then try to match by symbol
  if (symbol) {
    const upperSymbol = symbol.toUpperCase();
    if (upperSymbol in symbolIndustryMap) {
      const mappedTheme = symbolIndustryMap[upperSymbol];
      return industryGradients[mappedTheme];
    }
  }

  // Default to General
  return industryGradients.General;
}

/**
 * Get full cover style with gradient overlay
 * @param theme - The industry theme
 * @param symbol - Optional stock symbol
 * @param imageUrl - Optional background image URL
 * @returns CSS background value
 */
export function getIndustryCover(
  theme?: string | null,
  symbol?: string | null,
  imageUrl?: string | null
): string {
  const gradient = getIndustryGradient(theme, symbol);

  if (imageUrl) {
    // If image URL provided, overlay gradient on top
    if (imageUrl.startsWith("url(")) {
      return `${gradient}, ${imageUrl}`;
    }
    return `${gradient}, url('${imageUrl}')`;
  }

  // Just the gradient if no image
  return gradient;
}

/**
 * Get industry theme from symbol
 * @param symbol - Stock symbol
 * @returns IndustryTheme or "General" if not found
 */
export function getIndustryFromSymbol(symbol: string): IndustryTheme {
  const upperSymbol = symbol.toUpperCase();
  return symbolIndustryMap[upperSymbol] || "General";
}
