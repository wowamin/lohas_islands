import * as T from 'three';
import { BOARD_DATA } from '../../game/board';
import { CENTERS } from '../../game/cityLayout';
import type { DioramaKit } from './dioramaKit';

export const TILE_FOOTPRINT={width:.76,length:.64,height:.19} as const;
export function createCityTerrain(kit:DioramaKit,root:T.Group,night:boolean){
  const {geo,mesh,box,cylinder}=kit;
  const outline=Array.from({length:16},(_,i)=>{const a=i/16*Math.PI*2,r=16.15+(i%3===0?.35:0);return new T.Vector2(Math.cos(a)*r,Math.sin(a)*r);});
  const shape=new T.Shape(outline);
  const channel=[[-.8,-5],[-1.25,-3],[-.85,-1],[-.8,2.35],[.65,2.35],[.65,-1],[1.05,-3],[.45,-5]];
  const topShape=shape.clone(),hole=new T.Path();channel.forEach(([x,z],i)=>i?hole.lineTo(x,-z):hole.moveTo(x,-z));hole.closePath();topShape.holes.push(hole);
  const layers=[{name:'RockFoundation',depth:.65,y:-2.25,color:'#786a67'},{name:'DeepSoil',depth:.8,y:-1.65,color:'#aa7c62'},{name:'WarmSoil',depth:.65,y:-.9,color:'#c79d76'},{name:'GrassCap',depth:.15,y:-.2,color:night?'#637f6d':'#a8c7a0'}];
  for(const layer of layers){const g=geo(layer.name,()=>new T.ExtrudeGeometry(layer.name==='GrassCap'?topShape:shape,{depth:layer.depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.14,bevelThickness:.1,curveSegments:4}));const m=mesh(g,layer.color,[0,layer.y,0]);m.rotation.x=-Math.PI/2;m.name=layer.name;m.userData.keepMesh=true;}
  root.userData.terrainDepth=2.35;root.userData.tileFootprint=TILE_FOOTPRINT;
  // A recessed river bed, rather than a painted strip on top of the lawn.
  const riverShape=new T.Shape();channel.forEach(([x,z],i)=>i?riverShape.lineTo(x,-z):riverShape.moveTo(x,-z));riverShape.closePath();
  const water=mesh(geo('river',()=>new T.ShapeGeometry(riverShape)),night?'#397d92':'#8bcad8',[0,-.10,0],root,'water');water.rotation.x=-Math.PI/2;water.name='CityRiver';water.userData.keepMesh=true;water.castShadow=false;
  const roads=new T.Group();roads.name='Fixed80Road';root.add(roads);
  const stopMetadata:{id:number;position:readonly number[];rotation:number}[]=[];
  for(const tile of BOARD_DATA){
    const [x,,z]=tile.position,next=BOARD_DATA[tile.next].position;
    if(tile.next!==tile.id){const length=Math.hypot(next[0]-x,next[2]-z);const paving=box([length+.12,.06,1.05],[(x+next[0])/2,.035,(z+next[2])/2],night?'#7a8579':'#e3d4ba',roads,.025);paving.rotation.y=-Math.atan2(next[2]-z,next[0]-x);}
    const stop=new T.Group();stop.name='stop-'+tile.id;stop.position.set(x,0,z);stop.rotation.y=tile.rotation;roads.add(stop);
    box([TILE_FOOTPRINT.width,.19,TILE_FOOTPRINT.length],[0,.13,0],tile.color,stop,.085);
    box([TILE_FOOTPRINT.width-.045,.035,TILE_FOOTPRINT.length-.045],[0,.2325,0],new T.Color(tile.color).lerp(new T.Color('#ffffff'),.17).getStyle(),stop,.055);
    // Pale inset top and a colored raised rim give each real 3D stop a readable number bed.
    box([.40,.012,.34],[0,.255,0],night?'#dce2d7':'#fff9ee',stop,.07);
    if(tile.type==='SERVICE'||tile.type==='OPPORTUNITY'||tile.type==='FINISH'){
      const marker=cylinder(.033,.018,[.28,.262,0],tile.type==='FINISH'?'#c58d32':'#fff9ee',stop,8);marker.name='event-marker';
    }
    stopMetadata.push({id:tile.id,position:tile.position,rotation:tile.rotation});
    if(CENTERS.some(c=>c.end===tile.id)&&tile.next!==tile.id){const crossing=new T.Group();crossing.position.set((x+next[0])/2,.09,(z+next[2])/2);crossing.rotation.y=-Math.atan2(next[2]-z,next[0]-x);roads.add(crossing);for(let i=-2;i<=2;i++)box([.075,.014,.85],[i*.13,0,0],'#f8f2e7',crossing,.003);}
  }
  root.userData.stops=stopMetadata;
  // Gate columns stand outside the full four-player walking envelope.
  for(const tile of [BOARD_DATA[0],BOARD_DATA[79]]){
    const gate=new T.Group();gate.name=tile.id===0?'CityEntrance':'FinishGarden';gate.position.set(tile.position[0],.02,tile.position[2]);gate.rotation.y=tile.rotation;root.add(gate);
    for(const side of [-1,1]){box([.13,1.55,.13],[side*.95,.77,0],tile.id===0?'#a8c7a0':'#d4a84d',gate);cylinder(.15,.1,[side*.95,1.56,0],'#f8f2e7',gate);}
    box([2.1,.27,.17],[0,1.48,0],tile.id===0?'#a8c7a0':'#e8b17b',gate,.08);
    if(tile.id===79){const star=mesh(geo('finish-jewel',()=>new T.OctahedronGeometry(.25)), '#f3cf79',[0,1.96,0],gate);star.rotation.z=Math.PI/4;}
  }
  return {water};
}
