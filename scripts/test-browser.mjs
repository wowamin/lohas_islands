import { createServer } from 'node:http';
import { readFile, mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

// Uses an installed browser, Node's native WebSocket and an isolated temporary profile.
const browserPath=process.env.CHROME_PATH??'C:/Program Files/Google/Chrome/Application/chrome.exe';
const root=resolve('dist');
const testBase=process.env.LOHAS_TEST_BASE??'/';
assert.match(testBase,/^\/(?:[a-zA-Z0-9_-]+\/)*$/,'test deployment base must begin and end with /');
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!pathname.startsWith(testBase))throw Error('outside base');const path=resolve(root,pathname.slice(testBase.length)||'index.html');if(path!==root&&!path.startsWith(root+sep))throw Error('path');const file=path===root?resolve(root,'index.html'):path;res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(r=>server.listen(4178,'127.0.0.1',r));
const profile=await mkdtemp(resolve(tmpdir(),'lohas-browser-'));
const chrome=spawn(browserPath,['--headless=new','--remote-debugging-port=9338','--remote-allow-origins=http://localhost','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--window-size=1440,1000','about:blank'],{windowsHide:true,stdio:'ignore'});
chrome.on('error',e=>console.error(e.message));
let socket;const errors=[],failedRequests=[];let id=0;const pending=new Map();
const extraSockets=[],extraBrowsers=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let tabs;
 for(let i=0;i<60;i++){try{tabs=await(await fetch('http://127.0.0.1:9338/json')).json();break;}catch{await delay(200);}}
 assert.ok(tabs,'browser debugging endpoint');
 socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text+': '+m.params.exceptionDetails.exception?.description);if(m.method==='Network.responseReceived'&&m.params.response.url.startsWith('http://127.0.0.1:4178')&&m.params.response.status>=400)failedRequests.push({url:m.params.response.url,status:m.params.response.status});};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??'evaluation failed');return r.result.value;};
 const click=async text=>{const result=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(${JSON.stringify(text)})&&!b.disabled);if(!b)return false;b.click();return true;})()`);assert.ok(result,'button: '+text);await delay(100);};
 const waitFor=async text=>{for(let i=0;i<80;i++){if(await evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`))return;await delay(100);}throw Error('Missing text '+text);};
 const screenshot=async name=>{await mkdir('artifacts',{recursive:true});const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile('artifacts/'+name+'.png',Buffer.from(r.data,'base64'));};
 await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 if(process.argv.includes('--dice'))await call('Page.addScriptToEvaluateOnNewDocument',{source:`
   window.__feedbackProbe={contexts:0,starts:0,vibrations:[]};
   const Original=window.AudioContext;
   if(Original)window.AudioContext=new Proxy(Original,{construct(Target,args){const context=new Target(...args);window.__feedbackProbe.contexts++;for(const key of ['createOscillator','createBufferSource']){const make=context[key].bind(context);context[key]=(...args)=>{const node=make(...args),start=node.start.bind(node);node.start=(...args)=>{window.__feedbackProbe.starts++;return start(...args);};return node;};}return context;}});
   Object.defineProperty(navigator,'vibrate',{value:pattern=>{window.__feedbackProbe.vibrations.push(pattern);return true;},configurable:true});
 `});
 await call('Page.navigate',{url:'http://127.0.0.1:4178'+testBase});await waitFor('開始人生旅程');
 if(process.argv.includes('--characters')){
   await evaluate(`document.querySelectorAll('.character-trigger')[0].focus();document.querySelectorAll('.character-trigger')[0].click()`);await waitFor('確認選擇爺爺');await delay(900);await screenshot('characters-preview-desktop');
   assert.ok(await evaluate(`!!document.querySelector('.character-preview canvas')`),'real 3D preview');
   await evaluate(`window.__characterPreviewCanvas=document.querySelector('.character-preview canvas')`);await click('暫停自轉');const stopped=await evaluate(`document.querySelector('.character-preview canvas').dataset.rotation`);await delay(200);assert.equal(await evaluate(`document.querySelector('.character-preview canvas').dataset.rotation`),stopped);await click('繼續自轉');await delay(100);assert.notEqual(await evaluate(`document.querySelector('.character-preview canvas').dataset.rotation`),stopped);assert.equal(await evaluate(`document.querySelector('.character-preview canvas')===window.__characterPreviewCanvas`),true,'selection controls reuse preview renderer');
   const point=await evaluate(`(()=>{const r=document.querySelector('.character-preview canvas').getBoundingClientRect();return{x:r.x+r.width*.65,y:r.y+r.height*.55};})()`);await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});await delay(150);assert.equal(await evaluate(`document.querySelector('.character-preview').dataset.selectedCharacter`),'grandma','clicking actual 3D geometry selects character');
   await delay(6500);await screenshot('characters-preview-side');await delay(6500);await screenshot('characters-preview-back');
   await evaluate(`document.querySelectorAll('.character-option')[1].click()`);await delay(150);assert.equal(await evaluate(`document.querySelector('.character-preview').dataset.selectedCharacter`),'grandma');await click('確認選擇奶奶');assert.ok(await evaluate(`document.querySelectorAll('.character-trigger')[0].textContent.includes('奶奶')`));
   await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await evaluate(`document.querySelectorAll('.character-trigger')[1].click()`);await waitFor('確認選擇奶奶');await delay(600);await screenshot('characters-preview-mobile');
   assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'picker does not overflow');await click('確認選擇奶奶');await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
   await call('Emulation.setDeviceMetricsOverride',{width:320,height:740,deviceScaleFactor:1,mobile:true});await evaluate(`document.querySelector('.character-trigger').focus();document.querySelector('.character-trigger').click()`);await waitFor('確認選擇奶奶');await delay(200);await screenshot('characters-picker-320');assert.ok(await evaluate(`(()=>{const r=document.querySelector('.character-picker').getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight;})()`));await evaluate(`document.querySelectorAll('.character-option')[0].click()`);await click('先返回');assert.ok(await evaluate(`document.querySelector('.character-trigger').textContent.includes('奶奶')`),'cancel preserves confirmed choice');await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 }
 assert.equal(await evaluate(`document.querySelector('.online-count strong')?.textContent`),'1','online count is visible on the setup screen');
 await evaluate(`(()=>{const key='lohas-islands:online-tab:browser-test';localStorage.setItem(key,String(Date.now()));window.dispatchEvent(new StorageEvent('storage',{key,newValue:localStorage.getItem(key)}));})()`);await delay(50);
 assert.equal(await evaluate(`document.querySelector('.online-count strong')?.textContent`),'2','online count includes another active browser tab');
 await evaluate(`(()=>{const key='lohas-islands:online-tab:browser-test';localStorage.removeItem(key);window.dispatchEvent(new StorageEvent('storage',{key,oldValue:String(Date.now())}));})()`);await delay(50);
 assert.equal(await evaluate(`document.querySelector('.online-count strong')?.textContent`),'1','online count drops after the other tab closes');
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
 assert.ok(await evaluate(`document.querySelector('.online-count')!==null`),'online count remains visible during gameplay');
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.players.length`),4);
 assert.equal(await evaluate(`document.querySelectorAll('.island-stations>button').length`),50);
 if(process.argv.includes('--night-titles')){
   const selector='.journey-title h1,.journey-title h1 small,.journey-title p,.journey-hud .brand-lockup strong,.journey-hud .brand-lockup small,.journey-hud .brand-lockup em';
   const colors=()=>evaluate(`Array.from(document.querySelectorAll(${JSON.stringify(selector)}),node=>getComputedStyle(node).color)`);
   for(const [width,height] of [[1440,1000],[390,844]]){
     await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<800});await delay(100);
     const day=await colors();assert.equal(day.length,6);
     await click('白天');await delay(150);
     assert.deepEqual(await colors(),Array(6).fill('rgb(255, 255, 255)'),'night title, subtitle and brand are white');
     await screenshot(width<800?'mobile-night-titles':'desktop-night-titles');
     await click('夜晚');await delay(150);assert.deepEqual(await colors(),day,'daytime colors restored');
   }
   assert.equal(errors.length,0,errors.join('\n'));assert.deepEqual(failedRequests,[]);
   console.log('PASS: desktop/mobile night title, version, subtitle and brand turn white; day colors restore.');
 }else if(process.argv.includes('--toolbar')){
   const toggleToolbar=async()=>{await evaluate(`document.querySelector('.city-toolbar-toggle').click()`);await delay(50);};
   const saved=await evaluate(`localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))`);
   for(const [width,height] of [[320,740],[390,844],[768,1024]]){
     await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await delay(100);
     const info=await evaluate(`(()=>{const button=document.querySelector('.city-toolbar-toggle'),r=button.getBoundingClientRect();return{width:r.width,height:r.height,expanded:button.getAttribute('aria-expanded')};})()`);assert.ok(info.width>=48&&info.height>=48);assert.equal(info.expanded,'true');
     const toolbar=await evaluate(`(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};return{nav:rect(document.querySelector('.city-toolbar')),toggle:rect(document.querySelector('.city-toolbar-toggle')),help:rect(document.querySelector('.city-toolbar-help')),actions:rect(document.querySelector('.city-toolbar-actions')),buttons:[...document.querySelectorAll('.city-toolbar-actions>button')].filter(b=>getComputedStyle(b).display!=='none').map(rect)};})()`);
     assert.ok(Math.abs(toolbar.help.y-toolbar.toggle.y)<2,'help stays on the toggle row');assert.ok(toolbar.nav.height<=64,'compact single-row toolbar');assert.ok(toolbar.help.right<=width,'help remains inside viewport');
     for(const b of toolbar.buttons){assert.ok(Math.abs(b.y-toolbar.help.y)<2,'action stays on one row');assert.ok(b.width>=48&&b.height>=48,'large action touch targets');}
     await evaluate(`document.querySelector('.city-toolbar-actions').scrollLeft=9999`);await delay(50);assert.ok(await evaluate(`document.querySelector('.city-toolbar-actions').scrollLeft>0`),'actions scroll horizontally on mobile');
     const helpHit=await evaluate(`(()=>{const b=document.querySelector('.city-toolbar-help'),r=b.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b;})()`);assert.equal(helpHit,true,'help remains visible and tappable');
     await evaluate(`document.querySelector('.city-toolbar-help').click()`);await delay(50);assert.equal(await evaluate(`!!document.querySelector('.city-help')`),true);await evaluate(`document.querySelector('.city-toolbar-help').click()`);
     await click('白天');await toggleToolbar();
     assert.equal(await evaluate(`getComputedStyle(document.querySelector('.city-toolbar-actions')).display`),'none');
     assert.equal(await evaluate(`document.querySelector('.city-toolbar-toggle').getAttribute('aria-expanded')`),'false');
     await call('Page.bringToFront');await evaluate(`document.querySelector('.city-toolbar-toggle').focus()`);assert.equal(await evaluate(`document.activeElement===document.querySelector('.city-toolbar-toggle')`),true,'toggle accepts keyboard focus');await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await delay(100);
     assert.equal(await evaluate(`document.querySelector('.city-toolbar-toggle').getAttribute('aria-expanded')`),'true');assert.equal(await evaluate(`document.querySelector('.city-world').classList.contains('city-night')`),true,'toolbar preserves settings');
     await click('夜晚');await screenshot('toolbar-expanded-'+width);await toggleToolbar();await screenshot('toolbar-collapsed-'+width);
     await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await delay(50);assert.equal(await evaluate(`getComputedStyle(document.querySelector('.city-toolbar-actions')).display`),'contents','desktop toolbar stays visible');assert.equal(await evaluate(`getComputedStyle(document.querySelector('.city-toolbar-toggle')).display`),'none');
     await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await delay(50);await toggleToolbar();
     assert.ok(await evaluate(`document.documentElement.scrollWidth<=window.innerWidth`),'no horizontal overflow');
   }
   assert.equal(await evaluate(`localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))`),saved,'toolbar never changes game state');assert.equal(errors.length,0,errors.join('\n'));assert.deepEqual(failedRequests,[]);
   console.log('PASS: toolbar collapses/reopens at 320/390/768px; 48px toggle, keyboard activation, settings/state preserved, desktop visible and no horizontal overflow.');
 }else if(process.argv.includes('--dice')){
   const state=()=>evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state`);
   const until=async expression=>{for(let n=0;n<240;n++){if(await evaluate(expression))return;await delay(25);}throw Error('Timed out: '+expression);};
   const waitPhase=phase=>until(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.phase===${JSON.stringify(phase)}`);
   const realRoll=async()=>{const r=await evaluate(`(()=>{const r=document.querySelector('.dice-button').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...r});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...r});};
   const finishEvent=async()=>{
     const before=await state();
     if(!before.selectedEvent){await evaluate(`document.querySelector('.continue-button').click()`);await waitPhase('WAITING_ROLL');assert.equal((await state()).revision,before.revision+1);return;}
     assert.equal(await evaluate(`document.querySelectorAll('.event-dialog .effect-chip').length`),0,'no effect values before choosing');
     await evaluate(`(()=>{const b=document.querySelector('.event-dialog .choice-button,.event-dialog .event-confirm');b.click();b.click();})()`);await delay(70);
     const chosen=await state();assert.equal(chosen.selectedEvent,null);assert.equal(chosen.revision,before.revision+1,'choice resolves once');
     assert.equal(await evaluate(`document.querySelectorAll('.result-feedback .effect-chip').length`),3,'values appear only after choosing');
     const original=before.players[before.currentPlayerIndex],player=chosen.players[chosen.currentPlayerIndex];
     assert.deepEqual(chosen.eventOutcome,{money:player.money-original.money,health:player.health-original.health,stress:player.stress-original.stress});
     await evaluate(`document.querySelector('.continue-button').click()`);await waitPhase('WAITING_ROLL');assert.equal((await state()).revision,chosen.revision+1);
   };
   const assertLanding=(before,after)=>{const p=after.players[before.currentPlayerIndex];assert.equal(p.position,(before.players[before.currentPlayerIndex].position+after.diceValue)%50);assert.equal(after.currentPlayerIndex,before.currentPlayerIndex);};
   const changePreferences=async({speed,muted,vibration})=>{
     await click('動畫與音效');await until(`document.querySelector('.dice-preferences').open`);
     await evaluate(`(()=>{const inputs=document.querySelectorAll('.dice-preferences input');if(inputs[0].checked===${JSON.stringify(muted)})inputs[0].click();if(inputs[1].checked!==${JSON.stringify(vibration)})inputs[1].click();inputs[${speed==='quick'?3:2}].click();})()`);
     await screenshot('dice-settings');await evaluate(`document.querySelector('[aria-label="關閉動畫與音效設定"]').click()`);await delay(50);
   };
   assert.equal(await evaluate(`window.__feedbackProbe.contexts`),0,'no autoplay context before roll');
   await evaluate(`window.__originalDiceCanvas=document.querySelector('.island-render canvas')`);
   const before=await state();await realRoll();
   const rolled=await state();assert.equal(rolled.phase,'ROLLING');assert.equal(rolled.revision,before.revision+1);
   await evaluate(`for(let n=0;n<30;n++)document.querySelector('.dice-button').click()`);assert.equal((await state()).revision,rolled.revision,'rapid click lock');
   await delay(500);await screenshot('dice-rolling-desktop');
   await until(`document.querySelector('.turn-panel').dataset.dicePhase==='revealing'`);
   const revealing=await state();assert.equal(revealing.phase,'ROLLING');assert.equal(revealing.players[before.currentPlayerIndex].position,before.players[before.currentPlayerIndex].position,'reveal precedes movement');
   assert.ok(await evaluate(`document.querySelector('.dice-result-panel').textContent.includes(${JSON.stringify(String(rolled.diceValue))})`));await screenshot('dice-reveal-desktop');
   await waitPhase('EVENT');const landed=await state();assertLanding(before,landed);assert.equal(landed.diceValue,rolled.diceValue);
   assert.equal(await evaluate(`document.querySelector('.island-render canvas')===window.__originalDiceCanvas`),true,'renderer reused across roll');
   assert.equal(await evaluate(`window.__feedbackProbe.contexts`),1);assert.ok(await evaluate(`window.__feedbackProbe.starts>0`),'sound starts after gesture');
   assert.deepEqual(await evaluate(`window.__feedbackProbe.vibrations`),[],'vibration is off by default');await finishEvent();
   // Skip from rolling, rather than waiting for movement. The result and landing still commit once.
   const beforeSkip=await state();await realRoll();const skippedRoll=await state();await click('跳過動畫');await waitPhase('EVENT');const skipped=await state();assertLanding(beforeSkip,skipped);assert.equal(skipped.diceValue,skippedRoll.diceValue);const skippedRaw=JSON.stringify(skipped);await delay(1800);assert.equal(JSON.stringify(await state()),skippedRaw,'old fallback timer cannot trigger another landing');await finishEvent();
   await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
   await changePreferences({speed:'quick',muted:true,vibration:true});const starts=await evaluate(`window.__feedbackProbe.starts`),beforeQuick=await state();await realRoll();await waitPhase('EVENT');assertLanding(beforeQuick,await state());assert.equal(await evaluate(`window.__feedbackProbe.starts`),starts,'mute prevents all sounds');assert.ok(await evaluate(`window.__feedbackProbe.vibrations.includes(18)`),'explicit vibration opt-in');await finishEvent();
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
   const vibrationCount=await evaluate(`window.__feedbackProbe.vibrations.filter(x=>x===18).length`),beforeReduced=await state();await realRoll();
   assert.equal(await evaluate(`document.querySelector('.turn-panel').dataset.diceMotion`),'reduced');assert.equal(await evaluate(`document.querySelectorAll('.dice-spinning').length`),0);await screenshot('dice-reduced-mobile');await waitPhase('EVENT');assertLanding(beforeReduced,await state());assert.equal(await evaluate(`window.__feedbackProbe.vibrations.filter(x=>x===18).length`),vibrationCount,'reduced mode disables haptics');await finishEvent();
   await call('Emulation.setEmulatedMedia',{features:[]});await changePreferences({speed:'standard',muted:true,vibration:false});
   // Reload an interrupted roll: migration resumes its existing dice result, not another random roll.
   const beforeReload=await state();await realRoll();const interrupted=await state();await call('Page.reload');await waitFor('儲存進度');await waitPhase('EVENT');const recovered=await state();assertLanding(beforeReload,recovered);assert.equal(recovered.diceValue,interrupted.diceValue);await finishEvent();
   await call('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'||type==='webgl2'?null:original.call(this,type,...args);};})()`});
   await call('Page.reload');await waitFor('WebGL 不可用');assert.equal(await evaluate(`document.querySelectorAll('.city-map-50 [data-tile-id]').length`),50);
   const before2D=await state();await realRoll();await waitPhase('EVENT');assertLanding(before2D,await state());await finishEvent();
   assert.equal(errors.length,0,errors.join('\n'));assert.deepEqual(failedRequests,[]);
   console.log('PASS: real dice click, repeat lock, reveal-before-move, skip-roll cancellation, one movement/event/turn, after-choice values, renderer/audio context reuse, mute, vibration opt-in, quick/reduced modes, reload and 2D fallback.');
 }else if(process.argv.includes('--characters')){
   const state=()=>evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state`);
   const waitPhase=async phase=>{for(let n=0;n<140;n++){if((await state()).phase===phase)return;await delay(60);}throw Error('Missing phase '+phase);};
   const roles=['grandma','grandma','grandpa','grandma'];assert.deepEqual((await state()).players.map(p=>p.characterId),roles);assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('.journey-avatar'),e=>e.dataset.characterId)`),roles);
   assert.equal(new Set((await state()).players.map(p=>p.color)).size,4);
   await click('聚焦');for(let n=0;n<4;n++)await evaluate(`document.querySelector('[aria-label="放大城市"]').click()`);await delay(800);await screenshot('characters-city-closeup');
   const before=await state();await click('擲骰子');const roll=await state();await waitPhase('EVENT');const after=await state();assert.equal(after.players[0].position,(before.players[0].position+roll.diceValue)%50);assert.deepEqual(after.players.map(p=>p.characterId),roles);
   const finish=async()=>{await evaluate(`document.querySelector('.event-dialog .choice-button,.event-dialog .event-confirm')?.click()`);await delay(60);await evaluate(`document.querySelector('.continue-button').click()`);await waitPhase('WAITING_ROLL');};await finish();
   await click('儲存進度');assert.deepEqual(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-manual-save-key'))).state.players.map(p=>p.characterId)`),roles);await call('Page.reload');await waitFor('儲存進度');assert.deepEqual((await state()).players.map(p=>p.characterId),roles);
   await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await screenshot('characters-city-mobile');await click('擲骰子');const skippedDice=(await state()).diceValue;await click('跳過動畫');await waitPhase('EVENT');assert.equal((await state()).players[1].position,skippedDice);assert.deepEqual((await state()).players.map(p=>p.characterId),roles);await finish();
   // Resume old v3 progress without character IDs; keep balances and map positions intact.
   const legacy=await evaluate(`(()=>{const key=sessionStorage.getItem('lohas-auto-save-key'),value=JSON.parse(localStorage.getItem(key));value.state.players.forEach(p=>delete p.characterId);value.state.currentPlayerIndex=0;value.state.players[0].position=49;value.state.phase='MOVING';value.state.diceValue=2;value.state.selectedEvent=null;value.state.eventResultText=null;localStorage.setItem(key,JSON.stringify(value));return value.state;})()`);
   await call('Page.reload');await waitPhase('EVENT');const restored=await state();assert.equal(restored.players[0].position,1);assert.equal(restored.players[0].money,legacy.players[0].money+1000);assert.deepEqual(restored.players.map(p=>p.characterId),['grandpa','grandma','grandpa','grandma']);await finish();
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await click('擲骰子');await waitPhase('EVENT');await finish();
   // Fresh isolated game with WebGL blocked: the picker and city both use explicit 2D alternatives.
   await evaluate(`localStorage.removeItem(sessionStorage.getItem('lohas-auto-save-key'));localStorage.removeItem('lohas-recent-session-v3')`);
   await call('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'||type==='webgl2'?null:original.call(this,type,...args);};})()`});
   await call('Page.reload');await waitFor('一人開始體驗');await evaluate(`document.querySelector('.character-trigger').click()`);await waitFor('確認選擇爺爺');await delay(200);assert.ok(await evaluate(`!!document.querySelector('.character-preview-fallback')`));await screenshot('characters-picker-2d');await evaluate(`document.querySelectorAll('.character-option')[1].click()`);await click('確認選擇奶奶');await click('一人開始體驗');await waitFor('WebGL 不可用');assert.equal((await state()).players[0].characterId,'grandma');assert.equal((await state()).players.length,1);assert.equal(await evaluate(`document.querySelector('.city-map-50 [data-character-id]').dataset.characterId`),'grandma');await screenshot('characters-city-2d');
   await click('擲骰子');await waitPhase('EVENT');assert.equal((await state()).players[0].characterId,'grandma');
   assert.equal(errors.length,0,errors.join('\n'));assert.deepEqual(failedRequests,[]);
   console.log('PASS: desktop/mobile real 3D picker, separate/repeated player choices, role-aware HUD, walk/skip/wrap, manual/reloaded/legacy saves, reduced motion, solo and 2D picker/pawn fallback.');
 }else if(process.argv.includes('--isolation')){
   const appUrl='http://127.0.0.1:4178'+testBase;
   async function connect(url){
     const ws=new WebSocket(url);extraSockets.push(ws);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});let sequence=0;const requests=new Map();
     ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const r=requests.get(m.id);if(r){requests.delete(m.id);m.error?r.reject(m.error):r.resolve(m.result);}}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);if(m.method==='Network.webSocketCreated')errors.push('The game opened a WebSocket');if(m.method==='Network.requestWillBeSent'&&['XHR','Fetch'].includes(m.params.type))errors.push('Unexpected game data request: '+m.params.request.url);};
     const rpc=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++sequence;requests.set(requestId,{resolve,reject});ws.send(JSON.stringify({id:requestId,method,params}));});
     const evaluate=async expression=>{const r=await rpc('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??'evaluation');return r.result.value;};
     const click=async text=>{assert.ok(await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(${JSON.stringify(text)})&&!b.disabled);if(!b)return false;b.click();return true;})()`),'button '+text);await delay(100);};
     const wait=async predicate=>{for(let i=0;i<100;i++){if(await evaluate(predicate))return;await delay(100);}throw Error('Timed out: '+predicate);};
     return{rpc,evaluate,click,wait,state:()=>evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key')))?.state`)};
   }
   const version=await(await fetch('http://127.0.0.1:9338/json/version')).json(),browser=await connect(version.webSocketDebuggerUrl);
   const profileB=await mkdtemp(resolve(tmpdir(),'lohas-visitor-b-'));
   const chromeB=spawn(browserPath,['--headless=new','--remote-debugging-port=9339','--remote-allow-origins=http://localhost','--user-data-dir='+profileB,'--no-first-run','--no-default-browser-check','about:blank'],{windowsHide:true,stdio:'ignore'});extraBrowsers.push(chromeB);
   let tabsB;for(let i=0;i<60;i++){try{tabsB=await(await fetch('http://127.0.0.1:9339/json')).json();break;}catch{await delay(200);}}
   assert.ok(tabsB,'second independent browser starts');
   const b=await connect(tabsB.find(t=>t.type==='page').webSocketDebuggerUrl);
   await b.rpc('Runtime.enable');await b.rpc('Network.enable');await b.rpc('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await b.rpc('Page.navigate',{url:appUrl});
   await b.wait(`document.body.innerText.includes('一人開始體驗')`);await b.click('一人開始體驗');assert.equal((await b.state()).players.length,1);
   const aKey=await evaluate(`sessionStorage.getItem('lohas-auto-save-key')`),aBefore=await evaluate(`localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))`);
   const created=await browser.rpc('Target.createTarget',{url:'about:blank'});const c=await connect('ws://127.0.0.1:9338/devtools/page/'+created.targetId);
   await c.rpc('Runtime.enable');await c.rpc('Network.enable');await c.rpc('Page.navigate',{url:appUrl});await c.wait(`!!document.querySelector('.dice-button')`);
   const cKey=await c.evaluate(`sessionStorage.getItem('lohas-auto-save-key')`);assert.notEqual(aKey,cKey,'same-browser tabs get distinct save slots');
   assert.equal((await c.state()).players.length,4,'new tab forks the existing progress');
   const cBefore=await c.evaluate(`localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))`);
   async function playTurn(page){await page.click('擲骰子');await page.wait(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key')))?.state.phase==='EVENT'`);await page.evaluate(`document.querySelector('.event-dialog .choice-button,.event-dialog .event-confirm').click()`);await delay(100);await page.click('交給下一位');return page.state();}
   const bAfter=await playTurn(b);assert.equal(bAfter.round,2);assert.ok(bAfter.players[0].position>=1&&bAfter.players[0].position<=6);
   assert.equal(await evaluate(`localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))`),aBefore);assert.equal(await c.evaluate(`localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))`),cBefore);
   const cAfter=await playTurn(c);assert.equal(cAfter.currentPlayerIndex,1);assert.ok(cAfter.players[0].position>0);
   assert.equal(await evaluate(`localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))`),aBefore,'another tab must not overwrite visitor A');assert.deepEqual(await b.state(),bAfter,'another browser must not alter visitor B');
   await call('Page.reload');await waitFor('儲存進度');assert.equal(await evaluate(`sessionStorage.getItem('lohas-auto-save-key')`),aKey);assert.equal(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.players[0].position`),0,'reload resumes own progress despite another tab updating latest-save pointer');
   await b.rpc('Page.reload');await b.wait(`!!document.querySelector('.dice-button')`);assert.deepEqual(await b.state(),bAfter);
   const unknown=await c.evaluate(`(()=>{const key=sessionStorage.getItem('lohas-auto-save-key'),v=JSON.parse(localStorage.getItem(key));v.state.mapVersion=999;const raw=JSON.stringify(v);localStorage.setItem(key,raw);return raw;})()`);await c.rpc('Page.reload');await c.wait(`document.body.innerText.includes('目前可暫玩')`);await c.click('一人開始體驗');assert.equal(await c.evaluate(`localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))`),unknown,'unknown map version remains untouched');assert.deepEqual(await b.state(),bAfter);
   const context=await browser.rpc('Target.createBrowserContext'),newTarget=await browser.rpc('Target.createTarget',{url:'about:blank',browserContextId:context.browserContextId});const d=await connect('ws://127.0.0.1:9338/devtools/page/'+newTarget.targetId);
   await d.rpc('Runtime.enable');await d.rpc('Page.addScriptToEvaluateOnNewDocument',{source:`Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage denied','SecurityError');}});`});await d.rpc('Page.navigate',{url:appUrl});await d.wait(`document.body.innerText.includes('一人開始體驗')`);await d.click('一人開始體驗');await d.wait(`!!document.querySelector('.dice-button')`);await d.click('擲骰子');await d.wait(`!!document.querySelector('.event-dialog[open]')`);
   assert.equal(errors.length,0,errors.join('\n'));await mkdir('artifacts',{recursive:true});await writeFile('artifacts/phase-a-isolation.json',JSON.stringify({independentBrowserProcesses:2,sameProfileTabKeysDifferent:aKey!==cKey,visitorAUnchanged:true,visitorB:{players:bAfter.players.length,round:bAfter.round,position:bAfter.players[0].position},visitorC:{players:cAfter.players.length,playerIndex:cAfter.currentPlayerIndex,position:cAfter.players[0].position},unknownMapPreserved:true,storageDeniedStillPlayable:true,gameDataRequests:0,gameWebSockets:0},null,2));
   console.log('PASS: two independent browser processes plus same-profile tabs; independent state/save slots; reload isolation; solo and four-player play; unknown map preserved; denied storage remains playable; no game data requests or WebSockets.');
 }else if(process.argv.includes('--mobile-layout')){
   const desktop=await evaluate(`(()=>{const r=document.querySelector('.turn-panel').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};})()`);
   assert.ok(desktop.x>720&&desktop.y>750,'desktop roll control keeps its existing location');
   const sizes=[[320,740],[390,844],[430,932],[768,1024]];
   for(const [width,height]of sizes){
     await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await delay(350);
     const layout=await evaluate(`(()=>{const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};const button=document.querySelector('.dice-button'),r=button.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{panel:rect('.turn-panel'),roll:rect('.dice-button'),camera:rect('.camera-modes'),quality:rect('.quality-control'),scene:rect('.scene-city'),clickable:!!hit?.closest('.dice-button'),pageWidth:document.documentElement.scrollWidth};})()`);
     assert.ok(layout.panel.left>=10&&layout.panel.right<=width/2+12,'roll control is in the left half: '+JSON.stringify({width,layout}));
     assert.ok(Math.abs(layout.panel.left-layout.camera.left)<=1,'roll panel aligns with camera controls: '+JSON.stringify({width,layout}));
     assert.ok(Math.abs(layout.panel.width-layout.camera.width)<=1,'roll panel matches camera control width: '+JSON.stringify({width,layout}));
     assert.ok(layout.panel.top>=layout.scene.top+layout.scene.height*.5,'roll control is in the lower city area');
     assert.ok(layout.panel.bottom+4<=layout.camera.top,'roll control does not overlap camera buttons');
     assert.ok(layout.panel.right<layout.quality.left,'roll control does not overlap quality settings');
     assert.ok(layout.roll.height>=44,'touch target is at least 44px high');assert.ok(layout.clickable,'roll button receives a real tap');
     assert.ok(layout.pageWidth<=width,'mobile layout does not overflow horizontally');
     await screenshot('mobile-roll-'+width);
   }
   await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(200);
   for(let index=0;index<5;index++){
     const point=await evaluate(`(()=>{const pins=document.querySelectorAll('.island-center-pins button,.city-map-50 g[role="button"][aria-label]'),pin=pins[${index}];if(!pin)return{missing:true,count:pins.length};const r=pin.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
     assert.ok(!point.missing,'center pins are rendered: '+JSON.stringify(point));
     await evaluate(`(()=>{const pins=document.querySelectorAll('.island-center-pins button,.city-map-50 g[role="button"][aria-label]');pins[${index}].dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:${point.x},clientY:${point.y}}));})()`);
     for(let attempt=0;attempt<20&&!await evaluate(`!!document.querySelector('.center-education')`);attempt++)await delay(50);
     const placement=await evaluate(`(()=>{const r=document.querySelector('.center-education').getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,containsClick:r.left<=${point.x}&&r.right>=${point.x}&&r.top<=${point.y}&&r.bottom>=${point.y},withinViewport:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};})()`);
     assert.ok(placement.containsClick&&placement.withinViewport,'center education opens at clicked center and stays in the viewport: '+JSON.stringify({index,point,placement}));
     await evaluate(`document.querySelector('.center-education .center-close').click()`);await delay(50);
   }
   const point=await evaluate(`(()=>{const r=document.querySelector('.dice-button').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
   await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
   assert.equal(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.phase`),'ROLLING');
   assert.ok(await evaluate(`document.querySelector('.dice-button').disabled`));
   for(let i=0;i<40;i++){if(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.phase==='MOVING'`))break;await delay(100);}
   await click('跳過動畫');
   assert.ok(await evaluate(`(()=>{const s=JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state;return s.players[0].position===s.diceValue;})()`));
   await evaluate(`document.querySelector('.event-dialog .choice-button,.event-dialog .event-confirm').click()`);await delay(100);await click('交給下一位');
   assert.ok(await evaluate(`!document.querySelector('.dice-button').disabled`));
   await click('切換城市探索');assert.ok(await evaluate(`document.querySelector('.dice-button').disabled`));
   assert.equal(errors.length,0,errors.join('\n'));assert.deepEqual(failedRequests,[]);
   console.log('PASS: roll panel at mobile lower-left on 320/390/430/768px; desktop unchanged; no control overlaps; 44px touch target; real tap rolls; repeat lock, skip animation, next turn and exploration work.');
 }else{
 const unchanged=await evaluate(`localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))`);
 for(let i=0;i<5;i++){
   await evaluate(`document.querySelectorAll('.island-center-pins>button')[${i}].click()`);await delay(100);
   assert.ok(await evaluate(`document.querySelector('.center-education').innerText.includes('遊戲場景主題')`));
   await evaluate(`document.querySelector('[aria-label="關閉中心介紹並返回城市"]').click()`);await delay(50);
 }
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('lohas-city-preferences-v1')).state.explored.length`),5);
 assert.equal(await evaluate(`localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))`),unchanged,'building exploration never changes game');
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
 await click('儲存進度');await click('擲骰子');
 for(let i=0;i<40;i++){if(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.phase==='MOVING'`))break;await delay(100);}
 await click('跳過動畫');
 // Events have multiple outcomes; wait on persisted authoritative phase instead of a particular card.
 for(let i=0;i<100;i++){if(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.phase==='EVENT'`))break;await delay(100);}
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.phase`),'EVENT');
 assert.ok(await evaluate(`(()=>{const s=JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state;return s.players[0].position===s.diceValue;})()`),'skip animation retains rolled destination');
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.players[0].money`),10000,'skip does not apply event early');
 await screenshot('desktop-event');
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(500);
 await screenshot('mobile-event');
 await evaluate(`(()=>{const b=document.querySelector('.event-dialog .choice-button,.event-dialog .event-confirm');if(b)b.click();})()`);await delay(100);
 await click('交給下一位');await click('讀取存檔');
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.currentPlayerIndex`),0);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.players[0].position`),0);
 await click('切換城市探索');
 assert.ok(await evaluate(`document.querySelector('.dice-button').disabled`),'exploration pauses roll');
 await measure('mobile viewport 390x844 (desktop Chrome)','low');
 await delay(900);await screenshot('mobile-city');await click('返回遊戲模式');
 const graphics=await evaluate(`(()=>{const c=document.querySelector('.island-render canvas'),gl=c.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {vendor:ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):gl.getParameter(gl.VENDOR),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};})()`);
 await writeFile('artifacts/performance.json',JSON.stringify({environment:await evaluate('navigator.userAgent'),graphics,note:'Headless desktop Chrome; mobile viewport is not physical mobile hardware. Three samples per configuration; no FPS target assertion.',results:performanceResults},null,2));
 // Return to setup in this isolated profile, retaining the separate learning record.
 await evaluate(`localStorage.removeItem(sessionStorage.getItem('lohas-auto-save-key'));location.reload()`);await waitFor('開始人生旅程');
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
 const oldRaw=await evaluate(`(()=>{const s=JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state;s.players[0].position=39;s.currentPlayerIndex=0;s.phase='WAITING_ROLL';s.selectedEvent=null;s.eventResultText=null;const raw=JSON.stringify({version:1,state:s});localStorage.setItem('long-care-game-save-v1',raw);localStorage.removeItem(sessionStorage.getItem('lohas-auto-save-key'));return raw;})()`);
 await evaluate('location.reload()');await waitFor('已將舊進度轉為獨立體驗版本');
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.players[0].position`),47);
 assert.equal(await evaluate(`localStorage.getItem('long-care-game-save-v1-backup-before-50')`),oldRaw);
 await click('知道了');
 await evaluate(`(()=>{const v=JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key')));v.state.players[0].position=48;v.state.diceValue=4;v.state.phase='MOVING';localStorage.setItem(sessionStorage.getItem('lohas-auto-save-key'),JSON.stringify(v));location.reload();})()`);
 for(let i=0;i<80;i++){if(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.phase==='EVENT'`))break;await delay(100);}
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.players[0].position`),2);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.players[0].money`),11000);
 await evaluate(`(()=>{const v=JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key')));v.state.players[0].position=6;v.state.diceValue=2;v.state.phase='MOVING';v.state.selectedEvent=null;v.state.eventResultText=null;localStorage.setItem(sessionStorage.getItem('lohas-auto-save-key'),JSON.stringify(v));location.reload();})()`);
 await waitFor('知識機會卡');
 const beforeKnowledge=await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.players[0]`);
 await evaluate(`document.querySelector('.event-dialog .choice-button').click()`);await delay(100);
 const afterKnowledge=await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.players[0]`);
 for(const key of ['money','health','stress','position'])assert.equal(afterKnowledge[key],beforeKnowledge[key],'knowledge card retains '+key);
 // Simulate unavailable WebGL at startup, without changing product code or using a test-only product flag.
 await call('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'||type==='webgl2'?null:original.call(this,type,...args);};})()`});
 await evaluate(`localStorage.removeItem(sessionStorage.getItem('lohas-auto-save-key'));localStorage.removeItem('long-care-game-save-v1');location.reload()`);await waitFor('開始人生旅程');await click('先逛逛照顧城市');await waitFor('WebGL 不可用');
 assert.equal(await evaluate(`document.querySelectorAll('.city-map-50 [data-tile-id]').length`),50);
 await evaluate(`document.querySelector('.city-map-50 [aria-label="大和日照中心"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))`);await waitFor('健康管理與生活照顧');
 await screenshot('mobile-2d-fallback');
 await evaluate(`document.querySelector('[aria-label="關閉中心介紹並返回城市"]').click()`);await delay(100);await screenshot('mobile-2d-overview');await click('開始 2–4 人旅程');await click('開始人生旅程');await click('擲骰子');
 for(let i=0;i<80;i++){if(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.phase==='EVENT'`))break;await delay(100);}
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem(sessionStorage.getItem('lohas-auto-save-key'))).state.phase`),'EVENT','2D fallback is playable');
 assert.equal(errors.length,0,errors.join('\n'));
 assert.deepEqual(failedRequests,[],`no missing deployment assets at ${testBase}`);
 console.log('PASS: 50 stops, four players, five courtyard interactions and isolation, all camera modes, three quality levels, skip animation, wrap recovery, legacy backup/migration, training and manual saves, desktop/mobile layouts, playable no-WebGL fallback. Performance samples: artifacts/performance.json.');
 }
}finally{for(const ws of extraSockets)ws.close();for(const process of extraBrowsers)process.kill();socket?.close();chrome.kill();await new Promise(r=>server.close(r));}
