import type { GameEvent, ServiceKey } from './types';

// Distinct scenarios for the thirty new stops. Effects are game units, never benefit amounts.
// Policy: https://1966.gov.tw/LTC/cp-6572-85008-207.html
// Application: https://1966.gov.tw/LTC/cp-6533-70777-207.html
type Scenario={index:number;id:string;title:string;description:string;action:string;lesson:string;serviceKey:ServiceKey;health?:number;stress?:number;money?:number};
export const JOURNEY_SCENARIOS:readonly Scenario[]=[
  {index:1,id:'policy-30',title:'長照 3.0 導覽',description:'社區導覽介紹醫療與照顧的銜接。你想替返家生活先做準備。',action:'記下返家需要的協助',lesson:'長照 3.0 強調服務整合；個別方案仍須確認資格與實施條件。',serviceKey:'care'},
  {index:2,id:'apply-call',title:'第一通求助電話',description:'家人生活需要協助，你正在找申請入口。',action:'撥打 1966 諮詢',lesson:'可向 1966 或當地照管中心提出需求，再安排評估。',serviceKey:'care',stress:-2},
  {index:3,id:'needs-notes',title:'需求小筆記',description:'訪視前，家人對每天需要多少協助說法不同。',action:'一起記錄日常困難與期待',lesson:'實際生活紀錄有助於和照管專員討論需求，不能自行認定長照等級。',serviceKey:'care'},
  {index:4,id:'assessment',title:'到府評估日',description:'專員來訪，你希望把照顧情況說清楚。',action:'由本人與家人共同表達需要',lesson:'評估與核定由主管機關辦理；尊重被照顧者的意願。',serviceKey:'care'},
  {index:5,id:'a-plan',title:'A 單位協調站',description:'交通、白天照顧與家庭時段需要一起安排。',action:'與 A 個管討論照顧計畫',lesson:'A 社區整合型服務中心協調資源與計畫，不代表直接提供所有服務。',serviceKey:'care',stress:-2},
  {index:6,id:'b-services',title:'B 單位服務街',description:'你看到不同服務單位，想知道哪一個適合自己。',action:'核對項目、資格與可用時段',lesson:'B 複合型服務中心提供或連結照顧，實際內容依單位資格與安排。',serviceKey:'care'},
  {index:7,id:'c-neighbors',title:'C 單位鄰里站',description:'鄰居邀你參加巷弄據點活動。',action:'先了解活動與參與方式',lesson:'C 巷弄長照站支持社區參與；不能把所有據點當成日照中心。',serviceKey:'community',stress:-2},
  {index:8,id:'service-match',title:'資源媒合櫃台',description:'計畫已核定，但你還不確定哪天開始服務。',action:'確認承接單位與開始時間',lesson:'核定不等於已完成媒合，需確認提供單位、人力及時段。',serviceKey:'care'},
  {index:9,id:'follow-up',title:'追蹤關懷路口',description:'最近家中的協助需求改變了。',action:'聯絡個管討論調整',lesson:'服務後仍需追蹤；需求改變時可討論調整或複評。',serviceKey:'care',stress:-2},
  {index:10,id:'day-arrival',title:'大和迎賓庭院',description:'第一次來到日照中心，對新環境有些緊張。',action:'和工作人員熟悉動線與作息',lesson:'日照的活動、交通與照顧安排應先確認適合度，中心主題是遊戲情境。',serviceKey:'care',stress:-2},
  {index:20,id:'movement-break',title:'健康伸展角',description:'活動課安排了簡單伸展，你想找到適合的強度。',action:'依自己的狀態與專業建議參與',lesson:'健康促進應考量個別能力與安全，不必和別人比較。',serviceKey:'community',health:2},
  {index:21,id:'nutrition-chat',title:'營養討論桌',description:'最近食量改變，家人想直接套用別人的菜單。',action:'記錄飲食情況並諮詢專業',lesson:'營養與吞嚥需求因人而異，應由專業人員評估。',serviceKey:'meal',health:2},
  {index:22,id:'day-schedule',title:'一天的生活節奏',description:'活動與休息排得太滿，你想調整作息。',action:'共同安排活動與休息',lesson:'日照生活活動應兼顧個人喜好、休息與照顧需求。',serviceKey:'care',stress:-2},
  {index:33,id:'caregiver-circle',title:'照顧者交流圈',description:'你在交流時發現，其他家庭也會感到疲累。',action:'分享困難並詢問支持資源',lesson:'照顧者也需要支持，可以主動向服務窗口求助。',serviceKey:'community',stress:-3},
  {index:34,id:'respite-plan',title:'喘息預約日曆',description:'下月需要外出辦事，家中照顧要先安排。',action:'提前確認喘息資格與時段',lesson:'喘息需依核定、服務量能與安排使用，並非臨時一定有空位。',serviceKey:'respite',stress:-3},
  {index:35,id:'ride-check',title:'友善交通月台',description:'回診需要輪椅接送，你準備預約車輛。',action:'確認路線、車型與預約方式',lesson:'交通接送依資格與服務條件辦理，先確認可用性。',serviceKey:'transport',money:-100,stress:-2},
  {index:46,id:'discharge-team',title:'出院銜接會議',description:'家人即將返家，醫療與日常照顧都要準備。',action:'請出院團隊協助銜接',lesson:'醫療與長照有不同職責，出院前可先討論返家需要。',serviceKey:'care',stress:-2},
  {index:47,id:'abc-challenge',title:'ABC 分工挑戰',description:'朋友問：是不是找 A 單位就能直接得到所有服務？',action:'說明評估、計畫與服務提供的分工',lesson:'A 協調、B 提供或連結服務、C 支持社區參與；實際以資格及安排為準。',serviceKey:'community'},
  {index:48,id:'team-huddle',title:'跨專業討論室',description:'返家後的生活目標需要照服、護理與復能人員合作。',action:'提出共同目標並確認分工',lesson:'不同專業各有職責，應以本人需求協作，不能彼此取代。',serviceKey:'care',stress:-2},
  {index:59,id:'home-goal',title:'居家復能小目標',description:'你希望自己走到餐桌，不知道如何開始練習。',action:'與專業人員設定生活目標',lesson:'居家復能以個別生活功能目標規劃，練習方式需由專業評估。',serviceKey:'care',health:2},
  {index:60,id:'equipment-fit',title:'輔具試用站',description:'看到適合朋友的助行器，你也想買一台。',action:'先評估與試用合適輔具',lesson:'輔具須考量個人能力、尺寸與環境，不只看外觀。',serviceKey:'equipment',health:2},
  {index:61,id:'safe-home',title:'安心返家門廊',description:'家中走道有雜物，夜間走動不方便。',action:'和家人檢視照明與通行空間',lesson:'居家安全需依實際環境檢視，必要時尋求專業環境評估。',serviceKey:'equipment',health:2},
  {index:72,id:'dementia-neighbor',title:'失智友善街角',description:'鄰居在熟悉街口顯得焦急，找不到同行家人。',action:'溫和陪伴並尋求適當協助',lesson:'尊重與耐心有助友善互動；不要責備或替對方自行診斷。',serviceKey:'community',stress:-2},
  {index:73,id:'memory-art',title:'記憶與創作',description:'創作課提供音樂與繪畫，你想邀同伴參與。',action:'讓同伴選擇喜歡的活動',lesson:'以興趣與意願支持參與；活動不能取代醫療評估或治療。',serviceKey:'community',stress:-2},
  {index:74,id:'social-invite',title:'社會參與廣場',description:'長輩想再次參加社區活動，但擔心交通與體力。',action:'一起確認無障礙動線與休息點',lesson:'社會參與應尊重意願，並依能力安排支持。',serviceKey:'community',health:2},
  {index:75,id:'network-review',title:'照顧網絡拼圖',description:'請回想五個庭院，整理家庭可能用到的資源。',action:'依需求列出服務與聯絡窗口',lesson:'從需求找資源，還要確認服務資格與可用性。',serviceKey:'care'},
  {index:76,id:'budget-review',title:'費用確認站',description:'有人說遊戲幣的增減就是現實補助額度。',action:'區分遊戲數值與實際核定',lesson:'遊戲效果不是津貼；實際費用依核定、身分及服務條件確認。',serviceKey:'care'},
  {index:77,id:'family-challenge',title:'綜合情境挑戰',description:'家人回診、照顧者要休息，長輩也希望持續參加日照。',action:'共同排列需求並與個管討論',lesson:'把交通、照顧與喘息整合安排，不能只處理單一需求。',serviceKey:'respite',stress:-3},
  {index:78,id:'next-plan',title:'明天的照顧計畫',description:'旅程即將結束，你想把學到的內容帶回生活。',action:'記下下一步與可詢問的窗口',lesson:'認識資源只是起點，有需要時向 1966 或照管中心諮詢。',serviceKey:'community'},
  {index:79,id:'journey-finish',title:'抵達樂活終點',description:'你已走到第 80 格。回顧這段照顧旅程，等待同輪夥伴完成行動。',action:'完成旅程回顧',lesson:'照顧是持續合作的過程；結算依原有金錢、健康與壓力權重。',serviceKey:'community'},
];
export const JOURNEY_EVENTS:GameEvent[]=JOURNEY_SCENARIOS.map(s=>({
  id:s.id,title:s.title,description:s.description,category:s.index===79?'FINISH':'OPPORTUNITY',serviceKey:s.serviceKey,lesson:s.lesson,
  options:[{text:s.action,effect:{money:s.money??0,health:s.health??0,stress:s.stress??0},result:s.lesson+' 本格數值為遊戲模擬。'}],
}));
