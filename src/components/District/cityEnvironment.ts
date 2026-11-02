import * as T from 'three';
import { BOARD_DATA } from '../../game/board';
import { CENTERS, centerWorld, seededRandom, CITY_SEED } from '../../game/cityLayout';
import type { Quality } from '../../game/citySettings';
import type { DioramaKit } from './dioramaKit';

export function createCityEnvironment(kit:DioramaKit,root:T.Group,night:boolean,quality:Quality){
  const {box,orb,cylinder,mesh,geo}=kit,random=seededRandom(CITY_SEED+21);
  const decorations:{x:number;z:number;kind:string}[]=[];
  function roadDistance(x:number,z:number){let best=Infinity;for(const t of BOARD_DATA.slice(0,-1)){const a=t.position,b=BOARD_DATA[t.next].position,dx=b[0]-a[0],dz=b[2]-a[2],u=T.MathUtils.clamp(((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz),0,1);best=Math.min(best,Math.hypot(x-a[0]-u*dx,z-a[2]-u*dz));}return best;}
  function tree(x:number,z:number,scale:number,pink:boolean,parent=root){
    const group=new T.Group();group.position.set(x,0,z);group.scale.setScalar(scale);parent.add(group);
    cylinder(.065,.95,[0,.48,0],'#a97754',group,7);
    for(const side of [-1,1]){const branch=box([.045,.48,.045],[side*.13,.86,0],'#a97754',group,.008);branch.rotation.z=-side*.45;}
    const colors=pink?['#f3b7c7','#e79eb7','#f7d0d8']:['#a8c7a0','#83a67e','#b8d19c'];
    const crowns=quality==='low'?5:9;
    for(let i=0;i<crowns;i++){const a=i*2.399,ring=i<5?.36:.22,h=1.05+(i%3)*.20;const crown=orb(.36,[Math.cos(a)*ring,h,Math.sin(a)*ring],colors[i%3],group);crown.scale.set(1,.88,1);}
    cylinder(.40,.08,[0,.035,0],'#c0cf9e',group,12);
    return group;
  }
  function bench(at:readonly number[],rotation=0,parent=root){const g=new T.Group();g.position.set(at[0],at[1],at[2]);g.rotation.y=rotation;parent.add(g);for(const z of [-.10,0,.10])box([.88,.055,.08],[0,.34,z],'#a97754',g,.01);box([.88,.25,.055],[0,.54,-.14],'#b88a63',g,.02);for(const x of [-.32,.32])box([.055,.34,.23],[x,.16,0],'#748879',g,.01);}
  function planter(x:number,z:number,color:string,parent=root){box([.72,.23,.44],[x,.15,z],'#c0a08a',parent,.035);for(let i=0;i<5;i++){const xx=x+(i-2)*.12;orb(.11,[xx,.31,z],'#83a67e',parent);orb(.055,[xx,.43,z],i%2?color:'#f8edd2',parent);}}
  function pergola(x:number,z:number,color:string,parent=root){const g=new T.Group();g.position.set(x,0,z);parent.add(g);for(const a of [-.64,.64])for(const b of [-.44,.44])box([.075,1.25,.075],[a,.67,b],'#a97754',g,.015);for(let a=-.8;a<=.8;a+=.2)box([.09,.08,1.2],[a,1.32,0],color,g,.015);bench([0,0,0],0,g);}
  // Courtyard props stay inside the open arc and away from the player lane.
  for(const center of CENTERS){
    const group=root.getObjectByName(center.id) as T.Group;
    const terraceY=.02+center.index*.05;
    box([3.4,.10+center.index*.10,1.22],[0,terraceY-(.10+center.index*.10)/2,2.0],night?'#6c876c':'#bacda5',group,.05);
    group.userData.terraceHeight=.15+terraceY;
    const access=box([.64,.065,.85],[1.88,terraceY/2,2.02],'#dec9aa',group,.015);access.rotation.z=-(Math.atan2(terraceY,.64));
    planter(-2.2,.95,center.color,group);planter(2.2,.95,center.color,group);
    bench([-1.15,terraceY,1.95],0,group);bench([1.15,terraceY,1.95],0,group);
    if(center.id==='dahe'||center.id==='longshan'){const before=group.children.length;pergola(0,2.05,center.color,group);group.children[before].position.y=terraceY;}
    if(center.id==='annan'){
      const canopy=mesh(geo('awning',()=>new T.CylinderGeometry(.72,.72,.08,4)),center.color,[0,1.65,2.0],group);canopy.rotation.y=Math.PI/4;
      cylinder(.04,1.55,[0,.82,2.0],'#a97754',group);cylinder(.32,.08,[0,.59,2.0],'#c3a076',group);
    }
    if(center.id==='xinying')for(let x=-.7;x<=.7;x+=.35)cylinder(.12,.035,[x,.06,2.3],'#dfc798',group);
    if(center.id==='yihe')for(const x of [-.48,.48]){box([.045,.045,1.2],[x,.75,2.0],'#8fa79b',group);for(const z of [1.5,2.5])cylinder(.035,.72,[x,.39,z],'#8fa79b',group);}
    for(const side of [-1,1]){const p=centerWorld(center,side*3.7,-2.35);if(roadDistance(p[0],p[2])>1.1){tree(p[0],p[2],.9,center.index%2===0);decorations.push({x:p[0],z:p[2],kind:'courtyard-tree'});}}
  }
  // Repeated river stones and plants form an actual retaining wall.
  for(let i=0;i<21;i++){
    const z=-4.75+i*.34,x=-.20+.24*Math.sin(z*1.1);
    for(const side of [-1,1]){
      box([.26,.30,.31],[x+side*.99,-.04,z],i%3?'#a4aaa1':'#bac0b3',root,.055);
      if(i%3===0){orb(.16,[x+side*1.28,.18,z],'#8fae89');orb(.10,[x+side*1.40,.16,z+.13],'#bdd0a2');}
    }
  }
  // Low wooden arched bridges: the planks rise gently in the middle.
  for(const z of [-2.7,.9]){
    const bridge=new T.Group();bridge.name='ArchedWoodBridge';bridge.position.set(0,0,z);root.add(bridge);
    for(let i=0;i<15;i++){const x=-1.45+i*.207,y=.13+.26*Math.sin(i/14*Math.PI);box([.18,.09,.9],[x,y,0],'#b68258',bridge,.015);for(const side of [-1,1]){if(i%3===0)box([.065,.57,.065],[x,y+.3,side*.49],'#a97754',bridge,.015);if(i<14){const nextY=.13+.26*Math.sin((i+1)/14*Math.PI),rail=box([.24,.045,.045],[x+.10,(y+nextY)/2+.56,side*.49],'#b5845c',bridge,.01);rail.rotation.z=Math.atan2(nextY-y,.207);}}}
  }
  const petals:T.Mesh[]=[];
  for(let i=0;i<18;i++){const z=-4.5+random()*6.5,x=-.4+random()*.65;const petal=mesh(geo('petal',()=>new T.CircleGeometry(.045,5)),i%2?'#f3b7c7':'#f8f2e7',[x,-.086,z]);petal.rotation.x=-Math.PI/2;petal.castShadow=false;petal.userData.keepMesh=true;petals.push(petal);}
  // Park paths, lawns and seats around the river avoid the fixed route.
  for(const side of [-1,1]){
    box([.48,.045,4.6],[side*1.65,.04,-.6],'#e7d9c0');bench([side*2.3,.03,-.4],side*Math.PI/2);
    tree(side*2.65,-2.8,1.10,true);planter(side*2.4,1.6,'#f3b7c7');
  }
  // A planted perimeter and small residential blocks frame the five-center skyline.
  const count=quality==='low'?30:quality==='medium'?45:60;
  for(let i=0;i<count;i++){
    const angle=i/count*Math.PI*2,r=14.0+random()*1.25,x=Math.cos(angle)*r,z=Math.sin(angle)*r;
    if(roadDistance(x,z)<1.2)continue;
    tree(x,z,.85+random()*.55,i%3===0);decorations.push({x,z,kind:i%3===0?'cherry':'tree'});
    if(i%2===0)planter(x*.98,z*.98,i%3===0?'#f3b7c7':'#e8b17b');
  }
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2+.3,r=13.6,x=Math.cos(a)*r,z=Math.sin(a)*r;
    if(roadDistance(x,z)<1.4||CENTERS.some(c=>Math.hypot(x-c.position[0],z-c.position[1])<3.6))continue;
    const house=new T.Group();house.position.set(x,.03,z);house.rotation.y=-a;root.add(house);
    const color=['#e8b17b','#c9b5df','#a8c7a0','#8bcad8'][i%4];
    box([1.2,1.6,.95],[0,.8,0],'#f8f2e7',house,.05);box([1.38,.12,1.12],[0,1.64,0],color,house,.04);
    for(const y of [.45,1.15])for(const xx of [-.33,.33]){box([.37,.44,.07],[xx,y,.5],color,house,.02);mesh(geo('houseglass',()=>new T.BoxGeometry(.27,.33,.025)),night?'#f4d7a1':'#82b0bb',[xx,y,.55],house,'glass');}
    box([1.3,.14,.5],[0,.89,.69],color,house,.03);box([.4,.36,.33],[.2,1.88,0],'#d7d2c4',house,.03);
    decorations.push({x,z,kind:'home'});
  }
  // Lamps, signposts and a sheltered community bus stop, outside tile footprints.
  for(const center of CENTERS)for(const side of [-1,1]){
    const p=centerWorld(center,side*4.95,-.7);cylinder(.035,1.5,[p[0],.75,p[2]],'#6c8277');box([.27,.11,.22],[p[0],1.52,p[2]],night?'#ffe0a0':'#f8f2e7');
  }
  const shelter=new T.Group();shelter.position.set(3.1,0,5.2);root.add(shelter);for(const x of [-.8,.8])box([.055,1.3,.055],[x,.65,0],'#77988b',shelter);box([1.9,.14,.8],[0,1.32,0],'#8bcad8',shelter,.05);bench([0,0,0],0,shelter);kit.sign('社區接送站',1.65,[0,1.06,-.13],shelter);
  root.userData.decorations=decorations;root.userData.environmentFeatures=['river','stone-banks','arched-bridges','cherry-trees','layered-canopies','community-shops','bus-stop','pergolas'];
  return {petals,update(time:number,reduced:boolean){if(reduced)return;petals.forEach((p,i)=>{p.position.y=-.083+Math.sin(time*.8+i)*.002;p.rotation.z=Math.sin(time*.3+i)*.14;});}};
}

export function buildDioramaBackdrop(night:boolean){
  const root=new T.Group(),g=new T.PlaneGeometry(200,200),m=new T.MeshBasicMaterial({color:night?'#1e3441':'#dcebf1',toneMapped:false}),shadowMaterial=new T.ShadowMaterial({opacity:.14});const floor=new T.Mesh(g,m);floor.rotation.x=-Math.PI/2;floor.position.y=-2.65;root.add(floor);const shadow=new T.Mesh(g,shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=-2.645;shadow.receiveShadow=true;root.add(shadow);
  return {root,dispose(){g.dispose();m.dispose();shadowMaterial.dispose();}};
}
