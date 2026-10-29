import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ISLAND_CENTERS } from './islandModel';

export type LightingLayout = 'island' | 'district';
export function createLightingRig(scene:T.Scene,night:boolean,layout:LightingLayout,compact=false) {
  const group=new T.Group();group.name='CareSoftLighting';scene.add(group);
  const ambient=new T.AmbientLight('#fff3db',night?.12:.22);group.add(ambient);
  const sky=new T.HemisphereLight(night?'#9dbdde':'#d7eeff',night?'#5f7269':'#a2b98b',night?.8:1.25);group.add(sky);
  const sun=new T.DirectionalLight(night?'#b6cff2':'#fff0cf',night?.8:3.0);
  sun.position.set(layout==='island'?-13:-7,layout==='island'?26:16,layout==='island'?16:10);
  sun.target.position.set(0,.2,0);sun.castShadow=true;
  const extent=layout==='island'?18:10;
  Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,near:.5,far:85});sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.mapSize.set(compact?1024:2048,compact?1024:2048);
  sun.shadow.bias=-.00015;sun.shadow.normalBias=.018;sun.shadow.radius=compact?2.5:3.5;sun.shadow.blurSamples=compact?4:6;sun.shadow.intensity=night?.43:.66;
  group.add(sun,sun.target);
  const rim=new T.DirectionalLight(night?'#89b9d1':'#e4f3eb',night?.15:.5);rim.position.set(10,9,-10);group.add(rim);
  const pools:T.Mesh[]=[];let poolTexture:T.DataTexture|null=null;
  if(night){
    const n=48,data=new Uint8Array(n*n*4);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){const r=Math.hypot((x+.5)/n*2-1,(y+.5)/n*2-1),i=(y*n+x)*4;data[i]=255;data[i+1]=230;data[i+2]=180;data[i+3]=Math.round(Math.pow(Math.max(0,1-r),2)*100);}
    poolTexture=new T.DataTexture(data,n,n,T.RGBAFormat);poolTexture.needsUpdate=true;poolTexture.magFilter=T.LinearFilter;poolTexture.minFilter=T.LinearFilter;
    const points=layout==='island'?ISLAND_CENTERS.map(c=>[c.position[0],c.position[1]+1.5]):[[-.9,.65],[3.9,2.9],[-3.8,1.1]];
    points.forEach(([x,z],i)=>{
      const pool=new T.Mesh(new T.PlaneGeometry(2.1,2.1),new T.MeshBasicMaterial({map:poolTexture,color:'#ffe2a6',transparent:true,depthWrite:false,opacity:.65,blending:T.AdditiveBlending}));pool.position.set(x,.255,z);pool.rotation.x=-Math.PI/2;pool.renderOrder=3;group.add(pool);pools.push(pool);
      if(i%2===0){const lamp=new T.PointLight('#ffd6a0',5,4,2);lamp.position.set(x,.95,z);group.add(lamp);}
    });
  }
  return{sun,group,setShadow(value:number){sun.shadow.intensity=T.MathUtils.clamp(value,0,.9)*(night?.7:1);},dispose(){scene.remove(group);sun.shadow.dispose();for(const pool of pools){pool.geometry.dispose();(pool.material as T.Material).dispose();}poolTexture?.dispose();}};
}

const WATER=new Set(['80c4c8','5d99a6','8cd1c3','5a9fa7']);
const GLASS=new Set(['8fc4c6','97bcc3','a1c5ca','83b4bb','accbd0','f9dfa1']);
const GLOW=new Set(['f9dfa1','ffe0a0','ffe2a0','ffe6a2']);
export function upgradeLightingMaterials(root:T.Object3D,night:boolean){
  const converted=new Map<T.Material,T.MeshStandardMaterial>(),originals:{mesh:T.Mesh;material:T.Material|T.Material[]}[]=[];
  root.traverse(o=>{
    if(!(o instanceof T.Mesh)||Array.isArray(o.material)||!(o.material instanceof T.MeshLambertMaterial))return;
    const old=o.material;originals.push({mesh:o,material:old});
    if(!converted.has(old)){
      const hex=old.color.getHexString(),water=WATER.has(hex),glass=GLASS.has(hex);
      const common={color:old.color.clone(),flatShading:old.flatShading,side:old.side,roughness:water?.24:glass?.28:.83,metalness:water?.025:glass?.1:0,envMapIntensity:water?.75:glass?.5:.13};
      const next=water||glass?new T.MeshPhysicalMaterial({...common,clearcoat:water?.85:.55,clearcoatRoughness:water?.25:.3}):new T.MeshStandardMaterial(common);
      if(night&&GLOW.has(hex)){next.emissive.set('#ffc978');next.emissiveIntensity=.65;}
      converted.set(old,next);
    }
    o.material=converted.get(old)!;
  });
  return()=>{for(const {mesh,material} of originals)mesh.material=material;converted.forEach(m=>m.dispose());};
}

export function configureWebGLLighting(renderer:T.WebGLRenderer,scene:T.Scene,root:T.Object3D,night:boolean,layout:LightingLayout,compact=false){
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=night?1.08:.98;
  renderer.shadowMap.enabled=true;
  // PCFSoftShadowMap was removed in the installed Three version. VSM supplies
  // an actual blur pass; ordinary PCF is the supported fallback for limited GPUs.
  renderer.shadowMap.type=renderer.extensions.has('EXT_color_buffer_float')?T.VSMShadowMap:T.PCFShadowMap;
  scene.background=new T.Color(night?'#1c3442':'#d8eae7');
  const restoreMaterials=upgradeLightingMaterials(root,night);
  const rig=createLightingRig(scene,night,layout,compact);
  let environment:T.WebGLRenderTarget|null=null;
  const previousEnvironment=scene.environment;
  const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer);
  try{environment=pmrem.fromScene(room,.04,.1,100,{size:compact?128:256});scene.environment=environment.texture;scene.environmentIntensity=night?.32:.6;}catch{scene.environment=previousEnvironment;}finally{room.dispose();pmrem.dispose();}
  return {set(brightness:number,shadow:number){renderer.toneMappingExposure=(night?1.08:.98)*T.MathUtils.clamp(brightness,.7,1.3);rig.setShadow(shadow);},dispose(){scene.environment=previousEnvironment;environment?.dispose();restoreMaterials();rig.dispose();}};
}
