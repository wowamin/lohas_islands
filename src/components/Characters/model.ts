import * as T from 'three';
import type { CharacterId } from '../../game/characters';
import { createProceduralCharacter } from './procedural';
import type { CharacterAsset, CharacterModel, CharacterOptions } from './types';
// Replace a definition with {kind:'gltf',url:...,rotationY:...} when authored assets are available.
export const CHARACTER_ASSETS:Record<CharacterId,CharacterAsset>={grandpa:{kind:'procedural'},grandma:{kind:'procedural'}};
export function createCharacterModel(options:CharacterOptions):CharacterModel{
  const root=new T.Group();root.name='PlayerCharacter-'+options.characterId;root.userData.characterId=options.characterId;root.userData.color=options.color;
  let model=createProceduralCharacter(options),disposed=false;root.add(model.root);
  root.userData.source='procedural';root.userData.height=model.height;root.userData.forward='+Z';
  const asset=CHARACTER_ASSETS[options.characterId];
  if(asset.kind==='gltf'){
    root.userData.loading=true;
    void import('./gltfModel').then(module=>module.loadGltfCharacter(options,asset)).then(loaded=>{
      if(disposed){loaded.dispose();return;}root.remove(model.root);model.dispose();model=loaded;root.add(model.root);root.userData.source='gltf';root.userData.loading=false;
    }).catch(()=>{if(!disposed){root.userData.loading=false;root.userData.assetError='角色模型無法載入，已保留幾何原型';}});
  }
  return{root,characterId:options.characterId,height:model.height,update:(delta,pose)=>{if(!disposed)model.update(delta,pose);},dispose(){if(disposed)return;disposed=true;model.dispose();root.clear();}};
}
