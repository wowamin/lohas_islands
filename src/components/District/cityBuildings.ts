import * as T from 'three';
import type { DioramaKit } from './dioramaKit';
import type { CENTERS } from '../../game/cityLayout';

export function createCenterBuilding(kit:DioramaKit,parent:T.Group,center:typeof CENTERS[number],night:boolean){
  const {box,mesh,geo,cylinder,sign}=kit;
  const building=new T.Group();building.name='DayCareCenter';building.userData.variant=center.id;building.userData.features=['eaves','window-frames','glass','entrance','ramp','sign','roof-equipment','planting'];parent.add(building);
  const variants=[{width:5.6,floors:2,roof:'gable'},{width:5.8,floors:3,roof:'terrace'},{width:5.5,floors:2,roof:'garden'},{width:5.8,floors:2,roof:'terrace'},{width:5.4,floors:2,roof:'hip'}];
  const v=variants[center.index],floorHeight=.91,height=v.floors*floorHeight,half=v.width/2;
  kit.contact(v.width+1.2,3.5,[0,-.065,-.65],parent);
  box([v.width+.22,.18,2.85],[0,.02,-.65],'#d6c6ad',building,.09);
  box([v.width,height,2.5],[0,.15+height/2,-.72],'#f8f2e7',building,.09);
  // Recessed colored bays, separate glazing and projecting frames on all visible facades.
  for(let floor=0;floor<v.floors;floor++){
    const y=.55+floor*floorHeight;
    for(let col=-2;col<=2;col++){
      const x=col*(v.width/5.5);
      box([.78,.69,.12],[x,y+.08,.57],center.color,building,.025);
      const glass=mesh(geo('center-window',()=>new T.BoxGeometry(.60,.51,.035)),night?'#f4d7a1':'#7baeb8',[x,y+.09,.645],building,'glass');glass.name='GlazedWindow';
      box([.035,.56,.045],[x,y+.09,.673],'#f8f2e7',building,.005);
      box([.86,.065,.22],[x,y-.24,.65],'#e6d8c2',building,.015);
      if(floor===0&&Math.abs(col)===2){box([.64,.16,.24],[x,y-.31,.76],'#b59d78',building);for(const dx of [-.22,0,.22])kit.orb(.12,[x+dx,y-.18,.77],'#8caa7f',building);}
    }
    box([v.width+.12,.09,2.68],[0,.17+(floor+1)*floorHeight,-.72],floor===v.floors-1?center.color:'#e5dac7',building,.025);
    for(const side of [-1,1])for(const z of [-1.35,-.35]){
      box([.08,.64,.73],[side*(half+.025),y+.08,z],'#d6c6af',building);
      mesh(geo('side-window',()=>new T.BoxGeometry(.035,.49,.58)),night?'#f4d7a1':'#8ab6be',[side*(half+.073),y+.09,z],building,'glass');
    }
  }
  // Double entrance door, transom, porch canopy and visible column caps.
  box([1.34,1.03,.17],[0,.57,.69],'#a97754',building,.02);
  for(const side of [-1,1]){
    mesh(geo('entrance-glass',()=>new T.BoxGeometry(.52,.82,.025)),night?'#f4d7a1':'#8bcad8',[side*.30,.58,.79],building,'glass');
    box([.035,.24,.06],[side*.09,.53,.83],'#b68d58',building,.005);
    cylinder(.055,1.12,[side*.91,.57,1.05],'#f8f2e7',building);
  }
  box([2.3,.15,1.0],[0,1.18,.94],center.color,building,.055);
  box([2.0,.12,.5],[0,.07,1.04],'#e7d7bd',building);
  for(let step=0;step<2;step++)box([1.4,.07,.23],[-.22,.03-step*.02,1.30+step*.19],'#eee4d2',building,.015);
  const ramp=box([.65,.10,1.30],[1.15,.03,1.24],'#d8c6a9',building,.015);ramp.rotation.x=-.07;
  for(const x of [.84,1.48]){box([.035,.035,1.32],[x,.42,1.28],'#9aa69a',building,.006);for(const z of [.76,1.75])box([.035,.43,.035],[x,.22,z],'#9aa69a',building,.006);}
  sign(center.title,3.3,[0,1.57,.72],building);
  const roofY=height+.28;
  if(v.roof==='gable'||v.roof==='hip'){
    const shape=new T.Shape();shape.moveTo(-half-.2,0);shape.lineTo(0,.68);shape.lineTo(half+.2,0);shape.closePath();
    const roof=mesh(geo('gable'+v.width,()=>new T.ExtrudeGeometry(shape,{depth:3.02,bevelEnabled:true,bevelSize:.04,bevelThickness:.025,bevelSegments:1})),center.color,[0,roofY,-2.25],building);roof.name='LayeredRoof';
    for(let x=-half;x<=half;x+=.26){const ridge=box([.035,.035,3.08],[x,roofY+.68*(1-Math.abs(x)/(half+.2))+.025,-.74],'#f8e3c9',building,.005);ridge.userData.detail=true;}
  }else{
    box([v.width+.3,.16,2.85],[0,roofY,-.72],center.color,building,.06);
    box([v.width-.25,.12,2.25],[0,roofY+.12,-.72],v.roof==='garden'?'#a8c7a0':'#c7c0b4',building,.035);
    for(const z of [-2.02,.56])box([v.width+.2,.22,.11],[0,roofY+.14,z],'#f8f2e7',building,.025);
    for(const side of [-1,1])box([.11,.22,2.7],[side*(half+.08),roofY+.14,-.72],'#f8f2e7',building,.025);
    if(center.id==='annan'){
      box([3.0,.10,.62],[0,height-.28,.95],center.color,building,.03);
      for(const x of [-1.4,-.7,0,.7,1.4])box([.035,.30,.035],[x,height-.08,1.20],'#f8f2e7',building,.005);
      box([3,.035,.035],[0,height+.07,1.2],'#f8f2e7',building,.005);
    }
  }
  // Rooftop units and vents are true geometry, shared across all buildings.
  for(const x of [-1.7,1.4]){
    box([.68,.34,.56],[x,roofY+.35,-1.2],'#dad6cd',building,.035);
    for(let n=-2;n<=2;n++)box([.49,.025,.025],[x,roofY+.35+n*.045,-.905],'#969b96',building,.003);
  }
  // Independent side extensions create five distinct silhouettes without blocking the arc.
  if(center.id==='yihe'){box([1.0,1.0,1.4],[-half+.25,.55,-1.4],center.color,building,.06);box([1.2,.12,1.6],[-half+.25,1.12,-1.4],'#f8f2e7',building,.04);}
  if(center.id==='longshan'){for(const side of [-1,1])cylinder(.08,1.4,[side*2.9,.75,.3],'#a97754',building);box([6.1,.12,.7],[0,1.5,.3],center.color,building,.04);}
  parent.userData.buildingVariant=center.id;
  return building;
}
