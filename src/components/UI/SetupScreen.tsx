import { useState } from 'react';
import { Heart, Minus, Plus, Sparkles, UsersRound } from 'lucide-react';
import { useGameStore } from '../../game/store/useGameStore';

const MARKS = ['✿', '⌂', '☼', '♡'];

export const SetupScreen = ({ onResource, onExplore, onLearn }: { onResource: () => void; onExplore: () => void; onLearn:()=>void }) => {
  const [names, setNames] = useState(['玩家 1', '玩家 2']);
  const startGame = useGameStore((state) => state.startGame);

  const updateName = (index: number, value: string) => {
    setNames((current) => current.map((name, i) => (i === index ? value : name)));
  };

  return (
    <div className="setup-layer">
      <section className="setup-card" aria-labelledby="setup-title">
        <div className="setup-intro"><div className="setup-kicker"><Sparkles size={15} /> 一起走一段照顧的路</div>
        <div className="setup-emblem"><Heart size={27} fill="currentColor" /></div>
        <h1 id="setup-title">長照人生旅程 3.0</h1>
        <p className="setup-subtitle">走進城市的 50 個站點，找到生活裡的支持</p>
        <ol className="setup-rules"><li>擲骰前進，遇見社區服務</li><li>完成事件，收集照顧任務</li><li>走完 12 輪，一起回顧旅程</li></ol>
        <div className="setup-explore"><button className="text-button" type="button" onClick={onExplore}>先逛逛照顧城市 ↗</button><button className="text-button" type="button" onClick={onResource}>社區資源手冊</button><button className="text-button" type="button" onClick={onLearn}>A 個管新進人員訓練 ↗</button></div>

        </div><div className="setup-form"><div className="setup-section-title">
          <span><UsersRound size={16} /> 玩家名稱</span>
          <span className="player-count">{names.length} 位玩家</span>
        </div>

        <div className="name-list">
          {names.map((name, index) => (
            <label className="name-row" key={index}>
              <span className={'player-avatar player-tone-' + index}>{MARKS[index]}</span>
              <span className="name-field">
                <span className="name-caption">玩家 {index + 1}</span>
                <input
                  value={name}
                  onChange={(event) => updateName(index, event.target.value)}
                  aria-label={'玩家 ' + (index + 1) + ' 名稱'}
                  maxLength={12}
                />
              </span>
              {names.length > 2 && (
                <button className="icon-button remove-player" type="button" aria-label={'移除玩家 ' + (index + 1)} onClick={() => setNames((current) => current.filter((_, i) => i !== index))}>
                  <Minus size={17} />
                </button>
              )}
            </label>
          ))}
        </div>

        <div className="setup-actions">
          {names.length < 4 && (
            <button className="secondary-button add-player" type="button" onClick={() => setNames((current) => [...current, '玩家 ' + (current.length + 1)])}>
              <Plus size={17} /> 增加玩家
            </button>
          )}
          <button className="primary-button start-button" type="button" onClick={() => startGame(names.map((name, index) => name.trim() || '玩家 ' + (index + 1)))}>
            開始人生旅程 <span>✦</span>
          </button>
        </div>
        <div className="setup-note">支援 2–4 人，同一台裝置輪流遊玩</div>
      </div></section>
    </div>
  );
};
