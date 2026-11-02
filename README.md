# 長照人生旅程 3.0｜80 格 3D 長照城市

在既有 React、TypeScript、Three.js、Zustand 專案上重構。單向 80 格路線從城市入口穿越大和、安南、新營、義合、龍山五中心庭院，抵達終點園區。保留舊 50 格內容、原始 40 格事件及數值、爺爺／奶奶、骰子動畫、音效、學習模組與存檔。

本次分支為 feature/80-tile-city-board，尚未發布正式網站。最新工作依使用者的七階段 Master Prompt 重構浮島、立體地磚、五中心、環境、光影、UI 與相機，見 [視覺重構報告](docs/DIORAMA_REBUILD.md)。先前 [Phase 1 報告](docs/PHASE1_CITY_FOUNDATION.md) 與 [80 格實作紀錄](docs/CITY_BOARD_80.md) 為歷史交付；逐格映射、新增 30 個事件、分區與最新座標見 [資料明細](docs/CITY_BOARD_80_DATA.md)。

## 本機啟動

建議 Node.js 24；已安裝依賴可直接啟動，首次取得專案先執行 npm.cmd ci。

~~~powershell
npm.cmd run dev -- --host 127.0.0.1
~~~

開啟終端顯示網址，通常為 http://127.0.0.1:5173/ 。Windows 使用 npm.cmd，其他平台使用 npm。

~~~powershell
npm.cmd test
npm.cmd run build
node scripts/test-deploy.mjs
npm.cmd run preview -- --host 127.0.0.1
~~~

瀏覽器驗收須先建置，使用本機 Chrome（可由 CHROME_PATH 指定），獨立暫存設定檔與 4178／9338 連接埠：

~~~powershell
npm.cmd run test:browser
npm.cmd run test:journey
npm.cmd run test:diorama
npm.cmd run test:isolation
~~~

子路徑測試：在 PowerShell 設定 $env:LOHAS_TEST_BASE='/lohas_islands/' 後執行 npm.cmd run test:journey。截圖與量測輸出至 artifacts/；不讀寫日常 Chrome 的玩家資料。

## 路線與規則

|區域|畫面格數|數量|
|---|---|---:|
|城市入口|1–10|10|
|大和日照中心|11–23|13|
|安南日照中心|24–36|13|
|新營日照中心|37–49|13|
|義合日照中心|50–62|13|
|龍山日照中心|63–75|13|
|終點園區|76–80|5|

- 支援單人體驗與 2–4 人本機輪流；可重複選爺爺／奶奶，以玩家識別色區分。
- 骰子沿道路逐格前進；超出終點直接停第 80 格，不循環、不再發放繞圈起點獎勵。
- 到達終點後完成回顧事件，同一輪尚未行動的玩家各完成一次行動，隨後統一結算。原計分公式不變：金錢 /100 + 健康 ×2 − 壓力 ×2。
- 保留自由旋轉縮放、跟隨／聚焦、日夜與光影、低中高畫質、探索、資源手冊、六大學習模組、示範街區與簡易棋盤。
- WebGL 不可用時自動切換同資料的 80 格 SVG 備援，仍可擲骰、事件、存讀檔與結算。
- 「本機在線」是同瀏覽器分頁心跳估算，不是全站在線人數；遊戲沒有網路多人同步。

邏輯資料在 src/game/mapDefinition.ts、rules/boardRules.ts，唯一座標來源在 cityLayout.ts，經 board.ts 合併。3D、2D、角色、鏡頭皆讀取共用資料。匯出快照：[city-route-80.json](public/city-route-80.json)。修改資料後執行 npm.cmd run export:route，同步更新資料明細與 JSON。

中心主題為遊戲設計，不代表機構的實際服務資格與範圍。

## 存檔相容

存檔版本 4，地圖 lohas-city-80 / 版本 2，規則版本 2。沿用 long-care-game-save-v3:<sessionId> 與 lohas-manual-save-v3:<sessionId> 槽位名稱，讓舊分頁先讀取自己的資料；內容版本與鍵名分開管理。

支援 v1（40 格）、v2/v3（50 格）轉換至 v4。每次遷移先保留原始 JSON 至來源鍵的 -backup-before-v4，轉換通知可匯出。金錢、健康、壓力、任務、角色、目前玩家、輪數及待處理事件保留。移動中以原骰數、映射後的原定落點恢復，不重擲骰；舊循環超界移動以舊地圖末站為上限，再映射到新站點。

舊格映射：0→0、1–9→11–19、10–19→23–32、20–29→36–45、30–39→49–58、40–49→62–71。40 格先轉舊 50 格再套用。舊已結算紀錄維持結算，不重新開局。

未知或損壞存檔會顯示提示並阻止自動覆寫；可匯出原檔或選「保留原檔，另開新旅程」，建立獨立新槽。每分頁的核心遊戲進度隔離；學習、畫質與探索偏好仍由瀏覽器共用。

## 教育與驗證限制

新增內容沿用既有教育架構，政策導讀參照 [長照 3.0](https://1966.gov.tw/LTC/cp-6572-85008-207.html) 與 [官方申請流程](https://1966.gov.tw/LTC/cp-6533-70777-207.html)。遊戲數值不是實際補助；服務資格、費用與地區可用性須依主管機關核定。

既有試算保留原本的一般情境限制，未完整建模所有特殊給付。手機測試是桌面 Chrome 的尺寸模擬，尚未完成實機硬體驗證；最新視覺、操作尺寸與效能樣本見 artifacts/diorama-review.json。新增的程式化微縮模型、地磚、橋梁與水面皆可旋轉檢視，非背景圖片；模型、材質與靜態批次由城市生命週期管理。

既有架構資料：[Session 介面](docs/GAME_SESSION.md)、[角色實作](CHARACTER_IMPLEMENTATION_REPORT.md)、[骰子實作](DICE_UPGRADE_REPORT.md)；舊實作報告為歷史版本，以本次 80 格報告為準。

## GitHub Pages 部署

1. 在本分支完成 npm.cmd test、npm.cmd run build、node scripts/test-deploy.mjs；瀏覽器子路徑驗收通過後提交供審查。
2. 審查後將分支合併至 main 並推送；本次未執行合併或推送。
3. 倉庫 Settings → Pages → Source 選 GitHub Actions。
4. .github/workflows/deploy-pages.yml 會於 main 推送執行測試、建置，再只發布 dist/。不要發布原始 src/main.tsx。
5. 確認 Actions 部署完成，再檢查 https://wowamin.github.io/lohas_islands/ 。Vite 相對 base 保留子目錄支援。

~~~powershell
npm.cmd run export:route
npm.cmd test
npm.cmd run build
node scripts/test-deploy.mjs
~~~
