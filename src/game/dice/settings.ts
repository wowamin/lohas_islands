import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DiceMotion } from './DiceAnimationController';
export type DiceSpeed = Exclude<DiceMotion,'reduced'>;
interface DiceSettings { muted:boolean; vibration:boolean; speed:DiceSpeed; setMuted:(v:boolean)=>void;setVibration:(v:boolean)=>void;setSpeed:(v:DiceSpeed)=>void }
const storage=createJSONStorage(()=>({
  getItem:(key:string)=>{try{return globalThis.localStorage.getItem(key);}catch{return null;}},
  setItem:(key:string,value:string)=>{try{globalThis.localStorage.setItem(key,value);}catch{/* Preferences still work for this visit. */}},
  removeItem:(key:string)=>{try{globalThis.localStorage.removeItem(key);}catch{/* No game data is touched. */}},
}));
export const useDiceSettings=create<DiceSettings>()(persist(set=>({
  muted:false,vibration:false,speed:'standard',setMuted:muted=>set({muted}),setVibration:vibration=>set({vibration}),setSpeed:speed=>set({speed}),
}),{name:'lohas-dice-preferences-v1',version:1,storage,partialize:s=>({muted:s.muted,vibration:s.vibration,speed:s.speed}),merge:(saved,current)=>{
  const s=saved as Partial<DiceSettings>|undefined;
  return {...current,muted:typeof s?.muted==='boolean'?s.muted:false,vibration:s?.vibration===true,speed:s?.speed==='quick'?'quick':'standard'};
}}));
export const reducedMotion=()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const currentDiceMotion=():DiceMotion=>reducedMotion()?'reduced':useDiceSettings.getState().speed;
