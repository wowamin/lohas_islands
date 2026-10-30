# 50 格五中心城市升級實作報告

日期：2026-10-30。於既有專案就地升級，保留前一輪教育系統及使用者修改。

## 盤點與修改原則

修改前讀取 package.json、棋盤、Store、事件、動畫、存讀檔、主要 Three.js 場景與結果畫面，搜尋 40、%40、39、位置與圈數計算，並執行原測試，全部通過。

實裝版本：React 19.3.0（宣告 ^19.2.8）、Three.js 0.186.1、React Three Fiber 9.8.1、Drei 10.7.9、Zustand 5.0.15。主場景沿用原生 Three.js，R3F 備用場景保留，沒有增加套件。建置為 TypeScript + Vite，靜態輸出 dist；既有 Sites 識別不改、不部署。

## 五階段實作

1. 棋盤：BOARD_SIZE=50、0–49 索引、五區各 10。原 40 格存於 legacyBoard.ts，每 8 格保留順序後插入 2 個無數值效果的教育／轉場格。原事件卡檔案與結算畫面未修改。新增知識格以既有教育題目組成零數值效果的機會卡，確保每區都有知識與機會互動。
2. 骨架：cityLayout.ts 固定五個中心位置、旋轉及各庭院的 10 個停靠點。board.ts 補齊 ID、index、名稱、類型、centerId、世界座標、事件、教育模組、色彩、角色區位、前後格及 legacyId。3D 與 2D 共用座標。
3. 美術：共用既有 DayCareCenter 建築原型，保留門窗、屋頂、入口、招牌、無障礙坡道。五種庭院加入香草／涼亭、市集／座位、懷舊展示牆、平衡步道、畫架／音樂區，保留照顧者、輪椅、助行器與巴士。加上中央水景、公園、橋、低矮住宅、診所、商店、樹木、花圃、圍欄、路燈及斑馬線。
4. 互動：Overview、Follow、Focus 平滑鏡頭；逐格動畫與跳過；抵達時聚焦庭院、下一位回全景。建築／庭院教育面板沿用既有學習單元，探索進度獨立儲存，不改遊戲。探索面板可關閉返回城市。
5. 效能相容：重複建築零件、道路、植栽與路燈以 InstancedMesh 共用幾何與材質。種子固定 3050、裝飾避開固定路徑。低畫質與遠景省略細小窗框等細節，保留門窗本體與低面數遠景。限定 DPR、陰影與手機鏡頭。無 WebGL 使用同座標 2D 棋盤。

## 五區對照

| 畫面格數 | 內部索引 | 中心 | 庭院主題 |
| --- | --- | --- | --- |
| 01–10 | 0–9 | 大和 | 健康管理與生活照顧 |
| 11–20 | 10–19 | 安南 | 社區參與與社交活動 |
| 21–30 | 20–29 | 新營 | 認知訓練與懷舊活動 |
| 31–40 | 30–39 | 義合 | 復能運動與生活自立 |
| 41–50 | 40–49 | 龍山 | 藝術創作與身心療癒 |

以上為遊戲設計，非真實機構服務宣稱。完整 50 格資料見 public/city-route-50.json（由 npm.cmd run export:route 匯出）。

## 遊戲與存檔保護

- 保留 2–4 人輪流、骰子 1–6、初始金錢 10,000／健康 80／壓力 20、所有原事件效果與邊界、跨起點 +1,000、12 輪結算與原計分公式。
- 跨圈只將棋盤上限改為 BOARD_SIZE；最後落點仍由原 movePlayer 一次提交。動畫只改 journey 的顯示位置，跳過仍用同一骰數提交一次。
- 原 40 格的名稱、類型、事件及 serviceKey 全部逐一比對；新 10 格無金錢、健康、壓力效果。擲骰、正式事件與教育探索互相隔離。
- 新版自動及手動存檔使用 version 2，位置轉換公式 floor(p/8)*10+p%8。轉換前備份，原版鍵保留；顯示通知與匯出原檔入口。
- 未處理事件保留，ROLLING／MOVING 沿用骰數重播。資料解碼只接受明確版本與有效欄位，不載入存檔中的函式或不明事件。
- 損壞／未知自動存檔停止寫入，可暫玩且提示，避免靜默覆寫。
- 50 格會改變落點機率與跨圈速度；未為此擅自調整原事件或獎勵。需要後續遊戲平衡實測，不能宣稱統計分布與 40 格相同。

## 畫質設定

| 畫質 | DPR 上限 | 陰影 | 植栽目標數 | 渲染上限 |
| --- | --- | --- | --- | --- |
| 低 | 1 | 關閉 | 40 | 30 FPS |
| 中 | 1.25 | 單燈 PCF，512 | 70 | 60 FPS |
| 高 | 1.5 | 單燈 PCF，1024 | 100 | 60 FPS |

植栽會經避讓條件篩選。陰影只由建築等主要幾何投射，樹／路燈不投射。每幀不建立 Geometry、Material 或 Texture；場景、畫質或玩家名單變動時才建置對應資源，切換與卸載時釋放。畫面效能列與 artifacts/performance.json 是實際渲染樣本，不是目標值。

## 本次修改／新增檔案

