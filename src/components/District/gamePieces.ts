import { createCharacterActor } from '../Characters/actor';
import type { CharacterId } from '../../game/characters';
import type { Quality } from '../../game/citySettings';
export { createIslandDice } from './diceModel';
export function createPawn(color:string,characterId:CharacterId='grandpa',quality:Quality='medium',playerId=0) {
  const actor=createCharacterActor({color,characterId,quality,playerId});actor.root.userData.characterActor=actor;return actor.root;
}
