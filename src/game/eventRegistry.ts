import { EVENT_CARDS } from './events';
import { MODULES, QUESTIONS } from './education/content';
import type { GameEvent } from './types';
// New knowledge opportunities reuse reviewed-in-app content, with no numeric effects.
export const EDUCATION_EVENTS:GameEvent[]=MODULES.map(module=>{
  const q=QUESTIONS.find(q=>q.module===module.id)!;
  return {id:`education-${module.id}`,title:`知識機會卡 · ${q.title}`,description:`${q.background} ${q.problem}`,category:'OPPORTUNITY',lesson:q.explanation,
    options:q.choices.map((text,index)=>({text,effect:{},result:`${index===q.correct?'觀念正確。':'一起釐清觀念。'}${q.explanation} 本格不改變金錢、健康或壓力。`}))};
});
export const ALL_GAME_EVENTS=[...EVENT_CARDS,...EDUCATION_EVENTS];
export const eventsForTile=(ids:readonly string[])=>ALL_GAME_EVENTS.filter(event=>ids.includes(event.id));
