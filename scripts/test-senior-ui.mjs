import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdtemp } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';

const server = createServer(async (req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname.split('/').pop();
  if (!['index.html', 'senior-ui.css'].includes(name)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', extname(name) === '.css' ? 'text/css' : 'text/html; charset=utf-8');
  res.end(await readFile(resolve('dist/senior-ui', name)));
});
await new Promise(r => server.listen(4182, '127.0.0.1', r));
const profile = await mkdtemp(resolve(tmpdir(), 'lohas-a11y-'));
const chrome = spawn(process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--remote-debugging-port=9342', '--user-data-dir=' + profile,
  '--no-first-run', '--no-default-browser-check', 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(r => setTimeout(r, ms));
let socket;
try {
  let tabs;
  for (let n = 0; n < 60; n++) { try { tabs = await (await fetch('http://127.0.0.1:9342/json')).json(); break; } catch { await delay(100); } }
  assert.ok(tabs, 'Chrome starts');
  socket = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { socket.onopen = r; socket.onerror = j; });
  let sequence = 0;
  const pending = new Map();
  socket.onmessage = e => { const m = JSON.parse(e.data); if (!m.id) return; const p = pending.get(m.id); pending.delete(m.id); if (m.error) p.reject(m.error); else p.resolve(m.result); };
  const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => { const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.text); return r.result.value; };
  const key = async (key, code = key) => {
    const windowsVirtualKeyCode = key === 'Escape' ? 27 : 9;
    await call('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode });
  };
  await call('Page.enable');
  await call('Page.navigate', { url: 'http://127.0.0.1:4182/lohas_islands/senior-ui/index.html' });
  for (let n = 0; n < 60; n++) { if (await evaluate('!!document.querySelector("#open-task")')) break; await delay(100); }
  await delay(100);
  const ratios = await evaluate(`(() => {
    const style = getComputedStyle(document.documentElement), value = n => style.getPropertyValue('--senior-' + n).trim();
    const lum = hex => { const c = hex.replace('#','').match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4); return c[0]*.2126+c[1]*.7152+c[2]*.0722; };
    const pairs = [['ink','surface'],['muted','surface'],['ink','bg'],['muted','bg'],['surface','primary'],['surface','primary-hover'],['surface','primary-active'],['primary','surface'],['primary','secondary-hover'],['primary','secondary-active'],['disabled-ink','disabled-bg']];
    return pairs.map(([a,b]) => { const x=lum(value(a)), y=lum(value(b)); return {pair:a+'/'+b,ratio:(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}; });
  })()`);
  for (const { pair, ratio } of ratios) assert.ok(ratio >= 7, pair + ': ' + ratio);
  for (const [width, height, font] of [[1280, 900, '100%'], [390, 844, '100%'], [320, 740, '100%'], [320, 740, '200%']]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    await evaluate(`document.documentElement.style.fontSize=${JSON.stringify(font)}; document.querySelector('#open-task').click()`);
    assert.equal(await evaluate(`document.activeElement.textContent.trim()`), '先返回');
    const layout = await evaluate(`(() => {
      const dialog = document.querySelector('dialog'), r = dialog.getBoundingClientRect();
      const buttons = [...dialog.querySelectorAll('button')].map(b=>{const t=b.getBoundingClientRect();return {width:t.width,height:t.height,left:t.left,right:t.right,top:t.top,bottom:t.bottom};});
      const actions = [...dialog.querySelectorAll('.senior-actions button')].map(b=>b.getBoundingClientRect());
      const gap = actions[1].top >= actions[0].bottom ? actions[1].top-actions[0].bottom : actions[1].left-actions[0].right;
      return {pageWidth:document.documentElement.scrollWidth,dialogWidth:dialog.scrollWidth,clientWidth:dialog.clientWidth,rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},buttons,gap};
    })()`);
    assert.ok(layout.pageWidth <= width, JSON.stringify(layout));
    assert.ok(layout.dialogWidth <= layout.clientWidth, 'dialog does not overflow horizontally');
    assert.ok(layout.rect.left >= 0 && layout.rect.right <= width && layout.rect.top >= 0 && layout.rect.bottom <= height);
    for (const b of layout.buttons) assert.ok(b.width >= 48 && b.height >= 48, 'minimum hit area');
    assert.ok(layout.gap >= 12, 'button gap');
    for (let n = 0; n < 8; n++) { await key('Tab'); assert.equal(await evaluate('document.querySelector("dialog").contains(document.activeElement)'), true, 'focus stays inside'); }
    await key('Escape');
    await delay(50); // Native dialog cancellation/close is queued by the browser.
    assert.equal(await evaluate('document.querySelector("dialog").open'), false);
    assert.equal(await evaluate('document.activeElement.id'), 'open-task');
  }
  await evaluate(`document.querySelector('#open-task').click();document.querySelector('#confirm-task').click();document.querySelector('#confirm-task').click()`);
  assert.equal(await evaluate('document.querySelector("dialog").open'), false);
  assert.ok(await evaluate('document.querySelector("#task-status").textContent.includes("已確認")'));
  console.log('PASS: 11 text/background pairs >=7:1; desktop/390/320px and 200% text; 48px targets, 12px gaps; dialog focus, Tab containment, Esc, focus return and confirmation.');
  console.table(ratios.map(r => ({ ...r, ratio: r.ratio.toFixed(2) })));
} finally { socket?.close(); chrome.kill(); await new Promise(r => server.close(r)); }
