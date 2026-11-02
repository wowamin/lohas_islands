import { useEffect } from 'react';
import { useGameStore } from '../game/store/useGameStore';
import { useJourney } from '../game/journey';
import { FINISH_INDEX } from '../game/mapDefinition';
import { useDicePresentation } from '../game/dice/presentation';
import { currentDiceMotion } from '../game/dice/settings';
import { DICE_TIMING } from '../game/dice/DiceAnimationController';
import { gameFeedback } from '../game/dice/feedback';

export function MovementController() {
  const phase = useGameStore(s => s.phase);
  const revision = useGameStore(s => s.revision);
  const sessionId = useGameStore(s => s.sessionId);
  const dicePhase = useDicePresentation(s => s.phase);
  useEffect(() => {
    if (phase !== 'MOVING' || dicePhase === 'rolling' || dicePhase === 'revealing') return;
    const state = useGameStore.getState();
    const player = state.players[state.currentPlayerIndex];
    if (!player) return;
    let step = 0;
    const destination=state.pendingMoveTarget??Math.min(FINISH_INDEX,player.position+state.diceValue);
    const distance=destination-player.position;
    const journey = useJourney.getState();
    if(journey.follow)journey.setMode('follow');
    journey.setStep(player.id, player.position);
    let completed=false;
    const finish=()=>{
      if(completed)return;completed=true;window.clearInterval(timer);
      journey.setStep(player.id,destination);
      state.movePlayer(state.revision);
      journey.setStep(null,null);
      if(useJourney.getState().follow)journey.setMode('focus',destination);
    };
    const timer = window.setInterval(() => {
      if(step>=distance){finish();return;}
      step++;
      gameFeedback.step();
      journey.setStep(player.id, Math.min(destination,player.position+step));
      // Keep the final step visible for one interval before opening its event.
    }, DICE_TIMING[currentDiceMotion()].step);
    const unsubscribe=useJourney.subscribe(s=>{if(s.skipRequested)finish();});
    if(useJourney.getState().skipRequested)finish();
    return () => { window.clearInterval(timer);unsubscribe();journey.setStep(null,null); };
  }, [phase, revision, sessionId, dicePhase]);
  return null;
}
