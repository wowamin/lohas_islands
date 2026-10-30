export const CHARACTER_IDS = ['grandpa', 'grandma'] as const;
export type CharacterId = typeof CHARACTER_IDS[number];
export const CHARACTERS = {
  grandpa: { id:'grandpa', name:'爺爺', description:'綠帽、藍格紋上衣，手持椰子飲料', color:'#86b873' },
  grandma: { id:'grandma', name:'奶奶', description:'粉紅捲髮、紅框眼鏡，手持珍珠奶茶', color:'#ed8dab' },
} as const;
export const isCharacterId=(value:unknown):value is CharacterId=>value==='grandpa'||value==='grandma';
export const defaultCharacter=(index:number):CharacterId=>index%2===0?'grandpa':'grandma';
export const resolveCharacter=(value:unknown,index=0):CharacterId=>isCharacterId(value)?value:defaultCharacter(index);
