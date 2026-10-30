# 高齡友善樣式系統

## 檔案與預覽

- `public/senior-ui/senior-ui.css`：完整純 CSS，可直接複製到其他專案。
- `public/senior-ui/index.html`：可獨立運作的語意化任務確認彈窗，含開啟、取消、確認、焦點返回與重複確認保護。
- `src/main.tsx`：已匯入樣式。樣式以 `.senior-ui`／`.senior-*` 為作用範圍，不會自動取代現有遊戲畫面。

執行 `npm.cmd run dev` 後，開啟終端顯示的本機網址，加上 `/senior-ui/index.html`。正式建置也會保留範例及 CSS，支援 GitHub Pages 子目錄；這次尚未發布正式站。

## 變數與元件

預設根字級 16px 時，small／body／large／title／value 依序為 16／18／20／24／28px，使用 rem 隨使用者文字設定放大。不要縮小 html 根字級，也不要使用 transform 縮小整個介面。一般文字字重 400、按鈕 500、標題及數值 700；行高 1.7，按鈕行高 1.6。

| 類別 | 用途 |
| --- | --- |
| senior-ui | 字體、行高、背景與局部 reset 的容器 |
| senior-btn-primary | 20px 主要操作，至少 56px 高 |
| senior-btn-secondary | 20px 次要操作，至少 48×48px |
| senior-card | 純白不透明、高對比卡片 |
| senior-dialog | 原生 dialog 的高對比面板 |
| senior-dialog-header／body／footer | 固定在面板上／下的操作區與獨立捲動內容 |
| senior-dialog-close | 放大關閉鍵，搭配可見文字與 aria-label |
| senior-text-small／body／large／title／value | 字級輔助類別 |
| senior-text-secondary | 深灰綠次要文字，保持對比 |
| senior-stack／senior-actions | 內容間距與至少 12px 的按鈕間距 |

所有遊戲插畫上的文字都應放進 senior-card 或 senior-dialog。不要把背景改成透明，也不要對父容器降低 opacity，否則對比度不再有保證。全景 3D 棋格上的文字也需另外檢查，這份樣式不會直接修改 WebGL 文字材質。

按下時以背景、陰影、向下位移及 0.98 倍微縮表現壓按。靜止尺寸預留至 50px（主要操作 58px），微縮後仍超過 48px（主要操作 56px）。鍵盤焦點使用白色外襯與深色輪廓；支援減少動態及系統強制色彩。停用按鈕不靠透明度表現，仍保留清楚文字。

## React 整合

樣式已載入，可先逐一替換事件、確認與任務面板；避免一次改變整個 3D 畫布容器的排版。

```tsx
<section className="senior-ui senior-card senior-stack" aria-labelledby="task-heading">
  <h2 id="task-heading" className="senior-text-title">庭院探索</h2>
  <p className="senior-text-body">請先閱讀任務說明，再決定是否開始。</p>
  <div className="senior-actions">
    <button type="button" className="senior-btn-secondary" onClick={onBack}>先返回</button>
    <button type="button" className="senior-btn-primary" onClick={onConfirm}>確認開始</button>
  </div>
</section>
```

完整 HTML 彈窗範例見 `public/senior-ui/index.html`，請同時保留 JavaScript。只加 aria-modal 或 CSS 無法提供焦點管理。React 請用 ref 呼叫原生 `dialog.showModal()`／`close()`，並保留初始安全操作焦點、Tab 邊界處理、Esc 取消與關閉後返回原按鈕；只設定 open 屬性不等於 modal。若新增輸入欄或連結，必須將範例 Tab 邊界處理的 button 查詢改為所有可聚焦元素，或接入既有完整焦點管理元件。

實際確認操作使用既有 GameSessionAdapter 命令，維持回合與 revision 檢查。送出期間使用原生 disabled 與可見「處理中」文字；aria-disabled 單獨使用不會阻止點擊，需要程式攔截。範例只有提示訊息，不會呼叫遊戲命令。破壞性操作應明確描述結果並預設聚焦取消，不要使用自動倒數確認。

## 驗證

執行 `npm.cmd run build`，再執行 `node scripts/test-senior-ui.mjs`（本機 Chrome；可用 CHROME_PATH 指定）。本次檢查：

- 11 組文字／背景對比均至少 7:1。白底正文 14.73:1、次要文字 8.98:1、主要按鈕 10.00:1；hover、active、disabled 亦檢查。
- 1280／390／320px 寬度及 320px、200% 文字放大無橫向溢出。
- 互動尺寸至少 48×48px，相鄰按鈕至少 12px。
- 初始焦點在「先返回」、Tab 循環、Esc 取消、關閉後返回原按鈕、確認防重複。

這表示指定色組符合 WCAG 2.1 的 AAA 文字對比要求，不代表全站已通過 AAA。仍需實際螢幕閱讀器、實體手機、不同瀏覽器、遊戲各畫面及高齡使用者測試。建置成功；原專案 Three.js 共用區塊大小提醒仍存在。

參考：[W3C 文字對比](https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced)、[Modal Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)。本需求對所有文字採 7:1，比標準允許大字使用 4.5:1 更嚴格。
