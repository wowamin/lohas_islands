import { createServer } from 'vite';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const server = await createServer({ server: { host: '127.0.0.1', port: 4189, strictPort: true } });
await server.listen();
const profile = await mkdtemp(resolve(tmpdir(), 'lohas-focus-'));
const chrome = spawn(process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=9349', '--user-data-dir=' + profile,
    '--no-first-run', '--no-default-browser-check', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket, id = 0;
const pending = new Map(), errors = [];
const delay = ms => new Promise(r => setTimeout(r, ms));
try {
  let tabs;
  for (let n = 0; n < 60; n++) {
    try { tabs = await (await fetch('http://127.0.0.1:9349/json')).json(); break; } catch { await delay(200); }
  }
  assert.ok(tabs, 'Chrome starts');
  socket = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { socket.onopen = r; socket.onerror = j; });
  socket.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description);
  };
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id; pending.set(n, { resolve, reject }); socket.send(JSON.stringify({ id: n, method, params }));
  });
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description);
    return result.result.value;
  };
  const settled = async () => {
    for (let n = 0; n < 100; n++) { if (!await evaluate('window.demo.isAnimating')) return; await delay(40); }
    throw Error('camera animation did not finish');
  };
  const point = () => evaluate(`(()=>{const node=demo.clickableObjects[0].children[0];const p=node.getWorldPosition(node.position.clone()).project(demo.camera),r=demo.renderer.domElement.getBoundingClientRect();return{x:Math.round(r.left+(p.x/2+.5)*r.width),y:Math.round(r.top+(-p.y/2+.5)*r.height)};})()`);
  const mouse = (type, p, more = {}) => call('Input.dispatchMouseEvent', { type, ...p, ...more });
  const click = async p => { await mouse('mousePressed', p, { button: 'left', clickCount: 1 }); await mouse('mouseReleased', p, { button: 'left', clickCount: 1 }); };
  await call('Runtime.enable'); await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1200, height: 800, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: 'http://127.0.0.1:4189/examples/camera-focus/index.html' });
  for (let n = 0; n < 100; n++) {
    if (await evaluate('!!document.querySelector("canvas")')) break;
    await delay(100);
  }
  await evaluate(`import('/examples/camera-focus/main.js').then(m=>{window.demo=m.demo})`);
  assert.equal(await evaluate('demo.clickableObjects.length'), 5);
  assert.equal(await evaluate('demo.camera.isPerspectiveCamera && demo.controls.enableDamping && demo.controls.dampingFactor===.05'), true);
  assert.equal(await evaluate('demo.clickableObjects[0].getWorldPosition(demo.camera.position.clone()).distanceTo(demo.clickableObjects[0].position)>1'), true);
  await click(await point());
  assert.equal(await evaluate('demo.isAnimating && !demo.controls.enabled'), true, 'actual child click starts flight');
  assert.equal(await evaluate('demo.focusOnTarget(demo.clickableObjects[1])'), false, 'repeated flight rejected');
  await delay(300);
  assert.equal(await evaluate('demo.isAnimating && demo.controls.target.distanceTo(demo.clickableObjects[0].getWorldPosition(demo.camera.position.clone()))>.01'), true, 'flight interpolates over time');
  await settled();
  const checkEnd = () => evaluate(`(()=>{const d=demo,p=d.clickableObjects[0].getWorldPosition(d.camera.position.clone());return d.controls.target.distanceTo(p)<1e-5&&d.camera.position.clone().sub(p).distanceTo(p.clone().set(0,4,6))<1e-5&&d.controls.enabled&&d.controls.enableDamping;})()`);
  assert.equal(await checkEnd(), true, 'world-space target and offset exact');
  await delay(200); assert.equal(await checkEnd(), true, 'no post-flight drift');
  await evaluate('demo.resetView()'); await settled();
  let p = await point();
  await mouse('mousePressed', p, { button: 'left', clickCount: 1 });
  await mouse('mouseMoved', { x: p.x + 20, y: p.y }, { button: 'left', buttons: 1 });
  await mouse('mouseReleased', { x: p.x + 20, y: p.y }, { button: 'left', clickCount: 1 });
  assert.equal(await evaluate('demo.isAnimating'), false, '>5px drag does not focus');
  await delay(400); await evaluate('demo.resetView()'); await settled();
  p = await point();
  await mouse('mousePressed', p, { button: 'left', clickCount: 1 });
  await mouse('mouseMoved', { x: p.x + 3, y: p.y + 4 }, { button: 'left', buttons: 1 });
  await mouse('mouseReleased', { x: p.x + 3, y: p.y + 4 }, { button: 'left', clickCount: 1 });
  assert.equal(await evaluate('demo.isAnimating'), true, 'exactly5px accepted'); await settled();
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 664, deviceScaleFactor: 1, mobile: false });
  await delay(200);
  assert.equal(await evaluate('Math.abs(demo.camera.aspect-390/664)<1e-8 && demo.renderer.domElement.clientWidth===390'), true, 'resize updates projection and canvas');
  await evaluate('demo.resetView()'); await settled();
  await mkdir('artifacts', { recursive: true });
  const shot = await call('Page.captureScreenshot', { format: 'png' });
  await writeFile('artifacts/camera-focus-demo.png', Buffer.from(shot.data, 'base64'));
  await evaluate('demo.dispose()');
  assert.equal(await evaluate('document.querySelectorAll("canvas").length'), 0, 'dispose removes canvas');
  assert.deepEqual(errors, []);
  console.log('PASS: nested child raycast, world coordinates, smooth dual-track flight, input lock, no drift, >5px drag rejection, exact5px click, resize, disposal.');
} finally {
  socket?.close(); chrome.kill(); await server.close();
}
