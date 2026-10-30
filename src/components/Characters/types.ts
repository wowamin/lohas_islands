import type * as T from 'three';
import type { CharacterId } from '../../game/characters';
import type { Quality } from '../../game/citySettings';
export const CHARACTER_HEIGHT=1.12;
export type CharacterMotion='idle'|'charging'|'cheering'|'walking'|'landing';
export interface CharacterPose {motion:CharacterMotion;reducedMotion:boolean;phaseOffset?:number}
export interface CharacterModel {
  root:T.Group;characterId:CharacterId;height:number;
  update:(delta:number,pose:CharacterPose)=>void;
  dispose:()=>void;
}
export interface CharacterOptions {characterId:CharacterId;color:string;quality?:Quality}
export type CharacterAsset={kind:'procedural'}|{kind:'gltf';url:string;rotationY?:number};
