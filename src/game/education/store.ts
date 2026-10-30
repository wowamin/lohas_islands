import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QUESTIONS } from './content';
type LearningState = { read: string[]; answers: Record<string,number>; mistakes: string[]; tasks: string[]; markRead: (id:string)=>void; answer:(id:string,choice:number)=>void; complete:(id:string)=>void };
export const useLearning = create<LearningState>()(persist((set)=>({
  read:[],answers:{},mistakes:[],tasks:[],
  markRead:id=>set(s=>({read:[...new Set([...s.read,id])]})),
  complete:id=>set(s=>({tasks:[...new Set([...s.tasks,id])]})),
  answer:(id,choice)=>set(s=>({answers:{...s.answers,[id]:choice},mistakes:QUESTIONS.find(q=>q.id===id)?.correct===choice?s.mistakes:[...new Set([...s.mistakes,id])]})),
}),{name:'lohas-learning-v1',version:1}));
