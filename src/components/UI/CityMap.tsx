import { useRef, useState } from 'react';
import { BOARD_DATA } from '../../game/board';
import { cityPoint, CITY_ROUTE } from '../../game/city';
import { CENTERS, centerWorld } from '../../game/cityLayout';
import type { CenterId } from '../../game/cityLayout';
import { useGameStore } from '../../game/store/useGameStore';
import { useJourney } from '../../game/journey';
import { CharacterPortrait } from '../Characters/CharacterPortrait';
import { resolveCharacter, CHARACTERS } from '../../game/characters';
const project=(x:number,z:number)=>[640+(x-z)*23,440+(x+z)*14];
export function CityMap({selected,onSelect,labels,night,zoom,resetKey,onCenter}:{selected:number|null;onSelect:(id:number)=>void;labels:boolean;night:boolean;zoom:number;resetKey:number;onCenter?:(id:CenterId,point:{x:number;y:number})=>void}){
  const players=useGameStore(s=>s.players),current=useGameStore(s=>s.currentPlayerIndex);
  const visual=useJourney(s=>s.position),moving=useJourney(s=>s.playerId);
  const [pan,setPan]=useState({x:0,y:0,key:resetKey});const drag=useRef<{x:number;y:number;px:number;py:number}|null>(null);
  const offset=pan.key===resetKey?pan:{x:0,y:0};const focus=selected===null?[640,440]:cityPoint(selected),scale=selected===null?zoom:Math.max(1.4,zoom);
  return <svg className="city-svg city-map-50" viewBox="0 0 1280 900" aria-label="50 格五區城市 2D 棋盤，可點選中心與格子" onPointerDown={e=>{if((e.target as Element).closest('[role="button"]'))return;drag.current={x:e.clientX,y:e.clientY,px:offset.x,py:offset.y};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{const d=drag.current;if(!d)return;const ratio=1280/e.currentTarget.getBoundingClientRect().width;setPan({x:d.px+(e.clientX-d.x)*ratio,y:d.py+(e.clientY-d.y)*ratio,key:resetKey});}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
    <rect width="1280" height="900" fill={night?'#233e48':'#d8eae7'}/>
    <g aria-hidden="true" pointerEvents="none">
      <path d="M0 140L90 34L178 106L282 12L410 111L520 51L654 126L786 26L921 108L1058 16L1164 97L1280 40V900H0Z" fill={night?'#31495d':'#91adb9'}/>
      <path d="M0 216L128 96L261 188L373 114L522 218L675 132L806 198L946 110L1090 195L1193 121L1280 182V900H0Z" fill={night?'#3b5756':'#789d91'}/>
      <path d="M0 286Q138 166 278 265T551 252T846 257T1114 260L1280 214V900H0Z" fill={night?'#49624e':'#a8bd90'}/>
      <path d="M-40 365C98 334 60 581 124 681S396 822 652 805S1035 770 1325 928" fill="none" stroke={night?'#67776a':'#ddd5b0'} strokeWidth="58"/>
      <path d="M-40 365C98 334 60 581 124 681S396 822 652 805S1035 770 1325 928" fill="none" stroke={night?'#427b8c':'#78b9c4'} strokeWidth="38"/>
      <path d="M-40 365C98 334 60 581 124 681S396 822 652 805S1035 770 1325 928" fill="none" stroke={night?'#6296a4':'#c2e4df'} strokeWidth="2"/>
    </g>
    <g transform={`translate(${640+offset.x} ${440+offset.y}) scale(${scale}) translate(${-focus[0]} ${-focus[1]})`}>
      <ellipse cx="640" cy="449" rx="540" ry="325" fill={night?'#526d60':'#d9d7b4'}/><ellipse cx="640" cy="440" rx="530" ry="315" fill={night?'#74866a':'#c1d3aa'}/>
      {CENTERS.map(c=>{const[px,py]=project(c.position[0],c.position[1]);const[yx,,yz]=centerWorld(c,0,2);const[cx,cy]=project(yx,yz);return <g key={c.id}>
        <ellipse cx={cx} cy={cy} rx="130" ry="80" fill={night?'#879883':'#dedec0'} stroke={c.color} strokeWidth="4"/>
        <g role="button" tabIndex={0} aria-label={c.title} onClick={e=>onCenter?.(c.id,{x:e.clientX,y:e.clientY})} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();const rect=e.currentTarget.getBoundingClientRect();onCenter?.(c.id,{x:rect.left+rect.width/2,y:rect.top+rect.height/2});}}}>
          <path d={`M${px-66} ${py-25}L${px} ${py-53}L${px+68} ${py-24}V${py+22}L${px} ${py+52}L${px-66} ${py+22}Z`} fill="#f5f0e5" stroke="#c3cdb7"/>
          <path d={`M${px-76} ${py-26}L${px-8} ${py-72}L${px+77} ${py-28}L${px} ${py+5}Z`} fill={c.color}/>
          {[-35,-10,15,40].map(x=><rect key={x} x={px+x-7} y={py+7} width="13" height="21" rx="2" fill={night?'#f0d6a0':'#91bac0'}/>)}
          <rect x={px-83} y={py-105} width="166" height="29" rx="14" fill="#fff9eb"/><text x={px} y={py-85} textAnchor="middle" fontSize="16.8" fill="#31594f" fontWeight="700">{c.title}</text>
        </g></g>;})}
      <ellipse cx="640" cy="440" rx="65" ry="37" fill="#8cc8ca"/><path d="M600 429L686 455" stroke="#c3a37d" strokeWidth="20"/>
      <polyline points={CITY_ROUTE} fill="none" stroke="#f1e5cb" strokeWidth="22" strokeLinejoin="round"/>
      {BOARD_DATA.map(tile=>{const[x,y]=cityPoint(tile.id),active=players[current]?.position===tile.id;return <g key={tile.id} data-tile-id={tile.id} role="button" tabIndex={0} aria-label={`${tile.id+1} ${tile.name}`} aria-pressed={selected===tile.id} transform={`translate(${x} ${y})`} onClick={()=>onSelect(tile.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(tile.id);}}}><title>{tile.id+1} {tile.name} · {tile.role}</title><circle r="13" fill={tile.color} stroke={active||selected===tile.id?'#fff4ad':'#fffaf0'} strokeWidth={active||selected===tile.id?4:1}/><text textAnchor="middle" y="4" fill="#31594f" fontSize="11.55" fontWeight="700">{tile.id+1}</text>{labels&&<g><rect x="-37" y="16" width="74" height="18" rx="6" fill="#fffaf0"/><text y="29" textAnchor="middle" fill="#31594f" fontSize="9.45">{tile.name}</text></g>}</g>;})}
      {players.map(p=>{const[x,y]=cityPoint(moving===p.id&&visual!==null?visual:p.position);return <g key={p.id} transform={`translate(${x+(p.id%2-.5)*21} ${y-20-Math.floor(p.id/2)*21})`}><title>{p.name} {CHARACTERS[resolveCharacter(p.characterId,p.id)].name}</title><CharacterPortrait characterId={resolveCharacter(p.characterId,p.id)} color={p.color} x="-12" y="-22" width="24" height="28" data-character-id={resolveCharacter(p.characterId,p.id)}/><circle cy="13" r="7" fill={p.color}/><text y="16" textAnchor="middle" fill="white" fontSize="9">{p.id+1}</text></g>;})}
    </g>
  </svg>;
}
