import * as T from 'three';
import { LEGACY_TO_CURRENT } from '../../game/cityLayout';
import { createCityBoxGeometry } from '../Three/cityGeometry';

export const DISTRICT_STOPS = ([
  { id: 'center', title: '日照中心', kicker: 'DAY CARE', tileId: 5, service: 'care', at: [-1,2.8,-1.5], body: '白天有人陪伴，照顧也能融入日常。從採光廊道、活動空間到無障礙入口，走進一間有生活感的日照中心。' },
  { id: 'plaza', title: '一起活動的廣場', kicker: 'MEET & MOVE', tileId: 11, service: 'community', at: [.7,.45,1.1], body: '輪椅、助行器與慢慢走的步伐，都能在同一個廣場相遇。坐下聊天，或和照服員一起做簡單活動。' },
  { id: 'shuttle', title: '安心接送站', kicker: 'A FRIENDLY RIDE', tileId: 13, service: 'transport', at: [4.5,.6,2.5], body: '遮蔭候車、平整上下車區與清楚的動線，讓接送成為能安心出門的一段旅程。' },
  { id: 'garden', title: '照顧者休息花園', kicker: 'TAKE A BREATH', tileId: 18, service: 'respite', at: [-4,.6,1.7], body: '樹蔭下的座位留給每一位需要暫停的人。認識喘息支持，也為照顧者保留休息的位置。' },
] as const).map(stop=>({...stop,tileId:LEGACY_TO_CURRENT[stop.tileId]}));
export type DistrictStopId = typeof DISTRICT_STOPS[number]['id'];

