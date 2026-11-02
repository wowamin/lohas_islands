# 長照人生旅程 3.0：80 格城市重構

## Phase 1：原始碼分析

本次以 `feature/80-tile-city-board` 分支修改既有專案。修改前工作目錄乾淨。

- `src/game/mapDefinition.ts`：原地圖 `lohas-city-50`、版本 1、50 格；每中心 10 格。
- `src/game/rules/boardRules.ts`：40 格原始內容加 5 個知識格、5 個轉場格。
- `src/game/legacyBoard.ts`、`events.ts`：原始 40 格及事件效果；完整基準保存於 `board-50-baseline.json`。
- `src/game/cityLayout.ts`：五中心放射狀配置、每庭院 10 點；`board.ts` 合併規則與世界座標。
- `src/components/District/islandModel.ts`：實際使用的 Three.js 場景，重複物件已批次實例化。
- `src/components/Characters/actor.ts`：現有爺爺奶奶模型、行走與轉向；含 `%50` 硬編碼。
- `src/game/rules/engine.ts`：純函式規則；循環移動、經起點 +1000、第 12 輪結算。評分為金錢 /100 + 健康 ×2 − 壓力 ×2。
- `src/game/session/LocalGameSession.ts`、`store/`：回合命令、版本防重、Zustand 投影，繼續沿用。
- `src/components/MovementController.tsx`：逐格動畫，原使用模數循環。
- `src/components/UI/CityMap.tsx`、`game/city.ts`：共用棋盤資料的 SVG 備援，原折線會接回起點。
- `src/game/storage/saveCodec.ts`：存檔 v3，接受 v1（40 格）、v2/v3（50 格），原輪數上限 12。
- `LocalSaveRepository.ts`：每分頁獨立槽與來源備份；保留既有 key，透過存檔版本與地圖版本遷移。
- `scripts/test-education.mjs` 是 `npm test` 入口，串接遊戲、城市、分頁、角色、骰子測試。
- `.github/workflows/deploy-pages.yml`：main 推送才會自動部署；保留 Vite 相對資源路徑。

## 舊 50 格映射規劃

索引採 0 起算。舊 0 → 新 0；舊 1–9 → 新 11–19；舊 10–19 → 新 23–32；舊 20–29 → 新 36–45；舊 30–39 → 新 49–58；舊 40–49 → 新 62–71。
原始 40 格先用舊版 `floor(i/8)*10+i%8` 得到 50 格索引，再套此表。50 筆詳細對照見 [資料明細](CITY_BOARD_80_DATA.md)。

## 修改範圍

棋盤／路線／事件登錄、規則與存檔解碼、動畫和角色索引、3D 場景、2D 折線及 UI 文案、路線匯出、自動化測試與開發文件。原始事件內容與角色模型不改動。

## Phase 2：資料、事件與終點規則

棋盤常數統一為 `BOARD_SIZE=80`、`START_INDEX=0`、`FINISH_INDEX=79`。地圖 ID `lohas-city-80`、mapVersion 2、rulesVersion 2。格子包含連續唯一 ID、畫面編號、區域、舊格 ID、事件 ID、顏色、類型、互動方式、世界座標、朝向與前後節點。保留原大寫類型並增加 `FINISH`，避免另建不相容型別。

|區域|索引|畫面編號|數量|
|---|---|---|---:|
|城市入口|0–9|1–10|10|
|大和|10–22|11–23|13|
|安南|23–35|24–36|13|
|新營|36–48|37–49|13|
|義合|49–61|50–62|13|
|龍山|62–74|63–75|13|
|終點園區|75–79|76–80|5|

舊 50 格全部保留。修改前完整內容與事件效果保存在 `board-50-baseline.json`，測試逐筆比對新版名稱、類型、事件 ID、服務及原始 40 格的事件全文與數值。舊起點仍在索引 0；其他舊站維持相對順序。30 個新格在入口、中心庭院及終點，覆蓋 3.0、ABC、申請／評估／計畫／媒合／追蹤、日照作息、營養、復能、喘息、交通、跨專業、失智友善、參與及綜合挑戰。逐格描述、行動、知識與效果見 [新增事件明細](CITY_BOARD_80_DATA.md)。不是隨機複製舊事件。

