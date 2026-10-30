import { createServer } from 'node:http';
import { readFile, mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

// Uses an installed browser, Node's native WebSocket and an isolated temporary profile.
const browserPath=process.env.CHROME_PATH??'C:/Program Files/Google/Chrome/Application/chrome.exe';
const root=resolve('dist');
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path!==root&&!path.startsWith(root+sep))throw Error('path');const file=path===root?resolve(root,'index.html'):path;res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(r=>server.listen(4178,'127.0.0.1',r));
const profile=await mkdtemp(resolve(tmpdir(),'lohas-browser-'));
const chrome=spawn(browserPath,['--headless=new','--remote-debugging-port=9338','--remote-allow-origins=http://localhost','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--window-size=1440,1000','about:blank'],{windowsHide:true,stdio:'ignore'});
chrome.on('error',e=>console.error(e.message));
let socket;const errors=[];let id=0;const pending=new Map();
const delay=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let tabs;
 for(let i=0;i<60;i++){try{tabs=await(await fetch('http://127.0.0.1:9338/json')).json();break;}catch{await delay(200);}}
 assert.ok(tabs,'browser debugging endpoint');
 socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text+': '+m.params.exceptionDetails.exception?.description);};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??'evaluation failed');return r.result.value;};
 const click=async text=>{const result=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(${JSON.stringify(text)})&&!b.disabled);if(!b)return false;b.click();return true;})()`);assert.ok(result,'button: '+text);await delay(100);};
 const waitFor=async text=>{for(let i=0;i<80;i++){if(await evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`))return;await delay(100);}throw Error('Missing text '+text);};
 const screenshot=async name=>{await mkdir('artifacts',{recursive:true});const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile('artifacts/'+name+'.png',Buffer.from(r.data,'base64'));};
 await call('Runtime.enable');await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:'http://127.0.0.1:4178/'});await waitFor('開始人生旅程');
 await click('A 個管新進人員訓練');await waitFor('A 個管情境工作坊');
 await click('與家庭討論照顧計畫');await waitFor('判斷正確');
 await click('四包錢試算');await waitFor('估計自付');
 assert.ok((await evaluate('document.querySelector(".calc-result").innerText')).includes('$41'),'BA01 general category copay floors 41.6');
 await click('記錄本次試算練習');await waitFor('已完成一次試算練習');
 await click('服務碼');await waitFor('GA09');
 await evaluate(`(()=>{const e=document.querySelector('.learn-search input');const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(e,'GA09');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await delay(100);
 assert.equal(await evaluate('document.querySelectorAll(".service-grid article").length'),1);
 await evaluate(`document.querySelector('[aria-label="關閉學習中心"]').click()`);await delay(100);
 await click('增加玩家');await click('增加玩家');
 await click('開始人生旅程');await waitFor('儲存進度');await delay(1200);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.players.length`),4);
 assert.equal(await evaluate(`document.querySelectorAll('.island-stations>button').length`),50);
 const unchanged=await evaluate(`localStorage.getItem('long-care-game-save-v2')`);
 for(let i=0;i<5;i++){
   await evaluate(`document.querySelectorAll('.activity-pins>button')[${i}].click()`);await delay(100);
   assert.ok(await evaluate(`document.querySelector('.center-education').innerText.includes('遊戲場景主題')`));
   await evaluate(`document.querySelector('[aria-label="關閉中心介紹並返回城市"]').click()`);await delay(50);
 }
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('lohas-city-preferences-v1')).state.explored.length`),5);
 assert.equal(await evaluate(`localStorage.getItem('long-care-game-save-v2')`),unchanged,'building exploration never changes game');
 for(const [label,mode]of [['跟隨','follow'],['聚焦','focus'],['全景','overview']]){
   await evaluate(`(()=>{const b=[...document.querySelectorAll('.camera-modes button')].find(b=>b.textContent===${JSON.stringify(label)});b.click();})()`);await delay(100);
   assert.equal(await evaluate(`document.querySelector('.care-island').dataset.cameraMode`),mode);
 }
 const performanceResults=[];
 async function measure(label,quality){
   await evaluate(`(()=>{const e=document.querySelector('[aria-label="城市畫質"]');e.value=${JSON.stringify(quality)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
   await delay(1800);const samples=[];for(let i=0;i<3;i++){await delay(1500);samples.push(await evaluate(`(()=>{const c=document.querySelector('.island-render canvas');return {fps:Number(c.dataset.fps),calls:Number(c.dataset.calls),triangles:Number(c.dataset.triangles),quality:c.dataset.quality};})()`));}
   performanceResults.push({label,quality,samples});
 }
 for(const q of ['low','medium','high'])await measure('desktop 1440x1000',q);
 await measure('desktop final medium','medium');
 await delay(700);
 await screenshot('desktop-city');
 await click('儲存進度');await evaluate(`window.originalRandom=Math.random;Math.random=()=>.49`);await click('擲骰子');
 for(let i=0;i<40;i++){if(await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.phase==='MOVING'`))break;await delay(100);}
 await click('跳過動畫');
 await evaluate(`Math.random=window.originalRandom`);
 // Events have multiple outcomes; wait on persisted authoritative phase instead of a particular card.
 for(let i=0;i<100;i++){if(await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.phase==='EVENT'`))break;await delay(100);}
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.phase`),'EVENT');
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.players[0].position`),3,'skip animation retains rolled destination');
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.players[0].money`),10000,'skip does not apply event early');
 await screenshot('desktop-event');
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(500);
 await screenshot('mobile-event');
 await evaluate(`(()=>{const b=document.querySelector('.event-dialog .choice-button,.event-dialog .event-confirm');if(b)b.click();})()`);await delay(100);
 await click('交給下一位');await click('讀取存檔');
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.currentPlayerIndex`),0);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.players[0].position`),0);
 await click('切換城市探索');
 assert.ok(await evaluate(`document.querySelector('.dice-button').disabled`),'exploration pauses roll');
 await measure('mobile viewport 390x844 (desktop Chrome)','low');
 await delay(900);await screenshot('mobile-city');await click('返回遊戲模式');
 const graphics=await evaluate(`(()=>{const c=document.querySelector('.island-render canvas'),gl=c.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {vendor:ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):gl.getParameter(gl.VENDOR),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};})()`);
 await writeFile('artifacts/performance.json',JSON.stringify({environment:await evaluate('navigator.userAgent'),graphics,note:'Headless desktop Chrome; mobile viewport is not physical mobile hardware. Three samples per configuration; no FPS target assertion.',results:performanceResults},null,2));
 // Return to setup in this isolated profile, retaining the separate learning record.
 await evaluate(`localStorage.removeItem('long-care-game-save-v2');location.reload()`);await waitFor('開始人生旅程');
 await click('A 個管新進人員訓練');await waitFor('A 個管情境工作坊');await screenshot('mobile-training');
 for(const name of ['提出申請','到府評估','確認 CMS 與額度','擬訂照顧計畫','媒合服務資源','接受服務','追蹤與調整']){
   assert.ok(await evaluate(`(()=>{const b=[...document.querySelectorAll('.flow-options button')].find(b=>b.textContent===${JSON.stringify(name)});if(!b)return false;b.click();return true;})()`));await delay(50);
 }
 await click('檢查流程');await waitFor('順序正確');
 await click('服務網絡');await waitFor('資源媒合');
 await evaluate(`(()=>{const labels=[...document.querySelectorAll('.plan-checks label')];for(const label of labels)if(['交通接送','日照中心'].includes(label.textContent))label.querySelector('input').click();})()`);await delay(100);
 await click('確認媒合');await waitFor('媒合方向正確');
 assert.ok(await evaluate(`document.documentElement.scrollWidth<=window.innerWidth`),'mobile page does not overflow');
 assert.ok(await evaluate(`document.querySelector('.learn-shell').getBoundingClientRect().right<=window.innerWidth`),'mobile dialog within viewport');
 await evaluate(`document.querySelector('[aria-label="關閉學習中心"]').click()`);await delay(100);
 await click('開始人生旅程');await delay(1000);
 const oldRaw=await evaluate(`(()=>{const s=JSON.parse(localStorage.getItem('long-care-game-save-v2')).state;s.players[0].position=39;s.currentPlayerIndex=0;s.phase='WAITING_ROLL';s.selectedEvent=null;s.eventResultText=null;const raw=JSON.stringify({version:1,state:s});localStorage.setItem('long-care-game-save-v1',raw);localStorage.removeItem('long-care-game-save-v2');return raw;})()`);
 await evaluate('location.reload()');await waitFor('已將 40 格存檔轉換');
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.players[0].position`),47);
 assert.equal(await evaluate(`localStorage.getItem('long-care-game-save-v1-backup-before-50')`),oldRaw);
 await click('知道了');
 await evaluate(`(()=>{const v=JSON.parse(localStorage.getItem('long-care-game-save-v2'));v.state.players[0].position=48;v.state.diceValue=4;v.state.phase='MOVING';localStorage.setItem('long-care-game-save-v2',JSON.stringify(v));location.reload();})()`);
 for(let i=0;i<80;i++){if(await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.phase==='EVENT'`))break;await delay(100);}
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.players[0].position`),2);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.players[0].money`),11000);
 await evaluate(`(()=>{const v=JSON.parse(localStorage.getItem('long-care-game-save-v2'));v.state.players[0].position=6;v.state.diceValue=2;v.state.phase='MOVING';v.state.selectedEvent=null;v.state.eventResultText=null;localStorage.setItem('long-care-game-save-v2',JSON.stringify(v));location.reload();})()`);
 await waitFor('知識機會卡');
 const beforeKnowledge=await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.players[0]`);
 await evaluate(`document.querySelector('.event-dialog .choice-button').click()`);await delay(100);
 const afterKnowledge=await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.players[0]`);
 for(const key of ['money','health','stress','position'])assert.equal(afterKnowledge[key],beforeKnowledge[key],'knowledge card retains '+key);
 // Simulate unavailable WebGL at startup, without changing product code or using a test-only product flag.
 await call('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'||type==='webgl2'?null:original.call(this,type,...args);};})()`});
 await evaluate(`localStorage.removeItem('long-care-game-save-v2');localStorage.removeItem('long-care-game-save-v1');location.reload()`);await waitFor('開始人生旅程');await click('先逛逛照顧城市');await waitFor('WebGL 不可用');
 assert.equal(await evaluate(`document.querySelectorAll('.city-map-50 [data-tile-id]').length`),50);
 await evaluate(`document.querySelector('.city-map-50 [aria-label="大和日照中心"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))`);await waitFor('健康管理與生活照顧');
 await screenshot('mobile-2d-fallback');
 await evaluate(`document.querySelector('[aria-label="關閉中心介紹並返回城市"]').click()`);await delay(100);await screenshot('mobile-2d-overview');await click('開始 2–4 人旅程');await click('開始人生旅程');await click('擲骰子');
 for(let i=0;i<80;i++){if(await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.phase==='EVENT'`))break;await delay(100);}
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('long-care-game-save-v2')).state.phase`),'EVENT','2D fallback is playable');
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: 50 stops, four players, five courtyard interactions and isolation, all camera modes, three quality levels, skip animation, wrap recovery, legacy backup/migration, training and manual saves, desktop/mobile layouts, playable no-WebGL fallback. Performance samples: artifacts/performance.json.');
}finally{socket?.close();chrome.kill();await new Promise(r=>server.close(r));}
