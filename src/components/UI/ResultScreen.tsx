import { Activity, Brain, Coins, Crown, Heart, RotateCcw, Sparkles } from 'lucide-react';
import { useGameStore } from '../../game/store/useGameStore';
import { missionSummary, getResource } from '../../game/resources';
import { rankPlayers, scorePlayer } from '../../game/rules/engine';

export const ResultScreen = () => {
  const players = useGameStore((state) => state.players);
  const resetGame = useGameStore((state) => state.resetGame);
  const sorted = rankPlayers(players);

  return (
    <div className="result-layer">
      <section className="result-card">
        <div className="result-confetti"><Sparkles size={18} /><span>旅程完成</span><Sparkles size={18} /></div>
        <div className="winner-crown"><Crown size={28} /></div>
        <h1>人生旅程結算</h1>
        <p className="result-intro">每一段照顧都有價值，看看大家累積了哪些力量。</p>
        <div className="score-list">
          {sorted.map((player, index) => (
            <article className={'score-card' + (index === 0 ? ' score-winner' : '')} key={player.id}>
              <div className="score-rank">{index === 0 ? <Crown size={18} /> : index + 1}</div>
              <span className={'player-avatar small-avatar player-tone-' + player.id}>{['✿', '⌂', '☼', '♡'][player.id]}</span>
              <div className="score-player"><strong>{player.name}</strong><span className="score-resources"><span><Coins size={12} /> ${player.money.toLocaleString()}</span><span><Heart size={12} /> {player.health}</span><span><Brain size={12} /> {player.stress}</span></span></div>
              <div className="score-total"><small>旅程分數</small><strong>{Math.floor(scorePlayer(player))}</strong></div>
            </article>
          ))}
        </div>
        <div className="score-rule"><Activity size={15} /> 分數依金錢、健康與照顧壓力計算</div>
        <div className="journey-recap">{players.map((player) => <section key={player.id}><h2>{player.name} 的照顧足跡</h2><p>認識的服務：{player.learnedServices?.length ? player.learnedServices.map((key) => getResource(key).shortTitle).join('、') : '這次尚未完成服務事件'}</p><ul>{missionSummary(player.learnedServices, player.health, player.stress, player.completedActivities).map((mission) => <li key={mission.label}>{mission.done ? '✓ 已達成' : '○ 下次再挑戰'} · {mission.label}</li>)}</ul></section>)}</div>
        <button className="primary-button restart-button" type="button" onClick={resetGame}><RotateCcw size={18} /> 再走一次</button>
      </section>
    </div>
  );
};

