import './register-ts.mjs';
import { writeFile } from 'node:fs/promises';
const {BOARD_DATA}=await import('../src/game/board.ts');
const {CENTERS,LEGACY_TO_CURRENT,CITY_SEED}=await import('../src/game/cityLayout.ts');
const {MAP_ID,MAP_VERSION,RULES_VERSION}=await import('../src/game/mapDefinition.ts');
await writeFile('public/city-route-50.json',JSON.stringify({version:3,mapId:MAP_ID,mapVersion:MAP_VERSION,rulesVersion:RULES_VERSION,seed:CITY_SEED,notice:'中心主題是遊戲場景設計，不代表真實服務。',centers:CENTERS,legacyPositionMap:LEGACY_TO_CURRENT,tiles:BOARD_DATA},null,2)+'\n');
console.log('Exported public/city-route-50.json from authoritative TypeScript configuration.');
