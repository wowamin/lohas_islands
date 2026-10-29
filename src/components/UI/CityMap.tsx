import { useRef, useState } from 'react';
import { BOARD_DATA } from '../../game/board';
import { CITY_COLORS, CITY_ROUTE, cityPoint } from '../../game/city';
import { useGameStore } from '../../game/store/useGameStore';

export function CityMap({ selected, onSelect, labels, night, zoom, resetKey }: { selected: number | null; onSelect: (id: number) => void; labels: boolean; night: boolean; zoom: number; resetKey: number }) {
  const players = useGameStore(s => s.players);
  const current = useGameStore(s => s.currentPlayerIndex);
  const [pan, setPan] = useState({ x: 0, y: 0, key: resetKey });
  const drag = useRef<{x:number; y:number; px:number; py:number; moved:boolean} | null>(null);
  const offset = pan.key === resetKey ? pan : {x:0,y:0};
  const focus = selected === null ? [640,450] : cityPoint(selected);
  const scale = selected === null ? zoom : Math.max(1.35,zoom);
  return <svg className="city-svg" viewBox="0 0 1280 900" aria-label="40 站長照城市地圖，可點選建築查看站點" onPointerDown={e => {
    if ((e.target as Element).closest('[role="button"]')) return;
    drag.current = {x:e.clientX,y:e.clientY,px:offset.x,py:offset.y,moved:false}; e.currentTarget.setPointerCapture(e.pointerId);
  }} onPointerMove={e => {
    const d=drag.current; if(!d) return;
    const scale=1280/e.currentTarget.getBoundingClientRect().width;
    d.moved=true; setPan({x:d.px+(e.clientX-d.x)*scale,y:d.py+(e.clientY-d.y)*scale,key:resetKey});
  }} onPointerUp={() => {drag.current=null;}} onPointerCancel={() => {drag.current=null;}}>
    <defs><filter id="city-shadow" x="-50%" y="-50%" width="200%" height="230%"><feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#416977" floodOpacity=".15"/></filter><pattern id="water" width="60" height="48" patternUnits="userSpaceOnUse"><path d="M8 24q8 5 16 0m24 18q8 5 16 0" fill="none" stroke={night?'#344e65':'#fff'} strokeWidth="2" opacity=".4"/></pattern></defs>
    <rect width="1280" height="900" fill={night?'#1b3447':'#d8e9e7'}/><rect width="1280" height="900" fill="url(#water)"/>
    <g transform={`translate(${(selected===null?640:480)+offset.x} ${450+offset.y}) scale(${scale}) translate(${-focus[0]} ${-focus[1]})`}>
      <g opacity=".48" fill={night?'#668396':'#f7faf2'}><ellipse cx="212" cy="179" rx="60" ry="12"/><ellipse cx="1050" cy="696" rx="70" ry="13"/><ellipse cx="390" cy="760" rx="45" ry="9"/></g>
      <g filter="url(#city-shadow)"><path d="M532 165L1200 500Q1230 520 1200 542L775 782Q748 800 720 782L75 460Q45 440 75 420L505 172Q520 162 532 165" fill={night?'#4d6458':'#91b29b'} transform="translate(0 23)"/><path d="M532 165L1200 500Q1230 520 1200 542L775 782Q748 800 720 782L75 460Q45 440 75 420L505 172Q520 162 532 165" fill={night?'#647764':'#c9d9af'}/></g>
      <polyline points={CITY_ROUTE} fill="none" stroke={night?'#91988b':'#eee9d2'} strokeWidth="28" strokeLinejoin="round"/>
      <polyline points={CITY_ROUTE} fill="none" stroke={night?'#bdc1a8':'#b9b69e'} strokeWidth="2" strokeDasharray="5 9" strokeLinejoin="round"/>
      {[...BOARD_DATA].sort((a,b)=>cityPoint(a.id)[1]-cityPoint(b.id)[1]).map(tile => {
        const [x,y]=cityPoint(tile.id);const color=CITY_COLORS[tile.type];const active=players[current]?.position===tile.id;
        return <g key={tile.id} transform={`translate(${x} ${y})`} role="button" tabIndex={0} aria-label={`${tile.id+1} ${tile.name}`} aria-pressed={selected===tile.id} onClick={()=>onSelect(tile.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(tile.id);}}} className={'city-lot'+(selected===tile.id?' selected':'')+(active?' occupied':'')}>
          <title>{tile.id+1} · {tile.name}</title>
          <path d="M0 -28L42 -7L42 15L0 36L-42 15L-42 -7Z" fill={color}/><path d="M0 -28L42 -7L0 14L-42 -7Z" fill={night?'#b5b5a2':'#f9f4df'}/><path d="M0 14V36L-42 15V-7Z" fill="#000" opacity=".07"/>
          {(selected===tile.id||active)&&<path className="lot-ring" d="M0 -31L46 -8V17L0 40L-46 17V-8Z" fill="none" stroke={selected===tile.id?'#fff9cf':players[current].color} strokeWidth="4"/>}
          <Building type={tile.type} color={color} night={night} variant={tile.id%3}/>
          <g transform="translate(-34 7)"><circle r="12" fill={night?'#253c45':'#fffaf0'}/><text textAnchor="middle" y="4" fontSize="11" fontWeight="800" fill={night?'#fff4d6':'#4a5e54'}>{String(tile.id+1).padStart(2,'0')}</text></g>

          {players.filter(p=>p.position===tile.id).map((p,i)=><g className="city-person" key={p.id} transform={`translate(${10+i*13} 0)`}><ellipse cy="5" rx="8" ry="4" fill="#49625b" opacity=".25"/><path d="M-5 1V-9Q0 -16 5 -9V1" fill={p.color} stroke="#fff" strokeWidth="1.5"/><circle cy="-18" r="5" fill="#f3cfaa"/><text y="-28" textAnchor="middle" fontSize="12" fontWeight="900" fill={night?'#fff':'#314b45'}>{p.id+1}</text></g>)}
        </g>;
      })}
      {labels && <g pointerEvents="none">{BOARD_DATA.map(tile => {const [x,y]=cityPoint(tile.id);return <g key={tile.id} transform={'translate('+x+' '+(y+43)+')'}><rect x="-40" y="-10" width="80" height="21" rx="8" fill={night?'#233d48':'#fffdf4'} stroke={CITY_COLORS[tile.type]}/><text textAnchor="middle" y="4" fill={night?'#fff6de':'#415a51'} fontSize="12" fontWeight="700">{tile.name}</text></g>;})}</g>}
      <g transform="translate(705 753)" fill={night?'#d0dfd8':'#658c83'}><text fontSize="12" letterSpacing="4">CARE IS A JOURNEY, TOGETHER.</text></g>
    </g>
  </svg>;
}
function Building({type,color,night,variant}:{type:string;color:string;night:boolean;variant:number}) {
  const windowColor=night?'#ffe5a0':'#8dbcb8';
  if(type==='REST'||type==='OPPORTUNITY') return <g><path d="M-22 -4L0 -15L23 -3L0 9Z" fill="#9bb77f"/>{[-13,12].map((x,i)=><g key={x} transform={`translate(${x} ${i*-8})`}><path d="M0 0V-24" stroke="#907459" strokeWidth="4"/><path d="M0 -55L-13 -23H13Z" fill={i?'#6d9b7b':'#81ad81'}/><path d="M0 -43L-16 -14H16Z" fill={i?'#80a98c':'#92bb8a'}/></g>)}<path d="M-10 1L10 -9" stroke="#d2a169" strokeWidth="5"/>{type==='OPPORTUNITY'&&<text y="-37" x="23" fontSize="23" fill="#ae84b5">✦</text>}</g>;
  const h=type==='SERVICE'?44:26+variant*5;
  return <g className="city-building">
    <path d={`M-21 -5V${-h}L0 ${-h+10}V6Z`} fill={night?'#c4baa2':'#f6e9d1'}/>
    <path d={`M0 6V${-h+10}L23 ${-h-2}V-7Z`} fill={night?'#9eaa99':'#dddac0'}/>
    <path d={`M-25 ${-h}L-3 ${-h-17}L27 ${-h-3}L0 ${-h+12}Z`} fill={color}/>
    <path d={`M-25 ${-h}V${-h+5}L0 ${-h+17}V${-h+12}Z`} fill="#000" opacity=".13"/>
    <path d={`M-15 ${-h+12}V${-h+23}L-7 ${-h+27}V${-h+16}Z M7 ${-h+17}V${-h+29}L15 ${-h+25}V${-h+13}Z`} fill={windowColor}/>
    <path d="M-7 2V-12L-14 -15V-2Z" fill="#9a7d65"/>
    {type==='SERVICE'&&<g transform={`translate(0 ${-h-5})`}><path d="M-4 -9V7M-12 -1H4" stroke="#fff7de" strokeWidth="4"/></g>}
    {type==='RESOURCE'&&<circle cx="-2" cy={-h-3} r="6" fill="#fff4cc"/>}
    {type==='START'&&<path d={`M10 ${-h-10}V${-h-37}L26 ${-h-30}L10 ${-h-23}`} fill="#cf7656" stroke="#8d765f" strokeWidth="1.5"/>}
  </g>;
}
