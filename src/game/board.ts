import { BOARD_RULES } from './rules/boardRules';
import type { RuleTile } from './rules/boardRules';
import { routePosition } from './cityLayout';
export { BOARD_SIZE, LEGACY_TO_CURRENT } from './mapDefinition';
export interface BoardTile extends RuleTile {position:readonly [number,number,number]}
// Rendering joins logical stops to the immutable versioned world map.
export const BOARD_DATA:readonly BoardTile[]=Object.freeze(BOARD_RULES.map(tile=>Object.freeze({...tile,position:Object.freeze(routePosition(tile.index))})));
