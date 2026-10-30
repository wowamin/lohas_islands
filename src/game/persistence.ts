import { create } from 'zustand';
export { AUTO_KEY, MANUAL_KEY, SAVE_VERSION, LEGACY_AUTO_KEYS, LEGACY_MANUAL_KEYS, decodeSave } from './storage/saveCodec';
export type { GameSnapshot as SavedGame } from './rules/model';
export const useSaveStatus=create<{message:string;blocked:boolean;dismiss:()=>void}>(set=>({message:'',blocked:false,dismiss:()=>set(s=>({message:s.blocked?s.message:''}))}));
