import {useLayoutEffect,useState,useSyncExternalStore} from 'react';
import type {ReactNode} from 'react';
import {createPortal} from 'react-dom';

const query='(max-width: 900px)';
const subscribe=(notify:()=>void)=>{const media=window.matchMedia(query);media.addEventListener('change',notify);return()=>media.removeEventListener('change',notify);};
const snapshot=()=>window.matchMedia(query).matches;

// Keep existing stateful controls, but place mobile chrome in normal document flow.
export function ResponsiveSlot({target,children}:{target:string;children:ReactNode}){
  const mobile=useSyncExternalStore(subscribe,snapshot,()=>false);
  const [host,setHost]=useState<HTMLElement|null>(null);
  useLayoutEffect(()=>{setHost(mobile?document.getElementById(target):null);},[mobile,target]);
  return host?createPortal(children,host):children;
}
