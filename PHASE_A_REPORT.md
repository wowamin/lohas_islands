# Phase A 實作與驗收

工作分支：`feature/phase-a-local-session`。沿用原有 React、Three.js、R3F、Drei、Zustand，沒有新增依賴或多人伺服器。

## 完成內容

保留固定 50 格五中心城市、庭院穿越、程序化裝飾、InstancedMesh、全景／跟隨／聚焦、教育面板、低中高畫質、WebGL 失敗時可操作的 2D 棋盤，以及手機左下擲骰按鈕。新增單人入口，原有 2–4 人同裝置模式繼續保留。

| 內部索引 | 畫面格數 | 中心 |
| --- | --- | --- |
| 0–9 | 01–10 | 大和 |
| 10–19 | 11–20 | 安南 |
| 20–29 | 21–30 | 新營 |
| 30–39 | 31–40 | 義合 |
| 40–49 | 41–50 | 龍山 |

完整固定座標、格型、前後連接與事件對應在 `public/city-route-50.json`。中心主題為遊戲設計，不宣稱為機構實際服務。

## 修改檔案

- 地圖：`src/game/mapDefinition.ts`、`cityLayout.ts`、`board.ts`、`rules/boardRules.ts`、`scripts/export-route.mjs`、`public/city-route-50.json`。
- 純規則：`src/game/rules/model.ts`、`engine.ts`；保留原事件表、金錢／健康／壓力效果、經起點獎金、12 輪結算與評分公式。
- Session：`src/game/session/GameSessionAdapter.ts`、`LocalGameSession.ts`、`browserSession.ts`、`src/game/store/createGameClient.ts`、`useGameStore.ts`。
- 存檔：`src/game/storage/StorageAdapter.ts`、`LocalSaveRepository.ts`、`saveCodec.ts`、`src/game/persistence.ts`、`save.ts`。
- UI 橋接：`src/App.tsx`、`src/components/MovementController.tsx`、`src/components/UI/EventModal.tsx`、`HUD.tsx`、`ResultScreen.tsx`、`SaveNotice.tsx`、`SetupScreen.tsx`。
- 驗證：`scripts/test-board.mjs`、`test-session.mjs`、`test-game.mjs`、`test-education.mjs`、`test-browser.mjs`、`package.json`。
- 文件：`README.md`、本報告、`docs/GAME_SESSION.md`。

既有工作區的 Pages 部署修正、手機按鈕樣式與其他未提交檔案均保留；未刪除玩家資料。沒有重新建立城市或改寫教育政策資料。

## 驗證

- `npm.cmd test`：50 格唯一性、五中心各 10 格、固定庭院座標、40 格對應、1–4 人回合完整循環、擲骰範圍、跨圈、事件、評分、教育及試算測試。
- Session 測試：快照不可變、錯誤／重複命令拒絕、計時取消、過期 revision、Adapter 替換、手動存讀、v1／v2 遷移備份、未知版本保留、儲存拒絕時暫玩。
- `npm.cmd run build`：TypeScript 與 Vite 正式建置成功。仍有 Three.js 共用區塊超過建議大小的提醒。
- `node scripts/test-deploy.mjs`：根路徑與 `/lohas_islands/` 的 HTML／JS／CSS／favicon 路徑通過。
- `npm.cmd run lint`：結束碼 0，仍有 7 項警告（瀏覽器測試的運算式、既有元件的 effect／ref 使用），尚未全部清理。
- `node scripts/test-browser.mjs --mobile-layout`：320／390／430／768 寬度下左下擲骰、觸控尺寸、操作鎖定、跳過動畫與回合切換通過。
- `LOHAS_TEST_BASE=/lohas_islands/ node scripts/test-browser.mjs`：完整子目錄回歸通過，涵蓋五中心教育、三種鏡頭、三種畫質、四人遊戲、動畫跳過、跨圈恢復、遷移備份、手動存讀、學習實作、桌面／手機尺寸及可遊玩的無 WebGL 備援；沒有缺失資源或執行例外。
- `npm.cmd run test:isolation`：兩個獨立 Chrome 程序與同設定檔分頁同時遊玩；各自擲骰、事件、儲存、重新整理互不干擾。另驗證未知地圖資料保留及禁用 localStorage 仍可遊玩。沒有遊戲資料 API 或 WebSocket 請求。結果在 `artifacts/phase-a-isolation.json`。

## 部署、限制與後續

繼續使用 GitHub Pages 靜態部署；正式只發布 `dist/`。Vite 雜湊資源可由 CDN 快取，沒有動態後端依賴。未新增大型 3D 模型，沿用程序化幾何體與現有延遲載入。

本機無頭 Chrome RTX 4060 的樣本為中高畫質約 60 FPS、低畫質約 30 FPS；手機尺寸模擬不代表實體手機效能。未做大量 CDN 同時訪客壓力測試、實體手機硬體驗證或全部瀏覽器相容性測試，不能保證容量與 FPS。可進一步評估資源壓縮、Three.js 分包、遠景細節與不同手機的 GPU 成本。

舊版存檔仍會保留且新分頁使用獨立儲存槽；尚未自動清除歷史 Session 槽，長期使用可能需管理容量。學習及畫質偏好沿用同瀏覽器共享設計。

Phase C 的擴充介面、信任邊界與仍需開發的功能見 `docs/GAME_SESSION.md`。本次不包含線上房間、角色同步、社交、帳號或伺服器權威驗證。
