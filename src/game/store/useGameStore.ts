import { createGameClient } from './createGameClient';
import { createBrowserSession } from '../session/browserSession';
// React and Three.js keep the same read/subscription API. Rules live in the adapter.
const client=createGameClient(createBrowserSession());
export const useGameStore=client.useStore;
export const setGameSessionAdapter=client.setAdapter;
export const getGameSessionAdapter=client.getAdapter;
