# Phase A Session 與 Phase C 擴充介面

目前只有 LocalGameSession，沒有多人伺服器或網路同步。

介面上的「本機在線」僅以瀏覽器本機儲存心跳估算同一瀏覽器近期開啟的本站分頁數，不是全站訪客數或線上玩家數。

資料流：UI → Zustand 投影 → GameSessionAdapter.dispatch → 規則純函式 → 不可變 snapshot → UI／城市。自動存檔由 Session 呼叫 GameSaveRepository，再交給 StorageAdapter。瀏覽器儲存與分頁 ID 僅在 browserSession 組裝。

## 穩定邊界

- `mapDefinition.ts` 固定 mapId、mapVersion、rulesVersion、80 格、入口／終點與五中心資料。
- `rules/boardRules.ts` 保存邏輯格子與事件對應，不依賴 Three.js 世界座標。
- `cityLayout.ts` 保存固定座標與種子，`board.ts` 將邏輯格子與座標組合給渲染使用。
- `rules/engine.ts` 接收 snapshot、骰子樣本／事件樣本，回傳新 snapshot。測試可注入樣本；正式本機遊戲由 LocalGameSession 產生樣本。動畫只提交 COMPLETE_MOVEMENT，不決定骰數與事件效果。
- 玩家 snapshot 只含邏輯位置；角色模型與動畫仍由原渲染元件負責。

## GameSessionAdapter

介面原始碼：`src/game/session/GameSessionAdapter.ts`。

| 方法 | 合約 |
| --- | --- |
| getInfo() | Session ID、local／online、地圖及規則版本 |
| getSnapshot() | 目前權威快照；不得由 UI 直接修改 |
| subscribe(listener) | 發布快照；回傳取消訂閱函式 |
| dispatch(command) | 接受操作意圖，回傳接受／拒絕及 revision，支援 Promise |
| save()、load() | 經 Session 管理持久化，支援 Promise |
| dispose() | 停止計時器、通知與其他 Session 資源 |

命令包括 START_GAME、ROLL_DICE、COMPLETE_MOVEMENT、CHOOSE_EVENT、ADVANCE_TURN、RESET_GAME。事件選項只傳 eventId、optionIndex，不能由 UI 傳金錢、位置、骰數或效果。expectedRevision 避免舊動畫或重複操作套用到新狀態；LocalGameSession 拒絕額外欄位、錯誤階段及過期 revision。

`setGameSessionAdapter(adapter)` 會檢查版本、取消舊訂閱與計時器，將新快照投影到既有 Store。城市繼續讀取同一份 players／phase／diceValue，不需重寫渲染。測試涵蓋替換 Adapter 與延遲動畫的 revision 保護。

## 本地儲存與訪客隔離

每個分頁取得獨立 Session ID，核心遊戲自動／手動存檔分別使用 `long-care-game-save-v3:<id>`、`lohas-manual-save-v3:<id>`。重新整理保留 ID；新進站／新分頁從最近有效進度複製到自己的儲存槽，之後互不覆寫。不同瀏覽器的 localStorage 自然分離。關閉後重新進站會複製最近進度；本次未加入歷史儲存槽清理，以免誤刪資料。

學習記錄、探索與畫質偏好仍保留原本瀏覽器層級儲存，並非各分頁獨立。它們不改變回合、骰子或玩家數值。

目前存檔版本為 4，地圖 lohas-city-80（版本 2），規則版本 2；仍沿用 v3 槽位鍵以保留各分頁身分。v1 先由 40 格對應至舊 50 格，v2/v3 直接套用 FIFTY_TO_CURRENT，再轉成新版位置。遷移前保留來源 JSON 至 -backup-before-v4；未知版本、地圖／規則不相容或損壞時阻止自動寫入並提示，可匯出或另開新槽。移動中保存映射後的原定落點 pendingMoveTarget，保留原骰數；事件以原 ID 恢復，不重複套用。詳見 [80 格報告](CITY_BOARD_80.md)。

## 未來 Phase C

可新增 OnlineGameSession 實作同一介面，但本次沒有此實作。正式上線前需補上伺服器身分與回合權限、命令唯一 ID、重送去重、排序／revision、斷線恢復、房間生命週期與錯誤 UI；目前 UI 的同步操作橋接也需處理非同步拒絕與等待狀態。

伺服器必須自行驗證回合、骰子亂數、移動、事件選項、數值與勝負，只接收操作意圖，不能信任客戶端送出的結果。COMPLETE_MOVEMENT 在本機用於結束顯示動畫；在線上必須由伺服器控制結算，不能讓動畫客戶端決定權威結果。本機 revision 與欄位檢查不是防作弊系統。

地圖版本、規則版本與事件資料需與伺服器握手核對。共享城市角色同步、社交與 2–4 人線上房間是未來獨立功能，不會因換 Adapter 自動具備。
