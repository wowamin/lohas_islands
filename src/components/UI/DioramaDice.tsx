import {useEffect,useRef} from 'react';
import * as T from 'three';
import {createIslandDice} from '../District/diceModel';
import {diceAnimation,useDicePresentation} from '../../game/dice/presentation';
import {useGameStore} from '../../game/store/useGameStore';

// A presentation of the same authoritative result and animation token, never a second roll.
export function DioramaDice(){
  const host=useRef<HTMLSpanElement>(null);
  useEffect(()=>{
    const parent=host.current;if(!parent)return;
    let renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
    renderer.setSize(110,110);renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;parent.appendChild(renderer.domElement);
    const scene=new T.Scene(),camera=new T.OrthographicCamera(-1.6,1.6,1.8,-1.4,.1,30);camera.position.set(3,4.5,5);camera.lookAt(0,.7,0);
    scene.add(new T.HemisphereLight('#ffffff','#b6c1a8',2.0));const sun=new T.DirectionalLight('#fff0d6',2.6);sun.position.set(-3,6,4);scene.add(sun);
    const die=createIslandDice();die.root.position.set(0,0,0);die.root.scale.setScalar(1);die.root.visible=true;scene.add(die.root);
    let frame=0,previous='';
    const render=(now:number)=>{frame=requestAnimationFrame(render);if(document.hidden)return;const presentation=useDicePresentation.getState(),game=useGameStore.getState(),animated=presentation.phase==='rolling'||presentation.phase==='revealing',signature=presentation.phase+':'+game.diceValue;
      if(!animated&&signature===previous)return;previous=signature;
      die.update(animated?diceAnimation.sample(now):{phase:'idle',progress:1,result:game.diceValue,mode:'reduced',token:''});renderer.render(scene,camera);
    };frame=requestAnimationFrame(render);
    return()=>{cancelAnimationFrame(frame);die.dispose();renderer.dispose();renderer.domElement.remove();};
  },[]);
  return <span className="diorama-dice" ref={host} aria-hidden="true"/>;
}