新內容沿用現有教育模組，並參照衛福部 [長照 3.0](https://1966.gov.tw/LTC/cp-6572-85008-207.html) 與 [申請流程](https://1966.gov.tw/LTC/cp-6533-70777-207.html)。不新增實際補助金額承諾；機構主題仍明示為遊戲設計。

|項目|原版|新版|
|---|---|---|
|原始事件的金錢／健康／壓力／特殊效果|原值|逐筆保持不變|
|評分|金錢 /100 + 健康 ×2 − 壓力 ×2|不變|
|繞過起點|+1000 遊戲幣|單向路線不再繞圈，因此無此獎勵|
|新事件金錢效果|無|僅交通月台 −100；其餘 0|
|新事件健康效果|無|每格 0 或 +2|
|新事件壓力效果|無|每格 0、−2 或 −3|
|結束條件|第 12 輪結束|首位抵達 79 且完成終點事件，當輪最後玩家完成後|

到終點即標記 `reachedFinish`，骰子超界以 79 為上限。終點仍走正常事件流程；選項防重沿用 phase、事件 ID 與 revision。該輪尚未行動玩家各完成一次行動；到索引 0 的下一輪邊界才進 `RESULT`，不再開始新輪。結算後拒絕擲骰、移動、選事件與前進回合，保留原排名與重新開始。

## Phase 3：3D 城市與移動

保留五中心既有建築、爺爺／奶奶模型、配件、比例、識別色與動畫資源。每中心庭院弧線重採樣為 13 點；入口從中央公園側步道通往大和，依序穿越五庭院，再由龍山側回到終點花園。道路是開放連續路徑，末站不接起點。自動測試確認無路線交叉、無無效節點、庭院內路線不穿建築；終點支線曾被測試抓到交叉，已改正。

新增入口與終點門廊、終點金色標誌／花圃、沿路方向指引。保留庭院長椅、植栽、各中心活動場景、斑馬線、路燈、周圍社區與公園。重複幾何／材質及靜態 InstancedMesh 批次繼續共用；低／中／高畫質靜態批次數約 124／125／125，包含 1201／1301／1361 個實例。夜景、柔光、畫質與縮放設定沿用。

`MovementController` 對每一格更新視覺位置，最末步停留一個步伐時間才提交落點事件；超界縮短到剩餘步數。轉向與步行仍用原 CharacterActor，移除 `%50`。多玩家錯位邏輯不變。3D 跟隨目前玩家；2D 同樣支援跟隨與聚焦。略過動畫保留一次完成守衛、原骰數與落點。

唯一座標來源 `cityLayout.ts` 經 `board.ts` 合併，供 3D、SVG、角色、鏡頭共用。`public/city-route-80.json` 是由此產生的快照，測試確保無漂移。既有 `city-route-50.json` 僅作歷史快照，不由遊戲載入。

## Phase 4：存檔與 2D

存檔內容版本升至 4；保留既有 v3 分頁儲存鍵與最近進度指標，避免舊分頁改讀其他人的槽位。版本識別由 envelope 與地圖／規則欄位判定，不依鍵名。v1／v2／v3 都可遷移到 v4。

- 舊 40 格先映射至舊 50 格，再用 `FIFTY_TO_CURRENT`；50 筆映射見明細。
- 保留角色、金錢、健康、壓力、服務／任務、輪數、目前玩家、事件 ID、選後結果及實際數值差。
- 舊 `ROLLING` 恢復為原骰數的 `MOVING`。舊移動中的目標先按舊路線計算，再映射為 `pendingMoveTarget`，逐格走過新插入的道路。舊跨尾端移動以舊末站為上限，不恢復繞圈或虛增獎勵。新存檔移動以原起點／骰數恢復。
- 舊 `EVENT` 保留事件，已揭曉結果不再次套用；舊 `RESULT` 保留已完成歷史紀錄。
- 遷移前以 `來源鍵-backup-before-v4` 留下原始 JSON；已有不同備份時增加序號。v1 另保留原有 before-50 備份慣例。
- 成功遷移有可見通知。未知版本／資料損壞時阻止自動覆寫，可匯出或選「保留原檔，另開新旅程」，使用全新 Session 槽；不刪除原資料。
- 新分頁仍從最近進度複製到自身槽位；重新整理恢復自己的槽。重開旅程清除移動中目標，避免 Zustand 合併留下舊值。

2D SVG 直接使用同份 80 格資料，開放折線不再封閉。五中心與入口／終點分區、玩家位置、轉向與格數、事件及結算均與 3D 同源。保留拖曳、縮放、鍵盤操作與中心介紹。

## Phase 5：驗收結果

已執行並通過：

- `npm.cmd test`：全部既有與更新的棋盤、城市、Session、骰子、角色及教育測試；1–4 人 × 1–6 點完整旅程、每個首位抵達者位置、超界停止、同輪結算、防重、重開、v1–v4 存檔與備份。並比對 50 格基準及原事件效果。
- `npm.cmd run build`：TypeScript 與 Vite 正式建置成功。
- `node scripts/test-deploy.mjs`：編譯資產在 `/` 與 `/lohas_islands/` 正確解析。
- `node scripts/test-browser.mjs`：80 格 3D、五中心互動、相機、三段畫質、略過動畫、存讀檔、遷移、訓練、手機版與無 WebGL 備援。沒有瀏覽器例外或遺失資源。
- `node scripts/test-browser.mjs --dice`：真實點擊、連點鎖定、揭曉後移動、略過擲骰、音效解鎖／靜音、震動選擇、快速／減少動態、重新整理及 2D 骰子操作。
- `node scripts/test-browser.mjs --isolation`：獨立瀏覽器與同瀏覽器分頁、各自存檔與重整、未知地圖保留、儲存遭拒仍可遊玩。
- 設 `LOHAS_TEST_BASE=/lohas_islands/` 執行 `node scripts/test-browser.mjs --journey`：3D／2D 單人從起點完整到終點，四人同輪結算、終點事件重整、選項防重、逐格可見、重開；損壞存檔另開新槽後可正常遊玩，原文保持不變；1440／768／390／320px 無水平溢出。最後一輪完整旅程 3D 為 25 回合、2D 為 20 回合（隨機骰數），紀錄及截圖在 `artifacts/city80-*`。

效能樣本在 `artifacts/performance.json`：本機 Windows Chrome／RTX 4060，低畫質約 30 FPS（287 calls）、中／高約 60 FPS（350 calls）；手機尺寸模擬低畫質約 30 FPS。這是桌面硬體測量，不宣稱手機實機通過。

## 修改檔案清單

- 棋盤與事件：`src/game/mapDefinition.ts`、`cityLayout.ts`、`board.ts`、`city.ts`、`rules/boardRules.ts`、`journeyEvents.ts`（新增）、`eventRegistry.ts`、`types.ts`。
- 規則／狀態／儲存：`src/game/rules/engine.ts`、`rules/model.ts`、`storage/saveCodec.ts`、`storage/LocalSaveRepository.ts`、`session/browserSession.ts`。
- 移動／3D：`src/components/MovementController.tsx`、`Characters/actor.ts`、`District/CareIsland.tsx`、`District/islandModel.ts`、`Three/GameBoard3D.tsx`。
- UI／2D：`src/components/UI/CityMap.tsx`、`CityExplorer.tsx`、`CommunityBoard.tsx`、`EventModal.tsx`、`HUD.tsx`、`ResultScreen.tsx`、`SaveNotice.tsx`、`SetupScreen.tsx`、`src/learning.css`。
- 測試／匯出：`scripts/test-board.mjs`、`test-city.mjs`、`test-game.mjs`、`test-session.mjs`、`test-characters.mjs`、`test-dice.mjs`、`test-browser.mjs`、`export-route.mjs`、`package.json`（加入 test:journey）。
- 文件／資料：`README.md`、`docs/GAME_SESSION.md`、本報告、`docs/CITY_BOARD_80_DATA.md`、`docs/board-50-baseline.json`、`public/city-route-80.json`。
- 驗收產物：`artifacts/` 中本次重新擷取的城市／事件／骰子／備援截圖、效能樣本、分頁隔離紀錄及新增 `city80-*` 完整旅程截圖／JSON。

原 `events.ts`、`legacyBoard.ts`、爺爺奶奶模型與既有教育內容未改寫。

## 已知限制與尚未發布事項

目前驗收未發現阻擋遊玩的問題。尚未進行實體手機、Safari 或不同 GPU 實機驗證。Three.js 共用區塊約 737 kB（gzip 約 187 kB），仍有 Vite >500 kB 提醒；不是建置失敗。機構實際服務、資格與完整特殊給付條件仍屬原版教育資料限制。

本次完成本機分支與部署準備，沒有推送、合併或部署正式站。

## 本機預覽與 GitHub Pages

安裝依賴後執行 `npm.cmd run dev -- --host 127.0.0.1`，開啟終端顯示網址，通常為 `http://127.0.0.1:5173/`。正式輸出預覽先 `npm.cmd run build`，再 `npm.cmd run preview -- --host 127.0.0.1`。

部署步驟：

1. 在本分支執行測試、建置、部署路徑及子路徑瀏覽器驗收。
2. 提交供審查，確認後合併至 `main` 並推送。
3. GitHub Settings → Pages → Source 選 GitHub Actions。
4. `.github/workflows/deploy-pages.yml` 於 `main` 推送執行測試與建置，發布 `dist/`。
5. 確認 Actions 成功，再檢查 `https://wowamin.github.io/lohas_islands/`。不直接發布原始 index.html 或 src/。
