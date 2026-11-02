# Phase 1：80 格路線與場景基礎

本報告對應使用者最新指定的六階段計畫，只交付 Phase 1。沿用 `feature/80-tile-city-board` 上一輪的 80 格成果與既有未提交修改，不重新建立專案、不撤除已存在的功能。Phase 2 須待使用者確認後再開始，正式站未發布。

## 實際架構位置

|範圍|檔案|用途|
|---|---|---|
|棋盤常數與分區|`src/game/mapDefinition.ts`|80 格、0／79 起終點、七區、舊位置映射|
|棋盤邏輯|`src/game/rules/boardRules.ts`|唯一索引、畫面編號、區域、事件 ID、前後節點|
|路線座標|`src/game/cityLayout.ts`|入口、五庭院與終點的連續世界座標及朝向|
|共用棋盤資料|`src/game/board.ts`|合併邏輯與座標，供各渲染端使用|
|Three.js 主場景|`src/components/District/CareIsland.tsx`|WebGL、相機、玩家與互動|
|基本地形／道路／庭院|`src/components/District/islandModel.ts`、`landscape.ts`|城市地面、道路、五中心、入口與終點|
|角色|`src/components/Characters/actor.ts`、`model.ts`|原爺爺／奶奶及逐格行走、轉向、多人錯位|
|移動控制|`src/components/MovementController.tsx`|依骰數逐格播放，完成後提交落點|
|Zustand|`src/game/store/useGameStore.ts`、`createGameClient.ts`|遊戲 Session 的狀態投影與操作橋接|
|遊戲規則|`src/game/rules/engine.ts`、`session/LocalGameSession.ts`|擲骰、事件、回合、終點、計分及命令防重|
|事件|`src/game/events.ts`、`eventRegistry.ts`、`journeyEvents.ts`、`transitionEvents.ts`|原事件、新旅程情境、起點與零效果轉場|
|2D 備援|`src/components/UI/CityMap.tsx`、`src/game/city.ts`|使用同份棋盤與玩家資料的 SVG 路線|
|存檔|`src/game/storage/saveCodec.ts`、`LocalSaveRepository.ts`、`session/browserSession.ts`|版本遷移、原文備份、分頁隔離、恢復與重開|

## 路線與可玩性

|區域|程式索引|畫面編號|數量|
|---|---|---|---:|
|城市入口|0–9|1–10|10|
|大和日照中心|10–22|11–23|13|
|安南日照中心|23–35|24–36|13|
|新營日照中心|36–48|37–49|13|
|義合日照中心|49–61|50–62|13|
|龍山日照中心|62–74|63–75|13|
|終點園區|75–79|76–80|5|

路線由入口步道依序穿越五個庭院，接回公園側終點花園；使用庭院弧線及城市連接道路，不採傳統方形棋盤。路線不自交，每個非末站都有有效下一格；末站停在 79，不接回起點。

骰子保留原動畫與音效。玩家逐格移動、平滑轉向，最後一步完成後才開啟落點事件。超出終點直接停在 79。完成終點回顧後，同輪尚未行動者完成其回合，再統一結算；單人立即於該輪完成後結算。評分公式不變：金錢 /100 + 健康 ×2 − 壓力 ×2。

3D 與 2D 共用 `BOARD_DATA`，包含相同 80 格、分區、玩家位置與終點規則。WebGL 不可用時仍可完整遊玩。基本地形、原建築及原裝飾沿用，本次未製作新一輪完整美術資產。

## 本次補齊的內容與修改檔案

上一輪已完成主要 80 格基礎。本次檢查發現起點與五個舊出口原為空事件陣列，補成明確事件對應，確保 80 格皆有可解析事件 ID。

- 新增 `src/game/transitionEvents.ts`：起點 `city-entrance`，以及五個 `city-rest-*` 出口事件。全部零數值效果，無服務／任務獎勵。
- 修改 `src/game/rules/boardRules.ts`：僅為原空白起點與轉場補上事件 ID；原事件 ID、格名、類型、服務與相對順序不變。
- 修改 `src/game/eventRegistry.ts`：登錄上述六個對應。
- 修改 `src/game/rules/engine.ts`：出口仍自動揭曉原零效果結果，維持一次繼續操作；原有會增加健康或降低壓力的休息事件仍照原規則處理。
- 修改 `scripts/test-board.mjs`：驗證所有 80 格的事件對應；比對原事件及數值全文，額外確認被動出口不改數值與服務紀錄。
- 修改 `scripts/export-route.mjs`，重新產生 `public/city-route-80.json`、`docs/CITY_BOARD_80_DATA.md`，新增起點與出口對照。
- 更新 `README.md` 與本報告，明確設定 Phase 1 交付與 Phase 2 確認界線。
- 更新 `artifacts/city80-*`：本次瀏覽器完整旅程紀錄與截圖。

角色模型、原始事件全文、數值權重與存檔格式未因本次補齊而改變。原 v1–v3 遷移至 v4、移動中／待處理事件恢復、原檔備份與分頁隔離繼續保留。舊事件 ID 未刪除。

## 視覺參考的使用方式

使用者提供的「長照人生城市旅程 3.0.png」作為後續 Cozy Isometric Diorama 的城市密度、層次、庭院與溫暖材質方向。本階段保留既有可玩場景與基本地形，不宣稱已達圖片美術完成度。

圖片部分格號重複、區間及數量互有衝突，因此不將圖片文字當作棋盤資料；保留已確定的唯一索引 0–79、畫面編號 1–80 與上述七區配置。這也避免圖片中的生成錯字取代正確中心名稱。

## 驗收

- `npm.cmd test`：通過。包含 80 格數量／唯一性／有效座標／分區／路線連續無交叉／全格事件 ID，以及原事件、角色、骰子、教育、1–4 人完整旅程、超界停止、防重、同輪結算與存檔遷移回歸。
- `npm.cmd run build`：TypeScript 與 Vite 正式建置通過。仍有既有 Three.js 共用 bundle 超過 500 kB 的提醒。
- `node scripts/test-deploy.mjs`：通過，根路徑與 `/lohas_islands/` 的建置資產有效。
- 瀏覽器完整旅程：本次使用 `LOHAS_TEST_BASE=/lohas_islands/` 執行 `npm.cmd run test:journey` 並通過。確認 3D／2D 都從第 1 格走到第 80 格、四人同輪結算、終點事件恢復、防重、重開、損壞原檔保留，以及 1440／768／390／320px 操作；無瀏覽器例外或遺失資產。結果見 `artifacts/city80-journeys.json`。

手機測試為桌面 Chrome 的 320／390／768px 尺寸模擬，尚未做實體手機硬體測試。

## 本機確認

執行 `npm.cmd run dev -- --host 127.0.0.1`，開啟終端顯示網址（通常 `http://127.0.0.1:5173/`）。可一人開始，或設定 2–4 人，檢查路線、中心分區、逐格移動及終點結算。

本階段交付後停止，等待使用者確認 Phase 1，再進入 Phase 2。未推送、合併或發布正式網站。
