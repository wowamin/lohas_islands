import { BOARD_DATA } from '../../game/board';
import { getResource, CORE_SERVICES } from '../../game/resources';
import { useGameStore } from '../../game/store/useGameStore';
import type { ServiceKey } from '../../game/types';

const symbols = { START: '⌂', LIVING: '♡', SERVICE: '✚', OPPORTUNITY: '✦', ACCIDENT: '!', REST: '☼', RESOURCE: '＋' };
export function CommunityBoard({ onResource }: { onResource: (key: ServiceKey) => void }) {
  const players = useGameStore((state) => state.players);
  const currentIndex = useGameStore((state) => state.currentPlayerIndex);
  const current = players[currentIndex];
  return (
    <div className="community-board" aria-label="50 格社區棋盤">
      {BOARD_DATA.map((tile) => {
        const occupants = players.filter((player) => player.position === tile.id);
        return <button key={tile.id} type="button" className={'board-space space-' + tile.id + ' category-' + tile.type.toLowerCase() + (current?.position === tile.id ? ' is-active-space' : '')} onClick={() => onResource(tile.serviceKey ?? 'community')} aria-label={`${tile.id + 1} ${tile.name}，查看相關資源${occupants.length ? '，' + occupants.map((p) => p.name).join('、') + '在此' : ''}`} aria-current={current?.position === tile.id ? 'location' : undefined}>
          <span className="space-number">{String(tile.id + 1).padStart(2, '0')}</span><span className="space-symbol" aria-hidden="true">{symbols[tile.type]}</span><span className="space-name">{tile.name}</span>
          <span className="space-players">{occupants.map((player) => <span key={player.id} className={'board-token player-tone-' + player.id}>{player.id + 1}</span>)}</span>
        </button>;
      })}
      <div className="board-center">
        <span className="section-eyebrow">樂活社區・照顧同行</span>
        <h1>長照人生路</h1><p className="board-intro">認識社區，找到支持。</p>
        <div className="board-service-grid">{CORE_SERVICES.map((key) => { const service = getResource(key); return <button key={key} type="button" className={'board-service resource-' + key} onClick={() => onResource(key)}><span aria-hidden="true">{service.icon}</span><strong>{service.shortTitle}</strong><small>了解服務</small></button>; })}</div>
        <button className="meal-banner" type="button" onClick={() => onResource('meal')}><span aria-hidden="true">♧</span><span><strong>樂活聚飽棚</strong><small>一起回家吃飯</small></span></button>
        <p className="board-instruction">擲骰前進・完成事件・收集照顧任務<br />點選格子可查閱資源</p>
        {current && <p className="current-location" aria-live="polite">{current.name} 在第 {current.position + 1} 格 · {BOARD_DATA[current.position].name}</p>}
      </div>
    </div>
  );
}
