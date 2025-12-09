#!/usr/bin/env python3
"""
从 Wikidata 获取股票多语言名称
查询 NASDAQ, NYSE 等主要交易所的股票代码和中日韩文名称
"""

import json
import urllib.request
import urllib.parse
import time
from typing import List, Dict

WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"

# 主要美股交易所的 Wikidata ID
EXCHANGES = {
    "NASDAQ": "Q13677",
    "NYSE": "Q13677",  # New York Stock Exchange
    "US_EXCHANGES": "Q13677"  # 这会查询所有在美国上市的
}

SPARQL_QUERY = """
SELECT DISTINCT ?company ?ticker ?companyLabel
  ?nameEN ?nameZH ?nameZH_HANS ?nameZH_HANT ?nameJA ?nameKO
WHERE {
  # 公司有股票代码
  ?company wdt:P249 ?ticker.

  # 公司必须是某种类型的组织/企业
  ?company wdt:P31 ?instanceOf.

  # 获取各语言标签
  OPTIONAL { ?company rdfs:label ?nameEN FILTER(LANG(?nameEN) = "en") }
  OPTIONAL { ?company rdfs:label ?nameZH FILTER(LANG(?nameZH) = "zh") }
  OPTIONAL { ?company rdfs:label ?nameZH_HANS FILTER(LANG(?nameZH_HANS) = "zh-hans") }
  OPTIONAL { ?company rdfs:label ?nameZH_HANT FILTER(LANG(?nameZH_HANT) = "zh-hant") }
  OPTIONAL { ?company rdfs:label ?nameJA FILTER(LANG(?nameJA) = "ja") }
  OPTIONAL { ?company rdfs:label ?nameKO FILTER(LANG(?nameKO) = "ko") }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }

  # 至少要有一个中日韩文名称
  FILTER(BOUND(?nameZH) || BOUND(?nameZH_HANS) || BOUND(?nameZH_HANT) || BOUND(?nameJA) || BOUND(?nameKO))
}
ORDER BY ?ticker
LIMIT 5000
"""

def query_wikidata(query: str) -> List[Dict]:
    """执行 Wikidata SPARQL 查询"""
    params = urllib.parse.urlencode({
        "query": query,
        "format": "json"
    })

    url = f"{WIKIDATA_ENDPOINT}?{params}"

    req = urllib.request.Request(url)
    req.add_header("User-Agent", "StockMultilangFetcher/1.0")
    req.add_header("Accept", "application/json")

    print("正在查询 Wikidata...")

    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            if response.status != 200:
                print(f"查询失败: HTTP {response.status}")
                return []

            data = json.loads(response.read().decode('utf-8'))
            return data.get("results", {}).get("bindings", [])
    except Exception as e:
        print(f"查询失败: {e}")
        return []

def parse_results(bindings: List[Dict]) -> List[Dict]:
    """解析查询结果"""
    stocks = {}

    for binding in bindings:
        ticker = binding.get("ticker", {}).get("value", "").strip().upper()
        if not ticker:
            continue

        # 去重：如果已存在该ticker，跳过
        if ticker in stocks:
            continue

        company_label = binding.get("companyLabel", {}).get("value", "")
        name_en = binding.get("nameEN", {}).get("value", "")
        name_zh = binding.get("nameZH", {}).get("value", "")
        name_zh_hans = binding.get("nameZH_HANS", {}).get("value", "")
        name_zh_hant = binding.get("nameZH_HANT", {}).get("value", "")
        name_ja = binding.get("nameJA", {}).get("value", "")
        name_ko = binding.get("nameKO", {}).get("value", "")

        # 构建名称列表
        zh_names = []
        if name_zh_hans:
            zh_names.append(name_zh_hans)
        if name_zh_hant and name_zh_hant != name_zh_hans:
            zh_names.append(name_zh_hant)
        if name_zh and name_zh not in zh_names:
            zh_names.append(name_zh)

        en_names = []
        if name_en and name_en != company_label:
            en_names.append(name_en)
        if company_label:
            en_names.append(company_label)

        ja_names = [name_ja] if name_ja else []
        ko_names = [name_ko] if name_ko else []

        # 只保留有至少一个非英文名称的公司
        if zh_names or ja_names or ko_names:
            stocks[ticker] = {
                "symbol": ticker,
                "names": {
                    "zh": zh_names if zh_names else None,
                    "ja": ja_names if ja_names else None,
                    "ko": ko_names if ko_names else None,
                    "en": en_names if en_names else None,
                },
                "description": company_label or name_en or ticker,
                "type": "Common Stock"
            }

    return list(stocks.values())

def generate_typescript_code(stocks: List[Dict]) -> str:
    """生成 TypeScript 代码"""
    lines = []

    for stock in stocks:
        lines.append("  {")
        lines.append(f'    symbol: "{stock["symbol"]}",')
        lines.append("    names: {")

        names = stock["names"]
        if names.get("zh"):
            zh_str = ", ".join([f'"{n}"' for n in names["zh"]])
            lines.append(f"      zh: [{zh_str}],")
        if names.get("ja"):
            ja_str = ", ".join([f'"{n}"' for n in names["ja"]])
            lines.append(f"      ja: [{ja_str}],")
        if names.get("ko"):
            ko_str = ", ".join([f'"{n}"' for n in names["ko"]])
            lines.append(f"      ko: [{ko_str}],")
        if names.get("en"):
            en_str = ", ".join([f'"{n}"' for n in names["en"]])
            lines.append(f"      en: [{en_str}]")

        lines.append("    },")
        lines.append(f'    description: "{stock["description"]}",')
        lines.append(f'    type: "{stock["type"]}"')
        lines.append("  },")

    return "\n".join(lines)

def main():
    print("=" * 60)
    print("从 Wikidata 获取股票多语言名称")
    print("=" * 60)

    # 执行查询
    results = query_wikidata(SPARQL_QUERY)
    print(f"查询返回 {len(results)} 条结果")

    if not results:
        print("没有查询到数据")
        return

    # 解析结果
    stocks = parse_results(results)
    print(f"解析得到 {len(stocks)} 个有效股票")

    # 生成 JSON
    output_json = "stock-multilang-data.json"
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(stocks, f, ensure_ascii=False, indent=2)
    print(f"已保存 JSON 到: {output_json}")

    # 生成 TypeScript 代码
    ts_code = generate_typescript_code(stocks)
    output_ts = "stock-multilang-data.ts.snippet"
    with open(output_ts, "w", encoding="utf-8") as f:
        f.write(ts_code)
    print(f"已保存 TypeScript 代码到: {output_ts}")

    # 显示示例
    print("\n" + "=" * 60)
    print("示例数据（前5个）：")
    print("=" * 60)
    for stock in stocks[:5]:
        try:
            print(f"\n{stock['symbol']}: {stock['description']}")
            if stock['names'].get('zh'):
                print(f"  中文: {', '.join(stock['names']['zh'])}")
            if stock['names'].get('ja'):
                print(f"  日文: {', '.join(stock['names']['ja'])}")
            if stock['names'].get('ko'):
                print(f"  韩文: {', '.join(stock['names']['ko'])}")
        except UnicodeEncodeError:
            # Windows 命令行编码问题，跳过
            print(f"\n{stock['symbol']}: [包含多语言名称]")

    print("\n完成！")

if __name__ == "__main__":
    main()
