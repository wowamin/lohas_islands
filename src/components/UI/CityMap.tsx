import { useRef, useState } from 'react';
import { BOARD_DATA } from '../../game/board';
import { cityPoint, CITY_ROUTE } from '../../game/city';
import { CENTERS, centerWorld } from '../../game/cityLayout';
import type { CenterId } from '../../game/cityLayout';
import { useGameStore } from '../../game/store/useGameStore';
import { useJourney } from '../../game/journey';
const project=(x:number,z:number)=>[640+(x-z)*23,440+(x+z)*14];
export function CityMap({selected,onSelect,labels,night,zoom,resetKey,onCenter}:{selected:number|null;onSelect:(id:number)=>void;labels:boolean;night:boolean;zoom:number;resetKey:number;onCenter?:(id:CenterId)=>void}){
  const players=useGameStore(s=>s.players),current=useGameStore(s=>s.currentPlayerIndex);
  const visual=useJourney(s=>s.position),moving=useJourney(s=>s.playerId);
  const [pan,setPan]=useState({x:0,y:0,key:resetKey});const drag=useRef<{x:number;y:number;px:number;py:number}|null>(null);
  const offset=pan.key===resetKey?pan:{x:0,y:0};const focus=selected===null?[640,440]:cityPoint(selected),scale=selected===null?zoom:Math.max(1.4,zoom);
  return <svg className="city-svg city-map-50" viewBox="0 0 1280 900" aria-label="50 格五區城市 2D 棋盤，可點選中心與格子" onPointerDown={e=>{if((e.target as Element).closest('[role="button"]'))return;drag.current={x:e.clientX,y:e.clientY,px:offset.x,py:offset.y};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{const d=drag.current;if(!d)return;const ratio=1280/e.currentTarget.getBoundingClientRect().width;setPan({x:d.px+(e.clientX-d.x)*ratio,y:d.py+(e.clientY-d.y)*ratio,key:resetKey});}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
    <rect width="1280" height="900" fill={night?'#233e48':'#d8eae7'}/>
    <g transform={`translate(${640+offset.x} ${440+offset.y}) scale(${scale}) translate(${-focus[0]} ${-focus[1]})`}>
      <ellipse cx="640" cy="449" rx="540" ry="325" fill={night?'#526d60':'#d9d7b4'}/><ellipse cx="640" cy="440" rx="530" ry="315" fill={night?'#74866a':'#c1d3aa'}/>
      {CENTERS.map(c=>{const[px,py]=project(c.position[0],c.position[1]);const[yx,,yz]=centerWorld(c,0,2);const[cx,cy]=project(yx,yz);return <g key={c.id}>
        <ellipse cx={cx} cy={cy} rx="130" ry="80" fill={night?'#879883':'#dedec0'} stroke={c.color} strokeWidth="4"/>
        <g role="button" tabIndex={0} aria-label={`${c.title}庭院教育區`} onClick={()=>onCenter?.(c.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onCenter?.(c.id);}}}><rect x={cx-40} y={cy-25} width="80" height="40" rx="12" fill="#fff9eb"/><text x={cx} y={cy} textAnchor="middle" fontSize="13" fill="#31594f">✧ 庭院學習</text></g>
        <g role="button" tabIndex={0} aria-label={c.title} onClick={()=>onCenter?.(c.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onCenter?.(c.id);}}}>
          <path d={`M${px-66} ${py-25}L${px} ${py-53}L${px+68} ${py-24}V${py+22}L${px} ${py+52}L${px-66} ${py+22}Z`} fill="#f5f0e5" stroke="#c3cdb7"/>
          <path d={`M${px-76} ${py-26}L${px-8} ${py-72}L${px+77} ${py-28}L${px} ${py+5}Z`} fill={c.color}/>
          {[-35,-10,15,40].map(x=><rect key={x} x={px+x-7} y={py+7} width="13" height="21" rx="2" fill={night?'#f0d6a0':'#91bac0'}/>)}
          <rect x={px-83} y={py-105} width="166" height="29" rx="14" fill="#fff9eb"/><text x={px} y={py-85} textAnchor="middle" fontSize="16" fill="#31594f" fontWeight="700">{c.title}</text>
        </g></g>;})}
      <ellipse cx="640" cy="440" rx="65" ry="37" fill="#8cc8ca"/><path d="M600 429L686 455" stroke="#c3a37d" strokeWidth="20"/>
      <polyline points={CITY_ROUTE} fill="none" stroke="#f1e5cb" strokeWidth="22" strokeLinejoin="round"/>
      {BOARD_DATA.map(tile=>{const[x,y]=cityPoint(tile.id),active=players[current]?.position===tile.id;return <g key={tile.id} data-tile-id={tile.id} role="button" tabIndex={0} aria-label={`${tile.id+1} ${tile.name}`} aria-pressed={selected===tile.id} transform={`translate(${x} ${y})`} onClick={()=>onSelect(tile.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(tile.id);}}}><title>{tile.id+1} {tile.name} · {tile.role}</title><circle r="13" fill={tile.color} stroke={active||selected===tile.id?'#fff4ad':'#fffaf0'} strokeWidth={active||selected===tile.id?4:1}/><text textAnchor="middle" y="4" fill="#31594f" fontSize="11" fontWeight="700">{tile.id+1}</text>{labels&&<g><rect x="-37" y="16" width="74" height="18" rx="6" fill="#fffaf0"/><text y="29" textAnchor="middle" fill="#31594f" fontSize="9">{tile.name}</text></g>}</g>;})}
      {players.map(p=>{const[x,y]=cityPoint(moving===p.id&&visual!==null?visual:p.position);return <g key={p.id} transform={`translate(${x+(p.id%2-.5)*21} ${y-20-Math.floor(p.id/2)*21})`}><circle r="9" fill={p.color} stroke="#fff9e8" strokeWidth="2"/><text y="4" textAnchor="middle" fill="white" fontSize="11">{p.id+1}</text></g>;})}
    </g>
  </svg>;
}
