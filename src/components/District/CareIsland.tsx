import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { refinePainterSurfaces, sortPainterGroups } from './painterGeometry';
import { configureWebGLLighting } from './lighting';
import { SVGRenderer } from 'three/addons/renderers/SVGRenderer.js';
import { buildCareIsland, ISLAND_CENTERS, islandStation } from './islandModel';
import { BOARD_DATA } from '../../game/board';
import { useGameStore } from '../../game/store/useGameStore';

export default function CareIsland({gpu,night,resetKey,selected,labels,brightness,shadow,onSelect,onResource,onClearSelection}:{gpu:boolean;night:boolean;resetKey:number;brightness:number;shadow:number;selected:number|null;labels:boolean;onSelect:(n:number)=>void;onResource:()=>void;onClearSelection:()=>void}) {
  const host=useRef<HTMLDivElement>(null);
  const pins=useRef(new Map<string,HTMLButtonElement>());
  const playerNodes=useRef(new Map<number,HTMLDivElement>());
  const players=useGameStore(s=>s.players);
  const playersRef=useRef(players);playersRef.current=players;
  const api=useRef<{focus:(at?:readonly number[])=>void;zoom:(factor:number)=>void;light:(brightness:number,shadow:number)=>void}|null>(null);
  const [center,setCenter]=useState<string|null>(null);
  const [nav,setNav]=useState(()=>window.innerWidth>900);
  useEffect(()=>{
    const parent=host.current;if(!parent)return;
    const model=buildCareIsland(night),scene=new T.Scene();scene.background=new T.Color(night?'#263e48':'#dcebe4');scene.add(model.root);
    const ambient=new T.AmbientLight(night?'#cedaee':'#fff7e5',night?.5:.8);scene.add(ambient);
    const sun=new T.DirectionalLight(night?'#bed0e7':'#fff3db',night?.6:1.1);sun.position.set(-8,16,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-16,right:16,top:14,bottom:-14});sun.shadow.normalBias=.03;scene.add(sun);
    const camera=new T.OrthographicCamera(-16,16,12,-12,.1,150);camera.position.set(17,24,28);camera.lookAt(0,0,0);
    let renderer:T.WebGLRenderer|SVGRenderer;
    try{if(!gpu)throw new Error('compatible');const r=new T.WebGLRenderer({antialias:true});r.setPixelRatio(Math.min(window.devicePixelRatio,1.5));r.shadowMap.enabled=true;r.shadowMap.type=T.PCFShadowMap;renderer=r;}catch{renderer=new SVGRenderer();renderer.setQuality('low');ambient.color.multiplyScalar(.43);sun.intensity=night?.4:.65;}
    parent.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','五間日照中心的長照生活島，40 格連續路線，可拖曳旋轉');renderer.domElement.style.touchAction='none';
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.2,0);controls.enableDamping=true;controls.dampingFactor=.1;controls.rotateSpeed=.45;controls.minPolarAngle=.35;controls.maxPolarAngle=1.25;controls.minZoom=.6;controls.maxZoom=2.4;
    const gpuActive=renderer instanceof T.WebGLRenderer;const lightRig=renderer instanceof T.WebGLRenderer?configureWebGLLighting(renderer,scene,model.root,night,'island',parent.clientWidth<800):null;if(lightRig){scene.remove(ambient,sun);sun.shadow.dispose();}const disposePainter=gpuActive?()=>{}:refinePainterSurfaces(model.root);const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dirty=true,frame=0,last=0,flight:{at:T.Vector3;position:T.Vector3}|null=null;
    const vector=new T.Vector3();
    const focus=(at?:readonly number[])=>{const target=at?new T.Vector3(at[0],.6,at[2]):new T.Vector3(0,.2,0);const position=target.clone().add(new T.Vector3(17,24,28));camera.zoom=at?1.5:1;camera.updateProjectionMatrix();if(reduced){camera.position.copy(position);controls.target.copy(target);}else flight={at:target,position};dirty=true;};
    api.current={focus,light(b,s){lightRig?.set(b,s);if(!gpuActive)renderer.domElement.style.filter='brightness('+b+')';dirty=true;},zoom(f){camera.zoom=T.MathUtils.clamp(camera.zoom*f,.6,2.4);camera.updateProjectionMatrix();dirty=true;}};
    const resize=()=>{const w=parent.clientWidth,h=parent.clientHeight;const half=Math.max(12.7,14.8/(w/Math.max(h,1)));camera.left=-half*w/Math.max(h,1);camera.right=half*w/Math.max(h,1);camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();renderer.setSize(w,h);dirty=true;};
    const observer=new ResizeObserver(resize);observer.observe(parent);resize();
    controls.addEventListener('change',()=>{dirty=true;});controls.addEventListener('start',()=>{flight=null;});
    const place=(element:HTMLElement|undefined,at:readonly number[])=>{if(!element)return;vector.set(at[0],at[1],at[2]).project(camera);const x=(vector.x*.5+.5)*parent.clientWidth,y=(-vector.y*.5+.5)*parent.clientHeight;element.style.transform='translate('+x+'px,'+y+'px) translate(-50%,-50%)';element.style.visibility=x>0&&y>0&&x<parent.clientWidth&&y<parent.clientHeight?'visible':'hidden';};
    const tick=(now:number)=>{frame=requestAnimationFrame(tick);const delta=Math.min(.05,(now-last)/1000);last=now;
      if(flight){const step=1-Math.exp(-delta*5);camera.position.lerp(flight.position,step);controls.target.lerp(flight.at,step);dirty=true;if(camera.position.distanceTo(flight.position)<.03)flight=null;}
      controls.update();if(gpuActive&&!reduced){model.update(now/1000);dirty=true;}
      // Player positions are projected separately, so game updates do not rebuild the scene.
      for(const p of playersRef.current){const pos=islandStation(p.position);place(playerNodes.current.get(p.id),[pos[0]+(p.id%2)*.22,pos[1]+.37,pos[2]+Math.floor(p.id/2)*.18]);}
      if(dirty){scene.updateMatrixWorld(true);if(!gpuActive)sortPainterGroups(model.root,camera);renderer.render(scene,camera);for(const c of ISLAND_CENTERS)place(pins.current.get(c.id),c.at);for(const t of BOARD_DATA)place(pins.current.get('tile'+t.id),islandStation(t.id));dirty=false;}
    };frame=requestAnimationFrame(tick);
    return()=>{api.current=null;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();if(renderer instanceof T.WebGLRenderer)renderer.dispose();renderer.domElement.remove();disposePainter();lightRig?.dispose();model.dispose();};
  },[gpu,night]);
  useEffect(()=>{api.current?.light(brightness,shadow);},[brightness,shadow,night,gpu]);
  useEffect(()=>{setCenter(null);api.current?.focus();},[resetKey]);
  useEffect(()=>{if(selected!==null){setCenter(null);api.current?.focus(islandStation(selected));}},[selected]);
  return <div className="care-island">
    <div className="island-render" ref={host}/>
    <div className="island-stations" aria-label="40 格島嶼步道">{BOARD_DATA.map(t=><button key={t.id} ref={el=>{if(el)pins.current.set('tile'+t.id,el);else pins.current.delete('tile'+t.id);}} onClick={()=>onSelect(t.id)} aria-label={`${t.id+1} ${t.name}`} aria-pressed={selected===t.id} title={t.name}><b>{t.id===0?'起點':t.id+1}</b>{labels&&<span>{t.name}</span>}</button>)}</div>
    <div className="island-center-pins">{ISLAND_CENTERS.map(c=><button key={c.id} ref={el=>{if(el)pins.current.set(c.id,el);else pins.current.delete(c.id);}} aria-pressed={center===c.id} onClick={()=>{onClearSelection();setCenter(c.id);api.current?.focus(c.at);}}><i style={{background:c.color}}/>{c.title}</button>)}</div>
    <div className="island-player-pins" aria-hidden="true">{players.map(p=><div key={p.id} ref={el=>{if(el)playerNodes.current.set(p.id,el);else playerNodes.current.delete(p.id);}} style={{background:p.color}}>{p.id+1}</div>)}</div>
    <button className="island-menu" aria-label="切換地圖導覽" aria-expanded={nav} onClick={()=>setNav(!nav)}>☰</button>
    {nav&&<aside className="island-navigation" aria-label="五間日照中心導覽"><strong>地圖導覽</strong>{ISLAND_CENTERS.map(c=><button key={c.id} onClick={()=>{onClearSelection();setCenter(c.id);api.current?.focus(c.at);}}><i style={{background:c.color}}/>{c.title}</button>)}<button className="island-resource" onClick={onResource}>⌂ 建築與照顧介紹</button><button onClick={()=>{setCenter(null);api.current?.focus();}}>⌖ 返回島嶼全景</button></aside>}
    {center&&<div className="island-center-caption"><strong>{ISLAND_CENTERS.find(c=>c.id===center)?.title}</strong><span>走進日常，認識照顧。</span><button onClick={onResource}>認識日照服務 ↗</button><button aria-label="關閉中心介紹" onClick={()=>setCenter(null)}>×</button></div>}
    <div className="island-zoom"><button aria-label="縮小島嶼" onClick={()=>api.current?.zoom(.85)}>−</button><button aria-label="放大島嶼" onClick={()=>api.current?.zoom(1.15)}>＋</button></div>
  </div>;
}
