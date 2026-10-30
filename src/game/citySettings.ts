import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CenterId } from './cityLayout';
export type Quality='low'|'medium'|'high';
export const QUALITY={low:{dpr:1,shadows:false,shadowSize:512,treeCount:40},medium:{dpr:1.25,shadows:true,shadowSize:512,treeCount:70},high:{dpr:1.5,shadows:true,shadowSize:1024,treeCount:100}};
export const useCitySettings=create<{quality:Quality;explored:CenterId[];setQuality:(q:Quality)=>void;visit:(id:CenterId)=>void}>()(persist(set=>({
  quality:typeof window!=='undefined'&&window.innerWidth<900?'low':'medium',explored:[],
  setQuality:quality=>set({quality}),visit:id=>set(s=>({explored:[...new Set([...s.explored,id])]})),
}),{name:'lohas-city-preferences-v1',version:1,merge:(persisted,current)=>{const p=persisted as Partial<{quality:Quality;explored:CenterId[]}>;return{...current,quality:['low','medium','high'].includes(p?.quality??'')?p.quality!:current.quality,explored:Array.isArray(p?.explored)?p.explored.filter(id=>['dahe','annan','xinying','yihe','longshan'].includes(id)):[]};}}));
