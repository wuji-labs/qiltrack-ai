#!/usr/bin/env python3
"""
批量生成标普500和纳斯达克100公司的多语言名称
使用Claude AI生成地道的中日韩文翻译
"""

import json

# 标普500前150家公司（按市值）+ 纳斯达克100公司
# 数据来源: slickcharts.com, 2025年数据
COMPANIES = [
    # 前50大市值公司
    ("NVDA", "NVIDIA Corporation"),
    ("MSFT", "Microsoft Corporation"),
    ("AAPL", "Apple Inc."),
    ("AMZN", "Amazon.com Inc."),
    ("GOOGL", "Alphabet Inc. Class A"),
    ("META", "Meta Platforms Inc."),
    ("AVGO", "Broadcom Inc."),
    ("BRK.B", "Berkshire Hathaway Inc. Class B"),
    ("TSLA", "Tesla Inc."),
    ("JPM", "JPMorgan Chase & Co."),
    ("WMT", "Walmart Inc."),
    ("LLY", "Eli Lilly and Company"),
    ("V", "Visa Inc."),
    ("ORCL", "Oracle Corporation"),
    ("NFLX", "Netflix Inc."),
    ("MA", "Mastercard Incorporated"),
    ("XOM", "Exxon Mobil Corporation"),
    ("COST", "Costco Wholesale Corporation"),
    ("PG", "The Procter & Gamble Company"),
    ("HD", "The Home Depot Inc."),
    ("ASML", "ASML Holding N.V."),
    ("TMO", "Thermo Fisher Scientific Inc."),
    ("ABBV", "AbbVie Inc."),
    ("CRM", "Salesforce Inc."),
    ("BAC", "Bank of America Corporation"),
    ("MRK", "Merck & Co. Inc."),
    ("CVX", "Chevron Corporation"),
    ("KO", "The Coca-Cola Company"),
    ("CSCO", "Cisco Systems Inc."),
    ("AMD", "Advanced Micro Devices Inc."),
    ("ACN", "Accenture plc"),
    ("LIN", "Linde plc"),
    ("MCD", "McDonald's Corporation"),
    ("ADBE", "Adobe Inc."),
    ("PEP", "PepsiCo Inc."),
    ("WFC", "Wells Fargo & Company"),
    ("PM", "Philip Morris International Inc."),
    ("GE", "General Electric Company"),
    ("IBM", "International Business Machines Corporation"),
    ("ABT", "Abbott Laboratories"),
    ("MS", "Morgan Stanley"),
    ("QCOM", "QUALCOMM Incorporated"),
    ("INTC", "Intel Corporation"),
    ("CAT", "Caterpillar Inc."),
    ("INTU", "Intuit Inc."),
    ("NOW", "ServiceNow Inc."),
    ("ISRG", "Intuitive Surgical Inc."),
    ("TXN", "Texas Instruments Incorporated"),
    ("PFE", "Pfizer Inc."),

    # 51-100
    ("CMCSA", "Comcast Corporation"),
    ("DIS", "The Walt Disney Company"),
    ("BKNG", "Booking Holdings Inc."),
    ("HON", "Honeywell International Inc."),
    ("UNH", "UnitedHealth Group Incorporated"),
    ("AMGN", "Amgen Inc."),
    ("LOW", "Lowe's Companies Inc."),
    ("NKE", "Nike Inc."),
    ("UNP", "Union Pacific Corporation"),
    ("SPGI", "S&P Global Inc."),
    ("BA", "The Boeing Company"),
    ("T", "AT&T Inc."),
    ("NEE", "NextEra Energy Inc."),
    ("TJX", "The TJX Companies Inc."),
    ("SCHW", "The Charles Schwab Corporation"),
    ("UPS", "United Parcel Service Inc."),
    ("DE", "Deere & Company"),
    ("GS", "The Goldman Sachs Group Inc."),
    ("BLK", "BlackRock Inc."),
    ("AXP", "American Express Company"),
    ("PLD", "Prologis Inc."),
    ("VRTX", "Vertex Pharmaceuticals Incorporated"),
    ("SYK", "Stryker Corporation"),
    ("MDT", "Medtronic plc"),
    ("GILD", "Gilead Sciences Inc."),
    ("CVS", "CVS Health Corporation"),
    ("ADP", "Automatic Data Processing Inc."),
    ("MMC", "Marsh & McLennan Companies Inc."),
    ("MDLZ", "Mondelez International Inc."),
    ("REGN", "Regeneron Pharmaceuticals Inc."),
    ("CI", "The Cigna Group"),
    ("BMY", "Bristol-Myers Squibb Company"),
    ("CB", "Chubb Limited"),
    ("TMUS", "T-Mobile US Inc."),
    ("SO", "The Southern Company"),
    ("C", "Citigroup Inc."),
    ("ZTS", "Zoetis Inc."),
    ("SLB", "Schlumberger Limited"),
    ("ETN", "Eaton Corporation plc"),
    ("EQIX", "Equinix Inc."),
    ("ADI", "Analog Devices Inc."),
    ("PGR", "The Progressive Corporation"),
    ("DUK", "Duke Energy Corporation"),
    ("BSX", "Boston Scientific Corporation"),
    ("FI", "Fiserv Inc."),
    ("BDX", "Becton Dickinson and Company"),
    ("EL", "The Estée Lauder Companies Inc."),
    ("LRCX", "Lam Research Corporation"),
    ("KLAC", "KLA Corporation"),

    # 101-150
    ("NOC", "Northrop Grumman Corporation"),
    ("MO", "Altria Group Inc."),
    ("AMAT", "Applied Materials Inc."),
    ("SNPS", "Synopsys Inc."),
    ("AON", "Aon plc"),
    ("SHW", "The Sherwin-Williams Company"),
    ("APH", "Amphenol Corporation"),
    ("HCA", "HCA Healthcare Inc."),
    ("PH", "Parker-Hannifin Corporation"),
    ("MCO", "Moody's Corporation"),
    ("CME", "CME Group Inc."),
    ("ICE", "Intercontinental Exchange Inc."),
    ("USB", "U.S. Bancorp"),
    ("ITW", "Illinois Tool Works Inc."),
    ("MSI", "Motorola Solutions Inc."),
    ("GM", "General Motors Company"),
    ("F", "Ford Motor Company"),
    ("CDNS", "Cadence Design Systems Inc."),
    ("TGT", "Target Corporation"),
    ("FDX", "FedEx Corporation"),
    ("COF", "Capital One Financial Corporation"),
    ("PYPL", "PayPal Holdings Inc."),
    ("CL", "Colgate-Palmolive Company"),
    ("NXPI", "NXP Semiconductors N.V."),
    ("TT", "Trane Technologies plc"),
    ("MRVL", "Marvell Technology Inc."),
    ("MELI", "MercadoLibre Inc."),
    ("MNST", "Monster Beverage Corporation"),
    ("MAR", "Marriott International Inc."),
    ("PANW", "Palo Alto Networks Inc."),
    ("HUM", "Humana Inc."),
    ("GD", "General Dynamics Corporation"),
    ("WM", "Waste Management Inc."),
    ("ROP", "Roper Technologies Inc."),
    ("CARR", "Carrier Global Corporation"),
    ("CCI", "Crown Castle Inc."),
    ("MCK", "McKesson Corporation"),
    ("ECL", "Ecolab Inc."),
    ("TRV", "The Travelers Companies Inc."),
    ("PSA", "Public Storage"),
    ("SRE", "Sempra"),
    ("AJG", "Arthur J. Gallagher & Co."),
    ("FTNT", "Fortinet Inc."),
    ("O", "Realty Income Corporation"),
    ("AZO", "AutoZone Inc."),
    ("FICO", "Fair Isaac Corporation"),
    ("NSC", "Norfolk Southern Corporation"),
    ("APD", "Air Products and Chemicals Inc."),
    ("WELL", "Welltower Inc."),
    ("EMR", "Emerson Electric Co."),
]

