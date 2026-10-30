import { useEffect } from 'react';
import { useGameStore } from '../game/store/useGameStore';
import { useJourney } from '../game/journey';
import { BOARD_SIZE } from '../game/cityLayout';

export function MovementController() {
  const phase = useGameStore(s => s.phase);
  useEffect(() => {
    if (phase !== 'MOVING') return;
    const state = useGameStore.getState();
    const player = state.players[state.currentPlayerIndex];
    if (!player) return;
    let step = 0;
    const journey = useJourney.getState();
    if(journey.follow)journey.setMode('follow');
    journey.setStep(player.id, player.position);
    let completed=false;
    const finish=()=>{
      if(completed)return;completed=true;window.clearInterval(timer);
      journey.setStep(player.id,(player.position+state.diceValue)%BOARD_SIZE);
      state.movePlayer();
      journey.setStep(null,null);
      if(useJourney.getState().follow)journey.setMode('focus',(player.position+state.diceValue)%BOARD_SIZE);
    };
    const timer = window.setInterval(() => {
      step++;
      journey.setStep(player.id, (player.position + step) % BOARD_SIZE);
      if (step === state.diceValue) {
        finish();
      }
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : 420);
    const unsubscribe=useJourney.subscribe(s=>{if(s.skipRequested)finish();});
    return () => { window.clearInterval(timer);unsubscribe();journey.setStep(null,null); };
  }, [phase]);
  return null;
}
