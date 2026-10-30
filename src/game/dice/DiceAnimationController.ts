export type DicePhase = 'idle' | 'rolling' | 'revealing' | 'moving';
export type DiceMotion = 'standard' | 'quick' | 'reduced';
export const DICE_TIMING = {
  standard: { roll: 1200, reveal: 400, step: 360 },
  quick: { roll: 270, reveal: 180, step: 100 },
  reduced: { roll: 0, reveal: 120, step: 50 },
} as const;
export interface DiceFrame {
  phase: DicePhase; result: number; progress: number; mode: DiceMotion; token: string;
}
// Presentation only: no random source, player position, event effect or session dependency.
export class DiceAnimationController {
  private active: { result:number; mode:DiceMotion; token:string; start:number; skipped:boolean } | null = null;
  start(result:number, token:string, now:number, mode:DiceMotion):boolean {
    if(this.active || !Number.isInteger(result) || result<1 || result>6) return false;
    this.active={result,mode,token,start:now,skipped:false};return true;
  }
  sample(now:number):DiceFrame {
    if(!this.active)return {phase:'idle',result:1,progress:1,mode:'reduced',token:''};
    const {result,mode,token,start,skipped}=this.active,timing=DICE_TIMING[mode],elapsed=Math.max(0,now-start);
    const phase=skipped||elapsed>=timing.roll+timing.reveal?'moving':elapsed<timing.roll?'rolling':'revealing';
    return {phase,result,mode,token,progress:skipped||timing.roll===0?1:Math.min(1,elapsed/timing.roll)};
  }
  skip(){if(this.active)this.active.skipped=true;}
  reset(){this.active=null;}
}
export function diceHeight(progress:number, reduced=false):number {
  if(reduced)return 0;
  const p=Math.max(0,Math.min(1,progress));
  if(p<.14)return .18*(p/.14)**2; // lift and charge
  if(p<.68){const t=(p-.14)/.54;return .18*(1-t)+1.25*Math.sin(Math.PI*t);}
  if(p<.86)return .25*Math.sin(Math.PI*(p-.68)/.18); // first contact/bounce
  return .08*Math.sin(Math.PI*(p-.86)/.14); // smaller final bounce
}
