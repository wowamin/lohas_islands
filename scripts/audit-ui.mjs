import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
const url=process.env.LOHAS_AUDIT_URL??'https://wowamin.github.io/lohas_islands/';
const output=resolve('artifacts/ui-review');await mkdir(output,{recursive:true});
const profile=await mkdtemp(resolve(tmpdir(),'lohas-ui-review-'));
const chrome=spawn(process.env.CHROME_PATH??'C:/Program Files/Google/Chrome/Application/chrome.exe',[
 '--headless=new','--remote-debugging-port=9345','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','about:blank',
],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let socket,sequence=0;const pending=new Map(),errors=[],failed=[],screens=[];
try{
 let tabs;for(let n=0;n<80;n++){try{tabs=await(await fetch('http://127.0.0.1:9345/json')).json();break;}catch{await delay(100);}}
 if(!tabs)throw Error('Chrome unavailable');socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);if(m.method==='Network.responseReceived'&&m.params.response.status>=400)failed.push({url:m.params.response.url,status:m.params.response.status});};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??'evaluate');return r.result.value;};
 const wait=async expression=>{for(let n=0;n<200;n++){if(await evaluate(expression))return;await delay(100);}throw Error('Timeout '+expression);};
 const click=async label=>{const ok=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>(b.textContent.includes(${JSON.stringify(label)})||b.getAttribute('aria-label')===${JSON.stringify(label)})&&!b.disabled&&b.getClientRects().length);if(!b)return false;b.click();return true;})()`);if(!ok)throw Error('Missing button '+label);await delay(180);};
 const viewport=async(width,height)=>{await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});await evaluate('window.scrollTo(0,0)');await delay(350);};
 async function capture(name){
   await delay(180);
   const info=await evaluate(`(()=>{
     const selectors=['.player-panel','.player-card','.center-education button','.result-card','.score-total strong','.score-rule','.setup-card','.setup-subtitle','.setup-rules','.setup-actions button','.setup-explore button','.name-row input','.journey-title h1','.journey-title p','.brand-lockup strong','.brand-lockup em','.online-count','.city-toolbar','.city-toolbar-actions','.city-toolbar button','.island-center-pins button','.island-stations button','.education-launch','.education-launch button','.education-launch small','.city-performance','.camera-modes button','.island-zoom button','.player-card strong','.player-card b','.quick-stats','.turn-panel','.dice-button','.skip-animation','.journey-actions button','.journey-footer','.journey-message','.journey-message p','.disclaimer','.event-dialog','.event-description','.choice-button','.effect-chip','.simulation-note','.continue-button','.learn-shell','.learn-header','.learn-header h1','.learn-header p','.learn-close','.learn-tabs','.learn-tabs button','.learn-content','.lesson p','.source-note','.quiz-options button','.flow-options button','.learn-footer','.resource-dialog','.resource-header','.resource-details p','.resource-details li','.resource-tabs button','.resource-header button','.center-education','.center-education p','.center-education small','.center-close','.dice-preferences','.dice-preferences label'];
     const measured={};
     for(const selector of selectors){const nodes=[...document.querySelectorAll(selector)].filter(e=>getComputedStyle(e).display!=='none'&&e.getClientRects().length);if(!nodes.length)continue;measured[selector]=nodes.slice(0,12).map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();let p=e,bg='';while(p){const b=getComputedStyle(p).backgroundColor;if(b!=='rgba(0, 0, 0, 0)'&&b!=='transparent'){bg=b;break;}p=p.parentElement;}return{text:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,100),font:parseFloat(s.fontSize),lineHeight:s.lineHeight,weight:s.fontWeight,color:s.color,background:s.backgroundColor,nearestBackground:bg,rect:{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom},overflow:s.overflow,position:s.position,hit:(()=>{const h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h?{covered:!(e.contains(h)||h.contains(e)),tag:h.tagName,className:typeof h.className==='string'?h.className:'svg'}:null;})()};});}
     const dialog=document.querySelector('dialog[open],[role="dialog"]'),scope=dialog??document;
     const smallTargets=[...scope.querySelectorAll('button,input,select,summary,a')].filter(e=>!e.closest('[inert]')&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect();return{text:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,55),width:r.width,height:r.height,x:r.x,y:r.y};}).filter(r=>r.x>=0&&r.y>=0&&r.x<innerWidth&&r.y<innerHeight&&(r.width<48||r.height<48)).slice(0,100);
     return {width:innerWidth,height:innerHeight,pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,scrollY,dialog:dialog?.className??null,measured,smallTargets,assets:[...document.querySelectorAll('script[src],link[rel="stylesheet"]')].map(e=>e.src||e.href)};
   })()`);
   const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(resolve(output,name+'.png'),Buffer.from(shot.data,'base64'));screens.push({name,...info});console.log('Captured',name,info.width+'x'+info.height,'pageWidth='+info.pageWidth);
 }
 await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await viewport(1440,900);await call('Page.navigate',{url});await wait(`!!document.querySelector('.setup-card')`);await delay(1800);
 if(process.argv.includes('--details')){
   await click('增加玩家');await click('增加玩家');await click('開始人生旅程');await wait(`!!document.querySelector('.island-render canvas')`);await delay(700);
   await viewport(390,844);await evaluate(`document.querySelector('.island-center-pins button').click()`);await delay(400);await capture('25-mobile-center-hit-test');await click('關閉中心介紹並返回城市');
   await viewport(768,1024);await capture('26-tablet-player-hit-test');
   await import('./register-ts.mjs');const {ALL_GAME_EVENTS}=await import('../src/game/eventRegistry.ts');const choice=ALL_GAME_EVENTS.find(e=>e.options?.length>=2);
   async function fixture(patch){await evaluate(`(()=>{const key=sessionStorage.getItem('lohas-auto-save-key'),saved=JSON.parse(localStorage.getItem(key));Object.assign(saved.state,${JSON.stringify(patch)});saved.state.revision++;localStorage.setItem(key,JSON.stringify(saved));location.reload();})()`);await delay(650);}
   await viewport(390,844);await fixture({phase:'EVENT',selectedEvent:{id:choice.id},eventResultText:null,eventOutcome:null});await wait(`!!document.querySelector('.event-dialog .choice-button')`);await capture('27-mobile-event-choice');await evaluate(`document.querySelector('.event-dialog .choice-button').click()`);await capture('28-mobile-event-choice-result');
   await fixture({phase:'RESULT',selectedEvent:null,eventResultText:null,eventOutcome:null,round:12});await wait(`!!document.querySelector('.result-card')`);await viewport(1440,900);await capture('29-desktop-final-results');await viewport(390,844);await capture('30-mobile-final-results');
   await fixture({phase:'EVENT',selectedEvent:{id:choice.id},eventResultText:null,eventOutcome:null});await wait(`!!document.querySelector('.event-dialog .choice-button')`);await evaluate(`document.documentElement.style.fontSize='200%'`);await capture('31-mobile-event-enlarged-text');
 }else{
 await capture('01-desktop-setup');await viewport(390,844);await capture('02-mobile-setup');await evaluate('window.scrollTo(0,document.documentElement.scrollHeight)');await capture('03-mobile-setup-bottom');
 await viewport(320,740);await capture('04-small-mobile-setup');await viewport(1440,900);await click('增加玩家');await click('增加玩家');await click('開始人生旅程');await wait(`!!document.querySelector('.island-render canvas')`);await delay(900);await capture('05-desktop-game');
 await viewport(1366,768);await capture('06-laptop-game');await viewport(390,844);await capture('07-mobile-game');await evaluate('window.scrollTo(0,document.documentElement.scrollHeight)');await capture('08-mobile-game-bottom');await viewport(320,740);await capture('09-small-mobile-game');await viewport(768,1024);await capture('10-tablet-game');
 await viewport(390,844);await click('白天');await delay(900);await capture('11-mobile-night');await click('夜晚');await delay(600);
 if(await evaluate(`!!document.querySelector('.city-toolbar-toggle')`)){await click('收合城市工具列');await capture('12-mobile-toolbar-collapsed');await click('展開城市工具列');}
 await click('長照知識圖鑑');await capture('13-mobile-learning');await click('四包錢試算');await capture('14-mobile-calculator');await click('服務碼');await capture('15-mobile-services');
 await click('關閉學習中心');await click('A 個管新進訓練');await capture('16-mobile-training');await click('關閉學習中心');
 await evaluate(`document.querySelector('.island-center-pins button').click()`);await delay(500);await capture('17-mobile-center-info');await click('日照資源介紹');await capture('18-mobile-resource-handbook');await click('關閉資源手冊');await click('關閉中心介紹並返回城市');
 await click('動畫與音效');await capture('19-mobile-dice-settings');await click('關閉動畫與音效設定');
 await evaluate(`document.querySelector('.dice-button').click()`);await wait(`!!document.querySelector('.event-dialog[open]')`);await capture('20-mobile-event-before');
 await evaluate(`document.querySelector('.event-dialog .choice-button,.event-dialog .event-confirm')?.click()`);await capture('21-mobile-event-after');await click('交給下一位');
 await viewport(1440,900);await click('長照知識圖鑑');await capture('22-desktop-learning');await click('關閉學習中心');
 await call('Emulation.setDeviceMetricsOverride',{width:720,height:450,deviceScaleFactor:1,mobile:false});await evaluate(`document.documentElement.style.fontSize='200%'`);await capture('23-enlarged-text-layout');await evaluate(`document.documentElement.style.fontSize='16px'`);
 await viewport(390,844);await call('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'||type==='webgl2'?null:original.call(this,type,...args);};})()`});await call('Page.reload');await wait(`!!document.querySelector('.city-map-50')`);await capture('24-mobile-2d-fallback');
 }
 await writeFile(resolve(output,process.argv.includes('--details')?'detail-measurements.json':'measurements.json'),JSON.stringify({url,capturedAt:new Date().toISOString(),note:'Live site in isolated headless desktop Chrome, mobile viewport emulation; no production source or user saves changed. Detail event/result screens use this isolated profile local-save fixtures. 200% root text test is not a full browser/assistive-technology audit.',screens,errors,failed},null,2));
 console.log('UI review complete:',screens.length,'screens; runtime errors:',errors.length,'failed responses:',failed.length);
}finally{socket?.close();chrome.kill();}
