import { useRef } from 'react';
import { useDiceSettings, reducedMotion } from '../../game/dice/settings';
import { useGameStore } from '../../game/store/useGameStore';
import { gameFeedback } from '../../game/dice/feedback';
export function DicePreferences(){
  const dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement>(null);
  const muted=useDiceSettings(s=>s.muted),vibration=useDiceSettings(s=>s.vibration),speed=useDiceSettings(s=>s.speed);
  const phase=useGameStore(s=>s.phase),busy=phase==='ROLLING'||phase==='MOVING';
  const vibrationAvailable=typeof navigator!=='undefined'&&typeof navigator.vibrate==='function';
  return <>
    <button ref={opener} onClick={()=>dialog.current?.showModal()}>⚙ 動畫與音效</button>
    <dialog ref={dialog} className="senior-ui senior-dialog dice-preferences" aria-labelledby="dice-preferences-title" onClose={()=>opener.current?.focus()} onKeyDown={event=>{
      if(event.key!=='Tab')return;
      const nodes=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)')].filter(n=>!n.closest('fieldset[disabled]'));
      const first=nodes[0],last=nodes.at(-1);if(!first||!last)return;
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }}>
      <header className="senior-dialog-header"><h2 id="dice-preferences-title" className="senior-text-value">動畫與音效</h2><button type="button" className="senior-btn-secondary" autoFocus onClick={()=>dialog.current?.close()} aria-label="關閉動畫與音效設定">關閉</button></header>
      <div className="senior-dialog-body senior-stack">
        <label><input type="checkbox" checked={!muted} onChange={e=>{useDiceSettings.getState().setMuted(!e.target.checked);if(e.target.checked)gameFeedback.unlock();}}/>播放柔和音效</label>
        <label><input type="checkbox" checked={vibration} disabled={!vibrationAvailable} onChange={e=>useDiceSettings.getState().setVibration(e.target.checked)}/>啟用輕微震動（選用）</label>
        {!vibrationAvailable&&<p className="senior-text-small">此瀏覽器未提供震動功能。</p>}
        <fieldset disabled={busy}><legend>動畫速度</legend>
          <label><input type="radio" name="dice-speed" checked={speed==='standard'} onChange={()=>useDiceSettings.getState().setSpeed('standard')}/>標準：1.6 秒</label>
          <label><input type="radio" name="dice-speed" checked={speed==='quick'} onChange={()=>useDiceSettings.getState().setSpeed('quick')}/>快速：0.45 秒</label>
        </fieldset>
        {busy&&<p className="senior-text-small">本次移動結束後可調整速度。</p>}
        <p className="senior-text-small">{reducedMotion()?'已依系統設定減少動態：只揭曉點數，關閉翻滾、粒子與震動。':'啟用系統「減少動態效果」時，會自動簡化動畫。'}音效與震動不影響骰子結果。</p>
      </div>
    </dialog>
  </>;
}
