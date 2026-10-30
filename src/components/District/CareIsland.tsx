import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { configureWebGLLighting } from './lighting';
import { buildCareIsland, ISLAND_CENTERS } from './islandModel';
import { BOARD_DATA } from '../../game/board';
import { centerWorld, CENTERS } from '../../game/cityLayout';
import type { CenterId } from '../../game/cityLayout';
import { QUALITY, useCitySettings } from '../../game/citySettings';
import { useGameStore } from '../../game/store/useGameStore';
import { useJourney } from '../../game/journey';
import { createPawn, createIslandDice } from './gamePieces';
import { buildLandscape } from './landscape';

export default function CareIsland({night,resetKey,selected,labels,brightness,shadow,onSelect,onCenter,centerId,onUnavailable}:{night:boolean;resetKey:number;brightness:number;shadow:number;selected:number|null;labels:boolean;onSelect:(n:number)=>void;onCenter:(id:CenterId)=>void;centerId:CenterId|null;onUnavailable:()=>void}){
  const host=useRef<HTMLDivElement>(null),stats=useRef<HTMLOutputElement>(null);
  const pins=useRef(new Map<string,HTMLButtonElement>()),playerNodes=useRef(new Map<number,HTMLDivElement>());
  const handlers=useRef({onCenter,onUnavailable});handlers.current={onCenter,onUnavailable};
  const players=useGameStore(s=>s.players),phase=useGameStore(s=>s.phase);
  const quality=useCitySettings(s=>s.quality),explored=useCitySettings(s=>s.explored);
  const mode=useJourney(s=>s.mode),focusIndex=useJourney(s=>s.focusIndex),setMode=useJourney(s=>s.setMode);
  const [nav,setNav]=useState(()=>window.innerWidth>900);
  const api=useRef<{focus:(at?:readonly number[])=>void;zoom:(factor:number)=>void;light:(b:number,s:number)=>void}|null>(null);
  useEffect(()=>{const resize=()=>setNav(window.innerWidth>900);window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
  useEffect(()=>{
    const parent=host.current!;if(!parent)return;
    let renderer:T.WebGLRenderer;
    try{renderer=new T.WebGLRenderer({antialias:quality==='high',powerPreference:quality==='low'?'low-power':'high-performance'});}catch{handlers.current.onUnavailable();return;}
    const config=QUALITY[quality],model=buildCareIsland(night,quality),scene=new T.Scene();scene.add(model.root);
    const landscape=buildLandscape(night,quality);scene.add(landscape.root);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,config.dpr));renderer.shadowMap.enabled=config.shadows;
    const lightRig=configureWebGLLighting(renderer,scene,model.root,night,'island',quality!=='high',quality);
    const canvas=renderer.domElement;parent.appendChild(canvas);canvas.setAttribute('aria-label','50 格五間日照中心 3D 城市，可旋轉縮放');canvas.style.touchAction='none';
    const camera=new T.OrthographicCamera(-20,20,18,-18,.1,150);camera.position.set(21,27,30);camera.lookAt(0,0,0);
    const controls=new OrbitControls(camera,canvas);controls.target.set(0,.2,0);controls.enableDamping=true;controls.dampingFactor=.12;controls.rotateSpeed=.45;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pawns=new Map<number,T.Group>();
    function disposePawn(pawn:T.Group){pawn.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();}});}
    function syncPlayers(){const state=useGameStore.getState();for(const[id,pawn]of pawns)if(!state.players.some(p=>p.id===id&&p.color===pawn.userData.color)){scene.remove(pawn);disposePawn(pawn);pawns.delete(id);}for(const p of state.players){if(!pawns.has(p.id)){const pawn=createPawn(p.color);pawn.userData.color=p.color;pawns.set(p.id,pawn);scene.add(pawn);}}dirty=true;}
    const dice=createIslandDice();dice.root.position.set(0,2,0);scene.add(dice.root);
    const halo=new T.Mesh(new T.RingGeometry(.32,.43,20),new T.MeshBasicMaterial({color:'#fff1a4',side:T.DoubleSide}));halo.rotation.x=-Math.PI/2;scene.add(halo);
    const vector=new T.Vector3(),target=new T.Vector3(),followTarget=new T.Vector3(),cameraTarget=new T.Vector3(),offset=new T.Vector3(21,27,30);
    let dirty=true,frame=0,lastTime=0,lastRender=0,statSince=0,rendered=0,flight:{at:T.Vector3;camera:T.Vector3;zoom:number}|null=null;
    const focus=(at?:readonly number[])=>{const atVector=at?new T.Vector3(at[0],.3,at[2]):new T.Vector3(0,.2,0);const targetCamera=atVector.clone().add(offset);flight={at:atVector,camera:targetCamera,zoom:at?(parent.clientWidth<800?1.5:1.7):1};dirty=true;};
    api.current={focus,zoom(f){camera.zoom=T.MathUtils.clamp(camera.zoom*f,controls.minZoom,controls.maxZoom);camera.updateProjectionMatrix();flight=null;dirty=true;},light(b,s){lightRig.set(b,s);dirty=true;}};
    const resize=()=>{const w=parent.clientWidth,h=Math.max(1,parent.clientHeight),mobile=w<800,half=Math.max(18,17.5/(w/h));camera.left=-half*w/h;camera.right=half*w/h;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();renderer.setSize(w,h);controls.minPolarAngle=mobile?.45:.28;controls.maxPolarAngle=mobile?1.02:1.2;controls.minZoom=mobile?.8:.6;controls.maxZoom=mobile?2.3:3;controls.maxTargetRadius=mobile?13:16;camera.zoom=T.MathUtils.clamp(camera.zoom,controls.minZoom,controls.maxZoom);camera.updateProjectionMatrix();dirty=true;};
    const observer=new ResizeObserver(resize);observer.observe(parent);resize();
    const onChange=()=>{dirty=true;};const onStart=()=>{flight=null;if(useJourney.getState().mode==='follow')useJourney.getState().setMode('overview');};controls.addEventListener('change',onChange);controls.addEventListener('start',onStart);
    const raycaster=new T.Raycaster(),pointer=new T.Vector2();let pointerX=0,pointerY=0;
    const pointerDown=(e:PointerEvent)=>{pointerX=e.clientX;pointerY=e.clientY;};
    const pointerUp=(e:PointerEvent)=>{if(Math.hypot(e.clientX-pointerX,e.clientY-pointerY)>5)return;const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);for(const hit of raycaster.intersectObject(model.root,true)){const ids=hit.object.userData.centerIds as (CenterId|undefined)[]|undefined;const id=hit.instanceId!==undefined?ids?.[hit.instanceId]:undefined;if(id){handlers.current.onCenter(id);break;}}};
    const contextLost=(e:Event)=>{e.preventDefault();handlers.current.onUnavailable();};canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);
    function place(element:HTMLElement|undefined,x:number,y:number,z:number,dx=0,dy=0){if(!element)return;vector.set(x,y,z).project(camera);const sx=(vector.x*.5+.5)*parent.clientWidth+dx,sy=(-vector.y*.5+.5)*parent.clientHeight+dy;element.style.transform=`translate(${sx}px,${sy}px) translate(-50%,-50%)`;element.style.visibility=sx>0&&sy>0&&sx<parent.clientWidth&&sy<parent.clientHeight?'visible':'hidden';}
    const unsubscribe=useGameStore.subscribe(syncPlayers);syncPlayers();const unsubscribeJourney=useJourney.subscribe(()=>{dirty=true;});
    const tick=(now:number)=>{
      frame=requestAnimationFrame(tick);const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;
      if(document.hidden)return;
      controls.update();
      const journey=useJourney.getState(),game=useGameStore.getState(),current=game.players[game.currentPlayerIndex];
      const smooth=reduced?1:1-Math.exp(-dt*6);
      if(journey.mode==='follow'&&current){const p=BOARD_DATA[journey.position??current.position].position;followTarget.set(p[0],.3,p[2]);cameraTarget.copy(followTarget).add(offset);camera.position.lerp(cameraTarget,smooth);controls.target.lerp(followTarget,smooth);camera.zoom=T.MathUtils.lerp(camera.zoom,parent.clientWidth<800?1.4:1.6,smooth);camera.updateProjectionMatrix();dirty=true;flight=null;}
      else if(flight){camera.position.lerp(flight.camera,smooth);controls.target.lerp(flight.at,smooth);camera.zoom=T.MathUtils.lerp(camera.zoom,flight.zoom,smooth);camera.updateProjectionMatrix();dirty=true;if(camera.position.distanceToSquared(flight.camera)<.0004&&Math.abs(camera.zoom-flight.zoom)<.002)flight=null;}
      for(const p of game.players){const pawn=pawns.get(p.id);if(!pawn)continue;const at=journey.playerId===p.id&&journey.position!==null?journey.position:p.position,pos=BOARD_DATA[at].position;target.set(pos[0]+(p.id%2)*.25,pos[1],pos[2]+Math.floor(p.id/2)*.25);if(!pawn.userData.placed){pawn.position.copy(target);pawn.userData.placed=true;dirty=true;}if(pawn.position.distanceToSquared(target)>.00001){pawn.position.lerp(target,reduced?1:1-Math.exp(-dt*14));dirty=true;}if(journey.playerId===p.id&&!reduced){pawn.position.y=target.y+Math.abs(Math.sin(now*.012))*.1;dirty=true;}place(playerNodes.current.get(p.id),pawn.position.x,pawn.position.y+.9,pawn.position.z,(p.id%2)*24-12,-Math.floor(p.id/2)*27);}
      halo.visible=!!current;if(current){const p=BOARD_DATA[journey.position??current.position].position;halo.position.set(p[0],.25,p[2]);}
      dice.root.visible=game.phase==='ROLLING';if(dice.root.visible){dice.update(game.diceValue,!reduced,dt);dirty=true;}
      if(now-lastRender<1000/(quality==='low'?30:60)-1)return;
      if(!reduced){model.update(now/1000,false,camera.zoom);dirty=true;}else if(dirty)model.update(now/1000,true,camera.zoom);
      if(dirty){renderer.render(scene,camera);for(const c of ISLAND_CENTERS){place(pins.current.get(c.id),...c.at);}for(const t of BOARD_DATA)place(pins.current.get('tile'+t.id),...t.position);dirty=false;rendered++;lastRender=now;}
      if(now-statSince>=1500){const fps=rendered*1000/(now-statSince);canvas.dataset.fps=fps.toFixed(1);canvas.dataset.calls=String(renderer.info.render.calls);canvas.dataset.triangles=String(renderer.info.render.triangles);canvas.dataset.quality=quality;if(stats.current)stats.current.textContent=`${fps.toFixed(0)} FPS · ${renderer.info.render.calls} calls · ${quality==='low'?'低':quality==='medium'?'中':'高'}畫質`;rendered=0;statSince=now;}
    };frame=requestAnimationFrame(tick);
    return()=>{api.current=null;cancelAnimationFrame(frame);unsubscribe();unsubscribeJourney();observer.disconnect();controls.dispose();canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);for(const pawn of pawns.values())disposePawn(pawn);dice.dispose();halo.geometry.dispose();(halo.material as T.Material).dispose();lightRig.dispose();landscape.dispose();model.dispose();renderer.dispose();canvas.remove();};
  },[night,quality]);
  useEffect(()=>{api.current?.light(brightness,shadow);},[brightness,shadow,night,quality]);
  useEffect(()=>{api.current?.focus();},[resetKey]);
  useEffect(()=>{if(mode==='overview')api.current?.focus();else if(mode==='focus'){const index=focusIndex??0;const center=CENTERS[Math.floor(index/10)];api.current?.focus(selected!==null?BOARD_DATA[selected].position:centerWorld(center,0,2));}},[mode,focusIndex,selected,night,quality]);
  const selectCenter=(id:CenterId)=>{onCenter(id);};
  return <div className="care-island" data-camera-mode={mode}>
    <div className="island-render" ref={host}/>
    <div className="island-stations" aria-label="50 格城市庭院步道">{BOARD_DATA.map(t=><button key={t.id} ref={el=>{if(el)pins.current.set('tile'+t.id,el);else pins.current.delete('tile'+t.id);}} onClick={()=>onSelect(t.id)} aria-label={`${t.id+1} ${t.name}`} aria-pressed={selected===t.id} title={`${t.id+1} ${t.name} · ${t.role}`}><b>{t.id+1}</b>{labels&&<span>{t.name}</span>}</button>)}</div>
    <div className="island-center-pins">{ISLAND_CENTERS.map(c=><button key={c.id} ref={el=>{if(el)pins.current.set(c.id,el);else pins.current.delete(c.id);}} aria-pressed={centerId===c.id} onClick={()=>selectCenter(c.id)}><i style={{background:c.color}}/>{c.title}{explored.includes(c.id)?' ✓':''}</button>)}</div>
    <div className="island-player-pins" aria-hidden="true">{players.map(p=><div key={p.id} ref={el=>{if(el)playerNodes.current.set(p.id,el);else playerNodes.current.delete(p.id);}} style={{background:p.color}}>{p.id+1}</div>)}</div>
    <button className="island-menu" aria-label="切換地圖導覽" aria-expanded={nav} onClick={()=>setNav(!nav)}>☰</button>
    {nav&&<aside className="island-navigation" aria-label="五間日照中心導覽"><strong>城市導覽 {explored.length}/5</strong>{ISLAND_CENTERS.map(c=><button key={c.id} onClick={()=>selectCenter(c.id)}><i style={{background:c.color}}/>{c.title} {explored.includes(c.id)?'✓':''}</button>)}<small>五區庭院皆在實際行走路線上。主題為遊戲設計。</small><button onClick={()=>setMode('overview')}>⌖ 返回城市全景</button></aside>}
    <div className="camera-modes" aria-label="鏡頭模式">{(['overview','follow','focus'] as const).map(m=><button key={m} aria-pressed={mode===m} disabled={m!=='overview'&&!players.length&&centerId===null} onClick={()=>setMode(m,m==='focus'?(players[useGameStore.getState().currentPlayerIndex]?.position??0):undefined)}>{m==='overview'?'全景':m==='follow'?'跟隨':'聚焦'}</button>)}</div>
    <div className="island-zoom"><button aria-label="縮小城市" onClick={()=>api.current?.zoom(.85)}>−</button><button aria-label="放大城市" onClick={()=>api.current?.zoom(1.15)}>＋</button></div>
    <output className="city-performance" ref={stats} aria-label="目前渲染效能">量測中…{phase==='SETUP'?'':''}</output>
  </div>;
}
