import { useState } from 'react';
import { CityExplorer } from './components/UI/CityExplorer';
import { ResourceBook } from './components/UI/ResourceBook';
import type { ServiceKey } from './game/types';
import { HUD } from './components/UI/HUD';
import { EventModal } from './components/UI/EventModal';
import { SetupScreen } from './components/UI/SetupScreen';
import { ResultScreen } from './components/UI/ResultScreen';
import { useGameStore } from './game/store/useGameStore';



function App() {
  const phase = useGameStore((state) => state.phase);
  const [view, setView] = useState<'board' | '3d'>('board');
  const [exploring, setExploring] = useState(false);
  const [resource, setResource] = useState<ServiceKey | null>(null);

  return (
    <main className={'game-app' + (phase === 'SETUP' ? ' is-setup' : '')}>
      <div className="scene scene-city" inert={(phase === 'SETUP' && !exploring) || phase === 'EVENT' || phase === 'RESULT'}>
        <CityExplorer onResource={setResource} onView={setView} />
      </div>

      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      {phase === 'SETUP' && !exploring && <SetupScreen onResource={() => setResource('community')} onExplore={() => setExploring(true)} />}
      {phase === 'SETUP' && exploring && <button className="city-start primary-button" onClick={() => setExploring(false)}>開始 2–4 人旅程 →</button>}
      {phase !== 'SETUP' && phase !== 'RESULT' && (
        <>
          <HUD boardView={view} />
          <EventModal />
        </>
      )}
      {phase === 'RESULT' && <ResultScreen />}

      <div className="disclaimer">教育模擬｜金錢與效果為遊戲數值｜服務諮詢 1966</div>
      {resource && <ResourceBook selected={resource} onSelect={setResource} onClose={() => setResource(null)} />}
    </main>
  );
}

export default App;
