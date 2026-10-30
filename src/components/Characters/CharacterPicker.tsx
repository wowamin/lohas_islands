import { useEffect, useRef, useState } from 'react';
import type { CharacterId } from '../../game/characters';
import { CHARACTERS, CHARACTER_IDS } from '../../game/characters';
import { CharacterPreview } from './CharacterPreview';
export default function CharacterPicker({playerName,selected,color,onConfirm,onClose}:{playerName:string;selected:CharacterId;color:string;onConfirm:(id:CharacterId)=>void;onClose:()=>void}){
  const [draft,setDraft]=useState(selected),dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const node=dialog.current;node?.showModal();return()=>{node?.close();previous?.focus();};},[]);
  return <dialog ref={dialog} className="senior-ui senior-dialog character-picker" aria-labelledby="character-picker-title" onCancel={onClose} onKeyDown={event=>{
    if(event.key!=='Tab')return;const buttons=[...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];const first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }}>
    <header className="senior-dialog-header"><div><h2 id="character-picker-title" className="senior-text-value">{playerName||'旅人'} 的角色</h2><p className="senior-text-small">立體公仔可旋轉；角色不影響能力與遊戲數值。</p></div><button type="button" autoFocus className="senior-btn-secondary" aria-label="關閉角色選擇" onClick={onClose}>關閉</button></header>
    <div className="senior-dialog-body character-picker-body">
      <CharacterPreview selected={draft} color={color} onSelect={setDraft}/>
      <div className="character-options" role="group" aria-label="選擇爺爺或奶奶">{CHARACTER_IDS.map(id=><button key={id} type="button" className="character-option" aria-pressed={draft===id} onClick={()=>setDraft(id)}><strong>{draft===id?'✓ ':''}{CHARACTERS[id].name}</strong><span>{CHARACTERS[id].description}</span></button>)}</div>
      <p className="senior-text-small">可以重複選擇。棋子底座以各玩家顏色區分；此為依參考圖製作的幾何原型。</p>
    </div>
    <footer className="senior-dialog-footer"><div className="senior-actions"><button type="button" className="senior-btn-secondary" onClick={onClose}>先返回</button><button type="button" className="senior-btn-primary" onClick={()=>onConfirm(draft)}>確認選擇{CHARACTERS[draft].name}</button></div></footer>
  </dialog>;
}
