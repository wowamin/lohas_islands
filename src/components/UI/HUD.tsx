import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Dices, Footprints, Heart, Brain, Save, RotateCcw, Flag } from 'lucide-react';
import { useGameStore } from '../../game/store/useGameStore';
import { missionSummary } from '../../game/resources';
import { BOARD_DATA, BOARD_SIZE } from '../../game/board';
import { useJourney } from '../../game/journey';
import { saveSnapshot, loadSnapshot } from '../../game/save';
import { useDicePresentation } from '../../game/dice/presentation';
import { gameFeedback } from '../../game/dice/feedback';
import { DicePreferences } from './DicePreferences';
import { CharacterPortrait } from '../Characters/CharacterPortrait';
import { resolveCharacter } from '../../game/characters';

const TONES=['#84a36c','#d59184','#76a9bb','#ac8cba'];
export const HUD=({boardView,exploring=false}:{boardView:'board'|'3d';exploring?:boolean})=>{
  const players=useGameStore(s=>s.players),currentIndex=useGameStore(s=>s.currentPlayerIndex),round=useGameStore(s=>s.round),phase=useGameStore(s=>s.phase),diceValue=useGameStore(s=>s.diceValue);
  const roll=useGameStore(s=>s.rollDice),reset=useGameStore(s=>s.resetGame);
  const follow=useJourney(s=>s.follow),toggleFollow=useJourney(s=>s.toggleFollow);
  const visual=useJourney(s=>s.position),movingPlayer=useJourney(s=>s.playerId),skip=useJourney(s=>s.skip);
  const [message,setMessage]=useState('');
  const [missions,setMissions]=useState(false);
  const dicePhase=useDicePresentation(s=>s.phase),diceMode=useDicePresentation(s=>s.mode),skipDice=useDicePresentation(s=>s.skip);
  const p=players[currentIndex];if(!p)return null;
  const position=movingPlayer===p.id&&visual!==null?visual:p.position;
  const tile=BOARD_DATA[position];
  const rollLabel=exploring?'探索中 · 回合暫停':dicePhase==='revealing'?'擲出 '+diceValue+' 點':phase==='ROLLING'?'擲骰中…':phase==='MOVING'?'前進 '+diceValue+' 格…':'擲骰子';
  const compactRollLabel=exploring?'探索暫停':phase==='MOVING'?'前進中':rollLabel;
  const save=async()=>{try{await saveSnapshot();setMessage('已建立手動存檔，可用「讀取存檔」恢復。');}catch{setMessage('目前無法儲存；請等回合完成並確認瀏覽器儲存權限。');}};
  return <div className="hud-layer journey-hud">
    <header className="hud-header"><div className="brand-lockup"><span className="group-mark">樂</span><span><strong>樂活長照集團</strong><small>ALL AGES CARE GROUP</small><em>陪你走更安心的每一天</em></span></div></header>
    <div className="journey-title"><h1>長照人生旅程 <small>3.0</small></h1><p>走進日常，認識長照，發現更安心的未來</p></div>
    <aside className="player-panel" aria-label="玩家狀態"><div className="player-list">{players.map((player,i)=><article key={player.id} className={'player-card'+(i===currentIndex?' is-current':'')} style={{'--avatar-color':TONES[i]} as CSSProperties}>
      <CharacterPortrait className="journey-avatar" characterId={resolveCharacter(player.characterId,player.id)} data-character-id={resolveCharacter(player.characterId,player.id)} color={player.color} aria-hidden="true"/><div><strong>{player.name}</strong><b>$ {player.money.toLocaleString()}</b><div className="quick-stats"><span aria-label={'健康 '+player.health}><Heart size={13} fill="#dc9887"/> {player.health}</span><span aria-label={'壓力 '+player.stress}><Brain size={13}/> {player.stress}</span></div></div>{i===currentIndex&&<i className="current-turn-dot" title="目前回合"/>}
    </article>)}</div></aside>
    <aside className="journey-footer"><span className="location-illustration" aria-hidden="true">⌂</span><div><small>目前位置 · 第 {position+1} / {BOARD_SIZE} 格</small><strong>{tile.name}</strong><p>{tile.role} · 五區庭院旅程<br/>主題為遊戲設計，實際服務請另確認。</p></div></aside>
    <aside className="journey-message"><span className="message-pill">照顧旅程 · 第 {round} / 12 輪</span><h2>每一段路，都有人同行。</h2><p>{phase==='MOVING'?'擲骰完成，準備走向下一段生活。':'擲骰前進，在生活裡認識長照服務。'}</p><small>{boardView==='3d'?'拖曳旋轉、滾輪縮放；點建築探索。':'點選站點，可先認識相關資源。'}</small></aside>
    <aside className="turn-panel" aria-label="回合操作" data-dice-phase={dicePhase} data-dice-motion={diceMode}><div className={'illustrated-dice'+(dicePhase==='rolling'&&diceMode!=='reduced'?' dice-spinning':'')}><DiceFace value={diceValue} hiddenResult={dicePhase==='rolling'}/></div>
      <button className="primary-button dice-button" aria-label={rollLabel} disabled={phase!=='WAITING_ROLL'||exploring} onClick={()=>{if(useGameStore.getState().phase!=='WAITING_ROLL'||exploring)return;const unlocked=gameFeedback.unlock();roll();const revision=useGameStore.getState().revision;void unlocked.then(()=>{const state=useGameStore.getState();if(state.phase==='ROLLING'&&state.revision===revision)gameFeedback.click();});}}>{phase==='MOVING'?<Footprints size={20}/>:<Dices size={20}/>}<span className="dice-label-full">{rollLabel}</span><span className="dice-label-compact">{compactRollLabel}</span></button><p><span className="turn-player-label" title={p.name+' 的回合'}>目前是 <strong>{p.name}</strong> 的回合</span>{(phase==='ROLLING'||phase==='MOVING')&&<button className="skip-animation" onClick={()=>{if(dicePhase==='rolling'||dicePhase==='revealing')skipDice();else skip();}}>跳過動畫 →</button>}</p>
    </aside>
    <aside className="journey-actions"><button onClick={()=>setMissions(!missions)} aria-expanded={missions}><Flag size={17}/>照顧任務</button><button disabled={phase!=='WAITING_ROLL'} onClick={save}><Save size={17}/>儲存進度</button><button disabled={phase!=='WAITING_ROLL'} onClick={async()=>{try{await loadSnapshot();setMessage('已恢復手動存檔。');}catch{setMessage('找不到有效手動存檔，請先儲存。');}}}>↶ 讀取存檔</button><button aria-pressed={follow} onClick={toggleFollow}>⌖ {follow?'自動追蹤開':'自動追蹤關'}</button><button onClick={()=>{if(window.confirm('重新開始會取代目前進度，確定重新開始嗎？'))reset();}}><RotateCcw size={17}/>重新開始</button><DicePreferences/></aside>
    {missions&&<aside className="mission-panel"><button className="detail-close" aria-label="關閉照顧任務" onClick={()=>setMissions(false)}>×</button><h2>{p.name} 的照顧任務</h2><ul>{missionSummary(p.learnedServices,p.health,p.stress,p.completedActivities).map(m=><li key={m.label}><span>{m.done?'✓':'○'}</span><div><strong>{m.label}</strong><small>{m.detail}</small></div></li>)}</ul></aside>}
    {message&&<div className="save-toast" role="status">{message}<button aria-label="關閉儲存訊息" onClick={()=>setMessage('')}>×</button></div>}
  </div>;
};
function DiceFace({value,hiddenResult=false}:{value:number;hiddenResult?:boolean}){
 const patterns:Record<number,number[][]>={1:[[50,50]],2:[[34,34],[66,66]],3:[[34,34],[50,50],[66,66]],4:[[34,34],[66,34],[34,66],[66,66]],5:[[34,34],[66,34],[50,50],[34,66],[66,66]],6:[[34,30],[66,30],[34,50],[66,50],[34,70],[66,70]]};
 return <svg viewBox="0 0 100 105" role="img" aria-label={hiddenResult?'骰子翻滾中':'骰子 '+value+' 點'}><rect x="15" y="17" width="76" height="80" rx="17" fill="#a5b397"/><rect x="9" y="7" width="82" height="84" rx="17" fill="#fff3dc" stroke="#6a806c" strokeWidth="2"/>{(patterns[value]??patterns[1]).map(([x,y],i)=><circle key={i} cx={x} cy={y} r="5.5" fill="#31594f"/>)}</svg>;
}
