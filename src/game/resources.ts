import type { ServiceKey } from './types';

export interface CommunityResource {
  key: ServiceKey;
  title: string;
  shortTitle: string;
  icon: string;
  description: string;
  details: string[];
  sourceUrl?: string;
  sourceLabel: string;
  poster?: { amount: string; period: string; shares: string[] };
}

export const RESOURCES: CommunityResource[] = [
  {
    key: 'care', title: '照顧及專業服務', shortTitle: '照顧服務', icon: '♡',
    description: '把日常照顧與專業支持，安排進家人的生活。',
    details: ['包含居家服務、日間照顧等照顧支持，以及依需求安排的專業服務。', '可撥打 1966 或洽所在地照管中心，由評估與照顧計畫連結適合的服務。'],
    sourceUrl: 'https://1966.gov.tw/LTC/lp-6451-207.html', sourceLabel: '衛福部｜照顧及專業服務',
    poster: { amount: '10,020–36,180 元', period: '每月，依失能等級', shares: ['一般戶 16%', '中低收入戶 5%', '低收入戶全額補助'] },
  },
  {
    key: 'transport', title: '交通接送服務', shortTitle: '交通接送', icon: '↔',
    description: '回診、定期復健或透析的路上，多一份接送支持。',
    details: ['交通接送（DA01）提供居家與醫療院所之間的往返接送；實際預約與費用由地方規定及服務單位確認。', '社區式服務接送屬另一給付組合，前往日照與醫療院所的接送，應先確認適用服務。'],
    sourceUrl: 'https://1966.gov.tw/LTC/cp-6452-69937-207.html', sourceLabel: '衛福部｜交通接送服務',
    poster: { amount: '1,680–2,400 元', period: '每月，依原圖所列條件', shares: ['一般戶 21%–30%', '中低收入戶 7%–10%', '低收入戶全額補助'] },
  },
  {
    key: 'equipment', title: '輔具及居家無障礙環境改善', shortTitle: '輔具環境', icon: '⌂',
    description: '從適合的輔具與居家動線開始，讓日常更方便。',
    details: ['先透過需求評估，了解合適的輔具、租賃或居家環境改善方式，再依核定項目安排。', '官方資料已於 2026 年更新，包含智慧科技輔具租賃項目；照片上的舊額度不能直接視為現行核定金額。'],
    sourceUrl: 'https://1966.gov.tw/LTC/cp-6453-69940-207.html', sourceLabel: '衛福部｜輔具及居家無障礙',
    poster: { amount: '40,000 元', period: '每 3 年（原圖資料）', shares: ['一般戶 30%', '中低收入戶 10%', '低收入戶全額補助'] },
  },
  {
    key: 'respite', title: '喘息服務', shortTitle: '喘息支持', icon: '☼',
    description: '安排短暫替代照顧，讓照顧者也有休息的時間。',
    details: ['可依評估需求討論居家、社區或機構喘息方式，讓照顧者獲得短暫休息。', '向照管中心或個管員提出需求，由照顧計畫協助連結服務。原圖標示的「每月」週期不宜作為申請依據，請查閱官方現行規定。'],
    sourceUrl: 'https://1966.gov.tw/LTC/cp-6454-70075-207.html', sourceLabel: '衛福部｜喘息服務',
    poster: { amount: '32,340–48,510 元', period: '原圖週期標示待核對', shares: ['一般戶 30%', '中低收入戶 10%', '低收入戶全額補助'] },
  },
  {
    key: 'meal', title: '樂活聚飽棚', shortTitle: '社區共餐', icon: '♧',
    description: '幸福共響，餐餐有您。一起回家吃飯，讓關心從一頓飯開始。',
    details: ['文宣服務對象：單親家庭、獨居老人與弱勢民眾。', '文宣共餐地點：臺南市南區永春街 7 號。', '文宣共餐時間：週一至週五 16:00–19:30。', '共餐專線：06-2910236。前往前請先確認開放時間與參與方式。'],
    sourceLabel: '使用者提供的桌遊文宣；未標示日期，聯絡資訊待主辦單位確認',
  },
  {
    key: 'community', title: '樂活基金會・社區支持', shortTitle: '社區支持', icon: '✿',
    description: '從社區據點出發，認識照顧、日照與共餐的支持網絡。',
    details: ['原圖以樂活基金會與樂活集團為角落識別，周圍呈現日照、居家及住宿照顧等單位。', '各據點完整名稱、照片、電話與地址，將在取得清晰原稿後逐筆補齊；目前的功能格為服務情境，不代表已確認的機構名錄。'],
    sourceLabel: '使用者提供的桌遊文宣；外圈機構資料待補齊',
  },
];

export const CORE_SERVICES: ServiceKey[] = ['care', 'transport', 'equipment', 'respite'];
export const getResource = (key: ServiceKey) => RESOURCES.find((resource) => resource.key === key)!;

export function missionSummary(learned: ServiceKey[] = [], health = 0, stress = 100, activities: ('meal' | 'respite')[] = []) {
  const coreCount = CORE_SERVICES.filter((key) => learned.includes(key)).length;
  return [
    { label: '認識四大服務', detail: `${coreCount} / 4 類`, done: coreCount === 4 },
    { label: '參與社區共餐', detail: activities.includes('meal') ? '已完成' : '到共餐站完成事件', done: activities.includes('meal') },
    { label: '安排喘息支持', detail: activities.includes('respite') ? '已完成' : '到喘息站完成事件', done: activities.includes('respite') },
    { label: '照顧身心平衡', detail: '健康 ≥ 60・壓力 ≤ 50', done: health >= 60 && stress <= 50 },
  ];
}
