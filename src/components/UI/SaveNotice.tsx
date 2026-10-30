import { AUTO_KEY, LEGACY_AUTO_KEY, useSaveStatus } from '../../game/persistence';
export function SaveNotice(){
 const {message,blocked,dismiss}=useSaveStatus();if(!message)return null;
 const download=()=>{const keys=[AUTO_KEY,LEGACY_AUTO_KEY,AUTO_KEY+'-backup-before-50',LEGACY_AUTO_KEY+'-backup-before-50','lohas-manual-save-v1','lohas-manual-save-v2','lohas-manual-save-v1-backup-before-50','lohas-manual-save-v2-backup-before-50'];const payload=JSON.stringify(Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),null,2);const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='lohas-original-saves.json';a.click();URL.revokeObjectURL(url);};
 return <aside className="migration-notice" role="status"><p>{message}</p><button onClick={download}>匯出原始存檔</button>{!blocked&&<button onClick={dismiss}>知道了</button>}</aside>;
}
