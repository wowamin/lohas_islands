import { useEffect } from 'react';
import { CENTERS } from '../../game/cityLayout';
import type { CenterId } from '../../game/cityLayout';
import type { ModuleId } from '../../game/education/content';
import { useCitySettings } from '../../game/citySettings';
import { useGameStore } from '../../game/store/useGameStore';
export function CenterInfo({id,onClose,onLearn,onResource}:{id:CenterId;onClose:()=>void;onLearn:(module?:ModuleId)=>void;onResource:()=>void}){
  const center=CENTERS.find(c=>c.id===id)!;const visit=useCitySettings(s=>s.visit);
  const phase=useGameStore(s=>s.phase);
  useEffect(()=>visit(id),[id,visit]);
  return <aside className="island-center-caption center-education" aria-label="中心教育資訊"><strong>{center.title}</strong><span className="center-theme">{center.theme}</span><p>{center.features.join(' · ')}</p><p>第 {center.start+1}–{center.end+1} 格，從入口走進庭院，經過活動與休憩空間，再由出口前往下一區。</p><small>以上是遊戲場景主題，不代表中心實際提供的服務。實際收案、資格與服務範圍須向機構確認。</small><div><button onClick={onResource}>日照資源介紹 ↗</button><button disabled={phase!=='SETUP'&&phase!=='WAITING_ROLL'} onClick={()=>onLearn(center.module)}>學習單元 {center.module} ↗</button></div><button className="center-close" aria-label="關閉中心介紹並返回城市" onClick={onClose}>×</button></aside>;
}
