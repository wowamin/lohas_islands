import * as T from 'three';
import { createCharacterModel } from './model';
import type { CharacterOptions, CharacterMotion } from './types';
import type { GamePhase } from '../../game/rules/model';
import type { DicePhase } from '../../game/dice/DiceAnimationController';
export interface ActorFrame {
  delta:number;position:number;visualPosition:number|null;moving:boolean;active:boolean;
  phase:GamePhase;dicePhase:DicePhase;reducedMotion:boolean;
  worldPosition:(index:number)=>readonly [number,number,number];
}
export function createCharacterActor(options:CharacterOptions&{playerId:number}){
  const model=createCharacterModel(options),root=model.root,target=new T.Vector3();
  let lastIndex:number|null=null,yaw=0,landing=0,wasMoving=false,motion:CharacterMotion='idle';
  return {root,model,get motion(){return motion;},update(frame:ActorFrame){
    const index=frame.moving&&frame.visualPosition!==null?frame.visualPosition:frame.position,p=frame.worldPosition(index),dt=Math.min(.1,Math.max(0,frame.delta));
    const offsetX=(options.playerId%2-.5)*.65,offsetZ=(Math.floor(options.playerId/2)-.5)*.65;target.set(p[0]+offsetX,p[1],p[2]+offsetZ);
    const changed=lastIndex!==null&&lastIndex!==index;
    if(lastIndex===null){root.position.copy(target);const next=frame.worldPosition((index+1)%50);yaw=Math.atan2(next[0]-p[0],next[2]-p[2]);root.rotation.y=yaw;}
    if(changed){
      const dx=target.x-root.position.x,dz=target.z-root.position.z;if(Math.hypot(dx,dz)>.001)yaw=Math.atan2(dx,dz);
      const advance=(index-lastIndex!+50)%50;if(frame.phase!=='MOVING'&&advance>1)root.position.copy(target);
      landing=.34;
    }
    lastIndex=index;
    if(wasMoving&&!frame.moving)landing=.34;wasMoving=frame.moving;
    if(frame.moving&&root.position.distanceToSquared(target)<.0001){const next=frame.worldPosition((index+1)%50);yaw=Math.atan2(next[0]-p[0],next[2]-p[2]);}
    root.position.lerp(target,frame.reducedMotion?1:1-Math.exp(-dt*15));
    const turn=Math.atan2(Math.sin(yaw-root.rotation.y),Math.cos(yaw-root.rotation.y));root.rotation.y+=turn*(frame.reducedMotion?1:1-Math.exp(-dt*11));
    landing=Math.max(0,landing-dt);
    motion=frame.active&&(frame.phase==='ROLLING'||frame.dicePhase==='revealing')?(frame.dicePhase==='revealing'?'cheering':'charging'):frame.moving?'walking':landing>0?'landing':'idle';
    model.update(dt,{motion,reducedMotion:frame.reducedMotion,phaseOffset:options.playerId*.73});root.userData.motion=motion;root.userData.boardIndex=index;
  },dispose:()=>model.dispose()};
}
