import { reducedMotion, useDiceSettings } from './settings';
// One lazy audio context and one reusable noise buffer. No audio downloads or library required.
let context:AudioContext|undefined,master:GainNode|undefined,noise:AudioBuffer|undefined,activated=false,vibrating=false;
const sources=new Set<AudioScheduledSourceNode>();
function ready(){return context?.state==='running'&&!useDiceSettings.getState().muted&&typeof document!=='undefined'&&!document.hidden;}
function track(node:AudioScheduledSourceNode){sources.add(node);node.onended=()=>{sources.delete(node);node.disconnect();};}
function tone(frequency:number,duration:number,volume:number,delay=0){
  if(!ready()||!context||!master)return;
  const start=context.currentTime+delay,osc=context.createOscillator(),gain=context.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(gain);gain.connect(master);track(osc);osc.addEventListener('ended',()=>gain.disconnect());osc.start(start);osc.stop(start+duration+.02);
}
export const gameFeedback={
  unlock(){
    activated=true;
    if(useDiceSettings.getState().muted)return Promise.resolve();
    try{
      if(!context){const Constructor=globalThis.AudioContext??(globalThis as typeof globalThis&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!Constructor)return Promise.resolve();context=new Constructor();master=context.createGain();master.gain.value=.16;master.connect(context.destination);
        noise=context.createBuffer(1,Math.ceil(context.sampleRate*.14),context.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.sin(i*12.9898)*Math.sin(i*.7347);
      }
      return context.resume().catch(()=>{});
    }catch{return Promise.resolve();/* Blocked/unsupported audio never blocks a turn. */}
  },
  click(){try{tone(392,.10,.24);}catch{/* Silent fallback. */}},
  roll(){
    if(!ready()||!context||!master||!noise)return;
    try{const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain(),now=context.currentTime;source.buffer=noise;filter.type='lowpass';filter.frequency.value=650;gain.gain.setValueAtTime(.3,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.14);source.connect(filter);filter.connect(gain);gain.connect(master);track(source);source.addEventListener('ended',()=>{filter.disconnect();gain.disconnect();});source.start();source.stop(now+.15);}catch{/* Silent fallback. */}
  },
  land(){try{tone(130,.16,.35);if(activated&&useDiceSettings.getState().vibration&&!reducedMotion()&&typeof navigator.vibrate==='function'&&(navigator.userActivation?.hasBeenActive??true))vibrating=navigator.vibrate(18);}catch{/* Unsupported/denied haptics are optional. */}},
  reveal(){try{tone(262,.20,.22);tone(330,.22,.18,.07);tone(392,.26,.16,.14);}catch{/* Silent fallback. */}},
  step(){try{tone(196,.065,.12);}catch{/* Silent fallback. */}},
  stop(){for(const source of sources){try{source.stop();}catch{/* Already stopped. */}}sources.clear();try{if(vibrating&&typeof navigator!=='undefined'&&typeof navigator.vibrate==='function')navigator.vibrate(0);}catch{/* Optional. */}vibrating=false;},
};