# 知名公司的标准中日韩文翻译（基于富途/老虎等券商）
KNOWN_TRANSLATIONS = {
    # 已存在的公司跳过（后面会从现有文件读取）
}

def generate_translations(symbol: str, name: str) -> dict:
    """
    为公司名称生成中日韩文翻译
    优先使用已知的标准翻译，否则生成合理的翻译
    """
    # 移除 Inc., Corporation, Company 等后缀
    clean_name = name
    for suffix in [" Inc.", " Corporation", " Company", " Co.", " plc", " N.V.", " Limited", " Group", " Incorporated", " Technologies", " International"]:
        clean_name = clean_name.replace(suffix, "")
    clean_name = clean_name.replace("The ", "").strip()

    # 已知翻译（这里只列举部分，完整列表太长）
    known = {
        "NVDA": {"zh": ["英伟达", "輝達"], "ja": ["エヌビディア"], "ko": ["엔비디아"]},
        "MSFT": {"zh": ["微软", "微軟"], "ja": ["マイクロソフト"], "ko": ["마이크로소프트"]},
        "AAPL": {"zh": ["苹果", "蘋果"], "ja": ["アップル"], "ko": ["애플"]},
        "AMZN": {"zh": ["亚马逊", "亞馬遜"], "ja": ["アマゾン"], "ko": ["아마존"]},
        "GOOGL": {"zh": ["谷歌", "穀歌"], "ja": ["グーグル"], "ko": ["구글"]},
        "META": {"zh": ["Meta", "脸书", "臉書"], "ja": ["メタ"], "ko": ["메타"]},
        "TSLA": {"zh": ["特斯拉"], "ja": ["テスラ"], "ko": ["테슬라"]},
        "JPM": {"zh": ["摩根大通", "摩根大通銀行"], "ja": ["JPモルガン"], "ko": ["JP모건"]},
        "WMT": {"zh": ["沃尔玛", "沃爾瑪"], "ja": ["ウォルマート"], "ko": ["월마트"]},
        "V": {"zh": ["维萨", "維薩"], "ja": ["ビザ"], "ko": ["비자"]},
        "MA": {"zh": ["万事达", "萬事達"], "ja": ["マスターカード"], "ko": ["마스터카드"]},
        "NFLX": {"zh": ["奈飞", "網飛"], "ja": ["ネットフリックス"], "ko": ["넷플릭스"]},
        "KO": {"zh": ["可口可乐", "可口可樂"], "ja": ["コカ・コーラ"], "ko": ["코카콜라"]},
        "PEP": {"zh": ["百事", "百事可樂"], "ja": ["ペプシ"], "ko": ["펩시"]},
        "MCD": {"zh": ["麦当劳", "麥當勞"], "ja": ["マクドナルド"], "ko": ["맥도날드"]},
        "NKE": {"zh": ["耐克"], "ja": ["ナイキ"], "ko": ["나이키"]},
        "DIS": {"zh": ["迪士尼"], "ja": ["ディズニー"], "ko": ["디즈니"]},
        "BA": {"zh": ["波音"], "ja": ["ボーイング"], "ko": ["보잉"]},
        "CAT": {"zh": ["卡特彼勒"], "ja": ["キャタピラー"], "ko": ["캐터필러"]},
        "GE": {"zh": ["通用电气", "通用電氣"], "ja": ["ゼネラル・エレクトリック"], "ko": ["제너럴 일렉트릭"]},
        "F": {"zh": ["福特"], "ja": ["フォード"], "ko": ["포드"]},
        "GM": {"zh": ["通用汽车", "通用汽車"], "ja": ["ゼネラルモーターズ"], "ko": ["제너럴 모터스"]},
    }

    if symbol in known:
        return known[symbol]

    # 对于没有标准翻译的，生成基本翻译
    # 简体中文：音译或意译
    # 繁体中文：对应简体
    # 日文：片假名音译
    # 韩文：音译

    # 这里返回None表示需要手动添加
    return None

def main():
    print("生成标普500和纳斯达克100公司多语言数据...")
    print(f"总共 {len(COMPANIES)} 家公司\n")

    results = []
    missing_count = 0

    for symbol, name in COMPANIES:
        translations = generate_translations(symbol, name)

        if translations:
            results.append({
                "symbol": symbol,
                "names": translations,
                "description": name,
                "type": "Common Stock"
            })
            print(f"✓ {symbol}: {name}")
        else:
            missing_count += 1
            print(f"⚠ {symbol}: {name} - 需要手动添加翻译")

    print(f"\n完成！")
    print(f"已生成: {len(results)} 个公司")
    print(f"需要手动添加: {missing_count} 个公司")

    # 保存结果
    with open("sp500-nasdaq100-partial.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n已保存到: sp500-nasdaq100-partial.json")
    print("\n建议：将剩余公司的翻译补充完整后再合并到主数据文件")

if __name__ == "__main__":
    main()
