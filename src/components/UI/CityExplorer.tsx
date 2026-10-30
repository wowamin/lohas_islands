import { lazy, Suspense, Component, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BOARD_DATA } from '../../game/board';
import { CITY_COLORS, districtOf } from '../../game/city';
import { getResource } from '../../game/resources';
import type { ServiceKey } from '../../game/types';
import { useGameStore } from '../../game/store/useGameStore';
import { CityMap } from './CityMap';
import { CenterInfo } from './CenterInfo';
import { CENTERS } from '../../game/cityLayout';
import type { CenterId } from '../../game/cityLayout';
import type { ModuleId } from '../../game/education/content';
import { useCitySettings } from '../../game/citySettings';
import type { Quality } from '../../game/citySettings';
import { useJourney } from '../../game/journey';
const CareIsland = lazy(()=>import('../District/CareIsland'));
const CareDistrict = lazy(()=>import('../District/CareDistrict'));
const Scene3D = lazy(()=>import('../Three/Scene3D'));
function supports3D() { try { const c=document.createElement('canvas');const gl=c.getContext('webgl2');if(gl){gl.getExtension('WEBGL_lose_context')?.loseContext();return true;}return false;}catch{return false;} }
class SceneBoundary extends Component<{children:ReactNode;fallback:ReactNode;onError?:()=>void},{failed:boolean}> {
  state={failed:false};static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(){this.props.onError?.();}
  render(){return this.state.failed?this.props.fallback:this.props.children;}
}
export function CityExplorer({onResource,onView,onLearn}:{onResource:(s:ServiceKey)=>void;onView:(v:'board'|'3d')=>void;onLearn:(module?:ModuleId)=>void}) {
  const [has3D,setHas3D]=useState(supports3D);
  const [view]=useState<'board'|'3d'>('board');
  const [island,setIsland]=useState(true);
  useEffect(()=>onView(island&&has3D?'3d':view),[island,has3D,view,onView]);
  const [district,setDistrict]=useState(false);
  const [center,setCenter]=useState<CenterId|null>(null);
  const quality=useCitySettings(s=>s.quality),setQuality=useCitySettings(s=>s.setQuality),explored=useCitySettings(s=>s.explored);
  const setMode=useJourney(s=>s.setMode);
  const selectTile=(id:number)=>{setSelected(id);setCenter(null);setMode('focus',id);};
  const openCenter=(id:CenterId)=>{setCenter(id);setSelected(null);setMode('focus',CENTERS.find(c=>c.id===id)!.start);};
  const [selected,setSelected]=useState<number|null>(null);
  const [list,setList]=useState(false);
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('all');
  const [labels,setLabels]=useState(false);
  const [night,setNight]=useState(false);
  const [zoom,setZoom]=useState(1);
  const [resetKey,setResetKey]=useState(0);
  const [lightOpen,setLightOpen]=useState(false);
  const [brightness,setBrightness]=useState(1);
  const [shadow,setShadow]=useState(.65);
  const [help,setHelp]=useState(false);
  const current=useGameStore(s=>s.players[s.currentPlayerIndex]);
  const phase=useGameStore(s=>s.phase);
  useEffect(()=>{if(phase==='ROLLING'){setSelected(null);setCenter(null);}if(phase==='WAITING_ROLL')setMode('overview');},[phase,setMode]);
  const tile=selected===null?null:BOARD_DATA[selected];
  const selectedResource=tile?.serviceKey?getResource(tile.serviceKey):null;
  const filtered=BOARD_DATA.filter(t=>(filter==='all'||t.type===filter)&&(t.name.includes(query)||districtOf(t.id).includes(query)||String(t.id+1)===query));
  const reset=()=>{setZoom(1);setResetKey(k=>k+1);setSelected(null);setCenter(null);setMode('overview');};
  const map=<CityMap onCenter={openCenter} selected={selected} onSelect={selectTile} labels={labels} night={night} zoom={zoom} resetKey={resetKey}/>;
  return <section className={'city-world'+(night?' city-night':'')+(district?' district-mode':island?' island-main':'')} aria-label="長照城市探索">
    <div className="city-viewport" style={(!has3D||!island)&&!district?{filter:`brightness(${brightness})`}:undefined}>{district?<Suspense fallback={<p className="scene-loading">正在走進日照街區…</p>}><CareDistrict brightness={brightness} shadow={shadow} gpu={has3D} night={night} resetKey={resetKey} onResource={onResource}/></Suspense>:island&&has3D?<SceneBoundary onError={()=>setHas3D(false)} fallback={map}><Suspense fallback={<p className="scene-loading">正在建造五區庭院城市…</p>}><CareIsland onUnavailable={()=>setHas3D(false)} centerId={center} onCenter={openCenter} brightness={brightness} shadow={shadow} night={night} resetKey={resetKey} selected={selected} labels={labels} onSelect={selectTile}/></Suspense></SceneBoundary>:!island&&view==='3d'&&has3D?<SceneBoundary onError={()=>setHas3D(false)} fallback={map}><Suspense fallback={null}><Scene3D onSelect={selectTile} selected={selected} labels={labels} night={night} resetKey={resetKey}/></Suspense></SceneBoundary>:map}</div>
    <nav className="city-toolbar" aria-label="城市操作">
      <button aria-label="回到城市全景" onClick={reset} title="重設視角">⌂ <span>全景</span></button>
      <button className="district-toggle" aria-pressed={district} onClick={()=>{setDistrict(!district);setList(false);setSelected(null);}}>{district?'← 返回遊戲城市':'日照示範街區 ↗'}</button>
      <button disabled={district} aria-label="50 站清單" aria-expanded={list} onClick={()=>{setList(!list);setSelected(null);}}>☷ <span>50 站清單</span></button>
      <button disabled={district} aria-label="顯示站點名牌" aria-pressed={labels} onClick={()=>setLabels(!labels)}>⌖ <span>名牌</span></button>
      <button aria-pressed={night} onClick={()=>setNight(!night)}>{night?'☾ 夜晚':'☀ 白天'}</button>
      <button disabled={district} onClick={()=>{setIsland(!island);setSelected(null);setResetKey(k=>k+1);}}>{island?'簡易棋盤':'立體島嶼'}</button>
      <button aria-expanded={lightOpen} onClick={()=>setLightOpen(!lightOpen)}>☀ 光影</button>
      <button aria-label="城市操作說明" aria-expanded={help} onClick={()=>setHelp(!help)}>?</button>
    </nav>
    {!has3D&&<div className="fallback-notice" role="status">WebGL 不可用，已切換可操作的 50 格 2D 棋盤。</div>}
    {center&&!district&&<CenterInfo id={center} onClose={()=>{setCenter(null);setMode('overview');}} onResource={()=>onResource('care')} onLearn={onLearn}/>}
    <div className="quality-control"><label>畫質 <select aria-label="城市畫質" disabled={!has3D||district||!island} value={quality} onChange={e=>setQuality(e.target.value as Quality)}><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select></label><span>探索 {explored.length}/5</span></div>
    {lightOpen&&<aside className="lighting-panel" aria-label="光影調整"><header><strong>讓光線剛剛好</strong><button aria-label="關閉光影調整" onClick={()=>setLightOpen(false)}>×</button></header><label><span>畫面亮度 <b>{Math.round(brightness*100)}%</b></span><input type="range" aria-label="畫面亮度" min=".75" max="1.25" step=".05" value={brightness} onChange={e=>setBrightness(Number(e.target.value))}/></label><label><span>陰影深淺 <b>{Math.round(shadow*100)}%</b></span><input type="range" aria-label="陰影深淺" min=".2" max=".85" step=".05" value={shadow} disabled={!has3D||(!island&&!district)} onChange={e=>setShadow(Number(e.target.value))}/></label>{!has3D&&<small>相容檢視支援亮度調整。</small>}<button className="light-reset" onClick={()=>{setBrightness(1);setShadow(.65);}}>還原柔光設定</button></aside>}
    {help&&<div className="city-help"><strong>一座城市，50 段照顧旅程</strong><p>點建築或庭院閱讀主題。五區主題為遊戲設計，不代表中心實際服務。探索不會改變回合。</p><p>{island&&has3D?'拖曳旋轉、右鍵平移、滾輪縮放；可選全景、跟隨、聚焦。移動時可跳過動畫。':'拖曳空白處平移，使用右下方 ＋／− 縮放。'}</p><button onClick={()=>setHelp(false)}>知道了</button></div>}
    <div className="city-caption"><span>{district?'A DAY IN OUR NEIGHBORHOOD':'THE CARE ISLAND'}</span><h2>{district?'樂活日照・生活街區':'把照顧，連成生活。'}</h2><p>{district?'從一個街區開始，練習相互照顧。':'一格旅程，一座相互支持的城市。'}</p></div>
    {list&&<aside className="city-index" aria-label="城市站點清單"><header><div><small>THE CITY INDEX</small><h2>走進社區的每一站</h2></div><button aria-label="關閉站點清單" onClick={()=>setList(false)}>×</button></header><input aria-label="搜尋站點" placeholder="搜尋名稱、區域或格數…" value={query} onChange={e=>setQuery(e.target.value)}/><div className="city-filters">{[['all','全部'],['SERVICE','服務'],['LIVING','生活'],['REST','休息']].map(([key,label])=><button key={key} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}</button>)}</div><p className="index-count">{filtered.length} / 50 站 · 依原棋盤順序</p><div className="city-index-list">{filtered.map(t=><button key={t.id} onClick={()=>{selectTile(t.id);setList(false);}}><b style={{color:CITY_COLORS[t.type]}}>{String(t.id+1).padStart(2,'0')}</b><span><strong>{t.name}</strong><small>{districtOf(t.id)}</small></span><span>↗</span></button>)}{!filtered.length&&<p>找不到符合的站點，試試其他名稱。</p>}</div></aside>}
    {tile&&<aside className="city-detail" aria-label="站點資訊"><button className="detail-close" aria-label="關閉站點資訊" onClick={()=>setSelected(null)}>×</button><span className="detail-kicker">{districtOf(tile.id)} / STOP {String(tile.id+1).padStart(2,'0')}</span><h2>{tile.name}</h2><p>{selectedResource?.description??(tile.type==='OPPORTUNITY'?'在生活的轉彎處，遇見新的照顧機會。':tile.type==='ACCIDENT'?'生活有時出乎預期，練習面對變化與做出選擇。':tile.type==='REST'?'留一點時間給自己，休息也是旅程的一部分。':'從日常的小選擇，練習照顧自己與家人。')}</p><div className="detail-meta"><span>第 {tile.id+1} / 50 格</span><span>{current?.position===tile.id?'目前玩家在此':'探索預覽'}</span></div><button className="detail-resource" onClick={()=>onResource(tile.serviceKey??'community')}>認識相關社區資源 ↗</button><small>擲骰並前進到此站時，才會觸發遊戲事件。</small></aside>}
    <div className={district||island?'city-legend hidden-legend':'city-legend'}><span><i style={{background:'#6daba5'}}/>照顧服務</span><span><i style={{background:'#e4b56f'}}/>日常生活</span><span><i style={{background:'#b39cc5'}}/>機會</span><span><i style={{background:'#d99383'}}/>轉折</span><span><i style={{background:'#8ba776'}}/>休息</span></div>
    {(!island||!has3D)&&view==='board'&&!district&&<div className="city-zoom"><button aria-label="縮小城市" disabled={zoom<=.65} onClick={()=>setZoom(v=>Math.max(.65,v-.2))}>−</button><span>{Math.round(zoom*100)}%</span><button aria-label="放大城市" disabled={zoom>=2.2} onClick={()=>setZoom(v=>Math.min(2.2,v+.2))}>＋</button></div>}
  </section>;
}
