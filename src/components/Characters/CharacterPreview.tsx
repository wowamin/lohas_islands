import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCharacterModel } from './model';
import { CHARACTER_IDS } from '../../game/characters';
import type { CharacterId } from '../../game/characters';
import { CharacterPortrait } from './CharacterPortrait';
export function CharacterPreview({selected,color,onSelect}:{selected:CharacterId;color:string;onSelect:(id:CharacterId)=>void}){
  const [autoRotate,setAutoRotate]=useState(true);
  const host=useRef<HTMLDivElement>(null),handlers=useRef({onSelect,selected,autoRotate});
  useEffect(()=>{handlers.current={onSelect,selected,autoRotate};},[onSelect,selected,autoRotate]);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    const parent=host.current;if(!parent)return;
    let mounted=true,renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{queueMicrotask(()=>{if(mounted)setFailed(true);});return()=>{mounted=false;};}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.1,30);camera.position.set(0,1.15,3.4);
    scene.add(new T.HemisphereLight('#fff5e7','#8b9b81',2));const key=new T.DirectionalLight('#fff0de',3.2);key.position.set(-2,4,5);scene.add(key);const fill=new T.DirectionalLight('#d9eeed',1.5);fill.position.set(3,2,-2);scene.add(fill);
    const models=CHARACTER_IDS.map((id,index)=>{const model=createCharacterModel({characterId:id,color,quality:'medium'});model.root.position.x=index===0?-.63:.63;scene.add(model.root);return model;});
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.57,0);controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=true;controls.minPolarAngle=.55;controls.maxPolarAngle=1.55;controls.update();
    const canvas=renderer.domElement;canvas.setAttribute('aria-label','爺爺與奶奶立體角色預覽，可拖曳旋轉，也可使用下方角色按鈕選擇');canvas.style.touchAction='pan-y';parent.appendChild(canvas);
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');let reduced=media.matches;const preference=()=>{reduced=media.matches;};media.addEventListener('change',preference);
    const resize=()=>{const w=parent.clientWidth,h=Math.max(1,parent.clientHeight);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(parent);resize();
    const raycaster=new T.Raycaster(),pointer=new T.Vector2();let downX=0,downY=0;
    const down=(e:PointerEvent)=>{downX=e.clientX;downY=e.clientY;};const up=(e:PointerEvent)=>{
      if(Math.hypot(e.clientX-downX,e.clientY-downY)>6)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
      const hit=raycaster.intersectObjects(models.map(m=>m.root),true)[0];if(!hit)return;let node:T.Object3D|null=hit.object;while(node){const id=node.userData.characterId as CharacterId|undefined;if(id){handlers.current.onSelect(id);break;}node=node.parent;}
    };
    const lost=(event:Event)=>{event.preventDefault();cancelAnimationFrame(frame);setFailed(true);};canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('webglcontextlost',lost);
    let frame=0,last=performance.now(),rotation=-.12;
    const tick=(now:number)=>{frame=requestAnimationFrame(tick);const dt=Math.min(.05,(now-last)/1000);last=now;if(document.hidden)return;if(!reduced&&handlers.current.autoRotate)rotation+=dt*.22;controls.update();for(const model of models){const chosen=model.characterId===handlers.current.selected;model.root.rotation.y=reduced?-.12:rotation;model.root.scale.setScalar(reduced?(chosen?1.06:1):T.MathUtils.lerp(model.root.scale.x,chosen?1.06:1,1-Math.exp(-dt*9)));model.update(dt,{motion:'idle',reducedMotion:reduced||!handlers.current.autoRotate});}canvas.dataset.rotation=String(reduced?-.12:rotation);renderer.render(scene,camera);};frame=requestAnimationFrame(tick);
    return()=>{mounted=false;cancelAnimationFrame(frame);observer.disconnect();media.removeEventListener('change',preference);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('webglcontextlost',lost);controls.dispose();models.forEach(m=>m.dispose());renderer.dispose();canvas.remove();};
  },[color]);
  return <div className={'character-preview'+(failed?' is-fallback':'')} ref={host} data-selected-character={selected}>{!failed&&<button type="button" className="character-rotation-toggle" aria-pressed={!autoRotate} onClick={()=>setAutoRotate(!autoRotate)}>{autoRotate?'暫停自轉':'繼續自轉'}</button>}{failed&&<div className="character-preview-fallback" role="group" aria-label="目前使用2D角色預覽">{CHARACTER_IDS.map(id=><button key={id} type="button" aria-label={`選擇${id==='grandpa'?'爺爺':'奶奶'}`} aria-pressed={selected===id} onClick={()=>onSelect(id)}><CharacterPortrait characterId={id} color={color} aria-hidden="true"/></button>)}</div>}</div>;
}
