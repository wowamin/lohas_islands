import type { GameSnapshot } from '../rules/model';
import type { StorageAdapter } from './StorageAdapter';
import { AUTO_KEY, MANUAL_KEY, RECENT_AUTO_KEY, RECENT_MANUAL_KEY, LEGACY_AUTO_KEYS, LEGACY_MANUAL_KEYS, decodeSave, encodeSave } from './saveCodec';
export interface GameSaveRepository {
  loadAuto():GameSnapshot|null;saveAuto(snapshot:GameSnapshot):void;
  loadManual():GameSnapshot;saveManual(snapshot:GameSnapshot):void;
}
export type SaveNotice={message:string;blocked:boolean};
export class LocalSaveRepository implements GameSaveRepository {
  readonly autoKey:string;readonly manualKey:string;
  private blocked=false;private storage:StorageAdapter;private notice:(notice:SaveNotice)=>void;
  constructor(storage:StorageAdapter,sessionId:string,notice:(notice:SaveNotice)=>void=()=>{}){
    if(!/^[a-zA-Z0-9_-]{1,100}$/.test(sessionId))throw new Error('Session ID 無效');
    this.storage=storage;this.autoKey=AUTO_KEY+':'+sessionId;this.manualKey=MANUAL_KEY+':'+sessionId;this.notice=notice;
  }
  private backup(key:string,raw:string){
    const base=key+'-backup-before-v3',old=this.storage.getItem(base);
    if(old===null)this.storage.setItem(base,raw);
    else if(old!==raw){let n=2;while(this.storage.getItem(base+'-'+n)!==null)n++;this.storage.setItem(base+'-'+n,raw);}
    // Retain the original migration backup key for the original 40-stop source too.
    if(key.endsWith('-v1')&&this.storage.getItem(key+'-backup-before-50')===null)this.storage.setItem(key+'-backup-before-50',raw);
  }
  private read(key:string,recentKey:string,legacyKeys:string[],prefix:string):GameSnapshot|null{
    let source=key,raw=this.storage.getItem(key);
    if(raw===null){const recent=this.storage.getItem(recentKey);if(recent?.startsWith(prefix+':')&&/^[a-zA-Z0-9_-]+$/.test(recent.slice(prefix.length+1))){source=recent;raw=this.storage.getItem(recent);}}
    if(raw===null)for(const legacy of legacyKeys){const candidate=this.storage.getItem(legacy);if(candidate!==null){source=legacy;raw=candidate;break;}}
    if(raw===null)return null;
    const decoded=decodeSave(JSON.parse(raw));
    if(decoded.migrated){this.backup(source,raw);this.notice({message:'已將舊進度轉為獨立體驗版本，原始存檔與備份均已保留。',blocked:false});}
    // A new tab forks a saved snapshot into its own slot; it never writes the source slot.
    if(source!==key||decoded.migrated){this.storage.setItem(key,encodeSave(decoded.state));this.storage.setItem(recentKey,key);}
    return decoded.state;
  }
  loadAuto(){
    try{return this.read(this.autoKey,RECENT_AUTO_KEY,LEGACY_AUTO_KEYS,AUTO_KEY);}catch{this.blocked=true;this.notice({message:'存檔無法讀取，原資料已保留。目前可暫玩，但不會覆寫自動存檔。請先匯出原始存檔。',blocked:true});return null;}
  }
  saveAuto(snapshot:GameSnapshot){
    if(this.blocked)return;
    try{this.storage.setItem(this.autoKey,encodeSave(snapshot));this.storage.setItem(RECENT_AUTO_KEY,this.autoKey);}catch{this.blocked=true;this.notice({message:'瀏覽器無法儲存進度，目前可繼續暫玩。請檢查儲存空間與權限。',blocked:true});}
  }
  saveManual(snapshot:GameSnapshot){
    if(snapshot.phase!=='WAITING_ROLL')throw new Error('請在回合間儲存');
    const raw=this.storage.getItem(this.manualKey);if(raw!==null)this.backup(this.manualKey,raw);
    this.storage.setItem(this.manualKey,encodeSave(snapshot));this.storage.setItem(RECENT_MANUAL_KEY,this.manualKey);
  }
  loadManual(){const saved=this.read(this.manualKey,RECENT_MANUAL_KEY,LEGACY_MANUAL_KEYS,MANUAL_KEY);if(!saved||saved.phase!=='WAITING_ROLL')throw new Error('沒有有效的手動存檔');return saved;}
}
