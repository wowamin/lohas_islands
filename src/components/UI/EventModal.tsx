import { Activity, Brain, Check, Coins, Heart, HeartHandshake, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { GameEvent, TileType } from '../../game/types';
import { useGameStore } from '../../game/store/useGameStore';
import { ResourceDetails } from './ResourceBook';
import { BOARD_DATA } from '../../game/board';

const CATEGORY: Record<TileType, { title: string; icon: string; color: string }> = {
  START: { title: '人生起點', icon: '⌂', color: '#d88c65' },
  LIVING: { title: '生活日常', icon: '♡', color: '#bb8b69' },
  SERVICE: { title: '長照服務', icon: '✚', color: '#65968e' },
  OPPORTUNITY: { title: '社區機會', icon: '✦', color: '#aa9148' },
  ACCIDENT: { title: '生活事件', icon: '!', color: '#bd7665' },
  REST: { title: '休息時刻', icon: '☼', color: '#6f9464' },
  RESOURCE: { title: '資源補給', icon: '＋', color: '#718a99' },
};

export const EventModal = () => {
  const phase = useGameStore((state) => state.phase);
  const selectedEvent = useGameStore((state) => state.selectedEvent);
  const chooseEvent = useGameStore((state) => state.chooseEvent);
  const revision = useGameStore((state) => state.revision);
  const eventResultText = useGameStore((state) => state.eventResultText);
  const advanceFromResult = useGameStore((state) => state.advanceFromResult);
  const currentPlayer = useGameStore((state) => state.players[state.currentPlayerIndex]);
  const lesson = useGameStore((state) => state.eventLesson);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (phase !== 'EVENT') return;
    const active = document.activeElement as HTMLElement | null;
    const node = dialog.current;
    node?.showModal();
    return () => { node?.close(); active?.focus(); };
  }, [phase]);
  useEffect(() => {
    if (phase === 'EVENT') {
      dialog.current?.scrollTo(0, 0);
      dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    }
  }, [phase, selectedEvent]);

  if (phase !== 'EVENT') return null;
  const category = CATEGORY[selectedEvent?.category ?? 'LIVING'];

  return (
      <dialog ref={dialog} className={'event-card event-dialog category-' + (selectedEvent?.category ?? 'LIVING').toLowerCase()} aria-label={selectedEvent?.title ?? '這一步的回應'} onCancel={(event) => event.preventDefault()}>
        {selectedEvent ? (
          <>
            <div className="event-art">
              <span className="event-sunburst" />
              <span className="event-art-symbol">{category.icon}</span>
              <span className="event-art-leaf"><HeartHandshake size={26} /></span>
              <span className="event-art-sparkle"><Sparkles size={16} /></span>
            </div>
            <div className="event-content">
              <div className="event-category"><span>{category.icon}</span>{category.title}</div>
              <p className="arrival-label">抵達第 {(currentPlayer?.position ?? 0) + 1} 格 · {BOARD_DATA[currentPlayer?.position ?? 0].name}</p>
              <h2 id="event-title">{selectedEvent.title}</h2>
              <p className="event-description">{selectedEvent.description}</p>
              <div className="event-context"><span className={'context-avatar player-tone-' + (currentPlayer?.id ?? 0)}>{currentPlayer?.name.slice(0, 1) || '玩'}</span><span>這是 <strong>{currentPlayer?.name}</strong> 遇到的情況</span></div>
              <p className="simulation-note">以下遊戲幣及健康、壓力變動為模擬效果。</p>
              {selectedEvent.serviceKey && <details className="event-resource"><summary>先了解相關服務</summary><ResourceDetails serviceKey={selectedEvent.serviceKey} /></details>}

              {selectedEvent.options ? (
                <div className="event-options">
                  <div className="choose-label">你會怎麼做？</div>
                  {selectedEvent.options.map((option, index) => (
                    <button className="choice-button" type="button" key={index} onClick={() => chooseEvent(selectedEvent.id, index, revision)}>
                      <span className="choice-copy"><strong>{option.text}</strong><span className="effect-list">{effectSummary(option.effect)}</span></span>
                      
                    </button>
                  ))}
                </div>
              ) : (
                <div className="event-single-action">
                  <div className="event-effect-card"><span className="effect-card-icon"><Activity size={17} /></span><div><small>資源變化</small><div className="effect-list">{effectSummary(selectedEvent.effect)}</div></div></div>
                  <button className="primary-button event-confirm" type="button" onClick={() => chooseEvent(selectedEvent.id, undefined, revision)}>了解，繼續前進 </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="result-feedback">
            <div className="feedback-art"><span>✦</span><div className="feedback-check"><Check size={28} /></div></div>
            <div className="event-category result-category"><span>♡</span>這一步的回應</div>
            <h2 id="event-title">旅程繼續向前</h2>
            <p className="event-description">{eventResultText}</p>
            {lesson && <div className="learning-note"><strong>這一步認識的事</strong><p>{lesson}</p></div>}
            <div className="result-note"><span className={'context-avatar player-tone-' + (currentPlayer?.id ?? 0)}>{currentPlayer?.name.slice(0, 1) || '玩'}</span><span><strong>{currentPlayer?.name}</strong> 已完成這次選擇</span></div>
            <button className="primary-button continue-button" type="button" onClick={advanceFromResult}>交給下一位 </button>
          </div>
        )}
      </dialog>
  );
};

function effectSummary(effect?: GameEvent['effect']) {
  if (!effect) return <span className="effect-neutral">依照你的選擇，迎接接下來的旅程</span>;
  const changes: { label: string; value: number; icon: ReactNode }[] = [];
  if (effect.money !== undefined) changes.push({ label: '金錢', value: effect.money, icon: <Coins size={13} /> });
  if (effect.health !== undefined) changes.push({ label: '健康', value: effect.health, icon: <Heart size={13} /> });
  if (effect.stress !== undefined) changes.push({ label: '壓力', value: effect.stress, icon: <Brain size={13} /> });
  if (!changes.length) return <span className="effect-neutral">沒有數值變動</span>;
  return changes.map((item) => (
    <span className={'effect-chip ' + (item.value > 0 ? (item.label === '壓力' ? 'effect-negative' : 'effect-positive') : (item.label === '壓力' ? 'effect-positive' : 'effect-negative'))} key={item.label}>
      {item.icon}{item.label} {item.value > 0 ? '+' : ''}{item.value.toLocaleString()}
    </span>
  ));
}
