import * as T from 'three';
import { buildCareDistrict } from './model';
import { BOARD_DATA } from '../../game/board';
import { CENTERS, centerWorld, routePosition, seededRandom, CITY_SEED } from '../../game/cityLayout';
import { QUALITY } from '../../game/citySettings';
import type { Quality } from '../../game/citySettings';

export const ISLAND_CENTERS=CENTERS.map(c=>({...c,at:centerWorld(c,0,0,3.15)}));
export const islandStation=routePosition;
export function buildCareIsland(night=false,quality:Quality='medium'){
  const source=buildCareDistrict(night),root=new T.Group();root.name='FiveCentersCity';root.userData.seed=CITY_SEED;
  const geometries=new Map<string,T.BufferGeometry>(),materials=new Map<string,T.MeshLambertMaterial>();
  const material=(color:string)=>{if(!materials.has(color))materials.set(color,new T.MeshLambertMaterial({color,flatShading:true}));return materials.get(color)!;};
  const geometry=(key:string,fn:()=>T.BufferGeometry)=>{if(!geometries.has(key))geometries.set(key,fn());return geometries.get(key)!;};
  function mesh(g:T.BufferGeometry,color:string,at:readonly number[],parent:T.Group=root){const m=new T.Mesh(g,material(color));m.position.set(at[0],at[1],at[2]);m.receiveShadow=true;parent.add(m);return m;}
  function box(size:[number,number,number],at:readonly number[],color:string,parent=root){return mesh(geometry('b'+size.map(v=>v.toFixed(4)).join(','),()=>new T.BoxGeometry(...size)),color,at,parent);}
  function orb(r:number,at:readonly number[],color:string,parent=root){return mesh(geometry('o'+r,()=>new T.IcosahedronGeometry(r,0)),color,at,parent);}
  function disc(r:number,h:number,at:readonly number[],color:string,parent=root,n=24){return mesh(geometry('c'+[r,h,n],()=>new T.CylinderGeometry(r,r,h,n)),color,at,parent);}
  const ground=disc(16.5,.18,[0,-.18,0],night?'#8d987e':'#e5d8b6',root,64);ground.receiveShadow=true;
  disc(16.15,.08,[0,-.06,0],night?'#6c866e':'#b9cda4',root,64);
  // Fixed route, independent of decoration seed and quality. Segment endpoints are exact stops.
  const roads=new T.Group();roads.name='Fixed50Road';root.add(roads);
  for(const tile of BOARD_DATA){
    const [x,,z]=tile.position,[nx,,nz]=BOARD_DATA[tile.next].position;
    const length=Math.hypot(nx-x,nz-z),segment=box([length+.08,.045,.9],[(x+nx)/2,.125,(z+nz)/2],'#eadfc6',roads);segment.rotation.y=-Math.atan2(nz-z,nx-x);
    disc(.47,.035,[x,.17,z],'#eadfc6',roads,16);
    const stop=disc(.27,.035,[x,.205,z],tile.color,roads,16);stop.name='stop-'+tile.id;stop.userData.tileId=tile.id;
    if(tile.id%10===9){const crossing=new T.Group();crossing.position.set((x+nx)/2,.16,(z+nz)/2);crossing.rotation.y=segment.rotation.y;roads.add(crossing);for(let i=-2;i<=2;i++)box([.11,.008,.82],[i*.21,0,0],'#fffaf0',crossing);}
  }
  const template=source.root.getObjectByName('DayCareCenter')!;
  const wheelchair=source.root.getObjectByName('CareResident-wheelchair')!;
  const walker=source.root.getObjectByName('CareResident-walker')!;
  const caregiver=source.root.getObjectByName('CareResident-stand')!;
  const courtyardBounds:Record<string,{minX:number;maxX:number;minZ:number;maxZ:number}>={};
  for(const center of ISLAND_CENTERS){
    const group=new T.Group();group.name=center.id;group.userData.centerId=center.id;group.position.set(center.position[0],.15,center.position[1]);group.rotation.y=center.rotation;root.add(group);
    box([10,.04,5],[0,-.07,2.1],night?'#829483':'#d6ddbd',group);
    courtyardBounds[center.id]={minX:-5,maxX:5,minZ:0,maxZ:4.6};
    const building=template.clone(true);building.position.set(0,0,0);building.userData.centerId=center.id;group.add(building);
    building.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;if(o.material instanceof T.MeshLambertMaterial&&o.material.color.getHexString()==='568d87')o.material=material(center.color);o.geometry.computeBoundingBox();const size=o.geometry.boundingBox!.getSize(new T.Vector3());o.userData.detail=Math.min(size.x,size.y,size.z)<.035&&Math.max(size.x,size.y,size.z)<.7;if(quality==='low'&&o.userData.detail)o.visible=false;}});
    // Porch, ramp and a clear gated courtyard. Nothing is generated on the fixed walkway.
    box([1.8,.08,.65],[0,.02,1.5],'#f5f0e5',group);
    const ramp=box([1.7,.05,.7],[1.4,.02,1.3],'#e6d6b8',group);ramp.rotation.z=-.05;
    for(const x of [-4.95,4.95]){box([.06,.45,3.1],[x,.2,2.5],'#cfb58a',group);for(let z=1.1;z<4.2;z+=.65)box([.08,.6,.08],[x,.3,z],'#b6a181',group);}
    // Seats, flowers and notice-board are safely inside the inner loop of each courtyard.
    for(const x of [-1.1,1.1]){box([.7,.08,.3],[x,.35,2],'#cca577',group);box([.7,.25,.045],[x,.49,1.88],'#cca577',group);}
    for(const x of [-2.8,2.8]){box([.65,.23,.48],[x,.15,1.1],'#dbb69a',group);for(const dx of [-.2,0,.2])orb(.13,[x+dx,.36,1.1],center.color,group);}
    box([.8,.5,.08],[0,.75,1.25],'#fff2d9',group);for(const x of [-.33,.33])box([.045,.7,.045],[x,.35,1.25],'#b9a27e',group);
    for(const [prototype,x,z] of [[wheelchair,-.45,2.1],[caregiver,.35,2.1],[walker,2,1.3]] as const){const resident=prototype.clone(true);resident.position.set(x,.06,z);group.add(resident);}
    // Each theme is a game vignette, never a claim about the real center's services.
    if(center.id==='dahe'){
      for(const x of [-2.7,2.7])for(const z of [.75,1.2])orb(.12,[x,.39,z],'#7fa477',group);
      const pergola=new T.Group();pergola.position.set(0,0,2.2);group.add(pergola);for(const x of [-.65,.65])for(const z of [-.3,.3])box([.055,1.1,.055],[x,.6,z],'#bea07b',pergola);for(let x=-.8;x<=.8;x+=.2)box([.08,.06,.95],[x,1.18,0],'#e2c7a2',pergola);
    }else if(center.id==='annan'){
      for(const x of [-2.8,2.8]){box([.7,.35,.4],[x,.25,.6],'#d2ba8f',group);box([1,.12,.8],[x,.88,.6],center.color,group);for(const dx of [-.35,.35])box([.04,.7,.04],[x+dx,.5,.6],'#e9dab7',group);}
      disc(.42,.08,[0,.4,2.15],'#d0b48c',group,12);
    }else if(center.id==='xinying'){
      box([2,.85,.09],[0,.52,1.3],'#b9a388',group);for(const x of [-.65,0,.65])box([.45,.42,.035],[x,.65,1.36],x===0?'#e8c6a6':'#c6d6c5',group);
      for(const x of [-2.9,2.9])box([.55,.65,.5],[x,.4,.65],'#dba998',group);
    }else if(center.id==='yihe'){
      for(const x of [-.55,.55]){box([.04,.55,1.45],[x,.7,2.15],'#89a9a0',group);for(const z of [1.6,2.7])box([.05,.68,.05],[x,.4,z],'#8ca89a',group);}
      for(const z of [1.7,2.05,2.4])disc(.17,.035,[0,.16,z],'#d7c690',group,12);
    }else{
      for(const x of [-2.5,2.5]){box([.5,.65,.035],[x,.8,.8],'#f5f0e5',group);for(const dx of [-.18,.18]){const leg=box([.045,.9,.045],[x+dx,.45,.8],'#b59a7a',group);leg.rotation.z=dx>0?-.15:.15;}orb(.11,[x,.85,.85],center.color,group);}
      disc(.5,.07,[0,.19,2.2],'#c4b2cd',group,16);for(const x of [-.35,0,.35])box([.035,.5,.035],[x,.65,1.7],'#8eab9b',group);
    }
  }
  // Central green park, lake and bridges, kept away from all courtyard stop coordinates.
  disc(3.6,.035,[0,.04,0],night?'#6d9188':'#b0cba8',root,32);
  const lake=disc(1.65,.025,[0,.08,0],night?'#5d99a6':'#80c4c8',root,32);lake.scale.z=.75;
  box([3.5,.12,.65],[0,.22,0],'#c8a67f');for(const z of [-.36,.36])box([3.5,.055,.055],[0,.6,z],'#ba9b77');
  // Fixed-seed decoration placements; collision guard uses the complete route segments.
  const random=seededRandom();
  function roadDistance(x:number,z:number){let best=Infinity;for(const tile of BOARD_DATA){const a=tile.position,b=BOARD_DATA[tile.next].position;const dx=b[0]-a[0],dz=b[2]-a[2],t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz),0,1);best=Math.min(best,Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz));}return best;}
  const decorations:{x:number;z:number;kind:string}[]=[];
  const trees=new T.Group();trees.name='InstancedTrees';root.add(trees);
  const treePositions:[number,number,number][]=[];
  for(let i=0;i<QUALITY[quality].treeCount*4&&treePositions.length<QUALITY[quality].treeCount;i++){
    const angle=random()*Math.PI*2,r=13.6+random()*1.7,x=Math.cos(angle)*r,z=Math.sin(angle)*r;
    if(roadDistance(x,z)<1.1||CENTERS.some(c=>Math.hypot(x-c.position[0],z-c.position[1])<3.5))continue;
    treePositions.push([x,z,.65+random()*.45]);decorations.push({x,z,kind:'tree'});
  }
  function instances(g:T.BufferGeometry,color:string,positions:[number,number,number][],dy:number,foliage=false){
    const inst=new T.InstancedMesh(g,material(color),positions.length),dummy=new T.Object3D();
    positions.forEach(([x,z,s],i)=>{dummy.position.set(x,dy*s,z);dummy.scale.setScalar(s);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);if(foliage)inst.setColorAt(i,new T.Color(i%9===0?'#e1b8bd':i%2?'#a9c8a2':'#85ad83'));});inst.instanceMatrix.needsUpdate=true;inst.receiveShadow=true;trees.add(inst);return inst;
  }
  instances(geometry('trunk',()=>new T.CylinderGeometry(.055,.075,.8,5)),'#ac9574',treePositions,.4);
  instances(geometry('foliage',()=>new T.IcosahedronGeometry(.47,0)),'#ffffff',treePositions,1.04,true);
  // Road lamps use instancing too, with one shared geometry/material per part.
  const lampPositions:[number,number,number][]=CENTERS.flatMap(c=>[-1,1].map(side=>{const p=centerWorld(c,side*4.9,-.6);return[p[0],p[2],1] as [number,number,number];}));
  instances(geometry('lamp-post',()=>new T.CylinderGeometry(.027,.04,1.1,5)),'#7b9687',lampPositions,.55);
  instances(geometry('lamp-head',()=>new T.IcosahedronGeometry(.12,0)),night?'#ffe2a0':'#f5edd6',lampPositions,1.15);
  // Low distant town silhouette: homes, market, and clinic around the outer edge.
  const town=new T.Group();town.name='DistantTownLOD';root.add(town);
  for(let i=0;i<10;i++){
    const angle=i/10*Math.PI*2+.22,r=14.1,x=Math.cos(angle)*r,z=Math.sin(angle)*r;
    if(roadDistance(x,z)<1.25||CENTERS.some(c=>Math.hypot(x-c.position[0],z-c.position[1])<3.5))continue;
    const home=new T.Group();home.position.set(x,0,z);home.rotation.y=-angle;town.add(home);
    box([.9,.65,.8],[0,.35,0],i===0?'#d8e6d9':'#f2e7d3',home);
    const roof=mesh(geometry('house-roof',()=>new T.ConeGeometry(.76,.4,4)),i%2?'#a9cce2':'#e8b29b',[0,.84,0],home);roof.rotation.y=Math.PI/4;
    box([.22,.28,.03],[-.2,.47,.42],'#9fc2c4',home);box([.2,.4,.03],[.2,.27,.42],'#aa9478',home);
    if(i===0){box([.38,.08,.04],[0,.7,.44],'#7aa590',home);box([.08,.35,.04],[0,.7,.44],'#7aa590',home);}
    decorations.push({x,z,kind:i===0?'clinic':i%3===0?'shop':'home'});
  }
  // Merge repeated static meshes into instances while preserving per-instance center hit targets.
  const batches=new Map<string,{g:T.BufferGeometry;m:T.Material;items:{matrix:T.Matrix4;centerId?:string;detail:boolean;shadow:boolean}[]}>();
  root.updateMatrixWorld(true);const originals:T.Mesh[]=[];
  root.traverse(o=>{if(!(o instanceof T.Mesh)||o instanceof T.InstancedMesh||!o.visible||Array.isArray(o.material))return;let p:T.Object3D|null=o,id:string|undefined;while(p){if(p.userData.centerId){id=p.userData.centerId;break;}p=p.parent;}const key=o.geometry.uuid+':'+o.material.uuid+':'+!!o.userData.detail;let batch=batches.get(key);if(!batch){batch={g:o.geometry,m:o.material,items:[]};batches.set(key,batch);}batch.items.push({matrix:o.matrixWorld.clone(),centerId:id,detail:!!o.userData.detail,shadow:o.castShadow});originals.push(o);});
  originals.forEach(o=>o.removeFromParent());
  const detailBatches:T.InstancedMesh[]=[],instanced:T.InstancedMesh[]=[];
  for(const batch of batches.values()){const m=new T.InstancedMesh(batch.g,batch.m,batch.items.length);batch.items.forEach((item,i)=>m.setMatrixAt(i,item.matrix));m.instanceMatrix.needsUpdate=true;m.userData.centerIds=batch.items.map(item=>item.centerId);m.userData.detail=batch.items[0].detail;m.castShadow=batch.items.some(i=>i.shadow);m.receiveShadow=true;root.add(m);instanced.push(m);if(m.userData.detail)detailBatches.push(m);}
  const bus=source.root.getObjectByName('AccessibleShuttle')!.clone(true);root.add(bus);bus.position.set(4.6,.15,0);
  root.userData.decorations=decorations;root.userData.courtyardBounds=courtyardBounds;
  // The old caller API is retained; distant detail is omitted at low zoom/quality.
  const rings=new Map<string,T.Mesh>();
  function update(time:number,reduced=false,zoom=1){for(const m of detailBatches)m.visible=quality!=='low'&&zoom>=1.05;if(!reduced){const a=time*.035;bus.position.set(Math.cos(a)*4.6,.15,Math.sin(a)*4.6);bus.rotation.y=-a-Math.PI/2;}}
  return {root,rings,update,dispose(){root.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});source.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
