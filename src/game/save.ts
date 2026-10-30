import { useGameStore } from './store/useGameStore';
import { backUp, decodeSave, SAVE_VERSION, useSaveStatus } from './persistence';
const SLOT='lohas-manual-save-v2',LEGACY_SLOT='lohas-manual-save-v1';
export function saveSnapshot(){
  const state=useGameStore.getState();
  if(state.phase!=='WAITING_ROLL')throw new Error('請在回合間儲存');
  const previous=localStorage.getItem(SLOT);if(previous)backUp(SLOT,previous);
  const snapshot=decodeSave({version:SAVE_VERSION,state});
  localStorage.setItem(SLOT,JSON.stringify({version:SAVE_VERSION,savedAt:new Date().toISOString(),state:snapshot.state}));
}
export function loadSnapshot(){
  const current=localStorage.getItem(SLOT),raw=current??localStorage.getItem(LEGACY_SLOT);
  if(!raw)throw new Error('沒有手動存檔');
  const decoded=decodeSave(JSON.parse(raw));
  if(decoded.state.phase!=='WAITING_ROLL')throw new Error('手動存檔階段無效');
  if(decoded.migrated){backUp(current===null?LEGACY_SLOT:SLOT,raw);localStorage.setItem(SLOT,JSON.stringify({version:SAVE_VERSION,state:decoded.state}));useSaveStatus.setState({message:'已轉換舊手動存檔的棋盤位置；原檔及備份已保留。'});}
  useGameStore.setState(decoded.state);
}
