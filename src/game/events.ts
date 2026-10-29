import type { GameEvent } from './types';

// 遊戲效果皆為模擬數值，不代表實際費用、補助或健康預測。
export const EVENT_CARDS: GameEvent[] = [
  { id: 'home', title: '為日常找一位幫手', description: '家人需要日常起居協助，你想重新安排照顧工作。', category: 'SERVICE', serviceKey: 'care', lesson: '先說明需求，再透過評估安排服務；每個家庭的照顧計畫都可能不同。', options: [
    { text: '先討論居家服務需求', effect: { money: -300, stress: -8 }, result: '你與家人一起整理需求，為日常照顧找到支持。' },
    { text: '先與家人分工，再諮詢服務', effect: { stress: -5 }, result: '大家釐清可以分擔的工作，也留下需要專業協助的項目。' },
  ] },
  { id: 'day', title: '走進日照中心', description: '家人想參與白天的活動，你們一起了解日間照顧。', category: 'SERVICE', serviceKey: 'care', effect: { money: -200, health: 5, stress: -8 }, result: '你們認識了日照活動與服務流程，也討論了合適的安排。', lesson: '日間照顧屬照顧服務的一種，可依需求與照顧計畫討論使用。' },
  { id: 'transport', title: '安排下一次回診', description: '回診時間已確定，家人當天無法接送。你會如何準備？', category: 'SERVICE', serviceKey: 'transport', lesson: '預約前確認目的地、時間、移動需求及適用服務，實際費用依地方規定。', options: [
    { text: '詢問長照交通接送與預約', effect: { money: -200, stress: -8 }, result: '你確認了預約方式，為回診安排接送支持。' },
    { text: '先協調親友接送，保留備案', effect: { money: -100, stress: -4 }, result: '親友協助這次接送，你也記下可諮詢的交通資源。' },
  ] },
  { id: 'equipment', title: '找到合適的輔具', description: '日常移動開始需要更多協助，你準備了解輔具。', category: 'SERVICE', serviceKey: 'equipment', effect: { money: -400, stress: -8 }, result: '先評估、再選擇，你學會把使用需求放在購買之前。', lesson: '輔具可有租賃或購買方式，應先確認需求評估、適用項目及申請流程。' },
  { id: 'safety', title: '一起檢查居家動線', description: '家人覺得浴室與走道不太好通行，你們決定一起整理。', category: 'LIVING', serviceKey: 'equipment', effect: { money: -200, health: 5 }, result: '你整理了動線，也記下需要專業評估的環境改善項目。', lesson: '居家環境改善可先向照管中心提出需求，依評估與核定內容安排。' },
  { id: 'respite', title: '把休息排進行事曆', description: '你希望有一段時間休息，也讓家人的照顧持續有人接手。', category: 'SERVICE', serviceKey: 'respite', lesson: '喘息是照顧支持的一部分，可和個管員討論合適的服務方式。', options: [
    { text: '討論居家喘息安排', effect: { money: -500, stress: -16 }, result: '你為家中照顧安排替手，留出一段自己的時間。' },
    { text: '了解社區或機構喘息', effect: { money: -600, stress: -18 }, result: '你認識了不同的替代照顧選擇，開始規劃休息。' },
  ] },
  { id: 'meal', title: '樂活聚飽棚・一起吃飯', description: '你來到共餐站，準備認識一起吃飯的鄰里朋友。', category: 'LIVING', serviceKey: 'meal', effect: { health: 5, stress: -6 }, result: '一頓飯連結了社區，你完成一次共餐任務。', lesson: '共餐資訊取自提供的文宣，參與前請先致電確認服務對象、時間與方式。' },
  { id: 'professional', title: '練習生活中的小目標', description: '你和家人想為日常活動訂一個合適的小目標。', category: 'SERVICE', serviceKey: 'care', effect: { money: -300, health: 8 }, result: '你學會和專業人員一起討論需求，再安排練習。', lesson: '專業服務應依個別評估與照顧目標安排，遊戲中的健康變化只是模擬。' },
  { id: 'family', title: '把照顧工作說清楚', description: '大家坐下來討論本週的陪伴、採買與照顧分工。', category: 'LIVING', serviceKey: 'community', effect: { stress: -6 }, result: '把需求說出來，也讓身邊的人有機會提供支持。', lesson: '社區資源與家庭分工可以一起規劃。' },
  { id: 'health', title: '留意自己的生活節奏', description: '忙碌的一週，你決定留時間整理睡眠、飲食與休息安排。', category: 'LIVING', effect: { health: 6, stress: -3 }, result: '你為照顧者的生活留了一點空間。', lesson: '健康數值是遊戲指標，不能代替實際健康評估。' },
  { id: 'community', title: '參加社區活動', description: '附近據點舉辦交流活動，你與家人一起參加。', category: 'LIVING', serviceKey: 'community', effect: { stress: -6, health: 3 }, result: '你多認識了幾位鄰居，也知道能向哪裡詢問資源。', lesson: '各據點活動與服務時間，請向實際主辦單位確認。' },
  { id: 'opportunity-care', title: '機會卡・服務分享', description: '鄰居分享了居家服務與日照的諮詢管道。', category: 'OPPORTUNITY', serviceKey: 'care', effect: { stress: -5 }, result: '你記下需要詢問的問題，準備了解照顧服務。', lesson: '認識管道是第一步，能否使用服務仍需依評估與核定結果。' },
  { id: 'opportunity-respite', title: '機會卡・照顧者聚會', description: '一位照顧者分享如何把喘息時間安排進日常。', category: 'OPPORTUNITY', serviceKey: 'respite', effect: { stress: -7 }, result: '你得知休息也可以列入照顧計畫。', lesson: '有喘息需求時，可向照管中心或個管員提出。' },
  { id: 'accident', title: '臨時調整照顧安排', description: '原本約好的親友臨時有事，需要重新協調今天的安排。', category: 'ACCIDENT', serviceKey: 'community', options: [
    { text: '聯絡其他家人，調整分工', effect: { stress: 3 }, result: '你和家人完成協調，也發現事先準備備案很有幫助。' },
    { text: '詢問既有服務單位能否調整', effect: { money: -300, stress: 1 }, result: '你了解了服務安排的限制，並和家人一起找到備案。' },
  ], lesson: '服務是否能臨時調整，仍需依實際人力與預約情況確認。' },
  { id: 'rest', title: '在休息站停一會', description: '暫時放慢腳步，和同行的人聊聊這段旅程。', category: 'REST', effect: { health: 5, stress: -8 }, result: '你整理了心情，準備繼續出發。', lesson: '持續照顧的同時，也記得安排自己的休息。' },
  { id: 'resource', title: '整理社區資源筆記', description: '你收到一份資源介紹，準備記下可能用得到的聯絡管道。', category: 'RESOURCE', serviceKey: 'community', effect: { money: 300, stress: -3 }, result: '你獲得 300 遊戲幣，並整理好自己的社區資源筆記。', lesson: '這是遊戲獎勵，不代表可申請或領取的實際補助。' },
];
export function eventsForTile(eventIds: readonly string[]) {
  return EVENT_CARDS.filter((event) => eventIds.includes(event.id));
}
