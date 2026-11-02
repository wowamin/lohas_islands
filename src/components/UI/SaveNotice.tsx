import { useSaveStatus } from '../../game/persistence';
import { setGameSessionAdapter, useGameStore } from '../../game/store/useGameStore';
import { createBrowserSession } from '../../game/session/browserSession';
export function SaveNotice(){
 const {message,blocked,dismiss}=useSaveStatus();if(!message)return null;
 const download=()=>{const keys=Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).filter((key):key is string=>!!key&&/^(long-care-game-save-v[1234]|lohas-manual-save-v[1234])(?:$|:|-backup)/.test(key));const payload=JSON.stringify(Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),null,2);const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='lohas-original-saves.json';a.click();URL.revokeObjectURL(url);};
 const restart=()=>{setGameSessionAdapter(createBrowserSession(true));useSaveStatus.setState({message:'',blocked:false});useGameStore.getState().resetGame();};
 return <aside className="migration-notice" role="status"><p>{message}</p><button onClick={download}>匯出原始存檔</button>{blocked?<button onClick={restart}>保留原檔，另開新旅程</button>:<button onClick={dismiss}>知道了</button>}</aside>;
}
