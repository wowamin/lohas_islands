# 手機直橫向排版修正

本次針對手機標誌直排、進度列縮窄、橫向地圖及擲骰區被截掉的問題。

## 原因與修改

舊行動版把桌面 HUD 用負的 top 值移到固定 570px 場景上方，並殘留 grid 欄位、縮放及 intrinsic width 規則。窄螢幕、橫向短高度與不同瀏覽器的尺寸計算容易使面板壓縮或超出可視範圍。

- `src/App.tsx`：提供手機標頭與擲骰區的正常流容器；依 `visualViewport.height` 更新可視高度。學習／資源面板開啟時，手機控制區同樣使用 inert。
- `src/components/UI/ResponsiveSlot.tsx`（新增）、`HUD.tsx`：使用 React portal 放置同一份控制項，保留原操作、Zustand、回合與存檔；旋轉不建立第二套遊戲狀態。
- `src/mobile-layout.css`（新增）、`diorama.css`、`main.tsx`：移除舊的行動版負位移補丁，改為「標頭 → 地圖 → 擲骰 → 玩家／進度／操作」正常排列；橫向短畫面使用地圖／擲骰雙欄。標誌給定可用寬度、禁止逐字換行，玩家及進度列不繼承隱式 grid 欄。
- `index.html`：加入 viewport-fit=cover；CSS 以安全區變數讀取瀏海及底部保留空間，並設定文字縮放基準。
- `src/components/District/CareIsland.tsx`：重新框取手機畫面，依實際 renderer 區塊尺寸投影名牌與玩家標記；修正偏移後的可視範圍判定。
- `src/components/UI/DioramaDice.tsx`：調整小視窗攝影機，讓骰子留在自身控制區內。
- `scripts/test-browser.mjs`、`package.json`：新增 `npm.cmd run test:mobile-layout`。

## 驗證

- `npm.cmd test`、`npm.cmd run build`、`node scripts/test-deploy.mjs`：通過。
- 行動版測試：320×568、390×664、390×844、768×1024、844×390、844×300、667×300，連續轉回直向及桌面；驗證標誌橫排、玩家卡與路線列寬度、按鈕命中、地圖框取及移動中旋轉。
- 安全區：本機 Chromium 未提供原生 safe-area CDP 指令，因此以同一組 CSS 安全區變數模擬左右各 44px、底部 21px，確認內容不進入保留區。沒有把模擬宣稱為 iPhone Safari 實機測試。
- 旋轉不變更存檔內容；真實點擊擲骰、旋轉、落點事件與橫向事件卡邊界驗證通過。

測量：`artifacts/mobile-layout-review.json`。截圖：`artifacts/mobile-fix-390x664.png`、`mobile-fix-844x300.png` 及其他 `mobile-fix-*`。

本次未發布正式網站。既有本機開發伺服器重新整理後即可載入新版排版。
