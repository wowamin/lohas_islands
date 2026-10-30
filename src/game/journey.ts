import { create } from 'zustand';
export type CameraMode='overview'|'follow'|'focus';
// Animation and camera preferences never alter authoritative game positions.
export const useJourney=create<{
  playerId:number|null;position:number|null;follow:boolean;mode:CameraMode;focusIndex:number|null;
  setStep:(id:number|null,position:number|null)=>void;toggleFollow:()=>void;
  setMode:(mode:CameraMode,focusIndex?:number)=>void;skip:()=>void;skipRequested:boolean;
}>((set)=>({
  playerId:null,position:null,follow:true,mode:'overview',focusIndex:null,skipRequested:false,
  setStep:(playerId,position)=>set({playerId,position,...(playerId===null?{skipRequested:false}:{})}),
  toggleFollow:()=>set(s=>({follow:!s.follow,mode:s.follow?'overview':'follow'})),
  setMode:(mode,focusIndex)=>set({mode,focusIndex:focusIndex??null}),
  skip:()=>set({skipRequested:true}),
}));
