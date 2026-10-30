import { useEffect } from 'react';
import { useGameStore } from '../game/store/useGameStore';
import { useJourney } from '../game/journey';
import { DICE_TIMING } from '../game/dice/DiceAnimationController';
import { diceAnimation, useDicePresentation } from '../game/dice/presentation';
import { currentDiceMotion, useDiceSettings } from '../game/dice/settings';
import { gameFeedback } from '../game/dice/feedback';

// The controller observes authoritative snapshots, so an eventual online adapter can supply the result.
export function DiceController(){
  useEffect(()=>{
    const timers=new Set<ReturnType<typeof setTimeout>>();let token='';let disposed=false;
    const schedule=(callback:()=>void,delay:number)=>{const handle=setTimeout(()=>{timers.delete(handle);if(!disposed)callback();},delay);timers.add(handle);};
    const cancel=()=>{timers.forEach(clearTimeout);timers.clear();gameFeedback.stop();};
    const complete=()=>{
      const state=useGameStore.getState();
      const presentation=useDicePresentation.getState();
      if(presentation.token!==token)return;
      useDicePresentation.setState({phase:'moving'});
      if(state.phase==='ROLLING'&&`${state.sessionId}:${state.revision}`===token)state.completeRoll(state.revision);
    };
    const sync=()=>{
      const s=useGameStore.getState(),next=`${s.sessionId}:${s.revision}`;
      if(s.phase==='ROLLING'&&next!==token){
        cancel();diceAnimation.reset();token=next;
        const mode=currentDiceMotion(),timing=DICE_TIMING[mode];diceAnimation.start(s.diceValue,token,performance.now(),mode);
        useDicePresentation.setState({phase:timing.roll?'rolling':'revealing',result:s.diceValue,mode,token,skipRequested:false});
        useJourney.getState().setMode('overview');
        if(timing.roll){for(const fraction of [.2,.4,.6,.78])schedule(()=>gameFeedback.roll(),timing.roll*fraction);schedule(()=>gameFeedback.land(),timing.roll*.68);schedule(()=>gameFeedback.land(),timing.roll*.86);}
        const reveal=()=>{useDicePresentation.setState({phase:'revealing'});gameFeedback.reveal();};
        if(timing.roll)schedule(reveal,timing.roll);else reveal();
        schedule(complete,timing.roll+timing.reveal);
      }else if(!['ROLLING','MOVING'].includes(s.phase)||!token.startsWith(s.sessionId+':')){
        cancel();token='';diceAnimation.reset();useDicePresentation.setState({phase:'idle',token:'',skipRequested:false});
      }
    };
    const unsubGame=useGameStore.subscribe(sync);
    const unsubSkip=useDicePresentation.subscribe(s=>{if(!s.skipRequested||!token)return;cancel();diceAnimation.skip();useDicePresentation.setState({skipRequested:false});useJourney.getState().skip();complete();});
    const unsubSettings=useDiceSettings.subscribe((s,old)=>{if((s.muted&&!old.muted)||(!s.vibration&&old.vibration))gameFeedback.stop();});
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const simplify=()=>{
      const presentation=useDicePresentation.getState();
      if(!media.matches||!['rolling','revealing'].includes(presentation.phase))return;
      cancel();diceAnimation.reset();diceAnimation.start(presentation.result,token,performance.now(),'reduced');
      useDicePresentation.setState({phase:'revealing',mode:'reduced'});schedule(complete,DICE_TIMING.reduced.reveal);
    };
    media.addEventListener('change',simplify);
    sync();
    return()=>{disposed=true;unsubGame();unsubSkip();unsubSettings();media.removeEventListener('change',simplify);cancel();diceAnimation.reset();useDicePresentation.setState({phase:'idle',token:'',skipRequested:false});};
  },[]);
  return null;
}
