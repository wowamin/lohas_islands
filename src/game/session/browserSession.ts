import { BrowserStorage } from '../storage/StorageAdapter';
import { LocalSaveRepository } from '../storage/LocalSaveRepository';
import { LocalGameSession } from './LocalGameSession';
import { useSaveStatus } from '../persistence';
const TAB_KEY='lohas-session-id-v3';
function tabId(){
  const fresh=()=>globalThis.crypto?.randomUUID?.()??`guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try{
    const navigation=globalThis.performance?.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
    const old=window.sessionStorage.getItem(TAB_KEY);
    // A direct visit creates a fork, including tabs whose sessionStorage was copied by an opener.
    const id=old&&/^[a-zA-Z0-9_-]{1,100}$/.test(old)&&navigation?.type!=='navigate'?old:fresh();
    window.sessionStorage.setItem(TAB_KEY,id);return id;
  }catch{return fresh();}
}
export function createBrowserSession(){
  const id=tabId(),repository=new LocalSaveRepository(new BrowserStorage(()=>globalThis.localStorage),id,notice=>useSaveStatus.setState(notice));
  try{window.sessionStorage.setItem('lohas-auto-save-key',repository.autoKey);window.sessionStorage.setItem('lohas-manual-save-key',repository.manualKey);}catch{/* A storage-restricted visitor can still play in memory. */}
  return new LocalGameSession({id,repository});
}
