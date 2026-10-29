# 長照人生路｜3D 遊戲 — 第 11 版專案匯出

網站：https://long-care-life-journey.minsyuan.chatgpt.site/
匯出日期：2026-10-29
原始碼版本：4a4730c120beb153cfe8427bd62019403654bfcd

## 內容與版本範圍
這是現有 React + TypeScript + Three.js + Zustand 專案，保留 40 格棋盤、2–4 位玩家、擲骰、回合、事件選擇、金錢／健康／壓力、瀏覽器存檔與 12 輪結算。
場景含五間日照中心、城市探索、日照示範街區、日夜及光影設定；無 WebGL 時使用相同模型的 SVG 相容顯示。
此版已取消先前 UI 調亮及整體調暗，回到該輪亮度調整前的配色。

重要：長照人生旅程 3.0 規格中的六大教育模組、A 個管訓練、四包錢試算及完整服務碼資料庫尚未實作，不包含在本版。現有資源介紹不是完整的 3.0 教育訓練系統。

## 開發啟動
安裝 Node.js 22.12 以上版本及 npm，在本資料夾開啟終端機執行：

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

依終端機顯示的本機網址開啟，通常是 http://127.0.0.1:5173/ 。首次安裝需要網路。
未包含 node_modules、Git 歷史、認證資訊與個人遊戲存檔。

## 建置及預覽

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

通常在 http://127.0.0.1:4173/ 預覽。dist/ 已包含本次成功建置的可部署網頁，需透過 HTTP 伺服器開啟，不能直接雙擊 index.html。
也可安裝 Python 3，執行以下命令查看現成網頁：

```sh
cd dist
python -m http.server 8080
```

然後開啟 http://localhost:8080/ 。靜態主機部署目錄為 dist/。
.openai/hosting.json 保留原 Sites 專案識別，作為原專案匯出記錄；另行部署至新專案時不要誤用它覆寫現有網站。

## 測試
安裝依賴後執行：

```sh
node scripts/test-game.mjs
npm run build
```

本次兩項檢查通過。涵蓋 40 格路線與事件、重複執行防護、數值邊界、任務、起點獎勵、12 輪結算、舊存檔與擲骰階段恢復、五間中心、場景幾何、日夜材質及陰影範圍。
限制：本次沒有進行瀏覽器畫面或手機版實機驗證。測試環境先前無 WebGL，GPU 光影實際外觀仍需在支援 WebGL 的裝置確認；程式與幾何測試不等於 GPU 視覺驗證。

## 主要程式位置
- src/game/board.ts：40 格棋盤資料。
- src/game/events.ts：事件內容與效果。
- src/game/store/useGameStore.ts：遊戲狀態、回合、存檔與結算。
- src/components/District/：主要城市、示範街區、光影與相容渲染。
- src/components/UI/：玩家面板、擲骰操作、事件卡與資源介紹。
- scripts/test-game.mjs：遊戲及場景回歸測試。

## 存檔說明
存檔位於玩家瀏覽器的 LocalStorage，依網址分開。線上站與本機網址不會自動共用存檔。本壓縮檔不含任何玩家瀏覽器資料。
