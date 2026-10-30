# 長照人生旅程 3.0｜50 格五大日照中心城市

在既有 React／Three.js／Zustand 專案上升級，沒有重建不相容的新遊戲。固定 50 格、五中心各 10 格，路線穿越各庭院。保留原 40 格事件與相對順序、2–4 人輪流、原始數值效果與 12 輪結算，另加入 10 個無數值效果的知識／轉場格。

## 啟動

建議 Node.js 24（測試使用 registerHooks，至少 22.15）。依賴已安裝可直接啟動；首次取得原始碼先執行 npm.cmd ci。

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

開啟終端網址，通常是 http://127.0.0.1:5173/ 。Windows 使用 npm.cmd 避開 npm.ps1 執行原則限制；其他平台使用 npm。

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1
npm.cmd run test:browser
```

Vite 正式輸出在 dist/，須透過 HTTP 伺服器開啟。瀏覽器測試先建置，預設使用已安裝的 Windows Chrome，可用 CHROME_PATH 指定瀏覽器。測試使用獨立暫存設定檔、本機 4178／9338 連接埠，結束關閉自建瀏覽器與伺服器，截圖及效能樣本在 artifacts/。不讀寫日常瀏覽器的玩家資料。

Phase A 在 `feature/phase-a-local-session` 分支開發，本次變更尚未發布到正式站。.openai/hosting.json 是原站識別，未修改。架構與驗收見 [PHASE_A_REPORT.md](PHASE_A_REPORT.md) 及 [Session 擴充介面](docs/GAME_SESSION.md)。

## 路線與操作

| 畫面格數 | 中心 | 遊戲庭院主題 |
| --- | --- | --- |
| 01–10 | 大和 | 健康管理與生活照顧 |
| 11–20 | 安南 | 社區參與與社交活動 |
| 21–30 | 新營 | 認知訓練與懷舊活動 |
| 31–40 | 義合 | 復能運動與生活自立 |
| 41–50 | 龍山 | 藝術創作與身心療癒 |

這些主題是遊戲設計，不代表各機構真實提供的服務。每區包含入口、庭院步道、活動、休憩、知識機會與出口。完整固定座標、事件對照、前後連接及遷移表在 [public/city-route-50.json](public/city-route-50.json)，主來源是 src/game/cityLayout.ts 與 board.ts。修改設定後用 npm.cmd run export:route 更新 JSON。

- 開始畫面可一人直接體驗，也保留設定 2–4 人；擲骰後自動逐格移動，可「跳過動畫」，不改骰數、事件或數值。
- 開始畫面與遊戲畫面顯示本機在線分頁估算；只統計同一瀏覽器近期回應的本站分頁，並非全站即時人數。
- 全景可自由旋轉縮放；跟隨追蹤目前玩家；聚焦查看庭院。點建築、庭院或導覽可開啟教育面板，關閉返回城市，探索不觸發正式事件。
- 五中心探索進度與畫質另外儲存，不影響遊戲勝負。可選低／中／高畫質；手機新設定預設低畫質。
- 無 WebGL 或內容初始化失敗時顯示同座標的可操作 2D 棋盤，仍可遊玩、探索、查閱教育與存讀檔。
- 原有日夜、光影、簡易棋盤、日照示範街區、資源手冊、六大學習模組及情境實作均保留。

## 存檔遷移

目前存檔版本 3，含地圖及規則版本。自動存檔鍵為 `long-care-game-save-v3:<sessionId>`，手動存檔為 `lohas-manual-save-v3:<sessionId>`。每分頁獨立儲存，重新整理回到自己的進度；新分頁從最近進度複製後獨立操作。支援從版本 1／2 遷移，保留原鍵並先備份原始 JSON，不刪除舊資料。學習、探索與畫質偏好維持原本瀏覽器層級儲存。

舊位置 p 對應 floor(p/8)*10 + p%8，因此 0–7→0–7、8–15→10–17、16–23→20–27、24–31→30–37、32–39→40–47。數值、玩家、回合與待處理事件保留；ROLLING／MOVING 中斷以同一骰數重播未提交的移動，不重擲骰。轉換有可見通知與原始存檔匯出。

未知版本／損壞自動存檔會保留，停止自動寫入並提示可暫玩，避免覆寫原始資料；未直接重設使用者存檔。

## 教育與資料限制

沿用既有六模組、六題情境、四項實作、錯題回顧、試算與 15 項服務碼。政策資料沒有因城市主題新增而改寫。指南全文與原參考圖片仍未提供，機構資格及實際服務範圍未核實。試算仍是一般情境教學，未完整建模外看家庭、共用家務、輔具單項限制、原民區／離島價、歷次額度及所有併用條件，不可當正式核定。

## 驗收與限制

完整檔案清單、階段測試、架構與風險見 [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md)。

Phase A 新增純函式規則、LocalGameSession、可替換 GameSessionAdapter 與儲存介面，沒有線上多人連線。執行 `npm.cmd run test:isolation` 可驗證兩個獨立瀏覽器與同瀏覽器分頁的遊戲隔離；先執行正式建置。最新檔案清單及限制見 [PHASE_A_REPORT.md](PHASE_A_REPORT.md)。

效能樣本見 artifacts/performance.json，僅代表本機無頭 Chrome。手機尺寸模擬不等於手機硬體測試；不保證所有電腦 60 FPS 或手機 30 FPS。大型 Three.js 共用區塊仍有 Vite 建置提醒，後續可再拆分與壓縮資產。

## GitHub Pages 部署

GitHub Pages 不能直接執行倉庫根目錄的 /src/main.tsx。請使用本專案 .github/workflows/deploy-pages.yml，由 Actions 安裝依賴、測試、Vite 建置，再只發布 dist/。

1. 推送修正至 GitHub。
2. 在倉庫 Settings → Pages → Build and deployment → Source 選擇 GitHub Actions（不要使用從 main 根目錄直接發布的 Jekyll 流程）。
3. 在 Actions 確認「Build and deploy Vite to GitHub Pages」完成；可手動 Run workflow。
4. 開啟 https://wowamin.github.io/lohas_islands/ 。

Vite 使用相對 base，支援此子目錄及網域根目錄。不要把 src/ 或原始 index.html 當正式網站發布，也不要單獨上傳 dist/index.html 而漏掉 assets/。

部署路徑檢查：先 npm.cmd run build，再 node scripts/test-deploy.mjs。瀏覽器子目錄驗證可設定 LOHAS_TEST_BASE=/lohas_islands/ 後執行 npm.cmd run test:browser。測試中所有網站請求都必須留在子目錄。
