import type { CharacterId } from './characters';
export type Player = {
  id: number;
  name: string;
  color: string;
  characterId?: CharacterId;
  position: number;
  money: number;
  health: number;
  stress: number;
  learnedServices?: ServiceKey[];
  completedActivities?: ('meal' | 'respite')[];
};

export type ServiceKey = 'care' | 'transport' | 'equipment' | 'respite' | 'meal' | 'community';

export type TileType = 'START' | 'LIVING' | 'SERVICE' | 'OPPORTUNITY' | 'ACCIDENT' | 'REST' | 'RESOURCE';

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  category: TileType;
  serviceKey?: ServiceKey;
  lesson?: string;
  options?: {
    text: string;
    effect: { money?: number; health?: number; stress?: number };
    result: string;
  }[];
  effect?: { money?: number; health?: number; stress?: number };
  result?: string;
}
