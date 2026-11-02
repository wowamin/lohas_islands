# 點擊 3D 島嶼平滑聚焦

在專案根目錄執行 `npm run dev`，用瀏覽器開啟 Vite 顯示的網址，並加上 `/examples/camera-focus/index.html`。

`main.js` 是完整 ES Module，使用專案已安裝的 Three.js 與 GSAP；需透過 Vite 執行，不能直接用 `file://` 開啟 HTML。此示範獨立於遊戲頁，不讀寫角色或存檔。

點擊島嶼或其上方方塊可聚焦；拖曳超過 5px、取消手勢或多指操作不會觸發。雙軌運鏡使用 1.2 秒 `power2.inOut`，動畫完成後恢復阻尼及互動。可使用右上角按鈕回到總覽。

重用時呼叫 `createFocusDemo(container)`；容器需有明確寬高，Canvas CSS 設為寬高 100%。離開頁面時呼叫回傳物件的 `dispose()`。

瀏覽器互動驗證：`node scripts/test-camera-focus.mjs`（預設使用 Windows 安裝的 Chrome；可用 `CHROME_PATH` 指定）。
