import * as T from 'three';
import { buildCareDistrict } from './model';

export const ISLAND_CENTERS = [
  {id:'longshan',title:'龍山日照中心',color:'#82a56c',at:[-7,2.9,-.8],position:[-7,-1.5]},
  {id:'xinying',title:'新營日照中心',color:'#df9a91',at:[-2.3,2.9,-5],position:[-2.3,-5.7]},
  {id:'annan',title:'安南日照中心',color:'#af8bc4',at:[6.1,2.9,-3.2],position:[6.1,-3.9]},
  {id:'dahe',title:'大和日照中心',color:'#70adc1',at:[6.2,2.9,3.9],position:[6.2,3.2]},
  {id:'yihe',title:'義合日照中心',color:'#d4a069',at:[-4.4,2.9,4.8],position:[-4.4,4.1]},
] as const;
export function islandStation(id:number):[number,number,number] {
  const a=Math.PI*.75-id/40*Math.PI*2;
  return [10.5*Math.cos(a),.24,8.2*Math.sin(a)];
}
export function buildCareIsland(night=false) {
  const source=buildCareDistrict(night);
  const root=new T.Group();root.name='FiveCentersIsland';
  const geometries=new Map<string,T.BufferGeometry>(),materials=new Map<string,T.MeshLambertMaterial>();
  const material=(color:string)=>{if(!materials.has(color))materials.set(color,new T.MeshLambertMaterial({color}));return materials.get(color)!;};
  const geometry=(key:string,fn:()=>T.BufferGeometry)=>{if(!geometries.has(key))geometries.set(key,fn());return geometries.get(key)!;};
  function mesh(g:T.BufferGeometry,color:string,at:[number,number,number],parent=root){const m=new T.Mesh(g,material(color));m.position.set(...at);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(size:[number,number,number],at:[number,number,number],color:string,parent=root){return mesh(geometry('b'+size,()=>new T.BoxGeometry(...size,Math.ceil(size[0]/.7),1,Math.ceil(size[2]/.7))),color,at,parent);}
  function orb(r:number,at:[number,number,number],color:string,parent=root){return mesh(geometry('o'+r,()=>new T.IcosahedronGeometry(r,1)),color,at,parent);}
  function disc(r:number,h:number,at:[number,number,number],color:string,parent=root){return mesh(geometry('c'+[r,h],()=>new T.CylinderGeometry(r,r,h,16)),color,at,parent);}
  // Organic island top, split into small faces for correct compatible rendering.
  function ground(w:number,d:number,y:number,color:string) {
    const g=new T.PlaneGeometry(w,d,40,32);g.rotateX(-Math.PI/2);
    const a=g.getAttribute('position');for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i);const edge=Math.max(Math.abs(x)/(w/2),Math.abs(z)/(d/2));const corner=Math.pow(Math.abs(x)/(w/2)*Math.abs(z)/(d/2),3);a.setXYZ(i,x*(1-corner*.18),y+(edge>.93?-.07:0),z*(1-corner*.18));}g.computeVertexNormals();geometries.set('ground'+w,g);mesh(g,color,[0,0,0]);
  }
  ground(25.8,20.6,-.16,night?'#aaac8b':'#e7d9ae');ground(24.9,19.7,.03,night?'#708b65':'#b4ca8b');
  // Beach rim, scattered rounded rocks and a pond with a river flowing to the coast.
  const water=night?'#5d99a6':'#80c4c8';
  const lake=disc(2.9,.035,[.25,.095,.15],water);lake.scale.set(1.03,1,1.17);
  const river=box([1.6,.025,8.3],[.4,.09,5.7],water);river.rotation.y=-.12;
  for(let z=2.8;z<9.5;z+=1.1){orb(.32,[-.65+Math.sin(z)*.15,.17,z],'#dddbc4');orb(.23,[1.4,.14,z+.3],'#dad8c0');}
  for(let i=0;i<20;i++){const a=i/20*Math.PI*2;const r=2.95;orb(.22,[.25+Math.cos(a)*r,.16,.15+Math.sin(a)*r*1.17],'#d8d4ba');}
  // Forty accurate stations on one continuous walk; game data remains authoritative.
  const walkShape=new T.Shape();walkShape.absellipse(0,0,11.05,8.75,0,Math.PI*2,false,0);
  const walkHole=new T.Path();walkHole.absellipse(0,0,9.95,7.65,0,Math.PI*2,true,0);walkShape.holes.push(walkHole);
  const pathG=new T.ShapeGeometry(walkShape,80);pathG.rotateX(-Math.PI/2);geometries.set('walk',pathG);mesh(pathG,night?'#b7bba1':'#eee2c8',[0,.12,0]);
  const tileColors=['#bed39f','#eed0a5','#d6c4df','#b6d7df','#b8cba0'];
  for(let i=0;i<40;i++){const[x,,z]=islandStation(i);disc(.34,.035,[x,.17,z],tileColors[Math.floor(i/8)]);}
  const template=source.root.getObjectByName('DayCareCenter')!;
  for(const center of ISLAND_CENTERS){
    const g=new T.Group();g.position.set(center.position[0],.22,center.position[1]);root.add(g);
    box([5.1,.05,3.25],[0,-.02,.22],night?'#98a58c':'#e0dac0',g);
    const building=template.clone(true);building.position.set(0,0,-.2);
    building.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshLambertMaterial&&o.material.color.getHexString()==='568d87')o.material=material(center.color);});g.add(building);
    box([1.8,.04,1.05],[0,.04,1.48],'#f0e4ca',g);
    const ramp=box([1.5,.07,.62],[1.42,.08,1.3],'#e2d6b9',g);ramp.rotation.z=-.11;
    box([1.8,.25,.48],[-1.5,.18,1.43],'#d6ad83',g);
    for(const x of [-2.12,-1.8,-1.48,-1.16])orb(.18,[x,.45,1.43],'#8fb27b',g);
    for(const x of [-2.4,2.4]){const t=new T.Group();t.position.set(x,0,-.9);g.add(t);box([.1,.7,.1],[0,.35,0],'#9a8967',t);orb(.5,[0,1.05,0],'#7fa575',t);orb(.35,[.22,1.28,.07],'#a6bd83',t);}
    for(const x of [-.55,.65])person([center.position[0]+x,.25,center.position[1]+1.5],x<0?'#d49787':'#81a99b',x<0);
  }
  function person(at:[number,number,number],color:string,wheelchair=false){
    const g=new T.Group();g.position.set(...at);root.add(g);orb(.11,[0,wheelchair?.53:.69,0],'#e9c4a1',g);orb(.11,[0,wheelchair?.58:.74,-.02],'#dddcd1',g);box([.19,.25,.14],[0,wheelchair?.32:.46,0],color,g);
    if(wheelchair){box([.24,.05,.28],[0,.2,.04],'#709aa2',g);for(const x of [-.16,.16]){const wheel=mesh(geometry('wheel',()=>new T.TorusGeometry(.17,.024,5,12)),'#627b80',[x,.18,0],g);wheel.rotation.y=Math.PI/2;}box([.18,.04,.22],[0,.16,.2],'#849e9f',g);}else for(const x of [-.06,.06])box([.06,.28,.08],[x,.18,0],'#71878b',g);
  }
  function tree(x:number,z:number,scale=1,pink=false){
    const g=new T.Group();g.position.set(x,.1,z);g.scale.setScalar(scale);root.add(g);box([.1,.8,.1],[0,.4,0],'#9c8d69',g);orb(.48,[0,1.02,0],pink?'#d8aaac':'#8daf76',g);orb(.33,[.25,1.25,.05],pink?'#eac1bc':'#b0c68b',g);orb(.3,[-.27,1.08,.06],pink?'#d6a2ad':'#7da577',g);
  }
  for(let i=0;i<45;i++){const a=i/45*Math.PI*2;tree(11.6*Math.cos(a),9.15*Math.sin(a),.6+(i%4)*.1,i%11===0);}
  for(const[x,z]of[[-7,-4.5],[-3,-2.1],[3,-2.6],[4,1.8],[-2.5,2.2],[-1,5.2],[8,1.2],[2,-6.6],[-8,3]])tree(x,z,.85);
  // Timber bridges, railings and a central meeting place.
  for(const z of [-.6,5.8]){
    const bridge=new T.Group();bridge.position.set(.4,.24,z);root.add(bridge);box([3.2,.13,1],[0,.03,0],'#c8a67f',bridge);
    for(let x=-1.4;x<1.5;x+=.23)box([.035,.015,.99],[x,.11,0],'#e0c19a',bridge);
    for(const side of [-.5,.5]){box([3.3,.055,.055],[0,.55,side],'#b78e66',bridge);for(const x of [-1.4,-.7,0,.7,1.4])box([.06,.5,.06],[x,.3,side],'#b78e66',bridge);}
  }
  const plaza=disc(1.35,.05,[3,.17,.8],'#e8d9b9');plaza.scale.z=.85;
  disc(.4,.13,[3,.28,.8],'#b6d6cf');disc(.31,.015,[3,.355,.8],water);const fountain=disc(.075,.65,[3,.66,.8],'#a2c7bd');fountain.castShadow=false;
  person([3.7,.22,.9],'#cc9c85');person([2.6,.22,1.5],'#9ba9b9',true);
  for(const [x,z]of[[-6,2],[4,7],[8,-.7]]){box([1,.08,.35],[x,.36,z],'#d7ad79');box([1,.28,.05],[x,.54,z-.15],'#d7ad79');}
  // Little accessible shuttle along the boardwalk, kept clear of player markers.
  const bus=new T.Group();bus.name='IslandShuttle';root.add(bus);box([1.25,.48,.6],[0,.46,0],'#e1bb80',bus);box([1.28,.1,.63],[0,.76,0],'#f2e6c8',bus);box([.92,.22,.03],[0,.58,.31],'#97bcc3',bus);for(const x of[-.42,.42])for(const z of[-.3,.3]){const w=disc(.12,.055,[x,.15,z],'#5c7376',bus);w.rotation.x=Math.PI/2;}
  const rings=new Map<string,T.Mesh>();
  function update(t:number,reduced=false){const a=reduced?2.5:2.5+t*.015;bus.position.set(10.8*Math.cos(a),.15,8.5*Math.sin(a));bus.rotation.y=Math.atan2(-8.5*Math.cos(a),-10.8*Math.sin(a));}
  update(0,true);
  return{root,rings,update,dispose(){source.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
