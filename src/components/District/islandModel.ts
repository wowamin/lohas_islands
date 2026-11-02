import * as T from 'three';
import { buildCareDistrict } from './model';
import { CENTERS, centerWorld, routePosition, CITY_SEED } from '../../game/cityLayout';
import type { Quality } from '../../game/citySettings';
import { createDioramaKit } from './dioramaKit';
import { createCityTerrain } from './cityTerrain';
import { createCenterBuilding } from './cityBuildings';
import { createCityEnvironment } from './cityEnvironment';

export const ISLAND_CENTERS=CENTERS.map(c=>({...c,at:centerWorld(c,0,0,3.45)}));
export const islandStation=routePosition;
export function buildCareIsland(night=false,quality:Quality='medium'){
  const source=buildCareDistrict(night),root=new T.Group();root.name='FiveCentersCity';root.userData.seed=CITY_SEED;
  const kit=createDioramaKit(root,night);createCityTerrain(kit,root,night);
  const courtyardBounds:Record<string,{minX:number;maxX:number;minZ:number;maxZ:number}>={};
  for(const center of CENTERS){
    const group=new T.Group();group.name=center.id;group.userData.centerId=center.id;group.position.set(center.position[0],.15,center.position[1]);group.rotation.y=center.rotation;root.add(group);
    createCenterBuilding(kit,group,center,night);
    kit.box([10,.07,5],[0,-.12,2.1],night?'#6e8871':'#c6d7b3',group,.08);
    courtyardBounds[center.id]={minX:-5,maxX:5,minZ:0,maxZ:4.6};
  }
  root.userData.courtyardBounds=courtyardBounds;
  const environment=createCityEnvironment(kit,root,night,quality);
  // Reuse the existing resident prototypes; their positions leave the whole board lane clear.
  for(const center of CENTERS){const group=root.getObjectByName(center.id)!;for(const [name,x,z] of [['CareResident-wheelchair',-.55,2.9],['CareResident-stand',.2,2.8],['CareResident-walker',2.25,1.6]] as const){const npc=source.root.getObjectByName(name)!.clone(true);npc.position.set(x,.10,z);group.add(npc);}}
  kit.batch();
  const rings=new Map<string,T.Mesh>();
  return {root,rings,update(time:number,reduced=false,_zoom=1){environment.update(time,reduced);},dispose(){kit.dispose();source.dispose();}};
}
