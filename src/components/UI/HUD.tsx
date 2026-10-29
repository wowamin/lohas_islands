import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Dices, Footprints, Heart, Brain, Save, RotateCcw, Flag } from 'lucide-react';
import { useGameStore } from '../../game/store/useGameStore';
import { missionSummary } from '../../game/resources';
import { BOARD_DATA } from '../../game/board';

const TONES=['#84a36c','#d59184','#76a9bb','#ac8cba'];
export const HUD=({boardView}:{boardView:'board'|'3d'})=>{
  const players=useGameStore(s=>s.players),currentIndex=useGameStore(s=>s.currentPlayerIndex),round=useGameStore(s=>s.round),phase=useGameStore(s=>s.phase),diceValue=useGameStore(s=>s.diceValue);
  const roll=useGameStore(s=>s.rollDice),move=useGameStore(s=>s.movePlayer),reset=useGameStore(s=>s.resetGame);
  const [message,setMessage]=useState('');
  const [missions,setMissions]=useState(false);
  const p=players[currentIndex];if(!p)return null;
  const tile=BOARD_DATA[p.position];
  const save=async()=>{try{const {storage,name,version}=useGameStore.persist.getOptions();if(!storage||!name)throw new Error('storage');await storage.setItem(name,{state:useGameStore.getState(),version});setMessage('進度已儲存於此裝置');}catch{setMessage('無法儲存，請確認瀏覽器允許本機儲存。');}};
  return <div className="hud-layer journey-hud">
    <header className="hud-header"><div className="brand-lockup"><span className="group-mark">樂</span><span><strong>樂活長照集團</strong><small>ALL AGES CARE GROUP</small><em>陪你走更安心的每一天</em></span></div></header>
    <div className="journey-title"><h1>長照人生旅程 <small>2.0</small></h1><p>走進日常，認識長照，發現更安心的未來</p></div>
    <aside className="player-panel" aria-label="玩家狀態"><div className="player-list">{players.map((player,i)=><article key={player.id} className={'player-card'+(i===currentIndex?' is-current':'')} style={{'--avatar-color':TONES[i]} as CSSProperties}>
      <Avatar index={i}/><div><strong>{player.name}</strong><b>$ {player.money.toLocaleString()}</b><div className="quick-stats"><span aria-label={'健康 '+player.health}><Heart size={13} fill="#dc9887"/> {player.health}</span><span aria-label={'壓力 '+player.stress}><Brain size={13}/> {player.stress}</span></div></div>{i===currentIndex&&<i className="current-turn-dot" title="目前回合"/>}
    </article>)}</div></aside>
    <aside className="journey-footer"><span className="location-illustration" aria-hidden="true">⌂</span><div><small>目前位置 · 第 {p.position+1} / 40 格</small><strong>{tile.name}</strong><p>走進社區、完成事件，<br/>找到照顧自己與家人的支持。</p></div></aside>
    <aside className="journey-message"><span className="message-pill">照顧旅程 · 第 {round} / 12 輪</span><h2>每一段路，都有人同行。</h2><p>{phase==='MOVING'?'擲骰完成，準備走向下一段生活。':'擲骰前進，在生活裡認識長照服務。'}</p><small>{boardView==='3d'?'拖曳旋轉、滾輪縮放；點建築探索。':'點選站點，可先認識相關資源。'}</small></aside>
    <aside className="turn-panel" aria-label="回合操作"><div className={'illustrated-dice'+(phase==='ROLLING'?' dice-spinning':'')} aria-live="polite"><DiceFace value={diceValue}/></div>
      <button className="primary-button dice-button" disabled={phase==='ROLLING'||phase==='EVENT'} onClick={phase==='MOVING'?move:roll}>{phase==='MOVING'?<Footprints size={20}/>:<Dices size={20}/>} {phase==='ROLLING'?'擲骰中…':phase==='MOVING'?'前進 '+diceValue+' 格':'擲骰子'}</button><p>目前是 <strong>{p.name}</strong> 的回合</p>
    </aside>
    <aside className="journey-actions"><button onClick={()=>setMissions(!missions)} aria-expanded={missions}><Flag size={17}/>照顧任務</button><button onClick={save}><Save size={17}/>儲存進度</button><button onClick={()=>{if(window.confirm('重新開始會取代目前進度，確定重新開始嗎？'))reset();}}><RotateCcw size={17}/>重新開始</button></aside>
    {missions&&<aside className="mission-panel"><button className="detail-close" aria-label="關閉照顧任務" onClick={()=>setMissions(false)}>×</button><h2>{p.name} 的照顧任務</h2><ul>{missionSummary(p.learnedServices,p.health,p.stress,p.completedActivities).map(m=><li key={m.label}><span>{m.done?'✓':'○'}</span><div><strong>{m.label}</strong><small>{m.detail}</small></div></li>)}</ul></aside>}
    {message&&<div className="save-toast" role="status">{message}<button aria-label="關閉儲存訊息" onClick={()=>setMessage('')}>×</button></div>}
  </div>;
};
function DiceFace({value}:{value:number}){
  const dots:Record<number,number[][]>={1:[[32,32]],2:[[18,18],[46,46]],3:[[18,18],[32,32],[46,46]],4:[[18,18],[46,18],[18,46],[46,46]],5:[[18,18],[46,18],[32,32],[18,46],[46,46]],6:[[18,16],[46,16],[18,32],[46,32],[18,48],[46,48]]};
  return <svg viewBox="0 0 80 90" role="img" aria-label={'骰子 '+value+' 點'}><path d="M10 12L60 4L76 20V73L24 85L8 67Z" fill="#dce0c6"/><path d="M10 12L25 29L76 20L60 4Z" fill="#f6f5df"/><path d="M10 12L25 29V84L8 67Z" fill="#c9ceb5"/><g transform="translate(26 27) scale(.65)">{(dots[value]??dots[1]).map(([x,y],i)=><circle key={i} cx={x} cy={y} r="5" fill="#64765e"/>)}</g><ellipse cx="35" cy="15" rx="5" ry="3" fill="#74836a"/></svg>;
}
function Avatar({index}:{index:number}){
 const hair=['#826249','#c98275','#6c6256','#83678a'][index];
 return <svg className="journey-avatar" viewBox="0 0 64 72" aria-hidden="true"><rect width="64" height="72" rx="15" fill="#e7ead5"/><path d="M8 73V61Q12 48 32 48Q52 48 56 61V73" fill={TONES[index]}/><path d="M27 47V56L32 59L37 56V47" fill="#edc39e"/><ellipse cx="32" cy="30" rx="23" ry="25" fill={hair}/><ellipse cx="32" cy="34" rx="19" ry="21" fill="#f0cba8"/><path d="M12 31Q11 6 34 9Q54 8 53 31Q43 27 37 17Q27 30 12 31" fill={hair}/><circle cx="24" cy="35" r="2.1" fill="#4c5650"/><circle cx="40" cy="35" r="2.1" fill="#4c5650"/><ellipse cx="20" cy="41" rx="4" ry="2" fill="#dfa18e" opacity=".65"/><ellipse cx="44" cy="41" rx="4" ry="2" fill="#dfa18e" opacity=".65"/><path d="M28 44Q32 48 36 44" fill="none" stroke="#a47464" strokeWidth="1.7" strokeLinecap="round"/>{index===2&&<><path d="M10 25Q9 5 32 5Q55 5 54 25Z" fill="#6095ae"/><path d="M9 24Q32 16 56 24L54 29Q32 22 10 29Z" fill="#527e96"/><path d="M18 35a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M34 35a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M32 34H34" fill="none" stroke="#667777" strokeWidth="1.3"/></>}</svg>;
}
