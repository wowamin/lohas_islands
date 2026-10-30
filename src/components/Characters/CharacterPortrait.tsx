import type { SVGProps } from 'react';
import type { CharacterId } from '../../game/characters';
// This vector portrait is only the explicit 2D fallback / UI avatar, never the 3D piece.
export function CharacterPortrait({characterId,color='#89b5ad',...props}:SVGProps<SVGSVGElement>&{characterId:CharacterId;color?:string}){
  const grandma=characterId==='grandma';
  return <svg viewBox="0 0 64 76" {...props}>
    <rect x="2" y="2" width="60" height="72" rx="16" fill="#f5eddf"/>
    <ellipse cx="32" cy="66" rx="24" ry="6" fill={color}/>
    <ellipse cx="32" cy="51" rx="24" ry="17" fill={grandma?'#ef756d':'#874aa5'}/>
    <path d="M9 50Q8 30 32 30Q56 30 55 50Z" fill={grandma?'#d94d7d':'#326ea5'}/>
    {!grandma&&<g stroke="#cce4b4" strokeWidth="3"><path d="M19 37L20 51M45 37L44 51"/></g>}
    <ellipse cx="32" cy="27" rx="22" ry="22" fill={grandma?'#f394c0':'#bbd9bc'}/>
    <ellipse cx="32" cy="31" rx="19" ry="18" fill="#f0c7a6"/>
    {grandma?<g fill="#f394c0"><circle cx="14" cy="18" r="7"/><circle cx="23" cy="10" r="8"/><circle cx="36" cy="9" r="8"/><circle cx="48" cy="16" r="8"/><circle cx="12" cy="29" r="6"/><circle cx="52" cy="29" r="6"/><circle cx="14" cy="18" r="2" fill="#d74988"/><circle cx="48" cy="16" r="2" fill="#d74988"/></g>:<path d="M10 23Q9 2 32 3Q56 4 54 23Q44 17 32 20Q21 17 10 23" fill="#79c77b"/>}
    <ellipse cx="23" cy="30" rx="5" ry="6" fill="#292a30"/><ellipse cx="41" cy="30" rx="5" ry="6" fill="#292a30"/>
    <circle cx="21" cy="28" r="1.8" fill="white"/><circle cx="39" cy="28" r="1.8" fill="white"/>
    {grandma?<g stroke="#bb2348" strokeWidth="2.5" fill="none"><circle cx="23" cy="30" r="8"/><circle cx="41" cy="30" r="8"/><path d="M31 29H33"/></g>:<path d="M25 38Q28 32 32 37Q36 32 39 38Q36 43 32 39Q28 43 25 38" fill="#bbd9bc"/>}
    <ellipse cx="32" cy="42" rx="5" ry="3" fill="#e35b80"/>
    {grandma&&<g fill="#fff9ed">{[18,25,32,39,46].map((x,i)=><circle key={x} cx={x} cy={47+Math.sin(i/4*Math.PI)*4} r="2.6"/>)}</g>}
    <g transform="translate(48 49)">{grandma?<><path d="M-5-4H5L4 10H-4Z" fill="#d4a27f"/><path d="M-6-4H6" stroke="#ef795c" strokeWidth="3"/><path d="M1-4V-12" stroke="#46996d" strokeWidth="2"/><circle cx="-1" cy="6" r="1" fill="#302c2b"/><circle cx="2" cy="3" r="1" fill="#302c2b"/></>:<><ellipse rx="7" ry="8" fill="#8bca75"/><path d="M0-6V-13H-4" stroke="#38966a" fill="none" strokeWidth="2"/></>}</g>
  </svg>;
}
