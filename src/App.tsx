import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CityExplorer } from './components/UI/CityExplorer';
import { ResourceBook } from './components/UI/ResourceBook';
import type { ServiceKey } from './game/types';
import { HUD } from './components/UI/HUD';
import { EventModal } from './components/UI/EventModal';
import { SetupScreen } from './components/UI/SetupScreen';
import { ResultScreen } from './components/UI/ResultScreen';
import { useGameStore } from './game/store/useGameStore';
import { MovementController } from './components/MovementController';
import { LearningCenter } from './components/UI/LearningCenter';
import { useLearning } from './game/education/store';
import type { ModuleId } from './game/education/content';
import { SaveNotice } from './components/UI/SaveNotice';
import { DiceController } from './components/DiceController';
import { DiceResult } from './components/UI/DiceResult';
import { OnlineCount } from './components/UI/OnlineCount';



function App() {
  const phase = useGameStore((state) => state.phase);
  useEffect(()=>{if(phase==='RESULT'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)confetti();},[phase]);
  const [view, setView] = useState<'board' | '3d'>('board');
  const [exploring, setExploring] = useState(false);
  const [resource, setResource] = useState<ServiceKey | null>(null);
  const [learning, setLearning] = useState<'library'|'training'|null>(null);
  const [learningModule,setLearningModule]=useState<ModuleId>('A');
  const read = useLearning(s=>s.read.length);
  const exploringOnly = exploring && phase !== 'SETUP';
  const overlay = learning !== null || resource !== null;

  return (
    <main className={'game-app' + (phase === 'SETUP' ? ' is-setup' : '')}>
      <OnlineCount />
      <DiceController />
      <MovementController />
      <DiceResult />
      <div className="scene scene-city" inert={overlay || (phase === 'SETUP' && !exploring) || phase === 'EVENT' || phase === 'RESULT'}>
        <CityExplorer onResource={setResource} onView={setView} onLearn={module=>{setLearningModule(module??'A');setLearning('library');}} />
      </div>

      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      {phase === 'SETUP' && !exploring && <SetupScreen onResource={() => setResource('community')} onExplore={() => setExploring(true)} onLearn={()=>setLearning('training')} />}
      {phase === 'SETUP' && exploring && <button className="city-start primary-button" onClick={() => setExploring(false)}>開始 2–4 人旅程 →</button>}
      {phase !== 'SETUP' && phase !== 'RESULT' && (
        <>
          <div inert={overlay}><HUD boardView={view} exploring={exploringOnly} /></div>
          <EventModal />
        </>
      )}
      {phase === 'RESULT' && <ResultScreen />}
      {((phase==='SETUP'&&exploring)||phase==='WAITING_ROLL')&&<nav className="education-launch" inert={overlay} aria-label="遊戲與學習模式"><button onClick={()=>setLearning('library')}>▤ 長照知識圖鑑<small>六大單元 · 已閱讀 {read}/6</small></button><button onClick={()=>setLearning('training')}>✧ A 個管新進訓練<small>情境、計畫與補助練習</small></button>{phase==='WAITING_ROLL'&&<button aria-pressed={exploringOnly} onClick={()=>setExploring(!exploringOnly)}>{exploringOnly?'返回遊戲模式 →':'切換城市探索 →'}</button>}</nav>}
      {exploringOnly&&<div className="explore-status">城市探索中 · 回合暫停</div>}

      <div className="disclaimer">教育模擬｜金錢與效果為遊戲數值｜服務諮詢 1966</div>
      {resource && <ResourceBook selected={resource} onSelect={setResource} onClose={() => setResource(null)} />}
      {learning && <LearningCenter initialModule={learningModule} initial={learning} onClose={()=>setLearning(null)} />}
      <SaveNotice />
    </main>
  );
}

export default App;
