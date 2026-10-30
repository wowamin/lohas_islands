import { create } from 'zustand';
import { DiceAnimationController } from './DiceAnimationController';
import type { DicePhase, DiceMotion } from './DiceAnimationController';
export const diceAnimation=new DiceAnimationController();
export const useDicePresentation=create<{
  phase:DicePhase;result:number;mode:DiceMotion;token:string;skip:()=>void;skipRequested:boolean;
}>(set=>({phase:'idle',result:1,mode:'standard',token:'',skipRequested:false,skip:()=>set({skipRequested:true})}));
