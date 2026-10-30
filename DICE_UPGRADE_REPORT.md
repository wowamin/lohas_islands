# 擲骰動畫、事件揭曉與手機工具列

## 本次實作

沿用實際安裝的 React 19.3.0、Three.js 0.186.1、R3F 9.8.1、Drei 10.7.9、Zustand 5.0.15。沒有新增動畫或音效依賴，也沒有建立額外骰子 WebGL renderer。

骰子六面固定，對面點數合計 7，所有點數共用 pip geometry／material。圓角模型使用既有 Three.js 的 RoundedBoxGeometry，落地時有柔和接觸陰影、擴散光圈與 8 顆星星。資源在場景建立時配置，擲骰期間只更新姿態、透明度及既有粒子矩陣。

遊戲 Session 仍只在 ROLL_DICE 產生一次骰子結果。DiceAnimationController 接收結果後呈現 `rolling → revealing → moving`，不產生亂數或套用事件。玩家逐格移動在揭曉階段結束後才開始。跳過時取消展示排程，保留同一骰數並完成一次移動；revision、階段檢查及一次性完成旗標防止重複提交。

## 動畫參數

| 模式 | 翻滾／落地 | 揭曉 | 合計，不含移動 | 每格移動 |
| --- | --- | --- | --- | --- |
| 標準 | 1200 ms | 400 ms | 1600 ms | 360 ms |
| 快速 | 270 ms | 180 ms | 450 ms | 100 ms |
| 系統減少動態 | 0 ms | 120 ms | 120 ms | 50 ms |

標準翻滾前 14% 為蓄力；14–68% 浮起多軸翻轉；68–86% 第一次彈跳；86–100% 第二次小彈跳。姿態以 quaternion 對準結果骰面，92% 後已精準對齊。減少動態時不翻轉、不彈跳、不顯示光圈及星星，亦不震動；執行期間切換系統偏好也會簡化動畫。無 WebGL 時沿用 HUD 的 SVG 骰子、揭曉面板及相同控制流程。

## 音效與設定

使用原生 Web Audio 合成短促按壓、低通翻滾聲、落地低音、柔和揭曉和腳步提示。只有按下擲骰／啟用音效時才建立或恢復 AudioContext；同一 context 及翻滾 noise buffer 重複使用。瀏覽器封鎖或不支援時安靜退回，遊戲流程仍可完成。

「動畫與音效」設定可靜音、選快速模式，以及明確選用震動。震動預設關閉，每次落地 18 ms，僅在支援、使用者勾選及啟用條件允許時呼叫。靜音會停止現有聲源並阻止後續聲源；設定儲存於 `lohas-dice-preferences-v1`，與玩家存檔分離。

API 行為參考：[MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)、[MDN vibrate](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate)。

## 事件卡與工具列

選項只顯示情境文字；按下後才顯示金錢、健康、壓力的實際增減，包含 0。結果從套用後與套用前的玩家數值相減取得，受到上限或下限限制時也不會誤報原始效果。既有事件效果、評分與勝負規則沒有調整。

新增可選的 eventOutcome 結果欄位，版本 3 舊存檔仍可讀取；缺少此欄位的已結算舊事件保留原文字說明，不推測歷史增減。新結果可存檔／重新整理後顯示，且不再次執行選擇。

手機版（900px 以下）city-toolbar 使用單列排列，左側固定至少 48×48px 的 `<` 收合鍵，右側固定 `?` 說明鍵，中間操作可左右滑動，避免窄螢幕換行；收合後留下 `>` 展開鍵。隱藏的操作也會離開鍵盤焦點順序；收合時關閉工具列開啟的光影、清單與說明面板。工具列狀態不改變回合，桌面版一律維持完整工具列。

## 修改檔案

- 新增：`src/game/dice/DiceAnimationController.ts`、`settings.ts`、`presentation.ts`、`feedback.ts`。
- 新增：`src/components/DiceController.tsx`、`src/components/District/diceModel.ts`、`src/components/UI/DicePreferences.tsx`、`DiceResult.tsx`。
- 修改：`src/components/District/gamePieces.ts`、`CareIsland.tsx`、`src/components/MovementController.tsx`。
- 修改：`src/game/rules/model.ts`、`engine.ts`、`src/game/session/LocalGameSession.ts`、`src/game/store/createGameClient.ts`、`src/game/storage/saveCodec.ts`。
- 修改：`src/components/UI/HUD.tsx`、`EventModal.tsx`、`CityExplorer.tsx`、`src/App.tsx`、`src/main.tsx`。
- 新增：`src/dice.css`、`src/toolbar.css`、`scripts/test-dice.mjs`；更新 `scripts/test-game.mjs`、`test-browser.mjs`。
- 文件：本報告。瀏覽器截圖與效能樣本保存在 `artifacts/`。

## 驗收結果

- `npm.cmd test`：既有棋盤、1–4 人、事件、12 輪結算、教育及存檔測試通過；新增六面 pip 數量、對面合計、最終 quaternion、資源重用、三種模式、跳過、重複／偽造／過期命令拒絕及已存骰數恢復測試通過。所有既有事件另驗證結果顯示實際受限增減。
- `node scripts/test-browser.mjs --dice`：實際點擊後才建立音效 context、連點鎖定、先揭曉後移動、跳過翻滾、取消舊計時、事件與回合一次性、選擇後才顯示數值、renderer 重用、靜音、震動選用、快速／減少動態、重整恢復及 2D 備援通過。
- `node scripts/test-browser.mjs --toolbar`：320／390／768px 的收合、再展開、鍵盤操作、設定保留及無橫向溢出通過，桌面版顯示正常。
- `node scripts/test-browser.mjs --mobile-layout`：手機左下擲骰操作、重複鎖定、跳過及回合切換通過。
- `node scripts/test-browser.mjs`：完整城市、三種鏡頭、畫質、四人、教育、手動存讀、舊存檔、跨圈及可操作 2D 備援回歸通過。
- `npm.cmd run build`、`node scripts/test-deploy.mjs`：通過。大型 Three.js 共用區塊提醒仍存在。Lint 結束碼 0，仍有既有 effect／ref 與測試運算式警告。

## 後續與限制

測試使用桌面 Chrome 與手機尺寸模擬，震動 API 以測試替身驗證「未勾選不呼叫／勾選後呼叫」，未代表實體手機震動測試。音效有驗證聲源啟動、重用、靜音及瀏覽器限制下仍可遊玩，仍需真人在手機／耳機試聽調整音量。未宣稱所有裝置達成指定 FPS。

新增 COMPLETE_ROLL 命令只結束本機展示等待，不接受骰數並會取消 1700 ms 的本機備援計時。未來 OnlineGameSession 必須由伺服器自行驗證／安排擲骰結果與 MOVING 快照，不能將客戶端動畫完成通知視為權威結算。渲染持續接收同一 snapshot 的 diceValue，不需要改成客戶端自行擲骰。

本次沒有修改或發布工作區內其他同時進行的功能。
