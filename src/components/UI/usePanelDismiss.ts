import {useEffect} from 'react';

// Let temporary tools close when the user returns to the board or another control.
export function usePanelDismiss(open:boolean,selector:string,close:()=>void){
  useEffect(()=>{
    if(!open)return;
    const pointer=(event:PointerEvent)=>{if(event.target instanceof Element&&!event.target.closest(selector))close();};
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape')close();};
    document.addEventListener('pointerdown',pointer);document.addEventListener('keydown',key);
    return()=>{document.removeEventListener('pointerdown',pointer);document.removeEventListener('keydown',key);};
  },[open,selector,close]);
}
