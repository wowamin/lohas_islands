import { getGameSessionAdapter } from './store/useGameStore';
export const saveSnapshot=()=>getGameSessionAdapter().save();
export const loadSnapshot=()=>getGameSessionAdapter().load();
