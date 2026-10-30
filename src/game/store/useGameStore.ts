import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, GameEvent } from '../types';
import { eventsForTile } from '../eventRegistry';
import { BOARD_DATA } from '../board';
import { BOARD_SIZE } from '../cityLayout';
import { AUTO_KEY, SAVE_VERSION, gameStorage } from '../persistence';
import confetti from 'canvas-confetti';
let rollGeneration = 0;

type EventEffect = {
  money?: number;
  health?: number;
  stress?: number;
};

interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  round: number;
  phase: 'SETUP' | 'WAITING_ROLL' | 'ROLLING' | 'MOVING' | 'EVENT' | 'RESULT';
  diceValue: number;
  selectedEvent: GameEvent | null;
  eventResultText: string | null;
  eventLesson?: string;

  startGame: (names: string[]) => void;
  rollDice: () => void;
  movePlayer: () => void;
  resolveEvent: (effect: EventEffect, resultText?: string) => void;
  advanceFromResult: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(persist((set, get) => ({
  players: [],
  currentPlayerIndex: 0,
  round: 1,
  phase: 'SETUP',
  diceValue: 1,
  selectedEvent: null,
  eventResultText: null,

  startGame: (names) => {
    if (names.length < 2 || names.length > 4) return;
    rollGeneration++;
    const colors = ['#D88C65', '#89B5AD', '#D5B86A', '#58463B'];
    const players = names.map((name, i) => ({
      id: i, name, color: colors[i], position: 0, money: 10000, health: 80, stress: 20, learnedServices: []
    }));

    set({
      players,
      phase: 'WAITING_ROLL',
      round: 1,
      currentPlayerIndex: 0,
      diceValue: 1,
      selectedEvent: null,
      eventResultText: null,
      eventLesson: undefined,
    });
  },

  rollDice: () => {
    if (get().phase !== 'WAITING_ROLL') return;
    const val = Math.floor(Math.random() * 6) + 1;
    const generation = ++rollGeneration;
    set({ diceValue: val, phase: 'ROLLING' });

    setTimeout(() => {
      if (generation === rollGeneration && get().phase === 'ROLLING') set({ phase: 'MOVING' });
    }, 1500);
  },

  movePlayer: () => {
    const { players, currentPlayerIndex, diceValue } = get();
    if (players.length === 0 || get().phase !== 'MOVING') return;

    const newPlayers = [...players];
    const p = { ...newPlayers[currentPlayerIndex] };

    let newPos = p.position + diceValue;
    if (newPos >= BOARD_SIZE) {
      newPos -= BOARD_SIZE;
      p.money += 1000;
    }
    p.position = newPos;
    newPlayers[currentPlayerIndex] = p;

    let event: GameEvent | null = null;
    if (newPos !== 0) {
      const candidates = eventsForTile(BOARD_DATA[newPos].eventIds);
      event = candidates[Math.floor(Math.random() * candidates.length)] ?? null;
    }

    set({ players: newPlayers, phase: 'EVENT', selectedEvent: event, eventLesson: undefined, eventResultText: event ? null : newPos===0?'回到樂活起點，獲得 1,000 遊戲幣。這是桌遊獎勵，不是實際長照津貼。':`${BOARD_DATA[newPos].name}：這是教育／轉場停靠點，金錢、健康與壓力不變。可在回合間開啟知識圖鑑。` });
  },

  resolveEvent: (effect = {}, resultText = '') => {
    const { players, currentPlayerIndex } = get();
    const event = get().selectedEvent;
    if (players.length === 0 || get().phase !== 'EVENT' || !event) return;

    const newPlayers = [...players];
    const p = { ...newPlayers[currentPlayerIndex] };

    p.money = Math.max(0, p.money + (effect.money ?? 0));
    p.health = Math.min(100, Math.max(0, p.health + (effect.health ?? 0)));
    p.stress = Math.min(100, Math.max(0, p.stress + (effect.stress ?? 0)));
    p.learnedServices = event.serviceKey
      ? [...new Set([...(p.learnedServices ?? []), event.serviceKey])]
      : (p.learnedServices ?? []);
    p.completedActivities = event.id === 'meal' || event.id === 'respite'
      ? [...new Set<'meal' | 'respite'>([...(p.completedActivities ?? []), event.id])]
      : (p.completedActivities ?? []);

    newPlayers[currentPlayerIndex] = p;

      set({
        players: newPlayers,
        phase: 'EVENT',
        selectedEvent: null,
        eventResultText: resultText || '這次事件已完成。',
        eventLesson: event.lesson,
      });
  },

  advanceFromResult: () => {
    const { players, currentPlayerIndex, round } = get();
    if (players.length === 0 || get().phase !== 'EVENT' || get().selectedEvent) return;

    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    let nextRound = round;
    if (nextPlayerIndex === 0) nextRound++;

    if (nextRound > 12) {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) confetti();
      set({ phase: 'RESULT', selectedEvent: null, eventResultText: null });
      return;
    }

    set({
      currentPlayerIndex: nextPlayerIndex,
      round: nextRound,
      phase: 'WAITING_ROLL',
      selectedEvent: null,
      eventResultText: null,
      eventLesson: undefined,
    });
  },

  resetGame: () => { rollGeneration++; set({
    phase: 'SETUP',
    players: [],
    round: 1,
    currentPlayerIndex: 0,
    diceValue: 1,
    selectedEvent: null,
    eventResultText: null,
    eventLesson: undefined,
  }); },
}), {
  name: AUTO_KEY,
  version: SAVE_VERSION,
  storage: gameStorage,
  partialize: ({players,currentPlayerIndex,round,phase,diceValue,selectedEvent,eventResultText,eventLesson})=>({players,currentPlayerIndex,round,phase,diceValue,selectedEvent,eventResultText,eventLesson}),
  onRehydrateStorage: () => (state) => {
    rollGeneration++;
    if (state?.phase === 'ROLLING') state.phase = 'MOVING';
  },
}));