| 類別 | 檔案 |
| --- | --- |
| 固定配置及棋盤 | src/game/cityLayout.ts（新）、legacyBoard.ts（新）、board.ts、city.ts、eventRegistry.ts（新） |
| 遊戲與動畫 | src/game/store/useGameStore.ts、src/game/journey.ts、src/components/MovementController.tsx |
| 存檔保護 | src/game/persistence.ts（新）、src/game/save.ts、src/components/UI/SaveNotice.tsx（新） |
| 城市設定 | src/game/citySettings.ts（新） |
| 3D 城市 | src/components/District/islandModel.ts、CareIsland.tsx、lighting.ts、model.ts；src/components/Three/GameBoard3D.tsx |
| 2D 與 UI | src/components/UI/CityMap.tsx、CityExplorer.tsx、CenterInfo.tsx（新）、HUD.tsx、SetupScreen.tsx、CommunityBoard.tsx、LearningCenter.tsx |
| 整合與樣式 | src/App.tsx、src/learning.css、index.html |
| 測試 | scripts/register-ts.mjs（新）、test-board.mjs（新）、test-city.mjs（新）、test-game.mjs、test-education.mjs、test-browser.mjs |
| 匯出與說明 | scripts/export-route.mjs（新）、public/city-route-50.json（新）、package.json、README.md、IMPLEMENTATION_REPORT.md |

未變更 src/game/events.ts、src/components/UI/ResultScreen.tsx、既有政策資料與機構資格內容；沒有修改部署識別。

## 測試與驗收

各階段先跑適用的資料／幾何測試、TypeScript 檢查與建置，再整合 UI；完整測試入口 npm.cmd test。

- 50 格無重複、每中心 10 格、前後連結、路線不自交及跨 50 回 1。
- 原 40 格完整映射、所有事件對應、選擇效果、重複提交防護、健康／壓力／金錢邊界、任務、起點、2–4 人回合及 12 輪結果。
- 各中心所有停靠點轉回場景局部座標後都位於實際庭院範圍，路線不穿建築；裝飾種子重現與 Instancing。
- 舊版 40 個位置逐一轉換、原值與原檔不變、備份、待處理事件與中途移動恢復、未知版本停止寫入、手動快照。
- 日夜材質、陰影覆蓋完整場景、陰影燈數與貼圖上限、材質／場景清理。
- 原有教育題目、補助捨去與邊界、錯題回顧、與遊戲狀態隔離。

瀏覽器入口 npm.cmd run test:browser：1440×1000 桌面、390×844 手機尺寸，驗證 50 格 DOM、4 玩家、5 個庭院教育入口、探索不改遊戲、三種鏡頭、三種畫質、服務搜尋與試算、跳過動畫位置不變、手動存讀檔、舊檔轉換備份、48+4→2 並只領一次起點獎勵、知識機會卡選擇前後數值不變、手機版、強制無 WebGL 啟動後仍可擲骰至事件；收集執行例外與效能樣本。

## 尚存限制與可改善項目

- 未進行真實 iOS／Android 或多種 GPU 壓測；手機尺寸模擬不能證明手機實機達 30 FPS。本環境數據見 artifacts/performance.json，不推廣為所有裝置的保證。
- 使用固定道路段與圓形接點，未使用 CatmullRom；後續可在不改停靠座標的前提下增加彎道、道路材質與更細緻景觀。
- 主題場景已可識別，部分裝飾仍為共用低面數模型；可補更多獨特建築立面、招牌字面、植物與室外活動動作。
- 主程式仍含大型 Three.js 共用區塊約 739 kB，Vite 建置有提醒；可再拆分與實機分析。
- 教育指南全文、原參考圖片與機構真實服務資格仍缺；延用原 15 項服務碼及教學試算限制，不宣稱完成正式政策或機構查核。
- 本次沒有部署線上站。

## 最終實測結果

最終 npm.cmd test、npm.cmd run build、node scripts/test-browser.mjs 均通過，沒有瀏覽器執行例外。以 RTX 4060、Windows、Headless Chrome 156／ANGLE D3D11 量測；每設定取三筆約 1.5 秒區間的渲染樣本：

| 尺寸與畫質 | 三筆 FPS | Draw Calls | 三角形 |
| --- | --- | --- | --- |
| 桌面 1440×1000／低 | 30／30／30 | 131 | 36,688 |
| 桌面 1440×1000／中 | 60／60／60 | 194 | 61,048 |
| 桌面 1440×1000／高 | 60／60／60 | 194 | 62,248 |
| 手機尺寸 390×844／低（相同桌面硬體） | 30／30／30 | 131 | 36,688 |

這是短時間固定場景樣本，尚非手機硬體、低階電腦或長時間熱降頻測試。低畫質刻意上限 30 FPS；手機尺寸結果不能當成實機 30 FPS 保證。模型測試顯示低畫質 103 個靜態批次／932 個實例，中高畫質 104 個靜態批次／1,032–1,092 個實例；Draw Calls 另包含玩家、巴士與渲染通道，因此與模型批次數不同。

截圖：artifacts/desktop-city.png、desktop-event.png、mobile-city.png、mobile-event.png、mobile-training.png、mobile-2d-fallback.png、mobile-2d-overview.png。原始效能樣本與 GPU 字串在 artifacts/performance.json。
