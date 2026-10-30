import { useDicePresentation } from '../../game/dice/presentation';
export function DiceResult(){
  const phase=useDicePresentation(s=>s.phase),result=useDicePresentation(s=>s.result);
  if(phase!=='revealing'&&phase!=='moving')return null;
  return <output className="dice-result-panel" role="status" aria-live="polite" aria-atomic="true"><span>擲骰結果</span><strong>{result}<small> 點</small></strong><span>前進 {result} 格</span></output>;
}
