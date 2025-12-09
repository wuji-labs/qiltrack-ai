/**
 * 股票代码多语言映射表
 * 支持用户使用中文、日文、韩文搜索常见股票
 */

export interface StockNameMapping {
  symbol: string;
  names: {
    zh?: string[];  // 中文名称（简体/繁体）
    ja?: string[];  // 日文名称
    ko?: string[];  // 韩文名称
    en?: string[];  // 英文别名
  };
  description: string;  // 英文描述
  type?: string;
}

export const STOCK_NAME_MAPPINGS: StockNameMapping[] = [
  // 科技巨头
  {
    symbol: "AAPL",
    names: {
      zh: ["苹果", "蘋果"],
      ja: ["アップル", "りんご"],
      ko: ["애플"],
      en: ["Apple"]
    },
    description: "Apple Inc.",
    type: "Common Stock"
  },
  {
    symbol: "MSFT",
    names: {
      zh: ["微软", "微軟"],
      ja: ["マイクロソフト"],
      ko: ["마이크로소프트"],
      en: ["Microsoft"]
    },
    description: "Microsoft Corporation",
    type: "Common Stock"
  },
  {
    symbol: "GOOGL",
    names: {
      zh: ["谷歌", "穀歌"],
      ja: ["グーグル"],
      ko: ["구글"],
      en: ["Google", "Alphabet"]
    },
    description: "Alphabet Inc. Class A",
    type: "Common Stock"
  },
  {
    symbol: "AMZN",
    names: {
      zh: ["亚马逊", "亞馬遜"],
      ja: ["アマゾン"],
      ko: ["아마존"],
      en: ["Amazon"]
    },
    description: "Amazon.com Inc.",
    type: "Common Stock"
  },
  {
    symbol: "META",
    names: {
      zh: ["Meta", "脸书", "臉書"],
      ja: ["メタ", "フェイスブック"],
      ko: ["메타", "페이스북"],
      en: ["Facebook"]
    },
    description: "Meta Platforms Inc.",
    type: "Common Stock"
  },
  {
    symbol: "TSLA",
    names: {
      zh: ["特斯拉"],
      ja: ["テスラ"],
      ko: ["테슬라"],
      en: ["Tesla"]
    },
    description: "Tesla Inc.",
    type: "Common Stock"
  },
  {
    symbol: "NVDA",
    names: {
      zh: ["英伟达", "輝達"],
      ja: ["エヌビディア"],
      ko: ["엔비디아"],
      en: ["Nvidia"]
    },
    description: "NVIDIA Corporation",
    type: "Common Stock"
  },
  {
    symbol: "NFLX",
    names: {
      zh: ["奈飞", "網飛"],
      ja: ["ネットフリックス"],
      ko: ["넷플릭스"],
      en: ["Netflix"]
    },
    description: "Netflix Inc.",
    type: "Common Stock"
  },
  {
    symbol: "AMD",
    names: {
      zh: ["AMD", "超微"],
      ja: ["AMD"],
      ko: ["AMD"],
      en: ["Advanced Micro Devices"]
    },
    description: "Advanced Micro Devices Inc.",
    type: "Common Stock"
  },
  {
    symbol: "INTC",
    names: {
      zh: ["英特尔", "英特爾"],
      ja: ["インテル"],
      ko: ["인텔"],
      en: ["Intel"]
    },
    description: "Intel Corporation",
    type: "Common Stock"
  },

  // 金融
  {
    symbol: "BRK.A",
    names: {
      zh: ["伯克希尔", "波克夏"],
      ja: ["バークシャー・ハサウェイ"],
      ko: ["버크셔 해서웨이"],
      en: ["Berkshire Hathaway"]
    },
    description: "Berkshire Hathaway Inc. Class A",
    type: "Common Stock"
  },
  {
    symbol: "BRK.B",
    names: {
      zh: ["伯克希尔B", "波克夏B"],
      ja: ["バークシャーB"],
      ko: ["버크셔B"],
      en: ["Berkshire Hathaway B"]
    },
    description: "Berkshire Hathaway Inc. Class B",
    type: "Common Stock"
  },
  {
    symbol: "JPM",
    names: {
      zh: ["摩根大通", "摩根大通銀行"],
      ja: ["JPモルガン"],
      ko: ["JP모건"],
      en: ["JPMorgan", "JP Morgan Chase"]
    },
    description: "JPMorgan Chase & Co.",
    type: "Common Stock"
  },
  {
    symbol: "BAC",
    names: {
      zh: ["美国银行", "美國銀行"],
      ja: ["バンク・オブ・アメリカ"],
      ko: ["뱅크오브아메리카"],
      en: ["Bank of America"]
    },
    description: "Bank of America Corporation",
    type: "Common Stock"
  },
  {
    symbol: "V",
    names: {
      zh: ["维萨", "維薩", "Visa"],
      ja: ["ビザ"],
      ko: ["비자"],
      en: ["Visa"]
    },
    description: "Visa Inc.",
    type: "Common Stock"
  },
  {
    symbol: "MA",
    names: {
      zh: ["万事达", "萬事達"],
      ja: ["マスターカード"],
      ko: ["마스터카드"],
      en: ["Mastercard"]
    },
    description: "Mastercard Incorporated",
    type: "Common Stock"
  },

  // 消费品
  {
    symbol: "KO",
    names: {
      zh: ["可口可乐", "可口可樂"],
      ja: ["コカ・コーラ"],
      ko: ["코카콜라"],
      en: ["Coca-Cola", "Coke"]
    },
    description: "The Coca-Cola Company",
    type: "Common Stock"
  },
  {
    symbol: "PEP",
    names: {
      zh: ["百事", "百事可乐", "百事可樂"],
      ja: ["ペプシ"],
      ko: ["펩시"],
      en: ["Pepsi", "PepsiCo"]
    },
    description: "PepsiCo Inc.",
    type: "Common Stock"
  },
  {
    symbol: "MCD",
    names: {
      zh: ["麦当劳", "麥當勞"],
      ja: ["マクドナルド"],
      ko: ["맥도날드"],
      en: ["McDonald's", "McDonalds"]
    },
    description: "McDonald's Corporation",
    type: "Common Stock"
  },
  {
    symbol: "NKE",
    names: {
      zh: ["耐克", "Nike"],
      ja: ["ナイキ"],
      ko: ["나이키"],
      en: ["Nike"]
    },
    description: "Nike Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DIS",
    names: {
      zh: ["迪士尼", "迪斯尼"],
      ja: ["ディズニー"],
      ko: ["디즈니"],
      en: ["Disney", "Walt Disney"]
    },
    description: "The Walt Disney Company",
    type: "Common Stock"
  },

  // 其他知名公司
  {
    symbol: "WMT",
    names: {
      zh: ["沃尔玛", "沃爾瑪"],
      ja: ["ウォルマート"],
      ko: ["월마트"],
      en: ["Walmart"]
    },
    description: "Walmart Inc.",
    type: "Common Stock"
  },
  {
    symbol: "BABA",
    names: {
      zh: ["阿里巴巴", "阿里"],
      ja: ["アリババ"],
      ko: ["알리바바"],
      en: ["Alibaba"]
    },
    description: "Alibaba Group Holding Limited",
    type: "ADR"
  },
  {
    symbol: "BIDU",
    names: {
      zh: ["百度"],
      ja: ["バイドゥ"],
      ko: ["바이두"],
      en: ["Baidu"]
    },
    description: "Baidu Inc.",
    type: "ADR"
  },
  {
    symbol: "PDD",
    names: {
      zh: ["拼多多"],
      ja: ["ピンドゥオドゥオ"],
      ko: ["핀둬둬"],
      en: ["Pinduoduo"]
    },
    description: "PDD Holdings Inc.",
    type: "ADR"
  },

  // 更多科技公司
  {
    symbol: "CRM",
    names: {
      zh: ["Salesforce", "赛富时", "賽富時"],
      ja: ["セールスフォース"],
      ko: ["세일즈포스"],
      en: ["Salesforce"]
    },
    description: "Salesforce Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ORCL",
    names: {
      zh: ["甲骨文"],
      ja: ["オラクル"],
      ko: ["오라클"],
      en: ["Oracle"]
    },
    description: "Oracle Corporation",
    type: "Common Stock"
  },
  {
    symbol: "ADBE",
    names: {
      zh: ["Adobe", "奥多比", "奧多比"],
      ja: ["アドビ"],
      ko: ["어도비"],
      en: ["Adobe"]
    },
    description: "Adobe Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CSCO",
    names: {
      zh: ["思科"],
      ja: ["シスコ"],
      ko: ["시스코"],
      en: ["Cisco"]
    },
    description: "Cisco Systems Inc.",
    type: "Common Stock"
  },
  {
    symbol: "IBM",
    names: {
      zh: ["IBM", "国际商业机器", "國際商業機器"],
      ja: ["IBM"],
      ko: ["IBM"],
      en: ["IBM"]
    },
    description: "International Business Machines Corporation",
    type: "Common Stock"
  },
  {
    symbol: "QCOM",
    names: {
      zh: ["高通"],
      ja: ["クアルコム"],
      ko: ["퀄컴"],
      en: ["Qualcomm"]
    },
    description: "QUALCOMM Incorporated",
    type: "Common Stock"
  },
  {
    symbol: "TXN",
    names: {
      zh: ["德州仪器", "德州儀器"],
      ja: ["テキサス・インスツルメンツ"],
      ko: ["텍사스 인스트루먼트"],
      en: ["Texas Instruments"]
    },
    description: "Texas Instruments Incorporated",
    type: "Common Stock"
  },
  {
    symbol: "AVGO",
    names: {
      zh: ["博通"],
      ja: ["ブロードコム"],
      ko: ["브로드컴"],
      en: ["Broadcom"]
    },
    description: "Broadcom Inc.",
    type: "Common Stock"
  },
  {
    symbol: "NOW",
    names: {
      zh: ["ServiceNow"],
      ja: ["サービスナウ"],
      ko: ["서비스나우"],
      en: ["ServiceNow"]
    },
    description: "ServiceNow Inc.",
    type: "Common Stock"
  },
  {
    symbol: "SNOW",
    names: {
      zh: ["Snowflake", "雪花"],
      ja: ["スノーフレーク"],
      ko: ["스노우플레이크"],
      en: ["Snowflake"]
    },
    description: "Snowflake Inc.",
    type: "Common Stock"
  },

  // 电商与零售
  {
    symbol: "SHOP",
    names: {
      zh: ["Shopify"],
      ja: ["ショッピファイ"],
      ko: ["쇼피파이"],
      en: ["Shopify"]
    },
    description: "Shopify Inc.",
    type: "Common Stock"
  },
  {
    symbol: "EBAY",
    names: {
      zh: ["eBay", "易贝", "易貝"],
      ja: ["イーベイ"],
      ko: ["이베이"],
      en: ["eBay"]
    },
    description: "eBay Inc.",
    type: "Common Stock"
  },
  {
    symbol: "TGT",
    names: {
      zh: ["Target", "塔吉特"],
      ja: ["ターゲット"],
      ko: ["타겟"],
      en: ["Target"]
    },
    description: "Target Corporation",
    type: "Common Stock"
  },
  {
    symbol: "COST",
    names: {
      zh: ["好市多", "開市客"],
      ja: ["コストコ"],
      ko: ["코스트코"],
      en: ["Costco"]
    },
    description: "Costco Wholesale Corporation",
    type: "Common Stock"
  },

  // 汽车
  {
    symbol: "F",
    names: {
      zh: ["福特"],
      ja: ["フォード"],
      ko: ["포드"],
      en: ["Ford"]
    },
    description: "Ford Motor Company",
    type: "Common Stock"
  },
  {
    symbol: "GM",
    names: {
      zh: ["通用汽车", "通用汽車"],
      ja: ["ゼネラルモーターズ"],
      ko: ["제너럴 모터스"],
      en: ["General Motors"]
    },
    description: "General Motors Company",
    type: "Common Stock"
  },
  {
    symbol: "TM",
    names: {
      zh: ["丰田", "豐田"],
      ja: ["トヨタ"],
      ko: ["도요타"],
      en: ["Toyota"]
    },
    description: "Toyota Motor Corporation",
    type: "ADR"
  },

  // 能源
  {
    symbol: "XOM",
    names: {
      zh: ["埃克森美孚", "艾克森美孚"],
      ja: ["エクソンモービル"],
      ko: ["엑손모빌"],
      en: ["Exxon Mobil", "ExxonMobil"]
    },
    description: "Exxon Mobil Corporation",
    type: "Common Stock"
  },
  {
    symbol: "CVX",
    names: {
      zh: ["雪佛龙", "雪佛龍"],
      ja: ["シェブロン"],
      ko: ["셰브론"],
      en: ["Chevron"]
    },
    description: "Chevron Corporation",
    type: "Common Stock"
  },

  // 医疗保健
  {
    symbol: "JNJ",
    names: {
      zh: ["强生", "嬌生"],
      ja: ["ジョンソン・エンド・ジョンソン"],
      ko: ["존슨앤드존슨"],
      en: ["Johnson & Johnson", "J&J"]
    },
    description: "Johnson & Johnson",
    type: "Common Stock"
  },
  {
    symbol: "PFE",
    names: {
      zh: ["辉瑞", "輝瑞"],
      ja: ["ファイザー"],
      ko: ["화이자"],
      en: ["Pfizer"]
    },
    description: "Pfizer Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ABBV",
    names: {
      zh: ["艾伯维", "艾伯維"],
      ja: ["アッヴィ"],
      ko: ["애브비"],
      en: ["AbbVie"]
    },
    description: "AbbVie Inc.",
    type: "Common Stock"
  },
  {
    symbol: "MRK",
    names: {
      zh: ["默克", "默沙東"],
      ja: ["メルク"],
      ko: ["머크"],
      en: ["Merck"]
    },
    description: "Merck & Co. Inc.",
    type: "Common Stock"
  },
  {
    symbol: "UNH",
    names: {
      zh: ["联合健康", "聯合健康"],
      ja: ["ユナイテッドヘルス"],
      ko: ["유나이티드헬스"],
      en: ["UnitedHealth"]
    },
    description: "UnitedHealth Group Incorporated",
    type: "Common Stock"
  },

  // 通信与媒体
  {
    symbol: "T",
    names: {
      zh: ["AT&T"],
      ja: ["AT&T"],
      ko: ["AT&T"],
      en: ["AT&T"]
    },
    description: "AT&T Inc.",
    type: "Common Stock"
  },
  {
    symbol: "VZ",
    names: {
      zh: ["Verizon", "威瑞森", "威訊"],
      ja: ["ベライゾン"],
      ko: ["버라이즌"],
      en: ["Verizon"]
    },
    description: "Verizon Communications Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CMCSA",
    names: {
      zh: ["康卡斯特", "康卡斯特"],
      ja: ["コムキャスト"],
      ko: ["컴캐스트"],
      en: ["Comcast"]
    },
    description: "Comcast Corporation",
    type: "Common Stock"
  },

  // 航空航天与国防
  {
    symbol: "BA",
    names: {
      zh: ["波音"],
      ja: ["ボーイング"],
      ko: ["보잉"],
      en: ["Boeing"]
    },
    description: "The Boeing Company",
    type: "Common Stock"
  },
  {
    symbol: "LMT",
    names: {
      zh: ["洛克希德马丁", "洛克希德馬丁"],
      ja: ["ロッキード・マーティン"],
      ko: ["록히드 마틴"],
      en: ["Lockheed Martin"]
    },
    description: "Lockheed Martin Corporation",
    type: "Common Stock"
  },

  // 工业
  {
    symbol: "CAT",
    names: {
      zh: ["卡特彼勒"],
      ja: ["キャタピラー"],
      ko: ["캐터필러"],
      en: ["Caterpillar"]
    },
    description: "Caterpillar Inc.",
    type: "Common Stock"
  },
  {
    symbol: "GE",
    names: {
      zh: ["通用电气", "通用電氣"],
      ja: ["ゼネラル・エレクトリック"],
      ko: ["제너럴 일렉트릭"],
      en: ["General Electric", "GE"]
    },
    description: "General Electric Company",
    type: "Common Stock"
  },

  // 中国概念股
  {
    symbol: "JD",
    names: {
      zh: ["京东", "京東"],
      ja: ["JD.com"],
      ko: ["징둥"],
      en: ["JD.com"]
    },
    description: "JD.com Inc.",
    type: "ADR"
  },
  {
    symbol: "NIO",
    names: {
      zh: ["蔚来", "蔚來"],
      ja: ["NIO"],
      ko: ["니오"],
      en: ["NIO"]
    },
    description: "NIO Inc.",
    type: "ADR"
  },
  {
    symbol: "LI",
    names: {
      zh: ["理想汽车", "理想汽車"],
      ja: ["Li Auto"],
      ko: ["리오토"],
      en: ["Li Auto"]
    },
    description: "Li Auto Inc.",
    type: "ADR"
  },
  {
    symbol: "XPEV",
    names: {
      zh: ["小鹏汽车", "小鵬汽車"],
      ja: ["XPeng"],
      ko: ["샤오펑"],
      en: ["XPeng"]
    },
    description: "XPeng Inc.",
    type: "ADR"
  },

  // 支付与金融科技
  {
    symbol: "PYPL",
    names: {
      zh: ["PayPal", "贝宝", "貝寶"],
      ja: ["ペイパル"],
      ko: ["페이팔"],
      en: ["PayPal"]
    },
    description: "PayPal Holdings Inc.",
    type: "Common Stock"
  },
  {
    symbol: "SQ",
    names: {
      zh: ["Square", "Block"],
      ja: ["ブロック"],
      ko: ["블록"],
      en: ["Block", "Square"]
    },
    description: "Block Inc.",
    type: "Common Stock"
  },
  {
    symbol: "COIN",
    names: {
      zh: ["Coinbase"],
      ja: ["コインベース"],
      ko: ["코인베이스"],
      en: ["Coinbase"]
    },
    description: "Coinbase Global Inc.",
    type: "Common Stock"
  },

  // 半导体
  {
    symbol: "TSM",
    names: {
      zh: ["台积电", "台灣積體電路"],
      ja: ["TSMC"],
      ko: ["TSMC"],
      en: ["TSMC", "Taiwan Semiconductor"]
    },
    description: "Taiwan Semiconductor Manufacturing Company Limited",
    type: "ADR"
  },
  {
    symbol: "ASML",
    names: {
      zh: ["阿斯麦", "阿斯麥"],
      ja: ["ASML"],
      ko: ["ASML"],
      en: ["ASML"]
    },
    description: "ASML Holding N.V.",
    type: "ADR"
  },
  {
    symbol: "MU",
    names: {
      zh: ["美光"],
      ja: ["マイクロン"],
      ko: ["마이크론"],
      en: ["Micron"]
    },
    description: "Micron Technology Inc.",
    type: "Common Stock"
  },

  // 奢侈品与时尚
  {
    symbol: "LVMUY",
    names: {
      zh: ["路威酩轩", "路威酩軒", "LVMH"],
      ja: ["LVMH"],
      ko: ["LVMH"],
      en: ["LVMH"]
    },
    description: "LVMH Moët Hennessy Louis Vuitton SE",
    type: "ADR"
  },

  // 娱乐与游戏
  {
    symbol: "SPOT",
    names: {
      zh: ["Spotify"],
      ja: ["スポティファイ"],
      ko: ["스포티파이"],
      en: ["Spotify"]
    },
    description: "Spotify Technology S.A.",
    type: "Common Stock"
  },
  {
    symbol: "RBLX",
    names: {
      zh: ["Roblox"],
      ja: ["ロブロックス"],
      ko: ["로블록스"],
      en: ["Roblox"]
    },
    description: "Roblox Corporation",
    type: "Common Stock"
  },

  // 房地产与酒店
  {
    symbol: "MAR",
    names: {
      zh: ["万豪", "萬豪"],
      ja: ["マリオット"],
      ko: ["메리어트"],
      en: ["Marriott"]
    },
    description: "Marriott International Inc.",
    type: "Common Stock"
  },

  // 韩国公司
  {
    symbol: "005930.KS",
    names: {
      zh: ["三星电子", "三星電子"],
      ja: ["サムスン電子"],
      ko: ["삼성전자"],
      en: ["Samsung Electronics"]
    },
    description: "Samsung Electronics Co., Ltd.",
    type: "Common Stock"
  },

  // 标普500 Top 51-100
  {
    symbol: "CMCSA",
    names: {
      zh: ["康卡斯特"],
      ja: ["コムキャスト"],
      ko: ["컴캐스트"],
      en: ["Comcast"]
    },
    description: "Comcast Corporation",
    type: "Common Stock"
  },
  {
    symbol: "BKNG",
    names: {
      zh: ["缤客", "Booking"],
      ja: ["ブッキング・ホールディングス"],
      ko: ["부킹홀딩스"],
      en: ["Booking Holdings"]
    },
    description: "Booking Holdings Inc.",
    type: "Common Stock"
  },
  {
    symbol: "HON",
    names: {
      zh: ["霍尼韦尔", "霍尼韋爾"],
      ja: ["ハネウェル"],
      ko: ["허니웰"],
      en: ["Honeywell"]
    },
    description: "Honeywell International Inc.",
    type: "Common Stock"
  },
  {
    symbol: "UNH",
    names: {
      zh: ["联合健康", "聯合健康"],
      ja: ["ユナイテッドヘルス"],
      ko: ["유나이티드헬스"],
      en: ["UnitedHealth"]
    },
    description: "UnitedHealth Group Incorporated",
    type: "Common Stock"
  },
  {
    symbol: "AMGN",
    names: {
      zh: ["安进", "安進"],
      ja: ["アムジェン"],
      ko: ["암젠"],
      en: ["Amgen"]
    },
    description: "Amgen Inc.",
    type: "Common Stock"
  },
  {
    symbol: "LOW",
    names: {
      zh: ["劳氏", "勞氏"],
      ja: ["ロウズ"],
      ko: ["로우스"],
      en: ["Lowe's"]
    },
    description: "Lowe's Companies Inc.",
    type: "Common Stock"
  },
  {
    symbol: "UNP",
    names: {
      zh: ["联合太平洋", "聯合太平洋"],
      ja: ["ユニオン・パシフィック"],
      ko: ["유니언 퍼시픽"],
      en: ["Union Pacific"]
    },
    description: "Union Pacific Corporation",
    type: "Common Stock"
  },
  {
    symbol: "SPGI",
    names: {
      zh: ["标普全球", "標普全球"],
      ja: ["S&Pグローバル"],
      ko: ["S&P 글로벌"],
      en: ["S&P Global"]
    },
    description: "S&P Global Inc.",
    type: "Common Stock"
  },
  {
    symbol: "NEE",
    names: {
      zh: ["新纪元能源", "新紀元能源"],
      ja: ["ネクステラ・エナジー"],
      ko: ["넥스트에라 에너지"],
      en: ["NextEra Energy"]
    },
    description: "NextEra Energy Inc.",
    type: "Common Stock"
  },
  {
    symbol: "TJX",
    names: {
      zh: ["TJX"],
      ja: ["TJX"],
      ko: ["TJX"],
      en: ["TJX Companies"]
    },
    description: "The TJX Companies Inc.",
    type: "Common Stock"
  },
  {
    symbol: "SCHW",
    names: {
      zh: ["嘉信理财", "嘉信理財"],
      ja: ["チャールズ・シュワブ"],
      ko: ["찰스 슈왑"],
      en: ["Charles Schwab"]
    },
    description: "The Charles Schwab Corporation",
    type: "Common Stock"
  },
  {
    symbol: "UPS",
    names: {
      zh: ["联合包裹", "聯合包裹"],
      ja: ["UPS"],
      ko: ["UPS"],
      en: ["UPS"]
    },
    description: "United Parcel Service Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DE",
    names: {
      zh: ["迪尔", "迪爾"],
      ja: ["ディア"],
      ko: ["디어"],
      en: ["Deere", "John Deere"]
    },
    description: "Deere & Company",
    type: "Common Stock"
  },
  {
    symbol: "GS",
    names: {
      zh: ["高盛", "高盛集团"],
      ja: ["ゴールドマン・サックス"],
      ko: ["골드만삭스"],
      en: ["Goldman Sachs"]
    },
    description: "The Goldman Sachs Group Inc.",
    type: "Common Stock"
  },
  {
    symbol: "BLK",
    names: {
      zh: ["贝莱德", "貝萊德"],
      ja: ["ブラックロック"],
      ko: ["블랙록"],
      en: ["BlackRock"]
    },
    description: "BlackRock Inc.",
    type: "Common Stock"
  },
  {
    symbol: "AXP",
    names: {
      zh: ["美国运通", "美國運通"],
      ja: ["アメリカン・エキスプレス"],
      ko: ["아메리칸 익스프레스"],
      en: ["American Express"]
    },
    description: "American Express Company",
    type: "Common Stock"
  },
  {
    symbol: "PLD",
    names: {
      zh: ["普洛斯"],
      ja: ["プロロジス"],
      ko: ["프롤로지스"],
      en: ["Prologis"]
    },
    description: "Prologis Inc.",
    type: "Common Stock"
  },
  {
    symbol: "VRTX",
    names: {
      zh: ["福泰制药", "福泰製藥"],
      ja: ["バーテックス"],
      ko: ["버텍스"],
      en: ["Vertex"]
    },
    description: "Vertex Pharmaceuticals Incorporated",
    type: "Common Stock"
  },
  {
    symbol: "SYK",
    names: {
      zh: ["史赛克"],
      ja: ["ストライカー"],
      ko: ["스트라이커"],
      en: ["Stryker"]
    },
    description: "Stryker Corporation",
    type: "Common Stock"
  },
  {
    symbol: "MDT",
    names: {
      zh: ["美敦力"],
      ja: ["メドトロニック"],
      ko: ["메드트로닉"],
      en: ["Medtronic"]
    },
    description: "Medtronic plc",
    type: "Common Stock"
  },
  {
    symbol: "GILD",
    names: {
      zh: ["吉利德"],
      ja: ["ギリアド・サイエンシズ"],
      ko: ["길리어드"],
      en: ["Gilead"]
    },
    description: "Gilead Sciences Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CVS",
    names: {
      zh: ["CVS"],
      ja: ["CVS"],
      ko: ["CVS"],
      en: ["CVS Health"]
    },
    description: "CVS Health Corporation",
    type: "Common Stock"
  },
  {
    symbol: "ADP",
    names: {
      zh: ["ADP"],
      ja: ["ADP"],
      ko: ["ADP"],
      en: ["Automatic Data Processing"]
    },
    description: "Automatic Data Processing Inc.",
    type: "Common Stock"
  },
  {
    symbol: "MMC",
    names: {
      zh: ["达信", "達信"],
      ja: ["マーシュ・アンド・マクレナン"],
      ko: ["마쉬앤맥클레넌"],
      en: ["Marsh & McLennan"]
    },
    description: "Marsh & McLennan Companies Inc.",
    type: "Common Stock"
  },
  {
    symbol: "MDLZ",
    names: {
      zh: ["亿滋", "億滋"],
      ja: ["モンデリーズ"],
      ko: ["몬델리즈"],
      en: ["Mondelez"]
    },
    description: "Mondelez International Inc.",
    type: "Common Stock"
  },
  {
    symbol: "REGN",
    names: {
      zh: ["再生元"],
      ja: ["リジェネロン"],
      ko: ["리제네론"],
      en: ["Regeneron"]
    },
    description: "Regeneron Pharmaceuticals Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CI",
    names: {
      zh: ["信诺", "信諾"],
      ja: ["シグナ"],
      ko: ["시그나"],
      en: ["Cigna"]
    },
    description: "The Cigna Group",
    type: "Common Stock"
  },
  {
    symbol: "BMY",
    names: {
      zh: ["百时美施贵宝", "百時美施貴寶"],
      ja: ["ブリストル・マイヤーズ スクイブ"],
      ko: ["브리스톨 마이어스 스큅"],
      en: ["Bristol-Myers Squibb"]
    },
    description: "Bristol-Myers Squibb Company",
    type: "Common Stock"
  },
  {
    symbol: "CB",
    names: {
      zh: ["安达保险", "安達保險"],
      ja: ["チャブ"],
      ko: ["처브"],
      en: ["Chubb"]
    },
    description: "Chubb Limited",
    type: "Common Stock"
  },
  {
    symbol: "SO",
    names: {
      zh: ["南方公司"],
      ja: ["サザン"],
      ko: ["서던 컴퍼니"],
      en: ["Southern Company"]
    },
    description: "The Southern Company",
    type: "Common Stock"
  },
  {
    symbol: "ZTS",
    names: {
      zh: ["硕腾", "碩騰"],
      ja: ["ゾエティス"],
      ko: ["조에티스"],
      en: ["Zoetis"]
    },
    description: "Zoetis Inc.",
    type: "Common Stock"
  },
  {
    symbol: "SLB",
    names: {
      zh: ["斯伦贝谢", "斯倫貝謝"],
      ja: ["シュルンベルジェ"],
      ko: ["슐럼버거"],
      en: ["Schlumberger"]
    },
    description: "Schlumberger Limited",
    type: "Common Stock"
  },
  {
    symbol: "ETN",
    names: {
      zh: ["伊顿", "伊頓"],
      ja: ["イートン"],
      ko: ["이튼"],
      en: ["Eaton"]
    },
    description: "Eaton Corporation plc",
    type: "Common Stock"
  },
  {
    symbol: "EQIX",
    names: {
      zh: ["Equinix"],
      ja: ["エクイニクス"],
      ko: ["에퀴닉스"],
      en: ["Equinix"]
    },
    description: "Equinix Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ADI",
    names: {
      zh: ["亚德诺", "亞德諾"],
      ja: ["アナログ・デバイセズ"],
      ko: ["아날로그 디바이스"],
      en: ["Analog Devices"]
    },
    description: "Analog Devices Inc.",
    type: "Common Stock"
  },
  {
    symbol: "PGR",
    names: {
      zh: ["Progressive"],
      ja: ["プログレッシブ"],
      ko: ["프로그레시브"],
      en: ["Progressive"]
    },
    description: "The Progressive Corporation",
    type: "Common Stock"
  },
  {
    symbol: "DUK",
    names: {
      zh: ["杜克能源"],
      ja: ["デューク・エナジー"],
      ko: ["듀크 에너지"],
      en: ["Duke Energy"]
    },
    description: "Duke Energy Corporation",
    type: "Common Stock"
  },
  {
    symbol: "BSX",
    names: {
      zh: ["波士顿科学", "波士頓科學"],
      ja: ["ボストン・サイエンティフィック"],
      ko: ["보스턴 사이언티픽"],
      en: ["Boston Scientific"]
    },
    description: "Boston Scientific Corporation",
    type: "Common Stock"
  },
  {
    symbol: "FI",
    names: {
      zh: ["Fiserv"],
      ja: ["ファイサーブ"],
      ko: ["피저브"],
      en: ["Fiserv"]
    },
    description: "Fiserv Inc.",
    type: "Common Stock"
  },
  {
    symbol: "BDX",
    names: {
      zh: ["碧迪", "碧迪醫療"],
      ja: ["ベクトン・ディッキンソン"],
      ko: ["벡톤디킨슨"],
      en: ["Becton Dickinson"]
    },
    description: "Becton Dickinson and Company",
    type: "Common Stock"
  },
  {
    symbol: "EL",
    names: {
      zh: ["雅诗兰黛", "雅詩蘭黛"],
      ja: ["エスティ ローダー"],
      ko: ["에스티 로더"],
      en: ["Estée Lauder"]
    },
    description: "The Estée Lauder Companies Inc.",
    type: "Common Stock"
  },
  {
    symbol: "LRCX",
    names: {
      zh: ["拉姆研究", "拉姆研究"],
      ja: ["ラムリサーチ"],
      ko: ["램 리서치"],
      en: ["Lam Research"]
    },
    description: "Lam Research Corporation",
    type: "Common Stock"
  },
  {
    symbol: "KLAC",
    names: {
      zh: ["科磊"],
      ja: ["KLA"],
      ko: ["KLA"],
      en: ["KLA"]
    },
    description: "KLA Corporation",
    type: "Common Stock"
  },
  {
    symbol: "WFC",
    names: {
      zh: ["富国银行", "富國銀行"],
      ja: ["ウェルズ・ファーゴ"],
      ko: ["웰스파고"],
      en: ["Wells Fargo"]
    },
    description: "Wells Fargo & Company",
    type: "Common Stock"
  },
  {
    symbol: "LLY",
    names: {
      zh: ["礼来", "禮來"],
      ja: ["イーライリリー"],
      ko: ["일라이 릴리"],
      en: ["Eli Lilly"]
    },
    description: "Eli Lilly and Company",
    type: "Common Stock"
  },
  {
    symbol: "LIN",
    names: {
      zh: ["林德"],
      ja: ["リンデ"],
      ko: ["린데"],
      en: ["Linde"]
    },
    description: "Linde plc",
    type: "Common Stock"
  },
  {
    symbol: "ACN",
    names: {
      zh: ["埃森哲", "埃森哲"],
      ja: ["アクセンチュア"],
      ko: ["액센츄어"],
      en: ["Accenture"]
    },
    description: "Accenture plc",
    type: "Common Stock"
  },
  {
    symbol: "PM",
    names: {
      zh: ["菲利普莫里斯", "菲利普莫里斯"],
      ja: ["フィリップ・モリス"],
      ko: ["필립 모리스"],
      en: ["Philip Morris"]
    },
    description: "Philip Morris International Inc.",
    type: "Common Stock"
  },

  // 标普500 Top 101-150
  {
    symbol: "ABT",
    names: {
      zh: ["雅培", "雅培"],
      ja: ["アボット"],
      ko: ["애보트"],
      en: ["Abbott"]
    },
    description: "Abbott Laboratories",
    type: "Common Stock"
  },
  {
    symbol: "MS",
    names: {
      zh: ["摩根士丹利"],
      ja: ["モルガン・スタンレー"],
      ko: ["모건 스탠리"],
      en: ["Morgan Stanley"]
    },
    description: "Morgan Stanley",
    type: "Common Stock"
  },
  {
    symbol: "ISRG",
    names: {
      zh: ["直觉外科", "直覺外科"],
      ja: ["インテュイティブサージカル"],
      ko: ["인튜이티브 서지컬"],
      en: ["Intuitive Surgical"]
    },
    description: "Intuitive Surgical Inc.",
    type: "Common Stock"
  },
  {
    symbol: "INTU",
    names: {
      zh: ["Intuit"],
      ja: ["イントゥイット"],
      ko: ["인튜이트"],
      en: ["Intuit"]
    },
    description: "Intuit Inc.",
    type: "Common Stock"
  },
  {
    symbol: "TMO",
    names: {
      zh: ["赛默飞世尔", "賽默飛世爾"],
      ja: ["サーモフィッシャー"],
      ko: ["써모 피셔"],
      en: ["Thermo Fisher"]
    },
    description: "Thermo Fisher Scientific Inc.",
    type: "Common Stock"
  },
  {
    symbol: "TMUS",
    names: {
      zh: ["T-Mobile"],
      ja: ["T-モバイル"],
      ko: ["T-모바일"],
      en: ["T-Mobile"]
    },
    description: "T-Mobile US Inc.",
    type: "Common Stock"
  },
  {
    symbol: "HD",
    names: {
      zh: ["家得宝", "家得寶"],
      ja: ["ホーム・デポ"],
      ko: ["홈디포"],
      en: ["Home Depot"]
    },
    description: "The Home Depot Inc.",
    type: "Common Stock"
  },
  {
    symbol: "TGT",
    names: {
      zh: ["塔吉特"],
      ja: ["ターゲット"],
      ko: ["타겟"],
      en: ["Target"]
    },
    description: "Target Corporation",
    type: "Common Stock"
  },
  {
    symbol: "NOC",
    names: {
      zh: ["诺斯罗普格鲁曼", "諾斯羅普格魯曼"],
      ja: ["ノースロップ・グラマン"],
      ko: ["노스럽 그루먼"],
      en: ["Northrop Grumman"]
    },
    description: "Northrop Grumman Corporation",
    type: "Common Stock"
  },
  {
    symbol: "MO",
    names: {
      zh: ["奥驰亚", "奧馳亞"],
      ja: ["アルトリア"],
      ko: ["알트리아"],
      en: ["Altria"]
    },
    description: "Altria Group Inc.",
    type: "Common Stock"
  },
  {
    symbol: "AMAT",
    names: {
      zh: ["应用材料", "應用材料"],
      ja: ["アプライド マテリアルズ"],
      ko: ["어플라이드 머티어리얼스"],
      en: ["Applied Materials"]
    },
    description: "Applied Materials Inc.",
    type: "Common Stock"
  },
  {
    symbol: "SNPS",
    names: {
      zh: ["新思科技"],
      ja: ["シノプシス"],
      ko: ["시놉시스"],
      en: ["Synopsys"]
    },
    description: "Synopsys Inc.",
    type: "Common Stock"
  },
  {
    symbol: "AON",
    names: {
      zh: ["怡安", "怡安"],
      ja: ["エーオン"],
      ko: ["에이온"],
      en: ["Aon"]
    },
    description: "Aon plc",
    type: "Common Stock"
  },
  {
    symbol: "SHW",
    names: {
      zh: ["宣伟", "宣偉"],
      ja: ["シャーウィン・ウィリアムズ"],
      ko: ["셔윈 윌리엄스"],
      en: ["Sherwin-Williams"]
    },
    description: "The Sherwin-Williams Company",
    type: "Common Stock"
  },
  {
    symbol: "APH",
    names: {
      zh: ["安费诺", "安費諾"],
      ja: ["アンフェノール"],
      ko: ["앰페놀"],
      en: ["Amphenol"]
    },
    description: "Amphenol Corporation",
    type: "Common Stock"
  },
  {
    symbol: "HCA",
    names: {
      zh: ["HCA医疗", "HCA醫療"],
      ja: ["HCAヘルスケア"],
      ko: ["HCA 헬스케어"],
      en: ["HCA Healthcare"]
    },
    description: "HCA Healthcare Inc.",
    type: "Common Stock"
  },
  {
    symbol: "PH",
    names: {
      zh: ["派克汉尼汾", "派克漢尼汾"],
      ja: ["パーカー・ハネフィン"],
      ko: ["파커 하니핀"],
      en: ["Parker-Hannifin"]
    },
    description: "Parker-Hannifin Corporation",
    type: "Common Stock"
  },
  {
    symbol: "MCO",
    names: {
      zh: ["穆迪"],
      ja: ["ムーディーズ"],
      ko: ["무디스"],
      en: ["Moody's"]
    },
    description: "Moody's Corporation",
    type: "Common Stock"
  },
  {
    symbol: "CME",
    names: {
      zh: ["芝商所"],
      ja: ["CMEグループ"],
      ko: ["CME 그룹"],
      en: ["CME Group"]
    },
    description: "CME Group Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ICE",
    names: {
      zh: ["洲际交易所"],
      ja: ["インターコンチネンタル取引所"],
      ko: ["인터컨티넨털 거래소"],
      en: ["Intercontinental Exchange"]
    },
    description: "Intercontinental Exchange Inc.",
    type: "Common Stock"
  },
  {
    symbol: "USB",
    names: {
      zh: ["美国合众银行", "美國合眾銀行"],
      ja: ["USバンコープ"],
      ko: ["US뱅코프"],
      en: ["U.S. Bancorp"]
    },
    description: "U.S. Bancorp",
    type: "Common Stock"
  },
  {
    symbol: "ITW",
    names: {
      zh: ["伊利诺伊工具", "伊利諾伊工具"],
      ja: ["イリノイ・ツール・ワークス"],
      ko: ["일리노이 툴 웍스"],
      en: ["Illinois Tool Works"]
    },
    description: "Illinois Tool Works Inc.",
    type: "Common Stock"
  },
  {
    symbol: "MSI",
    names: {
      zh: ["摩托罗拉系统", "摩托羅拉系統"],
      ja: ["モトローラ・ソリューションズ"],
      ko: ["모토로라 솔루션스"],
      en: ["Motorola Solutions"]
    },
    description: "Motorola Solutions Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CDNS",
    names: {
      zh: ["铿腾电子", "鏗騰電子"],
      ja: ["ケイデンス・デザイン・システムズ"],
      ko: ["케이던스 디자인 시스템즈"],
      en: ["Cadence"]
    },
    description: "Cadence Design Systems Inc.",
    type: "Common Stock"
  },
  {
    symbol: "FDX",
    names: {
      zh: ["联邦快递", "聯邦快遞"],
      ja: ["フェデックス"],
      ko: ["페덱스"],
      en: ["FedEx"]
    },
    description: "FedEx Corporation",
    type: "Common Stock"
  },
  {
    symbol: "COF",
    names: {
      zh: ["第一资本", "第一資本"],
      ja: ["キャピタル・ワン"],
      ko: ["캐피털 원"],
      en: ["Capital One"]
    },
    description: "Capital One Financial Corporation",
    type: "Common Stock"
  },
  {
    symbol: "CL",
    names: {
      zh: ["高露洁"],
      ja: ["コルゲート・パーモリーブ"],
      ko: ["콜게이트"],
      en: ["Colgate-Palmolive"]
    },
    description: "Colgate-Palmolive Company",
    type: "Common Stock"
  },
  {
    symbol: "NXPI",
    names: {
      zh: ["恩智浦"],
      ja: ["NXPセミコンダクターズ"],
      ko: ["NXP 반도체"],
      en: ["NXP Semiconductors"]
    },
    description: "NXP Semiconductors N.V.",
    type: "Common Stock"
  },
  {
    symbol: "TT",
    names: {
      zh: ["特灵科技"],
      ja: ["トレイン・テクノロジーズ"],
      ko: ["트레인 테크놀로지스"],
      en: ["Trane Technologies"]
    },
    description: "Trane Technologies plc",
    type: "Common Stock"
  },
  {
    symbol: "MRVL",
    names: {
      zh: ["迈威尔", "邁威爾"],
      ja: ["マーベル・テクノロジー"],
      ko: ["마블 테크놀로지"],
      en: ["Marvell"]
    },
    description: "Marvell Technology Inc.",
    type: "Common Stock"
  },
  {
    symbol: "MELI",
    names: {
      zh: ["美客多"],
      ja: ["メルカドリブレ"],
      ko: ["메르카도리브레"],
      en: ["MercadoLibre"]
    },
    description: "MercadoLibre Inc.",
    type: "Common Stock"
  },
  {
    symbol: "MNST",
    names: {
      zh: ["怪物饮料", "怪物飲料"],
      ja: ["モンスター・ビバレッジ"],
      ko: ["몬스터 베버리지"],
      en: ["Monster Beverage"]
    },
    description: "Monster Beverage Corporation",
    type: "Common Stock"
  },
  {
    symbol: "PANW",
    names: {
      zh: ["派拓网络", "派拓網絡"],
      ja: ["パロアルトネットワークス"],
      ko: ["팔로알토 네트웍스"],
      en: ["Palo Alto Networks"]
    },
    description: "Palo Alto Networks Inc.",
    type: "Common Stock"
  },
  {
    symbol: "HUM",
    names: {
      zh: ["哈门那", "哈門那"],
      ja: ["ヒューマナ"],
      ko: ["휴머나"],
      en: ["Humana"]
    },
    description: "Humana Inc.",
    type: "Common Stock"
  },
  {
    symbol: "GD",
    names: {
      zh: ["通用动力", "通用動力"],
      ja: ["ゼネラル・ダイナミクス"],
      ko: ["제너럴 다이내믹스"],
      en: ["General Dynamics"]
    },
    description: "General Dynamics Corporation",
    type: "Common Stock"
  },
  {
    symbol: "WM",
    names: {
      zh: ["废物管理", "廢物管理"],
      ja: ["ウェイスト・マネジメント"],
      ko: ["웨이스트 매니지먼트"],
      en: ["Waste Management"]
    },
    description: "Waste Management Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ROP",
    names: {
      zh: ["罗珀科技", "羅珀科技"],
      ja: ["ロパー・テクノロジーズ"],
      ko: ["로퍼 테크놀로지스"],
      en: ["Roper Technologies"]
    },
    description: "Roper Technologies Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CARR",
    names: {
      zh: ["开利", "開利"],
      ja: ["キャリア"],
      ko: ["캐리어"],
      en: ["Carrier"]
    },
    description: "Carrier Global Corporation",
    type: "Common Stock"
  },
  {
    symbol: "CCI",
    names: {
      zh: ["冠城", "冠城"],
      ja: ["クラウン・キャッスル"],
      ko: ["크라운 캐슬"],
      en: ["Crown Castle"]
    },
    description: "Crown Castle Inc.",
    type: "Common Stock"
  },
  {
    symbol: "MCK",
    names: {
      zh: ["麦克森", "麥克森"],
      ja: ["マッケソン"],
      ko: ["맥케슨"],
      en: ["McKesson"]
    },
    description: "McKesson Corporation",
    type: "Common Stock"
  },
  {
    symbol: "ECL",
    names: {
      zh: ["艺康", "藝康"],
      ja: ["エコラボ"],
      ko: ["에코랩"],
      en: ["Ecolab"]
    },
    description: "Ecolab Inc.",
    type: "Common Stock"
  },
  {
    symbol: "TRV",
    names: {
      zh: ["旅行者保险", "旅行者保險"],
      ja: ["トラベラーズ"],
      ko: ["트래블러스"],
      en: ["Travelers"]
    },
    description: "The Travelers Companies Inc.",
    type: "Common Stock"
  },
  {
    symbol: "PSA",
    names: {
      zh: ["公共储存"],
      ja: ["パブリック・ストレージ"],
      ko: ["퍼블릭 스토리지"],
      en: ["Public Storage"]
    },
    description: "Public Storage",
    type: "Common Stock"
  },
  {
    symbol: "SRE",
    names: {
      zh: ["桑普拉能源"],
      ja: ["センプラ・エナジー"],
      ko: ["셈프라 에너지"],
      en: ["Sempra"]
    },
    description: "Sempra",
    type: "Common Stock"
  },
  {
    symbol: "AJG",
    names: {
      zh: ["怡安盖勒格", "怡安蓋勒格"],
      ja: ["アーサー・J・ギャラガー"],
      ko: ["아서 J. 갤러거"],
      en: ["Arthur J. Gallagher"]
    },
    description: "Arthur J. Gallagher & Co.",
    type: "Common Stock"
  },
  {
    symbol: "FTNT",
    names: {
      zh: ["飞塔", "飛塔"],
      ja: ["フォーティネット"],
      ko: ["포티넷"],
      en: ["Fortinet"]
    },
    description: "Fortinet Inc.",
    type: "Common Stock"
  },
  {
    symbol: "O",
    names: {
      zh: ["Realty Income"],
      ja: ["リアルティ・インカム"],
      ko: ["리얼티 인컴"],
      en: ["Realty Income"]
    },
    description: "Realty Income Corporation",
    type: "Common Stock"
  },
  {
    symbol: "AZO",
    names: {
      zh: ["汽车地带", "汽車地帶"],
      ja: ["オートゾーン"],
      ko: ["오토존"],
      en: ["AutoZone"]
    },
    description: "AutoZone Inc.",
    type: "Common Stock"
  },
  {
    symbol: "FICO",
    names: {
      zh: ["费埃哲", "費埃哲"],
      ja: ["FICO"],
      ko: ["FICO"],
      en: ["Fair Isaac"]
    },
    description: "Fair Isaac Corporation",
    type: "Common Stock"
  },

  // 标普500 Top 151-200
  {
    symbol: "NSC",
    names: {
      zh: ["诺福克南方", "諾福克南方"],
      ja: ["ノーフォーク・サザン"],
      ko: ["노퍽 서던"],
      en: ["Norfolk Southern"]
    },
    description: "Norfolk Southern Corporation",
    type: "Common Stock"
  },
  {
    symbol: "APD",
    names: {
      zh: ["空气化工产品", "空氣化工產品"],
      ja: ["エア・プロダクツ"],
      ko: ["에어 프로덕츠"],
      en: ["Air Products"]
    },
    description: "Air Products and Chemicals Inc.",
    type: "Common Stock"
  },
  {
    symbol: "WELL",
    names: {
      zh: ["Welltower"],
      ja: ["ウェルタワー"],
      ko: ["웰타워"],
      en: ["Welltower"]
    },
    description: "Welltower Inc.",
    type: "Common Stock"
  },
  {
    symbol: "EMR",
    names: {
      zh: ["艾默生电气", "艾默生電氣"],
      ja: ["エマソン"],
      ko: ["에머슨"],
      en: ["Emerson"]
    },
    description: "Emerson Electric Co.",
    type: "Common Stock"
  },
  {
    symbol: "KMB",
    names: {
      zh: ["金佰利", "金佰利"],
      ja: ["キンバリー・クラーク"],
      ko: ["킴벌리 클라크"],
      en: ["Kimberly-Clark"]
    },
    description: "Kimberly-Clark Corporation",
    type: "Common Stock"
  },
  {
    symbol: "CTAS",
    names: {
      zh: ["信达思"],
      ja: ["シンタス"],
      ko: ["신타스"],
      en: ["Cintas"]
    },
    description: "Cintas Corporation",
    type: "Common Stock"
  },
  {
    symbol: "DLR",
    names: {
      zh: ["Digital Realty"],
      ja: ["デジタル・リアルティ"],
      ko: ["디지털 리얼티"],
      en: ["Digital Realty"]
    },
    description: "Digital Realty Trust Inc.",
    type: "Common Stock"
  },
  {
    symbol: "PNC",
    names: {
      zh: ["PNC金融", "PNC金融"],
      ja: ["PNCファイナンシャル"],
      ko: ["PNC 파이낸셜"],
      en: ["PNC Financial"]
    },
    description: "The PNC Financial Services Group Inc.",
    type: "Common Stock"
  },
  {
    symbol: "RSG",
    names: {
      zh: ["共和服务", "共和服務"],
      ja: ["リパブリック・サービシズ"],
      ko: ["리퍼블릭 서비스"],
      en: ["Republic Services"]
    },
    description: "Republic Services Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ORLY",
    names: {
      zh: ["奥莱利汽配", "奧萊利汽配"],
      ja: ["オライリー"],
      ko: ["오라일리"],
      en: ["O'Reilly Automotive"]
    },
    description: "O'Reilly Automotive Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DHR",
    names: {
      zh: ["丹纳赫", "丹納赫"],
      ja: ["ダナハー"],
      ko: ["다나허"],
      en: ["Danaher"]
    },
    description: "Danaher Corporation",
    type: "Common Stock"
  },
  {
    symbol: "AIG",
    names: {
      zh: ["美国国际集团", "美國國際集團"],
      ja: ["AIG"],
      ko: ["AIG"],
      en: ["AIG"]
    },
    description: "American International Group Inc.",
    type: "Common Stock"
  },
  {
    symbol: "EW",
    names: {
      zh: ["爱德华兹生命科学", "愛德華茲生命科學"],
      ja: ["エドワーズライフサイエンシズ"],
      ko: ["에드워즈 라이프사이언시스"],
      en: ["Edwards Lifesciences"]
    },
    description: "Edwards Lifesciences Corporation",
    type: "Common Stock"
  },
  {
    symbol: "GWW",
    names: {
      zh: ["固安捷"],
      ja: ["グレンジャー"],
      ko: ["그레인저"],
      en: ["W.W. Grainger"]
    },
    description: "W.W. Grainger Inc.",
    type: "Common Stock"
  },
  {
    symbol: "OXY",
    names: {
      zh: ["西方石油"],
      ja: ["オクシデンタル・ペトロリアム"],
      ko: ["옥시덴탈 페트롤리엄"],
      en: ["Occidental Petroleum"]
    },
    description: "Occidental Petroleum Corporation",
    type: "Common Stock"
  },
  {
    symbol: "IDXX",
    names: {
      zh: ["爱德士", "愛德士"],
      ja: ["アイデックス"],
      ko: ["아이덱스"],
      en: ["IDEXX"]
    },
    description: "IDEXX Laboratories Inc.",
    type: "Common Stock"
  },
  {
    symbol: "KMI",
    names: {
      zh: ["金德尔摩根", "金德爾摩根"],
      ja: ["キンダー・モルガン"],
      ko: ["킨더 모건"],
      en: ["Kinder Morgan"]
    },
    description: "Kinder Morgan Inc.",
    type: "Common Stock"
  },
  {
    symbol: "TEL",
    names: {
      zh: ["泰科电子", "泰科電子"],
      ja: ["TEコネクティビティ"],
      ko: ["TE 커넥티비티"],
      en: ["TE Connectivity"]
    },
    description: "TE Connectivity Ltd.",
    type: "Common Stock"
  },
  {
    symbol: "SYY",
    names: {
      zh: ["西斯科", "西斯科"],
      ja: ["シスコ"],
      ko: ["시스코"],
      en: ["Sysco"]
    },
    description: "Sysco Corporation",
    type: "Common Stock"
  },
  {
    symbol: "PCAR",
    names: {
      zh: ["帕卡"],
      ja: ["パッカー"],
      ko: ["팩카"],
      en: ["PACCAR"]
    },
    description: "PACCAR Inc.",
    type: "Common Stock"
  },
  {
    symbol: "AFL",
    names: {
      zh: ["aflac"],
      ja: ["アフラック"],
      ko: ["aflac"],
      en: ["Aflac"]
    },
    description: "Aflac Incorporated",
    type: "Common Stock"
  },
  {
    symbol: "PAYX",
    names: {
      zh: ["Paychex"],
      ja: ["ペイチェックス"],
      ko: ["페이첵스"],
      en: ["Paychex"]
    },
    description: "Paychex Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ALL",
    names: {
      zh: ["好事达", "好事達"],
      ja: ["オールステート"],
      ko: ["올스테이트"],
      en: ["Allstate"]
    },
    description: "The Allstate Corporation",
    type: "Common Stock"
  },
  {
    symbol: "AMP",
    names: {
      zh: ["美国安泰", "美國安泰"],
      ja: ["アメリプライズ"],
      ko: ["아메리프라이즈"],
      en: ["Ameriprise"]
    },
    description: "Ameriprise Financial Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CMG",
    names: {
      zh: ["Chipotle"],
      ja: ["チポトレ"],
      ko: ["치폴레"],
      en: ["Chipotle"]
    },
    description: "Chipotle Mexican Grill Inc.",
    type: "Common Stock"
  },
  {
    symbol: "NDAQ",
    names: {
      zh: ["纳斯达克", "納斯達克"],
      ja: ["ナスダック"],
      ko: ["나스닥"],
      en: ["Nasdaq"]
    },
    description: "Nasdaq Inc.",
    type: "Common Stock"
  },
  {
    symbol: "FAST",
    names: {
      zh: ["快扣", "快扣"],
      ja: ["ファスナル"],
      ko: ["파스널"],
      en: ["Fastenal"]
    },
    description: "Fastenal Company",
    type: "Common Stock"
  },
  {
    symbol: "CSX",
    names: {
      zh: ["CSX运输", "CSX運輸"],
      ja: ["CSX"],
      ko: ["CSX"],
      en: ["CSX"]
    },
    description: "CSX Corporation",
    type: "Common Stock"
  },
  {
    symbol: "ODFL",
    names: {
      zh: ["老道明", "老道明"],
      ja: ["オールド・ドミニオン"],
      ko: ["올드 도미니언"],
      en: ["Old Dominion"]
    },
    description: "Old Dominion Freight Line Inc.",
    type: "Common Stock"
  },
  {
    symbol: "VRSK",
    names: {
      zh: ["Verisk"],
      ja: ["ベリスク"],
      ko: ["베리스크"],
      en: ["Verisk"]
    },
    description: "Verisk Analytics Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DD",
    names: {
      zh: ["杜邦", "杜邦"],
      ja: ["デュポン"],
      ko: ["듀폰"],
      en: ["DuPont"]
    },
    description: "DuPont de Nemours Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CPRT",
    names: {
      zh: ["科帕特", "科帕特"],
      ja: ["コパート"],
      ko: ["코파트"],
      en: ["Copart"]
    },
    description: "Copart Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DXCM",
    names: {
      zh: ["德康医疗", "德康醫療"],
      ja: ["デクスコム"],
      ko: ["덱스컴"],
      en: ["Dexcom"]
    },
    description: "DexCom Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CEG",
    names: {
      zh: ["星座能源"],
      ja: ["コンステレーション・エナジー"],
      ko: ["컨스텔레이션 에너지"],
      en: ["Constellation Energy"]
    },
    description: "Constellation Energy Corporation",
    type: "Common Stock"
  },
  {
    symbol: "VST",
    names: {
      zh: ["Vistra"],
      ja: ["ビストラ"],
      ko: ["비스트라"],
      en: ["Vistra"]
    },
    description: "Vistra Corp.",
    type: "Common Stock"
  },
  {
    symbol: "MSCI",
    names: {
      zh: ["明晟"],
      ja: ["MSCI"],
      ko: ["MSCI"],
      en: ["MSCI"]
    },
    description: "MSCI Inc.",
    type: "Common Stock"
  },
  {
    symbol: "MCHP",
    names: {
      zh: ["微芯科技"],
      ja: ["マイクロチップ"],
      ko: ["마이크로칩"],
      en: ["Microchip"]
    },
    description: "Microchip Technology Incorporated",
    type: "Common Stock"
  },
  {
    symbol: "YUM",
    names: {
      zh: ["百胜餐饮", "百勝餐飲"],
      ja: ["ヤム・ブランズ"],
      ko: ["얌! 브랜즈"],
      en: ["Yum! Brands"]
    },
    description: "Yum! Brands Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CBRE",
    names: {
      zh: ["世邦魏理仕"],
      ja: ["CBRE"],
      ko: ["CBRE"],
      en: ["CBRE"]
    },
    description: "CBRE Group Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ROK",
    names: {
      zh: ["罗克韦尔", "羅克韋爾"],
      ja: ["ロックウェル"],
      ko: ["록웰"],
      en: ["Rockwell"]
    },
    description: "Rockwell Automation Inc.",
    type: "Common Stock"
  },
  {
    symbol: "TDG",
    names: {
      zh: ["泛达控股"],
      ja: ["トランスダイム"],
      ko: ["트랜스다임"],
      en: ["TransDigm"]
    },
    description: "TransDigm Group Incorporated",
    type: "Common Stock"
  },
  {
    symbol: "URI",
    names: {
      zh: ["联合租赁", "聯合租賃"],
      ja: ["ユナイテッド・レンタルズ"],
      ko: ["유나이티드 렌탈스"],
      en: ["United Rentals"]
    },
    description: "United Rentals Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ADSK",
    names: {
      zh: ["欧特克", "歐特克"],
      ja: ["オートデスク"],
      ko: ["오토데스크"],
      en: ["Autodesk"]
    },
    description: "Autodesk Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ON",
    names: {
      zh: ["安森美"],
      ja: ["オン・セミコンダクター"],
      ko: ["온세미컨덕터"],
      en: ["ON Semiconductor"]
    },
    description: "ON Semiconductor Corporation",
    type: "Common Stock"
  },
  {
    symbol: "EXC",
    names: {
      zh: ["Exelon"],
      ja: ["エクセロン"],
      ko: ["엑셀론"],
      en: ["Exelon"]
    },
    description: "Exelon Corporation",
    type: "Common Stock"
  },
  {
    symbol: "ROST",
    names: {
      zh: ["罗斯百货", "羅斯百貨"],
      ja: ["ロス・ストアーズ"],
      ko: ["로스 스토어즈"],
      en: ["Ross Stores"]
    },
    description: "Ross Stores Inc.",
    type: "Common Stock"
  },
  {
    symbol: "KVUE",
    names: {
      zh: ["Kenvue"],
      ja: ["ケンヴュー"],
      ko: ["켄뷰"],
      en: ["Kenvue"]
    },
    description: "Kenvue Inc.",
    type: "Common Stock"
  },
  {
    symbol: "FANG",
    names: {
      zh: ["Diamondback Energy"],
      ja: ["ダイヤモンドバック"],
      ko: ["다이아몬드백"],
      en: ["Diamondback Energy"]
    },
    description: "Diamondback Energy Inc.",
    type: "Common Stock"
  },

  // 标普500 Top 201-275
  {
    symbol: "DELL",
    names: {
      zh: ["戴尔", "戴爾"],
      ja: ["デル"],
      ko: ["델"],
      en: ["Dell"]
    },
    description: "Dell Technologies Inc.",
    type: "Common Stock"
  },
  {
    symbol: "BIIB",
    names: {
      zh: ["百健"],
      ja: ["バイオジェン"],
      ko: ["바이오젠"],
      en: ["Biogen"]
    },
    description: "Biogen Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CTVA",
    names: {
      zh: ["科迪华", "科迪華"],
      ja: ["コルテバ"],
      ko: ["코르테바"],
      en: ["Corteva"]
    },
    description: "Corteva Inc.",
    type: "Common Stock"
  },
  {
    symbol: "A",
    names: {
      zh: ["安捷伦"],
      ja: ["アジレント"],
      ko: ["애질런트"],
      en: ["Agilent"]
    },
    description: "Agilent Technologies Inc.",
    type: "Common Stock"
  },
  {
    symbol: "EA",
    names: {
      zh: ["艺电", "藝電"],
      ja: ["エレクトロニック・アーツ"],
      ko: ["일렉트로닉 아츠"],
      en: ["Electronic Arts"]
    },
    description: "Electronic Arts Inc.",
    type: "Common Stock"
  },
  {
    symbol: "HES",
    names: {
      zh: ["赫斯"],
      ja: ["ヘス"],
      ko: ["헤스"],
      en: ["Hess"]
    },
    description: "Hess Corporation",
    type: "Common Stock"
  },
  {
    symbol: "KHC",
    names: {
      zh: ["卡夫亨氏"],
      ja: ["クラフト・ハインツ"],
      ko: ["크래프트 하인즈"],
      en: ["Kraft Heinz"]
    },
    description: "The Kraft Heinz Company",
    type: "Common Stock"
  },
  {
    symbol: "EXR",
    names: {
      zh: ["Extra Space Storage"],
      ja: ["エクストラ・スペース・ストレージ"],
      ko: ["엑스트라 스페이스 스토리지"],
      en: ["Extra Space Storage"]
    },
    description: "Extra Space Storage Inc.",
    type: "Common Stock"
  },
  {
    symbol: "STZ",
    names: {
      zh: ["星座品牌"],
      ja: ["コンステレーション・ブランズ"],
      ko: ["컨스텔레이션 브랜즈"],
      en: ["Constellation Brands"]
    },
    description: "Constellation Brands Inc.",
    type: "Common Stock"
  },
  {
    symbol: "HPQ",
    names: {
      zh: ["惠普", "惠普"],
      ja: ["HP"],
      ko: ["HP"],
      en: ["HP"]
    },
    description: "HP Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DVN",
    names: {
      zh: ["德文能源"],
      ja: ["デボン・エナジー"],
      ko: ["데본 에너지"],
      en: ["Devon Energy"]
    },
    description: "Devon Energy Corporation",
    type: "Common Stock"
  },
  {
    symbol: "AEP",
    names: {
      zh: ["美国电力", "美國電力"],
      ja: ["アメリカン・エレクトリック・パワー"],
      ko: ["아메리칸 일렉트릭 파워"],
      en: ["American Electric Power"]
    },
    description: "American Electric Power Company Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DAL",
    names: {
      zh: ["达美航空", "達美航空"],
      ja: ["デルタ航空"],
      ko: ["델타 항공"],
      en: ["Delta Air Lines"]
    },
    description: "Delta Air Lines Inc.",
    type: "Common Stock"
  },
  {
    symbol: "APP",
    names: {
      zh: ["AppLovin"],
      ja: ["アップラビン"],
      ko: ["앱러빈"],
      en: ["AppLovin"]
    },
    description: "AppLovin Corporation",
    type: "Common Stock"
  },
  {
    symbol: "XEL",
    names: {
      zh: ["Xcel Energy"],
      ja: ["エクセル・エナジー"],
      ko: ["엑셀 에너지"],
      en: ["Xcel Energy"]
    },
    description: "Xcel Energy Inc.",
    type: "Common Stock"
  },
  {
    symbol: "MPWR",
    names: {
      zh: ["芯源系统", "芯源系統"],
      ja: ["モノリシック・パワー・システムズ"],
      ko: ["모놀리식 파워 시스템즈"],
      en: ["Monolithic Power"]
    },
    description: "Monolithic Power Systems Inc.",
    type: "Common Stock"
  },
  {
    symbol: "IR",
    names: {
      zh: ["英格索兰"],
      ja: ["インガソール・ランド"],
      ko: ["잉거솔 랜드"],
      en: ["Ingersoll Rand"]
    },
    description: "Ingersoll Rand Inc.",
    type: "Common Stock"
  },
  {
    symbol: "GEHC",
    names: {
      zh: ["通用医疗", "通用醫療"],
      ja: ["GEヘルスケア"],
      ko: ["GE 헬스케어"],
      en: ["GE HealthCare"]
    },
    description: "GE HealthCare Technologies Inc.",
    type: "Common Stock"
  },
  {
    symbol: "IQV",
    names: {
      zh: ["IQVIA"],
      ja: ["アイキューヴィア"],
      ko: ["아이큐비아"],
      en: ["IQVIA"]
    },
    description: "IQVIA Holdings Inc.",
    type: "Common Stock"
  },
  {
    symbol: "TTWO",
    names: {
      zh: ["Take-Two"],
      ja: ["テイクツー"],
      ko: ["테이크투"],
      en: ["Take-Two"]
    },
    description: "Take-Two Interactive Software Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ACGL",
    names: {
      zh: ["Arch Capital"],
      ja: ["アーチ・キャピタル"],
      ko: ["아치 캐피탈"],
      en: ["Arch Capital"]
    },
    description: "Arch Capital Group Ltd.",
    type: "Common Stock"
  },
  {
    symbol: "PCG",
    names: {
      zh: ["太平洋煤电", "太平洋煤電"],
      ja: ["PG&E"],
      ko: ["PG&E"],
      en: ["PG&E"]
    },
    description: "PG&E Corporation",
    type: "Common Stock"
  },
  {
    symbol: "RMD",
    names: {
      zh: ["瑞思迈", "瑞思邁"],
      ja: ["レスメド"],
      ko: ["레스메드"],
      en: ["ResMed"]
    },
    description: "ResMed Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ED",
    names: {
      zh: ["爱迪生联合电气", "愛迪生聯合電氣"],
      ja: ["コンソリデーテッド・エジソン"],
      ko: ["컨솔리데이티드 에디슨"],
      en: ["Consolidated Edison"]
    },
    description: "Consolidated Edison Inc.",
    type: "Common Stock"
  },
  {
    symbol: "D",
    names: {
      zh: ["道明尼能源"],
      ja: ["ドミニオン・エナジー"],
      ko: ["도미니언 에너지"],
      en: ["Dominion Energy"]
    },
    description: "Dominion Energy Inc.",
    type: "Common Stock"
  },
  {
    symbol: "EBAY",
    names: {
      zh: ["eBay", "易贝", "易貝"],
      ja: ["イーベイ"],
      ko: ["이베이"],
      en: ["eBay"]
    },
    description: "eBay Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ANSS",
    names: {
      zh: ["ANSYS"],
      ja: ["アンシス"],
      ko: ["앤시스"],
      en: ["ANSYS"]
    },
    description: "ANSYS Inc.",
    type: "Common Stock"
  },
  {
    symbol: "BK",
    names: {
      zh: ["纽约梅隆银行", "紐約梅隆銀行"],
      ja: ["バンク・オブ・ニューヨーク・メロン"],
      ko: ["뱅크 오브 뉴욕 멜론"],
      en: ["Bank of New York Mellon"]
    },
    description: "The Bank of New York Mellon Corporation",
    type: "Common Stock"
  },
  {
    symbol: "VICI",
    names: {
      zh: ["VICI Properties"],
      ja: ["VICIプロパティーズ"],
      ko: ["VICI 프로퍼티스"],
      en: ["VICI Properties"]
    },
    description: "VICI Properties Inc.",
    type: "Common Stock"
  },
  {
    symbol: "HLT",
    names: {
      zh: ["希尔顿", "希爾頓"],
      ja: ["ヒルトン"],
      ko: ["힐튼"],
      en: ["Hilton"]
    },
    description: "Hilton Worldwide Holdings Inc.",
    type: "Common Stock"
  },
  {
    symbol: "KEYS",
    names: {
      zh: ["是德科技"],
      ja: ["キーサイト・テクノロジーズ"],
      ko: ["키사이트 테크놀로지스"],
      en: ["Keysight"]
    },
    description: "Keysight Technologies Inc.",
    type: "Common Stock"
  },
  {
    symbol: "PPG",
    names: {
      zh: ["PPG工业", "PPG工業"],
      ja: ["PPGインダストリーズ"],
      ko: ["PPG 인더스트리즈"],
      en: ["PPG"]
    },
    description: "PPG Industries Inc.",
    type: "Common Stock"
  },
  {
    symbol: "AWK",
    names: {
      zh: ["美国水务", "美國水務"],
      ja: ["アメリカン・ウォーター・ワークス"],
      ko: ["아메리칸 워터 웍스"],
      en: ["American Water Works"]
    },
    description: "American Water Works Company Inc.",
    type: "Common Stock"
  },
  {
    symbol: "UAL",
    names: {
      zh: ["联合大陆航空", "聯合大陸航空"],
      ja: ["ユナイテッド航空"],
      ko: ["유나이티드 항공"],
      en: ["United Airlines"]
    },
    description: "United Airlines Holdings Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ARES",
    names: {
      zh: ["阿瑞斯管理", "阿瑞斯管理"],
      ja: ["アレス・マネジメント"],
      ko: ["아레스 매니지먼트"],
      en: ["Ares Management"]
    },
    description: "Ares Management Corporation",
    type: "Common Stock"
  },
  {
    symbol: "CSGP",
    names: {
      zh: ["CoStar"],
      ja: ["コースター"],
      ko: ["코스타"],
      en: ["CoStar"]
    },
    description: "CoStar Group Inc.",
    type: "Common Stock"
  },
  {
    symbol: "WMB",
    names: {
      zh: ["威廉姆斯"],
      ja: ["ウィリアムズ"],
      ko: ["윌리엄스"],
      en: ["Williams"]
    },
    description: "The Williams Companies Inc.",
    type: "Common Stock"
  },
  {
    symbol: "TRGP",
    names: {
      zh: ["Targa Resources"],
      ja: ["ターガ・リソーシズ"],
      ko: ["타가 리소시스"],
      en: ["Targa Resources"]
    },
    description: "Targa Resources Corp.",
    type: "Common Stock"
  },
  {
    symbol: "CHTR",
    names: {
      zh: ["特许通信", "特許通信"],
      ja: ["チャーター・コミュニケーションズ"],
      ko: ["차터 커뮤니케이션즈"],
      en: ["Charter Communications"]
    },
    description: "Charter Communications Inc.",
    type: "Common Stock"
  },
  {
    symbol: "GIS",
    names: {
      zh: ["通用磨坊"],
      ja: ["ゼネラル・ミルズ"],
      ko: ["제너럴 밀즈"],
      en: ["General Mills"]
    },
    description: "General Mills Inc.",
    type: "Common Stock"
  },
  {
    symbol: "MTB",
    names: {
      zh: ["M&T银行", "M&T銀行"],
      ja: ["M&Tバンク"],
      ko: ["M&T 뱅크"],
      en: ["M&T Bank"]
    },
    description: "M&T Bank Corporation",
    type: "Common Stock"
  },
  {
    symbol: "AXON",
    names: {
      zh: ["Axon Enterprise"],
      ja: ["アクソン"],
      ko: ["액슨"],
      en: ["Axon"]
    },
    description: "Axon Enterprise Inc.",
    type: "Common Stock"
  },
  {
    symbol: "COR",
    names: {
      zh: ["科慕"],
      ja: ["コアブリッジ"],
      ko: ["코어브리지"],
      en: ["Cencora"]
    },
    description: "Cencora Inc.",
    type: "Common Stock"
  },
  {
    symbol: "HWM",
    names: {
      zh: ["豪威尔"],
      ja: ["ハウメット"],
      ko: ["하우멧"],
      en: ["Howmet"]
    },
    description: "Howmet Aerospace Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DFS",
    names: {
      zh: ["Discover金融", "Discover金融"],
      ja: ["ディスカバー"],
      ko: ["디스커버"],
      en: ["Discover"]
    },
    description: "Discover Financial Services",
    type: "Common Stock"
  },
  {
    symbol: "PRU",
    names: {
      zh: ["保德信", "保德信"],
      ja: ["プルデンシャル"],
      ko: ["프루덴셜"],
      en: ["Prudential"]
    },
    description: "Prudential Financial Inc.",
    type: "Common Stock"
  },
  {
    symbol: "GLW",
    names: {
      zh: ["康宁"],
      ja: ["コーニング"],
      ko: ["코닝"],
      en: ["Corning"]
    },
    description: "Corning Incorporated",
    type: "Common Stock"
  },
  {
    symbol: "LVS",
    names: {
      zh: ["金沙集团", "金沙集團"],
      ja: ["ラスベガス・サンズ"],
      ko: ["라스베이거스 샌즈"],
      en: ["Las Vegas Sands"]
    },
    description: "Las Vegas Sands Corp.",
    type: "Common Stock"
  },
  {
    symbol: "FITB",
    names: {
      zh: ["第五第三银行", "第五第三銀行"],
      ja: ["フィフス・サード"],
      ko: ["피프스 써드"],
      en: ["Fifth Third"]
    },
    description: "Fifth Third Bancorp",
    type: "Common Stock"
  },
  {
    symbol: "SRE",
    names: {
      zh: ["森普拉能源"],
      ja: ["センプラ"],
      ko: ["셈프라"],
      en: ["Sempra Energy"]
    },
    description: "Sempra Energy",
    type: "Common Stock"
  },
  {
    symbol: "WTW",
    names: {
      zh: ["韦莱韬悦", "韋萊韜悅"],
      ja: ["ウィリス・タワーズ・ワトソン"],
      ko: ["윌리스 타워스 왓슨"],
      en: ["Willis Towers Watson"]
    },
    description: "Willis Towers Watson Public Limited Company",
    type: "Common Stock"
  },
  {
    symbol: "NTRS",
    names: {
      zh: ["北方信托", "北方信託"],
      ja: ["ノーザン・トラスト"],
      ko: ["노던 트러스트"],
      en: ["Northern Trust"]
    },
    description: "Northern Trust Corporation",
    type: "Common Stock"
  },
  {
    symbol: "VMC",
    names: {
      zh: ["Vulcan Materials"],
      ja: ["バルカン・マテリアルズ"],
      ko: ["벌컨 머티리얼스"],
      en: ["Vulcan Materials"]
    },
    description: "Vulcan Materials Company",
    type: "Common Stock"
  },
  {
    symbol: "STT",
    names: {
      zh: ["道富银行", "道富銀行"],
      ja: ["ステート・ストリート"],
      ko: ["스테이트 스트리트"],
      en: ["State Street"]
    },
    description: "State Street Corporation",
    type: "Common Stock"
  },
  {
    symbol: "GDDY",
    names: {
      zh: ["GoDaddy"],
      ja: ["ゴーダディ"],
      ko: ["고대디"],
      en: ["GoDaddy"]
    },
    description: "GoDaddy Inc.",
    type: "Common Stock"
  },
  {
    symbol: "WBD",
    names: {
      zh: ["华纳兄弟探索", "華納兄弟探索"],
      ja: ["ワーナー・ブラザース・ディスカバリー"],
      ko: ["워너 브러더스 디스커버리"],
      en: ["Warner Bros. Discovery"]
    },
    description: "Warner Bros. Discovery Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DECK",
    names: {
      zh: ["Deckers"],
      ja: ["デッカーズ"],
      ko: ["데커스"],
      en: ["Deckers"]
    },
    description: "Deckers Outdoor Corporation",
    type: "Common Stock"
  },
  {
    symbol: "HUBB",
    names: {
      zh: ["哈贝尔"],
      ja: ["ハベル"],
      ko: ["허벨"],
      en: ["Hubbell"]
    },
    description: "Hubbell Incorporated",
    type: "Common Stock"
  },
  {
    symbol: "PWR",
    names: {
      zh: ["Quanta Services"],
      ja: ["クアンタ・サービシズ"],
      ko: ["콴타 서비스"],
      en: ["Quanta"]
    },
    description: "Quanta Services Inc.",
    type: "Common Stock"
  },
  {
    symbol: "FTV",
    names: {
      zh: ["富事华", "富事華"],
      ja: ["フォーティブ"],
      ko: ["포티브"],
      en: ["Fortive"]
    },
    description: "Fortive Corporation",
    type: "Common Stock"
  },
  {
    symbol: "WAB",
    names: {
      zh: ["西屋制动", "西屋制動"],
      ja: ["ウェスティングハウス・エア・ブレーキ"],
      ko: ["웨스팅하우스 에어 브레이크"],
      en: ["Westinghouse Air Brake"]
    },
    description: "Westinghouse Air Brake Technologies Corporation",
    type: "Common Stock"
  },
  {
    symbol: "HBAN",
    names: {
      zh: ["亨廷顿银行", "亨廷頓銀行"],
      ja: ["ハンティントン・バンクシェアーズ"],
      ko: ["헌팅턴 뱅크셰어스"],
      en: ["Huntington Bancshares"]
    },
    description: "Huntington Bancshares Incorporated",
    type: "Common Stock"
  },
  {
    symbol: "ZBRA",
    names: {
      zh: ["斑马技术"],
      ja: ["ゼブラ・テクノロジーズ"],
      ko: ["제브라 테크놀로지스"],
      en: ["Zebra Technologies"]
    },
    description: "Zebra Technologies Corporation",
    type: "Common Stock"
  },
  {
    symbol: "LDOS",
    names: {
      zh: ["莱多斯"],
      ja: ["レイドス"],
      ko: ["레이도스"],
      en: ["Leidos"]
    },
    description: "Leidos Holdings Inc.",
    type: "Common Stock"
  },
  {
    symbol: "RF",
    names: {
      zh: ["地区金融", "地區金融"],
      ja: ["リージョンズ"],
      ko: ["리전스"],
      en: ["Regions Financial"]
    },
    description: "Regions Financial Corporation",
    type: "Common Stock"
  },
  {
    symbol: "INVH",
    names: {
      zh: ["Invitation Homes"],
      ja: ["インビテーション・ホームズ"],
      ko: ["인비테이션 홈즈"],
      en: ["Invitation Homes"]
    },
    description: "Invitation Homes Inc.",
    type: "Common Stock"
  },
  {
    symbol: "BALL",
    names: {
      zh: ["波尔公司"],
      ja: ["ボール"],
      ko: ["볼"],
      en: ["Ball"]
    },
    description: "Ball Corporation",
    type: "Common Stock"
  },
  {
    symbol: "CFG",
    names: {
      zh: ["Citizens金融", "Citizens金融"],
      ja: ["シチズンズ・ファイナンシャル"],
      ko: ["시티즌스 파이낸셜"],
      en: ["Citizens Financial"]
    },
    description: "Citizens Financial Group Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CMI",
    names: {
      zh: ["康明斯", "康明斯"],
      ja: ["カミンズ"],
      ko: ["커민스"],
      en: ["Cummins"]
    },
    description: "Cummins Inc.",
    type: "Common Stock"
  },
  {
    symbol: "SPG",
    names: {
      zh: ["西蒙地产", "西蒙地產"],
      ja: ["サイモン・プロパティー・グループ"],
      ko: ["사이먼 프로퍼티 그룹"],
      en: ["Simon Property Group"]
    },
    description: "Simon Property Group Inc.",
    type: "Common Stock"
  },
  {
    symbol: "MPC",
    names: {
      zh: ["马拉松石油", "馬拉松石油"],
      ja: ["マラソン・ペトロリアム"],
      ko: ["마라톤 페트롤리엄"],
      en: ["Marathon Petroleum"]
    },
    description: "Marathon Petroleum Corporation",
    type: "Common Stock"
  },
  {
    symbol: "PSX",
    names: {
      zh: ["菲利普66", "菲利普66"],
      ja: ["フィリップス66"],
      ko: ["필립스 66"],
      en: ["Phillips 66"]
    },
    description: "Phillips 66",
    type: "Common Stock"
  },
  {
    symbol: "LHX",
    names: {
      zh: ["L3哈里斯", "L3哈里斯"],
      ja: ["L3ハリス・テクノロジーズ"],
      ko: ["L3해리스"],
      en: ["L3Harris"]
    },
    description: "L3Harris Technologies Inc.",
    type: "Common Stock"
  },
  {
    symbol: "KR",
    names: {
      zh: ["克罗格", "克羅格"],
      ja: ["クローガー"],
      ko: ["크로거"],
      en: ["Kroger"]
    },
    description: "The Kroger Co.",
    type: "Common Stock"
  },
  {
    symbol: "PEG",
    names: {
      zh: ["公共服务企业集团", "公共服務企業集團"],
      ja: ["パブリック・サービス・エンタープライズ・グループ"],
      ko: ["퍼블릭 서비스 엔터프라이즈 그룹"],
      en: ["Public Service Enterprise Group"]
    },
    description: "Public Service Enterprise Group Inc.",
    type: "Common Stock"
  },
  {
    symbol: "GRMN",
    names: {
      zh: ["佳明", "佳明"],
      ja: ["ガーミン"],
      ko: ["가민"],
      en: ["Garmin"]
    },
    description: "Garmin Ltd.",
    type: "Common Stock"
  },
  {
    symbol: "MLM",
    names: {
      zh: ["马丁·玛丽埃塔", "馬丁·瑪麗埃塔"],
      ja: ["マーティン・マリエッタ"],
      ko: ["마틴 마리에타"],
      en: ["Martin Marietta"]
    },
    description: "Martin Marietta Materials Inc.",
    type: "Common Stock"
  },
  {
    symbol: "XYZ",
    names: {
      zh: ["Block", "Block"],
      ja: ["ブロック"],
      ko: ["블록"],
      en: ["Block", "Square"]
    },
    description: "Block Inc.",
    type: "Common Stock"
  },
  {
    symbol: "HSY",
    names: {
      zh: ["好时", "好時"],
      ja: ["ハーシー"],
      ko: ["허쉬"],
      en: ["Hershey"]
    },
    description: "The Hershey Company",
    type: "Common Stock"
  },
  {
    symbol: "NUE",
    names: {
      zh: ["纽柯", "紐柯"],
      ja: ["ニューコア"],
      ko: ["뉴코어"],
      en: ["Nucor"]
    },
    description: "Nucor Corporation",
    type: "Common Stock"
  },
  {
    symbol: "HIG",
    names: {
      zh: ["哈特福德金融", "哈特福德金融"],
      ja: ["ハートフォード"],
      ko: ["하트포드"],
      en: ["Hartford"]
    },
    description: "The Hartford Financial Services Group Inc.",
    type: "Common Stock"
  },
  {
    symbol: "WEC",
    names: {
      zh: ["WEC能源", "WEC能源"],
      ja: ["WECエナジー"],
      ko: ["WEC 에너지"],
      en: ["WEC Energy"]
    },
    description: "WEC Energy Group Inc.",
    type: "Common Stock"
  },
  {
    symbol: "XYL",
    names: {
      zh: ["赛莱默", "賽萊默"],
      ja: ["ザイレム"],
      ko: ["자일렘"],
      en: ["Xylem"]
    },
    description: "Xylem Inc.",
    type: "Common Stock"
  },
  {
    symbol: "EXPE",
    names: {
      zh: ["Expedia", "Expedia"],
      ja: ["エクスペディア"],
      ko: ["익스피디아"],
      en: ["Expedia"]
    },
    description: "Expedia Group Inc.",
    type: "Common Stock"
  },
  {
    symbol: "HPE",
    names: {
      zh: ["慧与", "慧與"],
      ja: ["ヒューレット・パッカード・エンタープライズ"],
      ko: ["휴렛 패커드 엔터프라이즈"],
      en: ["Hewlett Packard Enterprise", "HPE"]
    },
    description: "Hewlett Packard Enterprise Co.",
    type: "Common Stock"
  },
  {
    symbol: "NRG",
    names: {
      zh: ["NRG能源", "NRG能源"],
      ja: ["NRGエナジー"],
      ko: ["NRG 에너지"],
      en: ["NRG Energy"]
    },
    description: "NRG Energy Inc.",
    type: "Common Stock"
  },
  {
    symbol: "LEN",
    names: {
      zh: ["莱纳", "萊納"],
      ja: ["レナー"],
      ko: ["레나"],
      en: ["Lennar"]
    },
    description: "Lennar Corporation",
    type: "Common Stock"
  },
  {
    symbol: "K",
    names: {
      zh: ["家乐氏", "家樂氏"],
      ja: ["ケロッグ"],
      ko: ["켈로그"],
      en: ["Kellanova", "Kellogg"]
    },
    description: "Kellanova",
    type: "Common Stock"
  },
  {
    symbol: "EXE",
    names: {
      zh: ["Expand能源", "Expand能源"],
      ja: ["エクスパンド・エナジー"],
      ko: ["익스팬드 에너지"],
      en: ["Expand Energy"]
    },
    description: "Expand Energy Corporation",
    type: "Common Stock"
  },
  {
    symbol: "EME",
    names: {
      zh: ["EMCOR集团", "EMCOR集團"],
      ja: ["EMCORグループ"],
      ko: ["EMCOR 그룹"],
      en: ["EMCOR"]
    },
    description: "EMCOR Group Inc.",
    type: "Common Stock"
  },
  {
    symbol: "BR",
    names: {
      zh: ["Broadridge金融", "Broadridge金融"],
      ja: ["ブロードリッジ"],
      ko: ["브로드리지"],
      en: ["Broadridge"]
    },
    description: "Broadridge Financial Solutions Inc.",
    type: "Common Stock"
  },
  {
    symbol: "WRB",
    names: {
      zh: ["W. R. Berkley", "W. R. Berkley"],
      ja: ["W・R・バークレー"],
      ko: ["W. R. 버클리"],
      en: ["W. R. Berkley"]
    },
    description: "W. R. Berkley Corporation",
    type: "Common Stock"
  },
  {
    symbol: "PPL",
    names: {
      zh: ["PPL电力", "PPL電力"],
      ja: ["PPLコーポレーション"],
      ko: ["PPL"],
      en: ["PPL"]
    },
    description: "PPL Corporation",
    type: "Common Stock"
  },
  {
    symbol: "ES",
    names: {
      zh: ["Eversource能源", "Eversource能源"],
      ja: ["エバーソース・エナジー"],
      ko: ["에버소스 에너지"],
      en: ["Eversource Energy"]
    },
    description: "Eversource Energy",
    type: "Common Stock"
  },
  {
    symbol: "CNP",
    names: {
      zh: ["中点能源", "中點能源"],
      ja: ["センターポイント・エナジー"],
      ko: ["센터포인트 에너지"],
      en: ["CenterPoint Energy"]
    },
    description: "CenterPoint Energy Inc.",
    type: "Common Stock"
  },
  {
    symbol: "IP",
    names: {
      zh: ["国际纸业", "國際紙業"],
      ja: ["インターナショナル・ペーパー"],
      ko: ["인터내셔널 페이퍼"],
      en: ["International Paper"]
    },
    description: "International Paper Company",
    type: "Common Stock"
  },
  {
    symbol: "NI",
    names: {
      zh: ["NiSource", "NiSource"],
      ja: ["ナイソース"],
      ko: ["나이소스"],
      en: ["NiSource"]
    },
    description: "NiSource Inc.",
    type: "Common Stock"
  },
  {
    symbol: "INCY",
    names: {
      zh: ["Incyte", "Incyte"],
      ja: ["インサイト"],
      ko: ["인사이트"],
      en: ["Incyte"]
    },
    description: "Incyte Corporation",
    type: "Common Stock"
  },
  {
    symbol: "SW",
    names: {
      zh: ["Smurfit WestRock", "Smurfit WestRock"],
      ja: ["スマーフィット・ウエストロック"],
      ko: ["스머피트 웨스트록"],
      en: ["Smurfit WestRock"]
    },
    description: "Smurfit WestRock plc",
    type: "Common Stock"
  },
  {
    symbol: "CNC",
    names: {
      zh: ["Centene", "Centene"],
      ja: ["センティーン"],
      ko: ["센틴"],
      en: ["Centene"]
    },
    description: "Centene Corporation",
    type: "Common Stock"
  },
  {
    symbol: "GPN",
    names: {
      zh: ["环球支付", "環球支付"],
      ja: ["グローバル・ペイメンツ"],
      ko: ["글로벌 페이먼츠"],
      en: ["Global Payments"]
    },
    description: "Global Payments Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ZBH",
    names: {
      zh: ["捷迈邦美", "捷邁邦美"],
      ja: ["ジンマー・バイオメット"],
      ko: ["짐머 바이오멧"],
      en: ["Zimmer Biomet"]
    },
    description: "Zimmer Biomet Holdings Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CHRW",
    names: {
      zh: ["罗宾逊全球物流", "羅賓遜全球物流"],
      ja: ["C.H.ロビンソン"],
      ko: ["C.H. 로빈슨"],
      en: ["C.H. Robinson"]
    },
    description: "C.H. Robinson Worldwide Inc.",
    type: "Common Stock"
  },
  {
    symbol: "GPC",
    names: {
      zh: ["真正零部件", "真正零部件"],
      ja: ["ジェニュイン・パーツ"],
      ko: ["제뉴인 파츠"],
      en: ["Genuine Parts"]
    },
    description: "Genuine Parts Company",
    type: "Common Stock"
  },
  {
    symbol: "BG",
    names: {
      zh: ["邦吉", "邦吉"],
      ja: ["バンジ"],
      ko: ["번지"],
      en: ["Bunge"]
    },
    description: "Bunge Global SA",
    type: "Common Stock"
  },
  {
    symbol: "PKG",
    names: {
      zh: ["美国包装", "美國包裝"],
      ja: ["パッケージング・コーポレーション・オブ・アメリカ"],
      ko: ["패키징 코퍼레이션 오브 아메리카"],
      en: ["Packaging Corp"]
    },
    description: "Packaging Corporation of America",
    type: "Common Stock"
  },
  {
    symbol: "Q",
    names: {
      zh: ["Qnity电子", "Qnity電子"],
      ja: ["Qnity"],
      ko: ["Qnity"],
      en: ["Qnity"]
    },
    description: "Qnity Electronics",
    type: "Common Stock"
  },
  {
    symbol: "MKC",
    names: {
      zh: ["味好美", "味好美"],
      ja: ["マコーミック"],
      ko: ["맥코믹"],
      en: ["McCormick"]
    },
    description: "McCormick & Company Inc.",
    type: "Common Stock"
  },
  {
    symbol: "PNR",
    names: {
      zh: ["滨特尔", "濱特爾"],
      ja: ["ペンテア"],
      ko: ["펜테어"],
      en: ["Pentair"]
    },
    description: "Pentair plc",
    type: "Common Stock"
  },
  {
    symbol: "J",
    names: {
      zh: ["雅各布斯", "雅各布斯"],
      ja: ["ジェイコブス"],
      ko: ["제이콥스"],
      en: ["Jacobs"]
    },
    description: "Jacobs Solutions Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ESS",
    names: {
      zh: ["埃塞克斯地产", "埃塞克斯地產"],
      ja: ["エセックス・プロパティ・トラスト"],
      ko: ["에섹스 프로퍼티 트러스트"],
      en: ["Essex Property Trust"]
    },
    description: "Essex Property Trust Inc.",
    type: "Common Stock"
  },
  {
    symbol: "PSKY",
    names: {
      zh: ["派拉蒙天际", "派拉蒙天際"],
      ja: ["パラマウント・スカイダンス"],
      ko: ["파라마운트 스카이댄스"],
      en: ["Paramount Skydance"]
    },
    description: "Paramount Skydance Corp",
    type: "Common Stock"
  },
  {
    symbol: "WY",
    names: {
      zh: ["惠好", "惠好"],
      ja: ["ウェアハウザー"],
      ko: ["웨어하우저"],
      en: ["Weyerhaeuser"]
    },
    description: "Weyerhaeuser Company",
    type: "Common Stock"
  },
  {
    symbol: "BBY",
    names: {
      zh: ["百思买", "百思買"],
      ja: ["ベストバイ"],
      ko: ["베스트바이"],
      en: ["Best Buy"]
    },
    description: "Best Buy Co. Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ERIE",
    names: {
      zh: ["伊利保险", "伊利保險"],
      ja: ["エリー・インデムニティ"],
      ko: ["이리 인뎀니티"],
      en: ["Erie Indemnity"]
    },
    description: "Erie Indemnity Company",
    type: "Common Stock"
  },
  {
    symbol: "UHS",
    names: {
      zh: ["环球医疗", "環球醫療"],
      ja: ["ユニバーサル・ヘルス・サービシズ"],
      ko: ["유니버설 헬스 서비스"],
      en: ["Universal Health Services"]
    },
    description: "Universal Health Services Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ABNB",
    names: {
      zh: ["爱彼迎", "愛彼迎"],
      ja: ["エアビーアンドビー"],
      ko: ["에어비앤비"],
      en: ["Airbnb"]
    },
    description: "Airbnb Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ADM",
    names: {
      zh: ["阿彻丹尼尔斯米德兰", "阿徹丹尼爾斯米德蘭"],
      ja: ["アーチャー・ダニエルズ・ミッドランド"],
      ko: ["아처 대니얼스 미들랜드"],
      en: ["Archer Daniels Midland", "ADM"]
    },
    description: "Archer Daniels Midland Company",
    type: "Common Stock"
  },
  {
    symbol: "AEE",
    names: {
      zh: ["阿美伦", "阿美倫"],
      ja: ["アメレン"],
      ko: ["아머렌"],
      en: ["Ameren"]
    },
    description: "Ameren Corporation",
    type: "Common Stock"
  },
  {
    symbol: "AES",
    names: {
      zh: ["AES能源", "AES能源"],
      ja: ["AESコーポレーション"],
      ko: ["AES"],
      en: ["AES"]
    },
    description: "AES Corporation",
    type: "Common Stock"
  },
  {
    symbol: "AIZ",
    names: {
      zh: ["艾舒兰保险", "艾舒蘭保險"],
      ja: ["アシュアラント"],
      ko: ["어슈어런트"],
      en: ["Assurant"]
    },
    description: "Assurant Inc.",
    type: "Common Stock"
  },
  {
    symbol: "AKAM",
    names: {
      zh: ["阿卡迈", "阿卡邁"],
      ja: ["アカマイ・テクノロジーズ"],
      ko: ["아카마이"],
      en: ["Akamai"]
    },
    description: "Akamai Technologies Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ALGN",
    names: {
      zh: ["艾利科技", "艾利科技"],
      ja: ["アライン・テクノロジー"],
      ko: ["얼라인 테크놀로지"],
      en: ["Align Technology", "Invisalign"]
    },
    description: "Align Technology Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ALLE",
    names: {
      zh: ["安朗杰", "安朗杰"],
      ja: ["アレジオン"],
      ko: ["알레지온"],
      en: ["Allegion"]
    },
    description: "Allegion plc",
    type: "Common Stock"
  },
  {
    symbol: "AMCR",
    names: {
      zh: ["安姆科", "安姆科"],
      ja: ["アムコア"],
      ko: ["암코"],
      en: ["Amcor"]
    },
    description: "Amcor plc",
    type: "Common Stock"
  },
  {
    symbol: "AOS",
    names: {
      zh: ["艾欧史密斯", "艾歐史密斯"],
      ja: ["A・O・スミス"],
      ko: ["A. O. 스미스"],
      en: ["A. O. Smith"]
    },
    description: "A. O. Smith Corporation",
    type: "Common Stock"
  },
  {
    symbol: "APA",
    names: {
      zh: ["APA石油", "APA石油"],
      ja: ["APAコーポレーション"],
      ko: ["APA"],
      en: ["APA"]
    },
    description: "APA Corporation",
    type: "Common Stock"
  },
  {
    symbol: "APO",
    names: {
      zh: ["阿波罗全球管理", "阿波羅全球管理"],
      ja: ["アポロ・グローバル・マネジメント"],
      ko: ["아폴로 글로벌 매니지먼트"],
      en: ["Apollo Global"]
    },
    description: "Apollo Global Management Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ARE",
    names: {
      zh: ["亚历山德里亚房地产", "亞歷山德里亞房地產"],
      ja: ["アレクサンドリア・リアルエステート"],
      ko: ["알렉산드리아 부동산"],
      en: ["Alexandria Real Estate"]
    },
    description: "Alexandria Real Estate Equities Inc.",
    type: "Common Stock"
  },
  {
    symbol: "AMT",
    names: {
      zh: ["美国电塔", "美國電塔"],
      ja: ["アメリカン・タワー"],
      ko: ["아메리칸 타워"],
      en: ["American Tower"]
    },
    description: "American Tower Corporation",
    type: "Common Stock"
  },
  {
    symbol: "ANET",
    names: {
      zh: ["Arista网络", "Arista網絡"],
      ja: ["アリスタネットワークス"],
      ko: ["아리스타 네트웍스"],
      en: ["Arista Networks"]
    },
    description: "Arista Networks Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ATO",
    names: {
      zh: ["Atmos能源", "Atmos能源"],
      ja: ["アトモス・エナジー"],
      ko: ["애트모스 에너지"],
      en: ["Atmos Energy"]
    },
    description: "Atmos Energy Corporation",
    type: "Common Stock"
  },
  {
    symbol: "AVB",
    names: {
      zh: ["Avalon湾社区", "Avalon灣社區"],
      ja: ["アバロンベイ・コミュニティーズ"],
      ko: ["아발론베이 커뮤니티"],
      en: ["AvalonBay"]
    },
    description: "AvalonBay Communities Inc.",
    type: "Common Stock"
  },
  {
    symbol: "AVY",
    names: {
      zh: ["艾利丹尼森", "艾利丹尼森"],
      ja: ["エイブリィ・デニソン"],
      ko: ["에이버리 데니슨"],
      en: ["Avery Dennison"]
    },
    description: "Avery Dennison Corporation",
    type: "Common Stock"
  },
  {
    symbol: "BAX",
    names: {
      zh: ["百特", "百特"],
      ja: ["バクスター"],
      ko: ["백스터"],
      en: ["Baxter"]
    },
    description: "Baxter International Inc.",
    type: "Common Stock"
  },
  {
    symbol: "BEN",
    names: {
      zh: ["富兰克林资源", "富蘭克林資源"],
      ja: ["フランクリン・リソーシズ"],
      ko: ["프랭클린 리소시스"],
      en: ["Franklin Resources", "Franklin Templeton"]
    },
    description: "Franklin Resources Inc.",
    type: "Common Stock"
  },
  {
    symbol: "BF.B",
    names: {
      zh: ["布朗福曼", "布朗福曼"],
      ja: ["ブラウン・フォーマン"],
      ko: ["브라운포먼"],
      en: ["Brown-Forman"]
    },
    description: "Brown-Forman Corporation",
    type: "Common Stock"
  },
  {
    symbol: "BLDR",
    names: {
      zh: ["建筑第一资源", "建築第一資源"],
      ja: ["ビルダーズ・ファーストソース"],
      ko: ["빌더스 퍼스트소스"],
      en: ["Builders FirstSource"]
    },
    description: "Builders FirstSource Inc.",
    type: "Common Stock"
  },
  {
    symbol: "BRO",
    names: {
      zh: ["布朗与布朗", "布朗與布朗"],
      ja: ["ブラウン・アンド・ブラウン"],
      ko: ["브라운 앤 브라운"],
      en: ["Brown & Brown"]
    },
    description: "Brown & Brown Inc.",
    type: "Common Stock"
  },
  {
    symbol: "BX",
    names: {
      zh: ["黑石", "黑石"],
      ja: ["ブラックストーン"],
      ko: ["블랙스톤"],
      en: ["Blackstone"]
    },
    description: "Blackstone Inc.",
    type: "Common Stock"
  },
  {
    symbol: "BXP",
    names: {
      zh: ["波士顿地产", "波士頓地產"],
      ja: ["BXP"],
      ko: ["BXP"],
      en: ["BXP", "Boston Properties"]
    },
    description: "BXP Inc.",
    type: "Common Stock"
  },
  {
    symbol: "C",
    names: {
      zh: ["花旗", "花旗"],
      ja: ["シティグループ"],
      ko: ["시티그룹"],
      en: ["Citigroup", "Citi"]
    },
    description: "Citigroup Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CAG",
    names: {
      zh: ["康尼格拉", "康尼格拉"],
      ja: ["コナグラ・ブランズ"],
      ko: ["코나그라 브랜즈"],
      en: ["Conagra"]
    },
    description: "Conagra Brands Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CBOE",
    names: {
      zh: ["芝加哥期权交易所", "芝加哥期權交易所"],
      ja: ["Cboeグローバル・マーケッツ"],
      ko: ["시카고 옵션 거래소"],
      en: ["Cboe"]
    },
    description: "Cboe Global Markets Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CDW",
    names: {
      zh: ["CDW", "CDW"],
      ja: ["CDW"],
      ko: ["CDW"],
      en: ["CDW"]
    },
    description: "CDW Corporation",
    type: "Common Stock"
  },
  {
    symbol: "CF",
    names: {
      zh: ["CF工业", "CF工業"],
      ja: ["CFインダストリーズ"],
      ko: ["CF 인더스트리"],
      en: ["CF Industries"]
    },
    description: "CF Industries Holdings Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CHD",
    names: {
      zh: ["丘奇德怀特", "丘奇德懷特"],
      ja: ["チャーチ・アンド・ドワイト"],
      ko: ["처치 앤 드와이트"],
      en: ["Church & Dwight"]
    },
    description: "Church & Dwight Co. Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CLX",
    names: {
      zh: ["高乐氏", "高樂氏"],
      ja: ["クロロックス"],
      ko: ["클로록스"],
      en: ["Clorox"]
    },
    description: "The Clorox Company",
    type: "Common Stock"
  },
  {
    symbol: "CMS",
    names: {
      zh: ["CMS能源", "CMS能源"],
      ja: ["CMSエナジー"],
      ko: ["CMS 에너지"],
      en: ["CMS Energy"]
    },
    description: "CMS Energy Corporation",
    type: "Common Stock"
  },
  {
    symbol: "COO",
    names: {
      zh: ["库珀公司", "庫珀公司"],
      ja: ["クーパー・カンパニーズ"],
      ko: ["쿠퍼 컴퍼니"],
      en: ["Cooper Companies"]
    },
    description: "The Cooper Companies Inc.",
    type: "Common Stock"
  },
  {
    symbol: "COP",
    names: {
      zh: ["康菲石油", "康菲石油"],
      ja: ["コノコフィリップス"],
      ko: ["코노코필립스"],
      en: ["ConocoPhillips"]
    },
    description: "ConocoPhillips",
    type: "Common Stock"
  },
  {
    symbol: "CPAY",
    names: {
      zh: ["Corpay", "Corpay"],
      ja: ["コーペイ"],
      ko: ["코페이"],
      en: ["Corpay", "FLEETCOR"]
    },
    description: "Corpay Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CPB",
    names: {
      zh: ["金宝汤", "金寶湯"],
      ja: ["キャンベル・スープ"],
      ko: ["캠벨 수프"],
      en: ["Campbell Soup"]
    },
    description: "Campbell Soup Company",
    type: "Common Stock"
  },
  {
    symbol: "CPT",
    names: {
      zh: ["Camden地产", "Camden地產"],
      ja: ["カムデン・プロパティ・トラスト"],
      ko: ["캠든 프로퍼티 트러스트"],
      en: ["Camden Property Trust"]
    },
    description: "Camden Property Trust",
    type: "Common Stock"
  },
  {
    symbol: "CRL",
    names: {
      zh: ["查尔斯河实验室", "查爾斯河實驗室"],
      ja: ["チャールズ・リバー・ラボラトリーズ"],
      ko: ["찰스 리버 래버러토리"],
      en: ["Charles River Laboratories"]
    },
    description: "Charles River Laboratories International Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CRWD",
    names: {
      zh: ["CrowdStrike"],
      ja: ["クラウドストライク"],
      ko: ["크라우드스트라이크"],
      en: ["CrowdStrike"]
    },
    description: "CrowdStrike Holdings Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CTRA",
    names: {
      zh: ["Coterra能源", "Coterra能源"],
      ja: ["コテラ"],
      ko: ["코테라"],
      en: ["Coterra"]
    },
    description: "Coterra Energy Inc.",
    type: "Common Stock"
  },
  {
    symbol: "CZR",
    names: {
      zh: ["凯撒娱乐", "凱撒娛樂"],
      ja: ["シーザーズ・エンターテインメント"],
      ko: ["시저스 엔터테인먼트"],
      en: ["Caesars Entertainment"]
    },
    description: "Caesars Entertainment Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DASH",
    names: {
      zh: ["DoorDash"],
      ja: ["ドアダッシュ"],
      ko: ["도어대시"],
      en: ["DoorDash"]
    },
    description: "DoorDash Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DAY",
    names: {
      zh: ["Dayforce"],
      ja: ["デイフォース"],
      ko: ["데이포스"],
      en: ["Dayforce"]
    },
    description: "Dayforce Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DG",
    names: {
      zh: ["达乐", "達樂"],
      ja: ["ダラー・ゼネラル"],
      ko: ["달러 제너럴"],
      en: ["Dollar General"]
    },
    description: "Dollar General Corporation",
    type: "Common Stock"
  },
  {
    symbol: "DGX",
    names: {
      zh: ["奎斯特诊断", "奎斯特診斷"],
      ja: ["クエスト・ダイアグノスティックス"],
      ko: ["퀘스트 다이어그노스틱스"],
      en: ["Quest Diagnostics"]
    },
    description: "Quest Diagnostics Incorporated",
    type: "Common Stock"
  },
  {
    symbol: "DHI",
    names: {
      zh: ["D.R.霍顿", "D.R.霍頓"],
      ja: ["D.R.ホートン"],
      ko: ["D.R. 호튼"],
      en: ["D.R. Horton"]
    },
    description: "D.R. Horton Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DLTR",
    names: {
      zh: ["美元树", "美元樹"],
      ja: ["ダラー・ツリー"],
      ko: ["달러 트리"],
      en: ["Dollar Tree"]
    },
    description: "Dollar Tree Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DOC",
    names: {
      zh: ["Healthpeak地产", "Healthpeak地產"],
      ja: ["ヘルスピーク・プロパティーズ"],
      ko: ["헬스피크 프로퍼티"],
      en: ["Healthpeak"]
    },
    description: "Healthpeak Properties Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DOV",
    names: {
      zh: ["多佛", "多佛"],
      ja: ["ドーバー"],
      ko: ["도버"],
      en: ["Dover"]
    },
    description: "Dover Corporation",
    type: "Common Stock"
  },
  {
    symbol: "DOW",
    names: {
      zh: ["陶氏", "陶氏"],
      ja: ["ダウ"],
      ko: ["다우"],
      en: ["Dow"]
    },
    description: "Dow Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DPZ",
    names: {
      zh: ["达美乐", "達美樂"],
      ja: ["ドミノ・ピザ"],
      ko: ["도미노 피자"],
      en: ["Domino's"]
    },
    description: "Domino's Pizza Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DRI",
    names: {
      zh: ["达登饭店", "達登飯店"],
      ja: ["ダーデン・レストランツ"],
      ko: ["다든 레스토랑"],
      en: ["Darden Restaurants"]
    },
    description: "Darden Restaurants Inc.",
    type: "Common Stock"
  },
  {
    symbol: "DTE",
    names: {
      zh: ["DTE能源", "DTE能源"],
      ja: ["DTEエナジー"],
      ko: ["DTE 에너지"],
      en: ["DTE Energy"]
    },
    description: "DTE Energy Company",
    type: "Common Stock"
  },
  {
    symbol: "DVA",
    names: {
      zh: ["达维塔", "達維塔"],
      ja: ["ダヴィータ"],
      ko: ["다비타"],
      en: ["DaVita"]
    },
    description: "DaVita Inc.",
    type: "Common Stock"
  },
  {
    symbol: "EFX",
    names: {
      zh: ["艾可飞", "艾可飛"],
      ja: ["エクイファックス"],
      ko: ["에퀴팩스"],
      en: ["Equifax"]
    },
    description: "Equifax Inc.",
    type: "Common Stock"
  },
  {
    symbol: "EG",
    names: {
      zh: ["Everest集团", "Everest集團"],
      ja: ["エベレスト・グループ"],
      ko: ["에버레스트 그룹"],
      en: ["Everest Group"]
    },
    description: "Everest Group Ltd.",
    type: "Common Stock"
  },
  {
    symbol: "EIX",
    names: {
      zh: ["爱迪生国际", "愛迪生國際"],
      ja: ["エジソン・インターナショナル"],
      ko: ["에디슨 인터내셔널"],
      en: ["Edison International"]
    },
    description: "Edison International",
    type: "Common Stock"
  },
  {
    symbol: "ELV",
    names: {
      zh: ["Elevance健康", "Elevance健康"],
      ja: ["エレバンス・ヘルス"],
      ko: ["엘레반스 헬스"],
      en: ["Elevance Health"]
    },
    description: "Elevance Health Inc.",
    type: "Common Stock"
  },
  {
    symbol: "EMN",
    names: {
      zh: ["伊士曼化工", "伊士曼化工"],
      ja: ["イーストマン・ケミカル"],
      ko: ["이스트먼 케미컬"],
      en: ["Eastman Chemical"]
    },
    description: "Eastman Chemical Company",
    type: "Common Stock"
  },
  {
    symbol: "ENPH",
    names: {
      zh: ["Enphase能源", "Enphase能源"],
      ja: ["エンフェーズ・エナジー"],
      ko: ["엔페이즈 에너지"],
      en: ["Enphase Energy"]
    },
    description: "Enphase Energy Inc.",
    type: "Common Stock"
  },
  {
    symbol: "EPAM",
    names: {
      zh: ["EPAM系统", "EPAM系統"],
      ja: ["EPAMシステムズ"],
      ko: ["EPAM 시스템즈"],
      en: ["EPAM Systems"]
    },
    description: "EPAM Systems Inc.",
    type: "Common Stock"
  },
  {
    symbol: "EQR",
    names: {
      zh: ["股权住宅", "股權住宅"],
      ja: ["エクイティ・レジデンシャル"],
      ko: ["에퀴티 레지덴셜"],
      en: ["Equity Residential"]
    },
    description: "Equity Residential",
    type: "Common Stock"
  },
  {
    symbol: "FDS",
    names: {
      zh: ["FactSet"],
      ja: ["ファクトセット"],
      ko: ["팩트셋"],
      en: ["FactSet"]
    },
    description: "FactSet Research Systems Inc.",
    type: "Common Stock"
  },
  {
    symbol: "FE",
    names: {
      zh: ["第一能源", "第一能源"],
      ja: ["ファーストエナジー"],
      ko: ["퍼스트에너지"],
      en: ["FirstEnergy"]
    },
    description: "FirstEnergy Corp.",
    type: "Common Stock"
  },
  {
    symbol: "FOX",
    names: {
      zh: ["福克斯B类", "福克斯B類"],
      ja: ["フォックス・コーポレーションB"],
      ko: ["폭스 B"],
      en: ["Fox Class B"]
    },
    description: "Fox Corporation (Class B)",
    type: "Common Stock"
  },
  {
    symbol: "FOXA",
    names: {
      zh: ["福克斯A类", "福克斯A類"],
      ja: ["フォックス・コーポレーションA"],
      ko: ["폭스 A"],
      en: ["Fox Class A"]
    },
    description: "Fox Corporation (Class A)",
    type: "Common Stock"
  },
  {
    symbol: "FRT",
    names: {
      zh: ["联邦不动产", "聯邦不動產"],
      ja: ["フェデラル・リアルティ"],
      ko: ["페더럴 리얼티"],
      en: ["Federal Realty"]
    },
    description: "Federal Realty Investment Trust",
    type: "Common Stock"
  },
  {
    symbol: "FSLR",
    names: {
      zh: ["第一太阳能", "第一太陽能"],
      ja: ["ファースト・ソーラー"],
      ko: ["퍼스트 솔라"],
      en: ["First Solar"]
    },
    description: "First Solar Inc.",
    type: "Common Stock"
  },
  {
    symbol: "GEN",
    names: {
      zh: ["Gen数字", "Gen數碼"],
      ja: ["ジェン・デジタル"],
      ko: ["젠 디지털"],
      en: ["Gen Digital"]
    },
    description: "Gen Digital Inc.",
    type: "Common Stock"
  },
  {
    symbol: "GEV",
    names: {
      zh: ["通用电气Vernova", "通用電氣Vernova"],
      ja: ["GEヴェルノヴァ"],
      ko: ["GE 베르노바"],
      en: ["GE Vernova"]
    },
    description: "GE Vernova Inc.",
    type: "Common Stock"
  },
  {
    symbol: "GL",
    names: {
      zh: ["Globe人寿", "Globe人壽"],
      ja: ["グローブ・ライフ"],
      ko: ["글로브 라이프"],
      en: ["Globe Life"]
    },
    description: "Globe Life Inc.",
    type: "Common Stock"
  },
  {
    symbol: "GNRC",
    names: {
      zh: ["Generac电力", "Generac電力"],
      ja: ["ジェネラック"],
      ko: ["제너랙"],
      en: ["Generac"]
    },
    description: "Generac Holdings Inc.",
    type: "Common Stock"
  },
  {
    symbol: "GOOG",
    names: {
      zh: ["谷歌C类", "穀歌C類"],
      ja: ["グーグルC"],
      ko: ["구글 C"],
      en: ["Google Class C"]
    },
    description: "Alphabet Inc. Class C",
    type: "Common Stock"
  },
  {
    symbol: "HAL",
    names: {
      zh: ["哈里伯顿", "哈里伯頓"],
      ja: ["ハリバートン"],
      ko: ["할리버튼"],
      en: ["Halliburton"]
    },
    description: "Halliburton Company",
    type: "Common Stock"
  },
  {
    symbol: "HAS",
    names: {
      zh: ["孩之宝", "孩之寶"],
      ja: ["ハズブロ"],
      ko: ["해즈브로"],
      en: ["Hasbro"]
    },
    description: "Hasbro Inc.",
    type: "Common Stock"
  },
  {
    symbol: "HII",
    names: {
      zh: ["亨廷顿英戈尔斯", "亨廷頓英戈爾斯"],
      ja: ["ハンティントン・インガルス"],
      ko: ["헌팅턴 잉걸스"],
      en: ["Huntington Ingalls"]
    },
    description: "Huntington Ingalls Industries Inc.",
    type: "Common Stock"
  },
  {
    symbol: "HOLX",
    names: {
      zh: ["Hologic"],
      ja: ["ホロジック"],
      ko: ["홀로직"],
      en: ["Hologic"]
    },
    description: "Hologic Inc.",
    type: "Common Stock"
  },
  {
    symbol: "HRL",
    names: {
      zh: ["荷美尔", "荷美爾"],
      ja: ["ホーメル・フーズ"],
      ko: ["호멜"],
      en: ["Hormel Foods"]
    },
    description: "Hormel Foods Corporation",
    type: "Common Stock"
  },
  {
    symbol: "HSIC",
    names: {
      zh: ["亨利希恩", "亨利希恩"],
      ja: ["ヘンリー・シャイン"],
      ko: ["헨리 샤인"],
      en: ["Henry Schein"]
    },
    description: "Henry Schein",
    type: "Common Stock"
  },
  {
    symbol: "HST",
    names: {
      zh: ["好客酒店", "好客酒店"],
      ja: ["ホスト・ホテルズ"],
      ko: ["호스트 호텔스"],
      en: ["Host Hotels & Resorts"]
    },
    description: "Host Hotels & Resorts",
    type: "Common Stock"
  },
  {
    symbol: "IEX",
    names: {
      zh: ["艾德克斯", "艾德克斯"],
      ja: ["アイデックス"],
      ko: ["아이덱스"],
      en: ["IDEX"]
    },
    description: "IDEX Corporation",
    type: "Common Stock"
  },
  {
    symbol: "IFF",
    names: {
      zh: ["国际香精香料", "國際香精香料"],
      ja: ["インターナショナル・フレーバー・アンド・フレグランス"],
      ko: ["인터내셔널 플레이버스 앤 프래그런스"],
      en: ["International Flavors & Fragrances", "IFF"]
    },
    description: "International Flavors & Fragrances",
    type: "Common Stock"
  },
  {
    symbol: "IPG",
    names: {
      zh: ["埃培智", "埃培智"],
      ja: ["インターパブリック・グループ"],
      ko: ["인터퍼블릭 그룹"],
      en: ["Interpublic Group"]
    },
    description: "Interpublic Group of Companies (The)",
    type: "Common Stock"
  },
  {
    symbol: "IRM",
    names: {
      zh: ["铁山", "鐵山"],
      ja: ["アイアン・マウンテン"],
      ko: ["아이언 마운틴"],
      en: ["Iron Mountain"]
    },
    description: "Iron Mountain",
    type: "Common Stock"
  },
  {
    symbol: "IT",
    names: {
      zh: ["高德纳", "高德納"],
      ja: ["ガートナー"],
      ko: ["가트너"],
      en: ["Gartner"]
    },
    description: "Gartner",
    type: "Common Stock"
  },
  {
    symbol: "IVZ",
    names: {
      zh: ["景顺", "景順"],
      ja: ["インベスコ"],
      ko: ["인베스코"],
      en: ["Invesco"]
    },
    description: "Invesco",
    type: "Common Stock"
  },
  {
    symbol: "JBHT",
    names: {
      zh: ["JB亨特运输", "JB亨特運輸"],
      ja: ["J.B.ハント"],
      ko: ["J.B. 헌트"],
      en: ["J.B. Hunt"]
    },
    description: "J.B. Hunt",
    type: "Common Stock"
  },
  {
    symbol: "JBL",
    names: {
      zh: ["捷普", "捷普"],
      ja: ["ジェイビル"],
      ko: ["재빌"],
      en: ["Jabil"]
    },
    description: "Jabil",
    type: "Common Stock"
  },
  {
    symbol: "JCI",
    names: {
      zh: ["江森自控", "江森自控"],
      ja: ["ジョンソン・コントロールズ"],
      ko: ["존슨 컨트롤스"],
      en: ["Johnson Controls"]
    },
    description: "Johnson Controls",
    type: "Common Stock"
  },
  {
    symbol: "JKHY",
    names: {
      zh: ["杰克亨利", "傑克亨利"],
      ja: ["ジャック・ヘンリー"],
      ko: ["잭 헨리"],
      en: ["Jack Henry & Associates"]
    },
    description: "Jack Henry & Associates",
    type: "Common Stock"
  },
  {
    symbol: "KDP",
    names: {
      zh: ["绿山胡椒博士", "綠山胡椒博士"],
      ja: ["キューリグ・ドクターペッパー"],
      ko: ["큐릭 닥터페퍼"],
      en: ["Keurig Dr Pepper"]
    },
    description: "Keurig Dr Pepper",
    type: "Common Stock"
  },
  {
    symbol: "KEY",
    names: {
      zh: ["基科金融", "基科金融"],
      ja: ["キーコープ"],
      ko: ["키코프"],
      en: ["KeyCorp"]
    },
    description: "KeyCorp",
    type: "Common Stock"
  },
  {
    symbol: "KIM",
    names: {
      zh: ["金科地产", "金科地產"],
      ja: ["キムコ・リアルティ"],
      ko: ["킴코 리얼티"],
      en: ["Kimco Realty"]
    },
    description: "Kimco Realty",
    type: "Common Stock"
  },
  {
    symbol: "KKR",
    names: {
      zh: ["KKR", "KKR"],
      ja: ["KKR"],
      ko: ["KKR"],
      en: ["KKR & Co."]
    },
    description: "KKR & Co.",
    type: "Common Stock"
  },
  {
    symbol: "KMX",
    names: {
      zh: ["卡迈斯", "卡邁斯"],
      ja: ["カーマックス"],
      ko: ["카맥스"],
      en: ["CarMax"]
    },
    description: "CarMax",
    type: "Common Stock"
  },
  {
    symbol: "L",
    names: {
      zh: ["路氏", "路氏"],
      ja: ["ロウズ"],
      ko: ["로우스"],
      en: ["Loews"]
    },
    description: "Loews Corporation",
    type: "Common Stock"
  },
  {
    symbol: "LH",
    names: {
      zh: ["莱伯科", "萊伯科"],
      ja: ["ラボコープ"],
      ko: ["랩코프"],
      en: ["Labcorp"]
    },
    description: "Labcorp",
    type: "Common Stock"
  },
  {
    symbol: "LII",
    names: {
      zh: ["伦诺克斯", "倫諾克斯"],
      ja: ["レノックス・インターナショナル"],
      ko: ["레녹스 인터내셔널"],
      en: ["Lennox International"]
    },
    description: "Lennox International",
    type: "Common Stock"
  },
  {
    symbol: "LKQ",
    names: {
      zh: ["LKQ"],
      ja: ["LKQ"],
      ko: ["LKQ"],
      en: ["LKQ"]
    },
    description: "LKQ Corporation",
    type: "Common Stock"
  },
  {
    symbol: "LNT",
    names: {
      zh: ["联合能源", "聯合能源"],
      ja: ["アライアント・エナジー"],
      ko: ["얼라이언트 에너지"],
      en: ["Alliant Energy"]
    },
    description: "Alliant Energy",
    type: "Common Stock"
  },
  {
    symbol: "LULU",
    names: {
      zh: ["露露柠檬", "露露檸檬"],
      ja: ["ルルレモン"],
      ko: ["룰루레몬"],
      en: ["Lululemon"]
    },
    description: "Lululemon Athletica",
    type: "Common Stock"
  },
  {
    symbol: "LUV",
    names: {
      zh: ["西南航空", "西南航空"],
      ja: ["サウスウエスト航空"],
      ko: ["사우스웨스트 항공"],
      en: ["Southwest Airlines"]
    },
    description: "Southwest Airlines",
    type: "Common Stock"
  },
  {
    symbol: "LW",
    names: {
      zh: ["兰姆威士顿", "蘭姆威士頓"],
      ja: ["ラム・ウェストン"],
      ko: ["램 웨스턴"],
      en: ["Lamb Weston"]
    },
    description: "Lamb Weston",
    type: "Common Stock"
  },
  {
    symbol: "LYB",
    names: {
      zh: ["利安德巴赛尔", "利安德巴賽爾"],
      ja: ["ライオンデルバセル"],
      ko: ["라이온델바셀"],
      en: ["LyondellBasell"]
    },
    description: "LyondellBasell",
    type: "Common Stock"
  },
  {
    symbol: "MAA",
    names: {
      zh: ["美国中部公寓", "美國中部公寓"],
      ja: ["ミッド・アメリカ・アパートメント"],
      ko: ["미드 아메리카 아파트먼트"],
      en: ["Mid-America Apartment Communities"]
    },
    description: "Mid-America Apartment Communities",
    type: "Common Stock"
  },
  {
    symbol: "MAS",
    names: {
      zh: ["马斯科", "馬斯科"],
      ja: ["マスコ"],
      ko: ["마스코"],
      en: ["Masco"]
    },
    description: "Masco",
    type: "Common Stock"
  },
  {
    symbol: "MET",
    names: {
      zh: ["大都会人寿", "大都會人壽"],
      ja: ["メットライフ"],
      ko: ["메트라이프"],
      en: ["MetLife"]
    },
    description: "MetLife",
    type: "Common Stock"
  },
  {
    symbol: "MGM",
    names: {
      zh: ["美高梅", "美高梅"],
      ja: ["MGMリゾーツ"],
      ko: ["MGM 리조트"],
      en: ["MGM Resorts"]
    },
    description: "MGM Resorts",
    type: "Common Stock"
  },
  {
    symbol: "MHK",
    names: {
      zh: ["莫霍克工业", "莫霍克工業"],
      ja: ["モホーク・インダストリーズ"],
      ko: ["모호크 인더스트리"],
      en: ["Mohawk Industries"]
    },
    description: "Mohawk Industries",
    type: "Common Stock"
  },
  {
    symbol: "MKTX",
    names: {
      zh: ["MarketAxess"],
      ja: ["マーケットアクセス"],
      ko: ["마켓액세스"],
      en: ["MarketAxess"]
    },
    description: "MarketAxess",
    type: "Common Stock"
  },
  {
    symbol: "MMM",
    names: {
      zh: ["3M", "3M"],
      ja: ["3M"],
      ko: ["3M"],
      en: ["3M"]
    },
    description: "3M",
    type: "Common Stock"
  },
  {
    symbol: "MOH",
    names: {
      zh: ["莫利纳医疗", "莫利納醫療"],
      ja: ["モリーナ・ヘルスケア"],
      ko: ["몰리나 헬스케어"],
      en: ["Molina Healthcare"]
    },
    description: "Molina Healthcare",
    type: "Common Stock"
  },
  {
    symbol: "MOS",
    names: {
      zh: ["美盛", "美盛"],
      ja: ["モザイク"],
      ko: ["모자이크"],
      en: ["Mosaic"]
    },
    description: "Mosaic Company (The)",
    type: "Common Stock"
  },
  {
    symbol: "MRNA",
    names: {
      zh: ["莫德纳", "莫德納"],
      ja: ["モデルナ"],
      ko: ["모더나"],
      en: ["Moderna"]
    },
    description: "Moderna",
    type: "Common Stock"
  },
  {
    symbol: "MTCH",
    names: {
      zh: ["Match集团", "Match集團"],
      ja: ["マッチ・グループ"],
      ko: ["매치 그룹"],
      en: ["Match Group"]
    },
    description: "Match Group",
    type: "Common Stock"
  },
  {
    symbol: "MTD",
    names: {
      zh: ["梅特勒-托利多", "梅特勒-托利多"],
      ja: ["メトラー・トレド"],
      ko: ["메틀러 톨레도"],
      en: ["Mettler Toledo"]
    },
    description: "Mettler Toledo",
    type: "Common Stock"
  },
  {
    symbol: "NCLH",
    names: {
      zh: ["挪威邮轮", "挪威郵輪"],
      ja: ["ノルウェージャン・クルーズライン"],
      ko: ["노르웨이안 크루즈 라인"],
      en: ["Norwegian Cruise Line"]
    },
    description: "Norwegian Cruise Line Holdings",
    type: "Common Stock"
  },
  {
    symbol: "NDSN",
    names: {
      zh: ["诺信", "諾信"],
      ja: ["ノードソン"],
      ko: ["노드슨"],
      en: ["Nordson"]
    },
    description: "Nordson Corporation",
    type: "Common Stock"
  },
  {
    symbol: "ALB",
    names: {
      zh: ["雅保", "雅保"],
      ja: ["アルベマール"],
      ko: ["앨버말"],
      en: ["Albemarle"]
    },
    description: "Albemarle Corporation",
    type: "Common Stock"
  },
  {
    symbol: "AME",
    names: {
      zh: ["阿美特克", "阿美特克"],
      ja: ["アメテック"],
      ko: ["아메텍"],
      en: ["Ametek"]
    },
    description: "Ametek",
    type: "Common Stock"
  },
  {
    symbol: "APTV",
    names: {
      zh: ["安波福", "安波福"],
      ja: ["アプティブ"],
      ko: ["앱티브"],
      en: ["Aptiv"]
    },
    description: "Aptiv",
    type: "Common Stock"
  },
  {
    symbol: "BKR",
    names: {
      zh: ["贝克休斯", "貝克休斯"],
      ja: ["ベーカー・ヒューズ"],
      ko: ["베이커 휴즈"],
      en: ["Baker Hughes"]
    },
    description: "Baker Hughes",
    type: "Common Stock"
  },
  {
    symbol: "CAH",
    names: {
      zh: ["康德乐", "康德樂"],
      ja: ["カーディナル・ヘルス"],
      ko: ["카디널 헬스"],
      en: ["Cardinal Health"]
    },
    description: "Cardinal Health",
    type: "Common Stock"
  },
  {
    symbol: "CCL",
    names: {
      zh: ["嘉年华邮轮", "嘉年華郵輪"],
      ja: ["カーニバル"],
      ko: ["카니발"],
      en: ["Carnival"]
    },
    description: "Carnival",
    type: "Common Stock"
  },
  {
    symbol: "CINF",
    names: {
      zh: ["辛辛那提金融", "辛辛那提金融"],
      ja: ["シンシナティ・フィナンシャル"],
      ko: ["신시내티 파이낸셜"],
      en: ["Cincinnati Financial"]
    },
    description: "Cincinnati Financial",
    type: "Common Stock"
  },
  {
    symbol: "CTSH",
    names: {
      zh: ["高知特", "高知特"],
      ja: ["コグニザント"],
      ko: ["코그니전트"],
      en: ["Cognizant"]
    },
    description: "Cognizant",
    type: "Common Stock"
  },
  {
    symbol: "DDOG",
    names: {
      zh: ["Datadog"],
      ja: ["データドッグ"],
      ko: ["데이터독"],
      en: ["Datadog"]
    },
    description: "Datadog",
    type: "Common Stock"
  },
  {
    symbol: "EOG",
    names: {
      zh: ["EOG能源"],
      ja: ["EOGリソーシズ"],
      ko: ["EOG 리소시스"],
      en: ["EOG Resources"]
    },
    description: "EOG Resources",
    type: "Common Stock"
  },
  {
    symbol: "EQT",
    names: {
      zh: ["EQT"],
      ja: ["EQT"],
      ko: ["EQT"],
      en: ["EQT"]
    },
    description: "EQT Corporation",
    type: "Common Stock"
  },
  {
    symbol: "ETR",
    names: {
      zh: ["安特吉", "安特吉"],
      ja: ["エンタジー"],
      ko: ["엔터지"],
      en: ["Entergy"]
    },
    description: "Entergy",
    type: "Common Stock"
  },
  {
    symbol: "EVRG",
    names: {
      zh: ["Evergy"],
      ja: ["エバージー"],
      ko: ["에버지"],
      en: ["Evergy"]
    },
    description: "Evergy",
    type: "Common Stock"
  },
  {
    symbol: "EXPD",
    names: {
      zh: ["康捷国际", "康捷國際"],
      ja: ["エクスペダイターズ"],
      ko: ["익스페디터스"],
      en: ["Expeditors"]
    },
    description: "Expeditors International",
    type: "Common Stock"
  },
  {
    symbol: "FCX",
    names: {
      zh: ["麦克莫兰铜金", "麥克莫蘭銅金"],
      ja: ["フリーポート・マクモラン"],
      ko: ["프리포트 맥모란"],
      en: ["Freeport-McMoRan"]
    },
    description: "Freeport-McMoRan",
    type: "Common Stock"
  },
  {
    symbol: "FFIV",
    names: {
      zh: ["F5"],
      ja: ["F5"],
      ko: ["F5"],
      en: ["F5"]
    },
    description: "F5, Inc.",
    type: "Common Stock"
  },
  {
    symbol: "FIS",
    names: {
      zh: ["富达国信", "富達國信"],
      ja: ["フィデリティ・ナショナル・インフォメーション"],
      ko: ["피델리티 내셔널"],
      en: ["Fidelity National Information Services"]
    },
    description: "Fidelity National Information Services",
    type: "Common Stock"
  },
  {
    symbol: "LYV",
    names: {
      zh: ["Live Nation"],
      ja: ["ライブ・ネイション"],
      ko: ["라이브 네이션"],
      en: ["Live Nation"]
    },
    description: "Live Nation Entertainment",
    type: "Common Stock"
  },
  {
    symbol: "NEM",
    names: {
      zh: ["纽蒙特", "紐蒙特"],
      ja: ["ニューモント"],
      ko: ["뉴몬트"],
      en: ["Newmont"]
    },
    description: "Newmont",
    type: "Common Stock"
  },
  {
    symbol: "NTAP",
    names: {
      zh: ["NetApp"],
      ja: ["ネットアップ"],
      ko: ["넷앱"],
      en: ["NetApp"]
    },
    description: "NetApp",
    type: "Common Stock"
  },
  {
    symbol: "NVR",
    names: {
      zh: ["NVR"],
      ja: ["NVR"],
      ko: ["NVR"],
      en: ["NVR"]
    },
    description: "NVR, Inc.",
    type: "Common Stock"
  },
  {
    symbol: "NWS",
    names: {
      zh: ["新闻集团B类", "新聞集團B類"],
      ja: ["ニューズ・コーポレーションB"],
      ko: ["뉴스 코퍼레이션 B"],
      en: ["News Corp Class B"]
    },
    description: "News Corp (Class B)",
    type: "Common Stock"
  },
  {
    symbol: "NWSA",
    names: {
      zh: ["新闻集团A类", "新聞集團A類"],
      ja: ["ニューズ・コーポレーションA"],
      ko: ["뉴스 코퍼레이션 A"],
      en: ["News Corp Class A"]
    },
    description: "News Corp (Class A)",
    type: "Common Stock"
  },
  {
    symbol: "OKE",
    names: {
      zh: ["Oneok"],
      ja: ["ワンオーク"],
      ko: ["원오크"],
      en: ["Oneok"]
    },
    description: "Oneok",
    type: "Common Stock"
  },
  {
    symbol: "OMC",
    names: {
      zh: ["宏盟集团", "宏盟集團"],
      ja: ["オムニコム"],
      ko: ["옴니컴"],
      en: ["Omnicom"]
    },
    description: "Omnicom Group",
    type: "Common Stock"
  },
  {
    symbol: "OTIS",
    names: {
      zh: ["奥的斯", "奧的斯"],
      ja: ["オーチス"],
      ko: ["오티스"],
      en: ["Otis"]
    },
    description: "Otis Worldwide",
    type: "Common Stock"
  },
  {
    symbol: "PAYC",
    names: {
      zh: ["Paycom"],
      ja: ["ペイコム"],
      ko: ["페이컴"],
      en: ["Paycom"]
    },
    description: "Paycom",
    type: "Common Stock"
  },
  {
    symbol: "PFG",
    names: {
      zh: ["信安金融", "信安金融"],
      ja: ["プリンシパル・フィナンシャル"],
      ko: ["프린시펄 파이낸셜"],
      en: ["Principal Financial"]
    },
    description: "Principal Financial Group",
    type: "Common Stock"
  },
  {
    symbol: "PHM",
    names: {
      zh: ["普得集团", "普得集團"],
      ja: ["パルテグループ"],
      ko: ["펄트그룹"],
      en: ["PulteGroup"]
    },
    description: "PulteGroup",
    type: "Common Stock"
  },
  {
    symbol: "PLTR",
    names: {
      zh: ["Palantir", "帕兰提尔"],
      ja: ["パランティア"],
      ko: ["팔란티어"],
      en: ["Palantir"]
    },
    description: "Palantir Technologies",
    type: "Common Stock"
  },
  {
    symbol: "PNW",
    names: {
      zh: ["顶峰西部资本", "頂峰西部資本"],
      ja: ["ピナクル・ウェスト"],
      ko: ["피너클 웨스트"],
      en: ["Pinnacle West Capital"]
    },
    description: "Pinnacle West Capital",
    type: "Common Stock"
  },
  {
    symbol: "PODD",
    names: {
      zh: ["Insulet"],
      ja: ["インスレット"],
      ko: ["인슐렛"],
      en: ["Insulet"]
    },
    description: "Insulet Corporation",
    type: "Common Stock"
  },
  {
    symbol: "POOL",
    names: {
      zh: ["Pool公司", "Pool公司"],
      ja: ["プール"],
      ko: ["풀"],
      en: ["Pool Corporation"]
    },
    description: "Pool Corporation",
    type: "Common Stock"
  },
  {
    symbol: "PTC",
    names: {
      zh: ["PTC"],
      ja: ["PTC"],
      ko: ["PTC"],
      en: ["PTC"]
    },
    description: "PTC Inc.",
    type: "Common Stock"
  },
  {
    symbol: "RCL",
    names: {
      zh: ["皇家加勒比", "皇家加勒比"],
      ja: ["ロイヤル・カリビアン"],
      ko: ["로열 캐리비안"],
      en: ["Royal Caribbean"]
    },
    description: "Royal Caribbean Group",
    type: "Common Stock"
  },
  {
    symbol: "REG",
    names: {
      zh: ["Regency中心", "Regency中心"],
      ja: ["リージェンシー・センターズ"],
      ko: ["리젠시 센터스"],
      en: ["Regency Centers"]
    },
    description: "Regency Centers",
    type: "Common Stock"
  },
  {
    symbol: "RJF",
    names: {
      zh: ["雷蒙德詹姆斯", "雷蒙德詹姆斯"],
      ja: ["レイモンド・ジェームズ"],
      ko: ["레이먼드 제임스"],
      en: ["Raymond James"]
    },
    description: "Raymond James Financial",
    type: "Common Stock"
  },
  {
    symbol: "RL",
    names: {
      zh: ["拉夫劳伦", "拉夫勞倫"],
      ja: ["ラルフ・ローレン"],
      ko: ["랄프 로렌"],
      en: ["Ralph Lauren"]
    },
    description: "Ralph Lauren Corporation",
    type: "Common Stock"
  },
  {
    symbol: "ROL",
    names: {
      zh: ["Rollins"],
      ja: ["ロリンズ"],
      ko: ["롤린스"],
      en: ["Rollins"]
    },
    description: "Rollins, Inc.",
    type: "Common Stock"
  },
  {
    symbol: "PG",
    names: {
      zh: ["宝洁", "寶潔"],
      ja: ["プロクター・アンド・ギャンブル", "P&G"],
      ko: ["프록터 앤드 갬블", "P&G"],
      en: ["Procter & Gamble", "P&G"]
    },
    description: "Procter & Gamble",
    type: "Common Stock"
  },
  {
    symbol: "RTX",
    names: {
      zh: ["雷神技术", "雷神技術"],
      ja: ["RTX"],
      ko: ["RTX"],
      en: ["RTX", "Raytheon Technologies"]
    },
    description: "RTX Corporation",
    type: "Common Stock"
  },
  {
    symbol: "RVTY",
    names: {
      zh: ["Revvity"],
      ja: ["レブビティ"],
      ko: ["레비티"],
      en: ["Revvity"]
    },
    description: "Revvity",
    type: "Common Stock"
  },
  {
    symbol: "SBAC",
    names: {
      zh: ["SBA通信", "SBA通信"],
      ja: ["SBAコミュニケーションズ"],
      ko: ["SBA 커뮤니케이션스"],
      en: ["SBA Communications"]
    },
    description: "SBA Communications",
    type: "Common Stock"
  },
  {
    symbol: "SBUX",
    names: {
      zh: ["星巴克"],
      ja: ["スターバックス"],
      ko: ["스타벅스"],
      en: ["Starbucks"]
    },
    description: "Starbucks",
    type: "Common Stock"
  },
  {
    symbol: "SJM",
    names: {
      zh: ["斯马克", "斯馬克"],
      ja: ["J.M.スマッカー"],
      ko: ["J.M. 스머커"],
      en: ["J.M. Smucker"]
    },
    description: "J.M. Smucker Company (The)",
    type: "Common Stock"
  },
  {
    symbol: "SMCI",
    names: {
      zh: ["超微电脑", "超微電腦"],
      ja: ["スーパーマイクロ"],
      ko: ["슈퍼마이크로"],
      en: ["Supermicro"]
    },
    description: "Supermicro",
    type: "Common Stock"
  },
  {
    symbol: "SNA",
    names: {
      zh: ["实耐宝", "實耐寶"],
      ja: ["スナップオン"],
      ko: ["스냅온"],
      en: ["Snap-on"]
    },
    description: "Snap-on",
    type: "Common Stock"
  },
  {
    symbol: "SOLV",
    names: {
      zh: ["Solventum"],
      ja: ["ソルベンタム"],
      ko: ["솔벤텀"],
      en: ["Solventum"]
    },
    description: "Solventum",
    type: "Common Stock"
  },
  {
    symbol: "STE",
    names: {
      zh: ["Steris"],
      ja: ["ステリス"],
      ko: ["스테리스"],
      en: ["Steris"]
    },
    description: "Steris",
    type: "Common Stock"
  },
  {
    symbol: "STLD",
    names: {
      zh: ["钢铁动力", "鋼鐵動力"],
      ja: ["スティール・ダイナミクス"],
      ko: ["스틸 다이나믹스"],
      en: ["Steel Dynamics"]
    },
    description: "Steel Dynamics",
    type: "Common Stock"
  },
  {
    symbol: "STX",
    names: {
      zh: ["希捷", "希捷"],
      ja: ["シーゲイト"],
      ko: ["시게이트"],
      en: ["Seagate"]
    },
    description: "Seagate Technology",
    type: "Common Stock"
  },
  {
    symbol: "SWK",
    names: {
      zh: ["史丹利百得", "史丹利百得"],
      ja: ["スタンレー・ブラック・アンド・デッカー"],
      ko: ["스탠리 블랙 앤 데커"],
      en: ["Stanley Black & Decker"]
    },
    description: "Stanley Black & Decker",
    type: "Common Stock"
  },
  {
    symbol: "SWKS",
    names: {
      zh: ["思佳讯", "思佳訊"],
      ja: ["スカイワークス"],
      ko: ["스카이웍스"],
      en: ["Skyworks"]
    },
    description: "Skyworks Solutions",
    type: "Common Stock"
  },
  {
    symbol: "SYF",
    names: {
      zh: ["Synchrony金融", "Synchrony金融"],
      ja: ["シンクロニー"],
      ko: ["싱크로니"],
      en: ["Synchrony"]
    },
    description: "Synchrony Financial",
    type: "Common Stock"
  },
  {
    symbol: "TAP",
    names: {
      zh: ["摩森康胜", "摩森康勝"],
      ja: ["モルソン・クアーズ"],
      ko: ["몰슨 쿠어스"],
      en: ["Molson Coors"]
    },
    description: "Molson Coors Beverage Company",
    type: "Common Stock"
  },
  {
    symbol: "TDY",
    names: {
      zh: ["泰利丹", "泰利丹"],
      ja: ["テレダイン"],
      ko: ["텔레다인"],
      en: ["Teledyne"]
    },
    description: "Teledyne Technologies",
    type: "Common Stock"
  },
  {
    symbol: "TECH",
    names: {
      zh: ["Bio-Techne"],
      ja: ["バイオテクニー"],
      ko: ["바이오테크네"],
      en: ["Bio-Techne"]
    },
    description: "Bio-Techne",
    type: "Common Stock"
  },
  {
    symbol: "TER",
    names: {
      zh: ["泰瑞达", "泰瑞達"],
      ja: ["テラダイン"],
      ko: ["테라다인"],
      en: ["Teradyne"]
    },
    description: "Teradyne",
    type: "Common Stock"
  },
  {
    symbol: "TFC",
    names: {
      zh: ["Truist金融", "Truist金融"],
      ja: ["トゥルイスト"],
      ko: ["트루이스트"],
      en: ["Truist Financial"]
    },
    description: "Truist Financial",
    type: "Common Stock"
  },
  {
    symbol: "TKO",
    names: {
      zh: ["TKO集团", "TKO集團"],
      ja: ["TKOグループ"],
      ko: ["TKO 그룹"],
      en: ["TKO Group"]
    },
    description: "TKO Group Holdings",
    type: "Common Stock"
  },
  {
    symbol: "TPL",
    names: {
      zh: ["德州太平洋土地", "德州太平洋土地"],
      ja: ["テキサス・パシフィック・ランド"],
      ko: ["텍사스 퍼시픽 랜드"],
      en: ["Texas Pacific Land"]
    },
    description: "Texas Pacific Land Corporation",
    type: "Common Stock"
  },
  {
    symbol: "TPR",
    names: {
      zh: ["Tapestry"],
      ja: ["タペストリー"],
      ko: ["태피스트리"],
      en: ["Tapestry"]
    },
    description: "Tapestry, Inc.",
    type: "Common Stock"
  },
  {
    symbol: "TRMB",
    names: {
      zh: ["天宝", "天寶"],
      ja: ["トリンブル"],
      ko: ["트림블"],
      en: ["Trimble"]
    },
    description: "Trimble Inc.",
    type: "Common Stock"
  },
  {
    symbol: "TROW",
    names: {
      zh: ["普信集团", "普信集團"],
      ja: ["T・ロウ・プライス"],
      ko: ["T. 로우 프라이스"],
      en: ["T. Rowe Price"]
    },
    description: "T. Rowe Price",
    type: "Common Stock"
  },
  {
    symbol: "TSCO",
    names: {
      zh: ["拖拉机供应", "拖拉機供應"],
      ja: ["トラクター・サプライ"],
      ko: ["트랙터 서플라이"],
      en: ["Tractor Supply"]
    },
    description: "Tractor Supply",
    type: "Common Stock"
  },
  {
    symbol: "TSN",
    names: {
      zh: ["泰森食品", "泰森食品"],
      ja: ["タイソン・フーズ"],
      ko: ["타이슨 푸즈"],
      en: ["Tyson Foods"]
    },
    description: "Tyson Foods",
    type: "Common Stock"
  },
  {
    symbol: "TTD",
    names: {
      zh: ["Trade Desk"],
      ja: ["ザ・トレードデスク"],
      ko: ["트레이드 데스크"],
      en: ["Trade Desk"]
    },
    description: "Trade Desk (The)",
    type: "Common Stock"
  },
  {
    symbol: "TXT",
    names: {
      zh: ["德事隆", "德事隆"],
      ja: ["テキストロン"],
      ko: ["텍스트론"],
      en: ["Textron"]
    },
    description: "Textron",
    type: "Common Stock"
  },
  {
    symbol: "TYL",
    names: {
      zh: ["Tyler科技", "Tyler科技"],
      ja: ["タイラー・テクノロジーズ"],
      ko: ["타일러 테크놀로지스"],
      en: ["Tyler Technologies"]
    },
    description: "Tyler Technologies",
    type: "Common Stock"
  },
  {
    symbol: "UBER",
    names: {
      zh: ["优步", "優步"],
      ja: ["ウーバー"],
      ko: ["우버"],
      en: ["Uber"]
    },
    description: "Uber",
    type: "Common Stock"
  },
  {
    symbol: "UDR",
    names: {
      zh: ["UDR"],
      ja: ["UDR"],
      ko: ["UDR"],
      en: ["UDR"]
    },
    description: "UDR, Inc.",
    type: "Common Stock"
  },
  {
    symbol: "ULTA",
    names: {
      zh: ["Ulta美容", "Ulta美容"],
      ja: ["アルタ・ビューティー"],
      ko: ["울타 뷰티"],
      en: ["Ulta Beauty"]
    },
    description: "Ulta Beauty",
    type: "Common Stock"
  },
  {
    symbol: "VLO",
    names: {
      zh: ["瓦莱罗能源", "瓦萊羅能源"],
      ja: ["バレロ・エナジー"],
      ko: ["발레로 에너지"],
      en: ["Valero Energy"]
    },
    description: "Valero Energy",
    type: "Common Stock"
  },
  {
    symbol: "VLTO",
    names: {
      zh: ["Veralto"],
      ja: ["ベラルト"],
      ko: ["베랄토"],
      en: ["Veralto"]
    },
    description: "Veralto",
    type: "Common Stock"
  },
  {
    symbol: "VRSN",
    names: {
      zh: ["威瑞信", "威瑞信"],
      ja: ["ベリサイン"],
      ko: ["베리사인"],
      en: ["Verisign"]
    },
    description: "Verisign",
    type: "Common Stock"
  },
  {
    symbol: "VTR",
    names: {
      zh: ["Ventas"],
      ja: ["ベンタス"],
      ko: ["벤타스"],
      en: ["Ventas"]
    },
    description: "Ventas",
    type: "Common Stock"
  },
  {
    symbol: "VTRS",
    names: {
      zh: ["Viatris"],
      ja: ["ヴィアトリス"],
      ko: ["비아트리스"],
      en: ["Viatris"]
    },
    description: "Viatris",
    type: "Common Stock"
  },
  {
    symbol: "WAT",
    names: {
      zh: ["沃特世", "沃特世"],
      ja: ["ウォーターズ"],
      ko: ["워터스"],
      en: ["Waters"]
    },
    description: "Waters Corporation",
    type: "Common Stock"
  },
  {
    symbol: "WBA",
    names: {
      zh: ["沃尔格林", "沃爾格林"],
      ja: ["ウォルグリーン"],
      ko: ["월그린"],
      en: ["Walgreens"]
    },
    description: "Walgreens Boots Alliance",
    type: "Common Stock"
  },
  {
    symbol: "WDAY",
    names: {
      zh: ["Workday"],
      ja: ["ワークデイ"],
      ko: ["워크데이"],
      en: ["Workday"]
    },
    description: "Workday, Inc.",
    type: "Common Stock"
  },
  {
    symbol: "WDC",
    names: {
      zh: ["西部数据", "西部數據"],
      ja: ["ウエスタンデジタル"],
      ko: ["웨스턴 디지털"],
      en: ["Western Digital"]
    },
    description: "Western Digital",
    type: "Common Stock"
  },
  {
    symbol: "WSM",
    names: {
      zh: ["Williams-Sonoma"],
      ja: ["ウィリアムズ・ソノマ"],
      ko: ["윌리엄스 소노마"],
      en: ["Williams-Sonoma"]
    },
    description: "Williams-Sonoma, Inc.",
    type: "Common Stock"
  },
  {
    symbol: "WST",
    names: {
      zh: ["West制药", "West製藥"],
      ja: ["ウエスト・ファーマシューティカル"],
      ko: ["웨스트 파마슈티컬"],
      en: ["West Pharmaceutical"]
    },
    description: "West Pharmaceutical Services",
    type: "Common Stock"
  },
  {
    symbol: "WYNN",
    names: {
      zh: ["永利度假村", "永利度假村"],
      ja: ["ウィン・リゾーツ"],
      ko: ["윈 리조트"],
      en: ["Wynn Resorts"]
    },
    description: "Wynn Resorts",
    type: "Common Stock"
  },
];

/**
 * 搜索股票名称映射
 * @param query 用户输入的搜索词（可能是中文、日文、韩文或英文）
 * @returns 匹配的股票列表
 */
export function searchStockNameMappings(query: string): StockNameMapping[] {
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return [];

  return STOCK_NAME_MAPPINGS.filter(stock => {
    // 匹配ticker symbol
    if (stock.symbol.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // 匹配英文描述
    if (stock.description.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // 匹配各语言名称
    const allNames = [
      ...(stock.names.zh || []),
      ...(stock.names.ja || []),
      ...(stock.names.ko || []),
      ...(stock.names.en || []),
    ];

    return allNames.some(name =>
      name.toLowerCase().includes(lowerQuery) ||
      lowerQuery.includes(name.toLowerCase())
    );
  });
}
