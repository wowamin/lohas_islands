import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { refinePainterSurfaces, sortPainterGroups } from './painterGeometry';
import { configureWebGLLighting } from './lighting';
import { SVGRenderer } from 'three/addons/renderers/SVGRenderer.js';
import { buildCareDistrict, DISTRICT_STOPS } from './model';
import type { DistrictStopId } from './model';
import type { ServiceKey } from '../../game/types';

type Flight = { target: T.Vector3; camera: T.Vector3 };
export default function CareDistrict({gpu,night,resetKey,brightness,shadow,onResource}:{gpu:boolean;night:boolean;resetKey:number;brightness:number;shadow:number;onResource:(s:ServiceKey)=>void}) {
  const host=useRef<HTMLDivElement>(null);
  const pins=useRef(new Map<DistrictStopId,HTMLButtonElement>());
  const api=useRef<{focus:(id:DistrictStopId|null)=>void;zoom:(factor:number)=>void;light:(brightness:number,shadow:number)=>void}|null>(null);
  const [active,setActive]=useState<DistrictStopId|null>(null);
  const [compatible,setCompatible]=useState(!gpu);
  const [paths,setPaths]=useState(true);
  const chosen=DISTRICT_STOPS.find(s=>s.id===active);
  useEffect(()=>{
    const parent=host.current;if(!parent)return;
    const model=buildCareDistrict(night);
    const scene=new T.Scene();scene.background=new T.Color(night?'#253d48':'#dfebe2');scene.add(model.root);
    const ambient=new T.AmbientLight(night?'#cedaee':'#fff5dc',night?.5:.85);scene.add(ambient);
    const sun=new T.DirectionalLight(night?'#a8bedf':'#fff1d3',night?.6:1.15);sun.position.set(-4,12,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-9;sun.shadow.camera.right=9;sun.shadow.camera.top=9;sun.shadow.camera.bottom=-9;sun.shadow.normalBias=.025;scene.add(sun);
    const fill=new T.DirectionalLight('#cde4dd',.28);fill.position.set(8,5,-4);scene.add(fill);
    const camera=new T.OrthographicCamera(-9,9,7,-7,.1,100);camera.position.set(12,13,16);camera.lookAt(0,.3,0);
    let renderer:T.WebGLRenderer|SVGRenderer;
    try{if(!gpu)throw new Error('compatible');const webgl=new T.WebGLRenderer({antialias:true,alpha:false});webgl.setPixelRatio(Math.min(window.devicePixelRatio,1.5));webgl.shadowMap.enabled=true;webgl.shadowMap.type=T.PCFShadowMap;webgl.outputColorSpace=T.SRGBColorSpace;renderer=webgl;setCompatible(false);}catch{renderer=new SVGRenderer();renderer.setQuality('low');setCompatible(true);}
    renderer.domElement.setAttribute('aria-label','日照中心立體示範街區，可拖曳旋轉與縮放');renderer.domElement.style.display='block';renderer.domElement.style.touchAction='none';parent.appendChild(renderer.domElement);
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.3,0);controls.enableDamping=true;controls.dampingFactor=.12;controls.minPolarAngle=.35;controls.maxPolarAngle=1.25;controls.minZoom=.65;controls.maxZoom=2.5;controls.rotateSpeed=.5;controls.enablePan=true;controls.update();
    const gpuActive=renderer instanceof T.WebGLRenderer;
    const lightRig=renderer instanceof T.WebGLRenderer?configureWebGLLighting(renderer,scene,model.root,night,'district',parent.clientWidth<800):null;if(lightRig){scene.remove(ambient,sun,fill);sun.shadow.dispose();}
    const disposePainter=gpuActive?()=>{}:refinePainterSurfaces(model.root);
    if(!gpuActive){ambient.color.multiplyScalar(night?.3:.45);sun.intensity=night?.4:.6;fill.intensity=.15;}
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dirty=true,flight:Flight|null=null,frame=0,last=0;
    const flag=()=>{dirty=true;};controls.addEventListener('change',flag);
    controls.addEventListener('start',()=>{flight=null;});
    const project=new T.Vector3();
    const measure=()=>{const w=parent.clientWidth,h=parent.clientHeight;const aspect=w/Math.max(h,1);camera.left=-7.5*aspect;camera.right=7.5*aspect;camera.top=7.5;camera.bottom=-7.5;camera.updateProjectionMatrix();renderer.setSize(w,h);dirty=true;};
    const observer=new ResizeObserver(measure);observer.observe(parent);measure();
    const focus=(id:DistrictStopId|null)=>{
      const stop=DISTRICT_STOPS.find(s=>s.id===id);
      model.rings.forEach((ring,key)=>{ring.visible=key===id;});
      const target=stop?new T.Vector3(stop.at[0],.6,stop.at[2]):new T.Vector3(0,.3,0);
      const position=stop?target.clone().add(new T.Vector3(8,10,12)):new T.Vector3(12,13,16);
      camera.zoom=stop?1.35:1;camera.updateProjectionMatrix();
      if(reduced){camera.position.copy(position);controls.target.copy(target);}else flight={target,camera:position};dirty=true;
    };
    api.current={focus,light(b,s){lightRig?.set(b,s);if(!gpuActive)renderer.domElement.style.filter='brightness('+b+')';dirty=true;},zoom(factor){camera.zoom=T.MathUtils.clamp(camera.zoom*factor,.65,2.5);camera.updateProjectionMatrix();dirty=true;}};
    const tick=(now:number)=>{
      frame=requestAnimationFrame(tick);const delta=Math.min((now-last)/1000,.05);last=now;
      if(flight){const factor=1-Math.exp(-delta*5);camera.position.lerp(flight.camera,factor);controls.target.lerp(flight.target,factor);dirty=true;if(camera.position.distanceTo(flight.camera)<.03)flight=null;}
      controls.update();
      if(gpuActive&&!reduced){model.update(now/1000);dirty=true;}
      if(dirty){scene.updateMatrixWorld(true);if(!gpuActive)sortPainterGroups(model.root,camera);renderer.render(scene,camera);
        const w=parent.clientWidth,h=parent.clientHeight;
        for(const stop of DISTRICT_STOPS){const pin=pins.current.get(stop.id);if(!pin)continue;project.set(stop.at[0],stop.at[1],stop.at[2]).project(camera);const x=(project.x*.5+.5)*w,y=(-project.y*.5+.5)*h;pin.style.transform='translate('+x+'px,'+y+'px) translate(-50%,-100%)';pin.style.visibility=project.z<1&&x>0&&x<w&&y>0&&y<h?'visible':'hidden';}
        dirty=false;
      }
    };frame=requestAnimationFrame(tick);
    return()=>{api.current=null;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();if(renderer instanceof T.WebGLRenderer)renderer.dispose();renderer.domElement.remove();disposePainter();lightRig?.dispose();model.dispose();};
  },[gpu,night]);
  useEffect(()=>{api.current?.light(brightness,shadow);},[brightness,shadow,night,gpu]);
  useEffect(()=>{setActive(null);api.current?.focus(null);},[resetKey]);
  useEffect(()=>{api.current?.focus(active);},[active,night,gpu]);
  return <div className={'care-district'+(paths?' show-district-paths':'')}>
    <div className="district-render" ref={host}/>
    <div className="district-pins" aria-label="示範街區探索點">{DISTRICT_STOPS.map((stop,i)=><button key={stop.id} ref={el=>{if(el)pins.current.set(stop.id,el);else pins.current.delete(stop.id);}} aria-pressed={active===stop.id} onClick={()=>setActive(stop.id)}><span>{String(i+1).padStart(2,'0')}</span><strong>{stop.title}</strong><i>↗</i></button>)}</div>
    <aside className="district-intro"><span>NEIGHBORHOOD / 01</span><h2>在這裡，<br/>日子有人陪。</h2><p>從一趟接送、一場活動，<br/>到樹蔭下的片刻休息。</p><div className="district-chips"><span>日間照顧</span><span>友善動線</span><span>社區共融</span></div><small>拖曳旋轉 · 滾輪縮放<br/>點選 4 個標記，走近生活場景。</small></aside>
    {chosen&&<aside className="district-story" aria-label="示範街區介紹"><button className="detail-close" aria-label="關閉街區介紹" onClick={()=>setActive(null)}>×</button><span>{chosen.kicker}</span><h2>{chosen.title}</h2><p>{chosen.body}</p><div className="district-story-stop">對應原棋盤 · 第 {chosen.tileId+1} 格</div><button className="detail-resource" onClick={()=>onResource(chosen.service)}>了解相關服務 ↗</button><small>目前為場景探索；返回城市後繼續原遊戲。</small></aside>}
    <div className="district-controls"><button aria-label="縮小示範街區" onClick={()=>api.current?.zoom(.85)}>−</button><button onClick={()=>{setActive(null);api.current?.focus(null);}}>全景</button><button aria-label="放大示範街區" onClick={()=>api.current?.zoom(1.15)}>＋</button><button aria-pressed={paths} onClick={()=>setPaths(!paths)}>探索標記</button></div>
    <div className="district-caption">{compatible?'相容立體檢視 · 可旋轉與縮放':'3D 即時場景 · 柔光與動態人物'}<span>教育情境示意，非實際機構配置</span></div>
  </div>;
}
