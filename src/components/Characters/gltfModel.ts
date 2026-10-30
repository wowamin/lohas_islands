import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { CharacterAsset, CharacterModel, CharacterOptions, CharacterMotion } from './types';
import { CHARACTER_HEIGHT } from './types';
const cache=new Map<string,{refs:number;promise:Promise<GLTF>}>();
function disposeAsset(gltf:GLTF){
  const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
  gltf.scene.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value instanceof T.Texture)textures.add(value);}}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}
export async function loadGltfCharacter(options:CharacterOptions,asset:Extract<CharacterAsset,{kind:'gltf'}>):Promise<CharacterModel>{
  let entry=cache.get(asset.url);if(!entry){entry={refs:0,promise:new GLTFLoader().loadAsync(asset.url)};cache.set(asset.url,entry);}entry.refs++;
  const owned=entry;
  const release=()=>{if(--owned.refs===0){cache.delete(asset.url);void owned.promise.then(disposeAsset,()=>{});}};
  try{
    const gltf=await entry.promise,root=new T.Group(),model=clone(gltf.scene),oriented=new T.Group();oriented.rotation.y=asset.rotationY??0;oriented.add(model);root.add(oriented);root.name='GLTF-'+options.characterId;
    model.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=options.quality!=='low';o.receiveShadow=true;}});
    root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(oriented),size=box.getSize(new T.Vector3());if(!Number.isFinite(size.y)||size.y<=0)throw Error('GLB 角色沒有可用的幾何體');
    const center=box.getCenter(new T.Vector3()),scale=CHARACTER_HEIGHT/size.y;oriented.scale.setScalar(scale);oriented.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
    const badgeGeometry=new T.CylinderGeometry(.29,.31,.045,20),badgeMaterial=new T.MeshStandardMaterial({color:options.color,roughness:.7}),badge=new T.Mesh(badgeGeometry,badgeMaterial);badge.position.y=.025;root.add(badge);
    const mixer=new T.AnimationMixer(model),actions=new Map<CharacterMotion,T.AnimationAction>();
    for(const [motion,pattern] of [['idle',/idle/i],['walking',/walk|run/i],['charging',/charge|anticip/i],['cheering',/cheer|jump|wave/i],['landing',/land/i]] as const){const clip=gltf.animations.find(c=>pattern.test(c.name));if(clip)actions.set(motion,mixer.clipAction(clip));}
    let active:T.AnimationAction|undefined,disposed=false,time=0;
    return {root,characterId:options.characterId,height:CHARACTER_HEIGHT,update(delta,pose){
      if(disposed)return;time+=delta;
      const next=pose.reducedMotion?undefined:actions.get(pose.motion)??actions.get('idle');if(next!==active){active?.fadeOut(.15);next?.reset().fadeIn(.15).play();active=next;}
      if(!pose.reducedMotion)mixer.update(delta);else mixer.stopAllAction();
      // Generic fallback for assets without clips; authored clips take precedence.
      oriented.position.y=-box.min.y*scale+(pose.reducedMotion||next?0:Math.sin(time*2)*.012);
    },dispose(){if(disposed)return;disposed=true;mixer.stopAllAction();mixer.uncacheRoot(model);model.traverse(o=>{if(o instanceof T.SkinnedMesh)o.skeleton.dispose();});badgeGeometry.dispose();badgeMaterial.dispose();root.clear();release();}};
  }catch(error){release();throw error;}
}
