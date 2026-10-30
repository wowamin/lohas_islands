export const DATA_VERSION = '2026-10-30 / 教學資料 v1';
export const SOURCES = {
  law: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=L0070059',
  apply: 'https://1966.gov.tw/LTC/cp-6533-70777-207.html',
  codes: 'https://law.moj.gov.tw/LawClass/LawGetFile.ashx?FileId=0000398331&lan=C',
  rates: 'https://law.moj.gov.tw/LawClass/LawGetFile.ashx?FileId=0000398333&lan=C',
  policy: 'https://www.mohw.gov.tw/cp-18-82814-1.html',
};
export type ModuleId = 'A'|'B'|'C'|'D'|'E'|'F';
export const MODULES: {id: ModuleId; title: string; subtitle: string; lessons: string[]; tags: string[]; source: string; status: string}[] = [
  {id:'A',title:'認識 ABC 照顧體系',subtitle:'把需求交給對的人',tags:['ABC','個管','協作'],source:SOURCES.law,status:'依第 3–5 條整理；ABC 分工為教學摘要',lessons:['照管中心負責評估與核定；A 社區整合型服務中心協調資源與擬訂計畫。','B 複合型服務中心連結及提供照顧；C 巷弄長照站支持社區參與。實際服務依特約資格。','A 個管與家庭討論需求，將計畫送核定，再媒合服務並追蹤；A 不等於直接提供所有服務。']},
  {id:'B',title:'長照 3.0 政策視野',subtitle:'從出院到在地生活',tags:['3.0','HAH','醫照整合'],source:SOURCES.policy,status:'政策導讀；各方案資格與實施日期須逐案確認',lessons:['醫療與長照整合：出院準備先了解返家需要，銜接後續照顧。','在宅急症照護 HAH 與在宅安寧是醫療服務主題，應由醫療團隊判斷，不能以長照資格取代醫療收案。','智慧科技、輔具與居家安全可支持生活；重度失能支持、家庭喘息與在地安老須依個別需求規劃。']},
  {id:'C',title:'從申請到服務',subtitle:'走對每一步',tags:['1966','CMS','申請流程'],source:SOURCES.apply,status:'依官方申請流程整理',lessons:['可撥 1966、洽當地照管中心，或在住院時由出院準備小組協助。','CMS 為長照需要等級；由專員評估，不能用遊戲測驗自行認定。第 1 級不在本辦法給付範圍。','核定與媒合是不同階段；服務開始後仍需追蹤，需求改變時應討論調整或複評。']},
  {id:'D',title:'四包錢與補助練習',subtitle:'看懂額度與自付',tags:['四包錢','CMS','補助'],source:SOURCES.law,status:'額度與比率已對照官方頁面；試算限一般情境',lessons:['四項給付分別管理，不能把未用完的交通額度挪作照顧服務。','照顧與交通以月、喘息以年、輔具環改以三年為週期。試算的數量須與週期一致。','身分別、地區、照顧計畫與項目條件均影響費用；外看家庭、共用家務、輔具單項上限等特殊規則須另核。']},
  {id:'E',title:'讀懂服務代碼',subtitle:'從照顧問題找到服務',tags:['BA','C','GA','服務碼'],source:SOURCES.codes,status:'部分碼表已對照；缺教育指南全文，非完整資料庫',lessons:['BA 是居家照顧、C 是專業服務、GA 是喘息類組合；名稱相近不代表可以互換。','C 類計價可能以整組多次措施為單位，不能當成單次到訪價格。','先確認目標、資格、單位與限制，再連結服務；原民區或離島價格另列，不能套用一般區。']},
  {id:'F',title:'樂活服務網絡',subtitle:'讓照顧連成生活',tags:['樂活','資源媒合','日照'],source:'使用者提供之需求文件',status:'機構名稱依需求建檔；資格、服務區域與合作關係待機構確認',lessons:['把照顧問題拆成生活協助、專業照護、交通、營養與照顧者支持，再確認合適資源。','本圖以需求文件的機構名單建立教學連結，不表示已確認特約資格、服務區域或實際合作。','五間日照中心是城市地標；居家護理、醫療與 A 個管等服務仍須查明提供單位與資格。']},
];
export const FLOW = [
  ['提出申請','1966／照管中心／出院準備小組'],['到府評估','照管專員了解失能及照顧需求'],['確認 CMS 與額度','照管中心或地方主管機關核定'],['擬訂照顧計畫','A 個管與家庭討論，送照管中心核定'],['媒合服務資源','A 個管協調可用且合格的服務'],['接受服務','特約單位提供；社區支持依據點資格'],['追蹤與調整','A 個管追蹤；必要時通報複評'],
] as const;
export const NETWORK = [
  {name:'永春護理之家',role:'A 單位相關服務（待確認）',scope:'照顧計畫與資源聯繫',case:'王奶奶出院：確認 A 個管承接資格，再協調返家資源。'},
  {name:'永春居家長照機構',role:'居家長照',scope:'日常生活與身體照顧需求',case:'白天需要起居協助：先評估需求及服務人力。'},
  {name:'永夏居家長照機構',role:'居家長照',scope:'到宅照顧資源',case:'家庭照顧時段不足：確認可提供區域、項目與時間。'},
  {name:'永春居家護理所',role:'居家護理',scope:'專業護理需求諮詢',case:'有護理照護需要：轉介專業評估，不能以一般照服取代。'},
  {name:'長照交通接送',role:'交通支持',scope:'就醫等接送需求',case:'輪椅回診：核對資格、路線、車輛及預約。'},
  {name:'營養送餐網絡',role:'餐食支持',scope:'用餐可近性與營養需求',case:'獨居用餐不便：確認送餐資格；營養問題另轉專業。'},
  {name:'樂活全齡綜合診所',role:'醫療資源',scope:'醫療評估及轉介諮詢',case:'返家後醫療需求：向診所確認收案與轉介方式。'},
  ...['新營','義合','安南','龍山','大和'].map(n=>({name:n+'日照中心',role:'日間照顧',scope:'白天照顧與社區參與',case:'白天家屬上班：確認適合度、交通與照顧計畫。'})),
];
export const SERVICES = [
  ['BA01','基本身體清潔',260,'次','床上清潔'],['BA02','基本日常照顧',195,'30 分鐘','起居協助'],['BA04','協助進食或管灌餵食',130,'餐','進食協助'],['BA05','餐食照顧',310,'組','案家備餐'],['BA07','協助沐浴及洗頭',325,'次','浴間清潔'],['BA13','陪同外出',195,'30 分鐘','外出安全'],['BA14','陪同就醫',685,'1.5 小時內','就醫陪伴'],['BA15','家務協助',195,'30 分鐘','個案家務'],
  ['CA07','IADLs 復能、ADLs 復能照護',4500,'組（3 次措施）','生活功能目標'],['CB01a','營養照護',4500,'組（3 次措施）','營養需求'],['CB02','進食與吞嚥照護',9000,'組（6 次措施）','吞嚥需求'],
  ['GA03','日間照顧中心喘息服務－全日',1250,'全日','日照替代照顧'],['GA05','機構住宿式喘息服務',2310,'24 小時','短期住宿'],['GA06','小規模多機能服務－夜間喘息',2000,'夜','夜間替代照顧'],['GA09','居家喘息服務',770,'2 小時','家中替代照顧'],
].map(([code,name,price,unit,scenario])=>({code:String(code),name:String(name),price:Number(price),unit:String(unit),scenario:String(scenario),family:String(code).startsWith('BA')?'BA':String(code).startsWith('GA')?'GA':'C',source:SOURCES.codes,effective:'2025-06-19 修正附表；實施日依辦法與原附表',checked:'2026-10-30 已對照碼名與一般區價格；個案適用仍需核定',conditions:'須符合核定照顧計畫及該組合條件，詳見官方附表。',notes:String(code)==='BA15'?'非獨居共用區域有額外自付規則，本試算不含。':String(code)==='BA14'?'不含交通費；定期復健或透析不適用本碼。':String(code).startsWith('C')?'組合價格含多次措施；應依專業服務手冊與核定需求安排。':'時段併用、次數限制與專業人員資格須核對原附表。'}));
export const QUESTIONS: {id:string;module:ModuleId;title:string;background:string;problem:string;choices:string[];correct:number;explanation:string;related:string}[] = [
  {id:'a-discharge',module:'A',title:'王奶奶準備出院',background:'王奶奶行動不便，家屬白天需上班。你是承接個案的 A 個管員。',problem:'已有照管評估，下一步如何協助？',choices:['與家庭討論照顧計畫，送核定並協調資源','直接替王奶奶決定 CMS 等級','保證五間日照中心可提供全部服務'],correct:0,explanation:'A 個管整合需求與協調服務；等級與額度由照管中心或地方主管機關核定。',related:'ABC / 照顧計畫'},
  {id:'b-hah',module:'B',title:'在家接受急症照護？',background:'家屬聽說 HAH，希望直接改用長照額度接受急症治療。',problem:'你應如何回應？',choices:['有 CMS 就保證可以使用','轉由醫療團隊判斷收案，另協調照顧需求','用居家照顧員代替急症醫療'],correct:1,explanation:'醫療與長照銜接需要各自的專業評估，長照資格不能取代醫療收案條件。',related:'HAH / 醫照整合'},
  {id:'c-cms',module:'C',title:'第一次申請長照',background:'陳先生未曾接受長照評估，詢問自己是 CMS 幾級。',problem:'誰負責評估與確認？',choices:['由家屬填測驗後自選','日照櫃台直接決定','照管專員評估，由照管中心或地方主管機關核定'],correct:2,explanation:'CMS 不是遊戲分數；正式服務須經評估與核定。',related:'CMS / 1966'},
  {id:'d-budget',module:'D',title:'交通額度還有剩餘',background:'家屬想把未用完的交通額度，轉作喘息費用。',problem:'如何說明？',choices:['四項給付不得互相流用，另檢視喘息核定內容','只要年度總額未超過就可以','A 個管可以自行批准挪用'],correct:0,explanation:'四項額度分開管理；剩餘交通額度不是現金，也不能直接挪作喘息。',related:'四包錢 / 給付辦法第 7 條'},
  {id:'e-code',module:'E',title:'讓照顧者休息兩小時',background:'家庭照顧者需要外出休息，希望有替手到家中照顧。',problem:'先查詢哪項服務並確認資格？',choices:['BA14 陪同就醫','GA09 居家喘息服務','CB02 進食與吞嚥照護'],correct:1,explanation:'GA09 為居家喘息組合；仍須確認照顧計畫、適用條件及人力。',related:'GA09'},
  {id:'f-network',module:'F',title:'輪椅回診與白天照顧',background:'李爺爺需要回診接送，平日也有白天照顧需求。',problem:'最適當的媒合方式是？',choices:['只找一間日照中心並保證所有需求都能處理','跳過需求討論直接排服務','分別確認交通與日照資源，再由個管協調'],correct:2,explanation:'先拆解需求、確認機構資格及可用量能，再連結資源；教學名單不等於已確認的服務承諾。',related:'服務資源媒合'},
];