export function buildCareDistrict(night = false) {
  const root = new T.Group();root.name = 'CareDistrict';
  const materials = new Map<string,T.Material>();
  const geometries = new Map<string,T.BufferGeometry>();
  const mat = (color: string, basic=false) => {
    const key=color+basic;
    if(!materials.has(key)) materials.set(key,basic?new T.MeshBasicMaterial({color}):new T.MeshLambertMaterial({color,flatShading:true}));
    return materials.get(key)!;
  };
  function mesh(g:T.BufferGeometry,color:string,pos:[number,number,number],parent:T.Group=root,basic=false) {
    const m=new T.Mesh(g,mat(color,basic));m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function geom(key:string,create:()=>T.BufferGeometry) {if(!geometries.has(key))geometries.set(key,create());return geometries.get(key)!;}
  function box(size:[number,number,number],at:[number,number,number],color:string,parent=root,radius=0) {
    const key='box'+size.join(',')+':'+radius;
    return mesh(geom(key,()=>radius?createCityBoxGeometry(size,radius,size[0]>5?5:1):new T.BoxGeometry(...size,Math.max(1,Math.ceil(size[0]/.7)),1,Math.max(1,Math.ceil(size[2]/.7)))),color,at,parent);
  }
  function cyl(r:number,h:number,at:[number,number,number],color:string,parent=root,n=10) {
    return mesh(geom('cyl'+[r,h,n],()=>new T.CylinderGeometry(r,r,h,n)),color,at,parent);
  }
  function sphere(r:number,at:[number,number,number],color:string,parent=root) {
    return mesh(geom('ico'+r,()=>new T.IcosahedronGeometry(r,1)),color,at,parent);
  }
  function shadow(x:number,z:number,rx:number,rz:number,parent=root) {
    const m=mesh(geom('disc',()=>new T.CircleGeometry(1,16)),night?'#657467':'#a5b58e',[x,.09,z],parent,true);m.rotation.x=-Math.PI/2;m.scale.set(rx,rz,1);m.castShadow=false;
  }
  function roof(w:number,d:number,h:number,at:[number,number,number],color:string,parent=root) {
    const key='roof'+[w,d,h];
    const geometry=geom(key,()=>{
      const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,h);shape.closePath();
      const g=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,steps:1});g.translate(0,0,-d/2);g.computeVertexNormals();return g;
    });
    return mesh(geometry,color,at,parent);
  }
  const glass=night?'#f9dfa1':'#8fc4c6';
  const light=night?'#e8dec2':'#fff6df';
  // Layered island: every top surface stays below the architecture.
  box([13.7,.38,10.7],[0,-.28,0],'#839e78',root,.17);
  box([13.5,.14,10.5],[0,-.02,0],night?'#718669':'#c3d6a4',root,.06);
  box([12.8,.04,9.8],[0,.07,0],night?'#6f7b72':'#e2dcc7',root,.015);
  // Continuous road loop with an inner landscaped campus.
  box([12.4,.03,1.02],[0,.105,4.17],'#929fa1');box([12.4,.03,1.02],[0,.105,-4.17],'#929fa1');
  box([1.02,.03,7.4],[-5.69,.105,0],'#929fa1');box([1.02,.03,7.4],[5.69,.105,0],'#929fa1');
  for(let x=-5;x<=5;x+=.65){box([.29,.008,.035],[x,.126,4.17],'#f8f2de');box([.29,.008,.035],[x,.126,-4.17],'#f8f2de');}
  for(let z=-3.5;z<=3.5;z+=.65){box([.035,.008,.29],[-5.69,.126,z],'#f8f2de');box([.035,.008,.29],[5.69,.126,z],'#f8f2de');}
  box([10.1,.08,7.2],[0,.12,0],night?'#7b9075':'#b0c995',root,.035);
  box([9.8,.04,.6],[0,.18,3.27],'#f2e9d0');
  box([1.05,.035,4.4],[2.45,.18,1.1],'#f1e7cc');
  // Main day center: two wings, glazed entrance, teal gables and a warm canopy.
  const building = new T.Group();building.position.set(-.9,.2,-1.55);root.add(building);building.name='DayCareCenter';
  shadow(-1.15,-1.2,3.1,1.4);
  box([4.4,1.8,1.9],[0,.9,0],light,building,.045);
  box([4.5,.09,2.02],[0,1.03,0],'#d1dece',building);
  roof(4.75,2.25,.56,[0,1.84,0],'#568d87',building);
  box([.58,1.15,.09],[-1.84,.58,1.01],'#83b6ad',building);
  box([.58,1.15,.09],[1.84,.58,1.01],'#83b6ad',building);
  for(const x of [-1.44,-.8,.8,1.44]) for(const y of [.64,1.43]) {
    box([.46,.49,.04],[x,y,.973],glass,building);
    box([.5,.035,.09],[x,y-.26,1],'#eadbb8',building);
    box([.025,.48,.025],[x,y,1.002],'#f3edd8',building);
  }
  for(const side of [-1,1]) for(const z of [-.5,.35])for(const y of [.62,1.4])box([.04,.5,.47],[side*2.22,y,z],glass,building);
  box([.9,1.15,.045],[0,.58,.975],glass,building);
  box([.035,1.16,.04],[0,.58,1.005],'#f1ecd9',building);
  box([1.55,.13,.95],[0,1.29,1.25],'#d79d75',building,.025);
  for(const x of [-.63,.63])box([.055,1.2,.055],[x,.6,1.6],'#efe1be',building);
  box([1.08,.22,.3],[0,1.67,1.02],'#6d9c8f',building);
  // Visible medical/community emblem; text labels are HTML overlays.
  const emblem=cyl(.22,.045,[0,2.08,.27],'#e6ead0',building,20);emblem.rotation.x=Math.PI/2;
  box([.24,.07,.05],[0,2.08,.304],'#7aab8d',building);box([.07,.24,.05],[0,2.08,.306],'#7aab8d',building);
  // Entry platform and accessible sloped ramp.
  box([2.5,.18,1.05],[-.9,.23,-.06],'#e6dec7');
  const ramp=box([1.35,.08,1.3],[.85,.23,.1],'#ded6bd');ramp.rotation.z=-.13;
  for(const z of [-.53,.73]) {
    for(const x of [.25,.9,1.5])box([.035,.39,.035],[x,.48,z],'#8caaa1');
    const rail=box([1.35,.035,.035],[.88,.67,z],'#8caaa1');rail.rotation.z=-.13;
  }
  // Community activity room on the east side, distinct from the main building.
  box([1.7,.95,1.75],[3.55,.7,-1.65],'#dfb5a0',root,.04);
  roof(1.95,1.98,.48,[3.55,1.21,-1.65],'#d6a36e');
  for(const x of [3.1,3.6,4.1])box([.31,.43,.035],[x,.88,-.76],glass);
  box([.35,.7,.04],[3.55,.57,-.74],'#80a99d');
  // Courtyard paving and inlaid activity circles.
  box([4.85,.045,2.55],[-.15,.215,1.57],night?'#8caaa4':'#b2d1cc',root,.02);
  for(let x=-2.35;x<=2.1;x+=.49)box([.012,.006,2.5],[x,.242,1.57],'#dbe2d2');
  for(let z=.39;z<=2.8;z+=.49)box([4.8,.006,.012],[-.15,.242,z],'#dbe2d2');
  for(const [x,z] of [[-.65,1.7],[.8,1.25],[1.15,2.25]]) {
    const mark=cyl(.24,.01,[x,.25,z],'#d7c786',root,24);mark.castShadow=false;
  }
  // West garden, pergola and accessible planter boxes.
  box([2.1,.035,4.6],[-3.8,.195,.75],'#dfdabd',root,.015);
  for(const x of [-4.65,-3.1]) for(const z of [.2,1.9])box([.07,1.36,.07],[x,.88,z],'#bf9b74');
  for(let z=.05;z<2.15;z+=.24)box([1.95,.07,.09],[-3.88,1.6,z],'#d5b789');
  for(const z of [-.95,2.9]) {
    box([1.7,.35,.56],[-3.87,.4,z],'#d5ae8b',root,.04);
    for(let x=-4.45;x<-3.15;x+=.26)sphere(.14,[x,.66,z],'#8fae70');
  }
  function bench(x:number,z:number,rotation=0) {
    const g=new T.Group();g.position.set(x,.22,z);g.rotation.y=rotation;root.add(g);
    for(const x of [-.4,.4])box([.055,.27,.25],[x,.135,0],'#71897b',g);
    for(const z of [-.13,0,.13])box([1,.055,.09],[0,.3,z],'#d8af74',g);
    for(const y of [.48,.62])box([1,.075,.04],[0,y,-.15],'#d8af74',g);
  }
  bench(-3.88,.44);bench(-3.88,1.65,Math.PI);bench(.1,2.95);bench(3.7,.2,Math.PI/2);
  function tree(x:number,z:number,size=1,broad=false) {
    const g=new T.Group();g.position.set(x,.2,z);g.scale.setScalar(size);root.add(g);
    shadow(x,z,.43*size,.29*size);
    cyl(.065,.72,[0,.36,0],'#9a8968',g,7);
    if(broad){sphere(.42,[0,.98,0],'#86aa7b',g);sphere(.32,[.24,1.13,.06],'#a0b981',g);sphere(.3,[-.22,1.05,.05],'#719d7f',g);}else{
      for(const [y,r,h] of [[.82,.34,.86],[1.12,.25,.66]])mesh(geom('pine'+r,()=>new T.ConeGeometry(r,h,7)),'#68947a',[0,y,0],g);
    }
  }
  for(const [x,z,s,b] of [[-4.6,-2.6,1.2,1],[-3.7,-3,1,0],[3,-3.1,.9,0],[4.5,-3,1.1,1],[-4.7,2.6,.8,1],[4.7,.1,.85,0],[3.8,3.1,.6,1],[-2.9,3.2,.7,0]])tree(x,z,s,!!b);
  // People have explicit poses: walking, seated, wheelchair and a caregiver.
  function person(at:[number,number,number],color:string,pose:'stand'|'seated'|'wheelchair'|'walker'='stand',rotation=0) {
    const g=new T.Group();g.name='CareResident-'+pose;g.position.set(...at);g.rotation.y=rotation;root.add(g);
    const seated=pose==='seated'||pose==='wheelchair';const y=seated?.55:.75;
    sphere(.105,[0,y,0],'#ebc6a7',g);sphere(.108,[0,y+.035,-.022],'#d9dbd0',g);
    box([.18,.29,.13],[0,y-.26,0],color,g,.035);
    for(const x of [-.13,.13]){const arm=box([.055,.25,.06],[x,y-.25,.035],'#e8bea0',g,.02);arm.rotation.x=seated?-.8:-.2;}
    for(const x of [-.055,.055]) {
      box([.065,seated?.18:.29,.07],[x,seated?.13:.19,seated?.2:0],'#687b84',g,.015);
      box([.075,.045,.16],[x,.045,seated?.25:.055],'#526d72',g,.015);
    }
    if(seated){box([.22,.055,.26],[0,.32,.04],'#7e9fa6',g);box([.22,.24,.045],[0,.44,-.095],'#7e9fa6',g);}
    if(pose==='wheelchair'){
      for(const x of [-.16,.16]){const wheel=mesh(geom('wheel',()=>new T.TorusGeometry(.18,.024,5,14)),'#586e75',[x,.2,-.02],g);wheel.rotation.y=Math.PI/2;for(const yy of [.2,.38])box([.025,.025,.34],[x,yy,.03],'#8eabad',g);}
      for(const x of [-.13,.13]){const w=cyl(.055,.03,[x,.065,.27],'#53696d',g);w.rotation.z=Math.PI/2;}
    }
    if(pose==='walker')for(const x of [-.18,.18]){box([.025,.42,.025],[x,.22,.3],'#83a0a1',g);box([.025,.025,.26],[x,.43,.21],'#83a0a1',g);box([.36,.025,.025],[0,.36,.37],'#83a0a1',g);}
    return g;
  }
  person([-.9,.25,1.05],'#d58f83','wheelchair',.35);
  person([-.38,.25,.8],'#79a79b','stand',-.8);
  person([.75,.25,1.2],'#ddb471','walker',-.3);
  person([1.3,.25,1.75],'#96b3bc','stand',2.4);
  person([.3,.25,2.23],'#cc9986','stand',Math.PI);
  person([-3.8,.25,.5],'#a498b6','seated');
  person([-3.8,.25,1.62],'#d7ab82','seated',Math.PI);
  const walker=person([-2.4,.23,2.85],'#88a8ad','stand',Math.PI/2);
  person([3.7,.23,2.9],'#c99185','wheelchair',Math.PI/2);
  person([4.15,.23,2.92],'#79a79b','stand',Math.PI/2);
  // Sheltered accessible shuttle stop, bollards and tactile paving.
  for(const x of [3.1,4.75])box([.055,1.12,.055],[x,.79,2.25],'#77988e');
  box([2.05,.1,.7],[3.92,1.4,2.25],'#82afa4',root,.035);
  box([1.4,.6,.035],[3.92,.95,2.07],'#c4d9cc');
  for(let x=2.92;x<=4.9;x+=.18)box([.1,.015,.3],[x,.235,3.32],'#e2c67f');
  for(const x of [2.9,4.95])cyl(.045,.46,[x,.43,3.35],'#8aa396');
  for(let x=1.8;x<2.95;x+=.18)box([.08,.012,1],[x,.14,4.17],'#fff2d5');
  // Low-poly accessible minibus, ready for pickup.
  const bus=new T.Group();bus.position.set(3.85,.17,4.16);root.add(bus);bus.name='AccessibleShuttle';
  box([1.6,.65,.72],[0,.52,0],'#e3c17a',bus,.07);
  box([1.64,.11,.74],[0,.88,0],'#f6ecce',bus,.035);
  box([1.22,.26,.025],[-.06,.66,.373],'#a1c5ca',bus);
  box([.025,.31,.57],[.815,.62,0],'#a1c5ca',bus);
  for(const x of [-.52,.52])for(const z of [-.35,.35]){const w=cyl(.145,.095,[x,.16,z],'#52676b',bus,12);w.rotation.x=Math.PI/2;}
  for(const x of [-.65,.65])box([.1,.07,.025],[x,.4,.378],'#fff1be',bus);
  box([.15,.2,.03],[.38,.51,.39],'#6c9d98',bus);
  // Campus lighting and a small path through the garden.
  for(const [x,z] of [[-5,3.2],[5,-3.15],[-5,-3.15],[1.7,3.6]]) {
    cyl(.035,1.25,[x,.85,z],'#71877b');box([.35,.04,.045],[x+.14,1.49,z],'#71877b');box([.15,.055,.11],[x+.27,1.45,z],night?'#ffe0a0':'#eee4c1');
  }
  for(const x of [-2.1,-1.2,-.3,.6,1.5])cyl(.055,.015,[x,.255,2.8],'#e8d5a2',root,12);
  const rings=new Map<DistrictStopId,T.Mesh>();
  for(const stop of DISTRICT_STOPS){
    const ring=mesh(geom('focus-ring',()=>new T.RingGeometry(.32,.38,32)),'#fff2b6',[stop.at[0],.27,stop.at[2]],root,true);ring.rotation.x=-Math.PI/2;ring.visible=false;rings.set(stop.id,ring);
  }
  function update(t:number,reduced=false){
    if(!reduced){walker.position.x=-2.3+Math.sin(t*.22)*.5;walker.rotation.y=Math.cos(t*.22)>0?Math.PI/2:-Math.PI/2;bus.position.x=3.8+Math.sin(t*.12)*.34;}
  }
  return {root,rings,update,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
