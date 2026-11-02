# 桌面右側面板重疊修正

原本在線人數、畫質、操作欄與展開設定選單分別使用絕對定位，展開後進入同一塊右上角區域。另有舊的 768px 最小高度，使短視窗底部工具超出可視範圍。

## 修改

- 新增 `src/desktop-layout.css`，僅在寬度至少 901px 時使用：右側固定欄依序放在線人數、畫質及回合操作；設定、光影、說明、導覽與任務面板在固定欄左側展開。
- 依實際桌面可視高度限制面板；短視窗的操作與玩家列表可在自身範圍捲動，避免壓住下方位置及工具。
- 分開下方縮放／導覽、FPS 與學習入口的垂直間距，教育區預留足夠高度。
- 新增 `src/components/UI/usePanelDismiss.ts`，在點擊外部或按 Escape 時收合暫時面板；`CityExplorer.tsx` 的設定、光影、說明及站點清單切換時關閉前一個面板。
- `CareIsland.tsx`、`HUD.tsx` 的導覽與任務面板沿用相同收合機制。桌面新樣式由 `src/main.tsx` 載入。
- 新增 `npm.cmd run test:desktop-layout`；既有遊戲規則、存檔及角色未修改。

## 驗證

桌面瀏覽器測試涵蓋 1914×878（使用者截圖尺寸）、1920×1080、1440×900、1280×720、1024×768、1024×600、1366×600、901×600。

逐項量測固定面板及展開選單、光影、說明、導覽、任務的邊界，確認不重疊、不超出視窗；並用實際滑鼠點擊檢查設定按鈕、儲存、說明、導覽與任務，以及 Escape／點擊外部收合。UI 操作前後的遊戲存檔內容保持一致。

`npm.cmd test`、`npm.cmd run build`、`node scripts/test-deploy.mjs` 皆通過。

測量紀錄：`artifacts/desktop-layout-review.json`。

截圖：`artifacts/desktop-rail-menu-1914x878.png`、`desktop-rail-menu-1024x600.png`、`desktop-rail-fixed.png`。

本次未發布正式網站，本機重新整理後可確認修正。
