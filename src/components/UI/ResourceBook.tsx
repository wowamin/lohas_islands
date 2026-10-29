import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { RESOURCES, getResource } from '../../game/resources';
import type { ServiceKey } from '../../game/types';

export function ResourceDetails({ serviceKey }: { serviceKey: ServiceKey }) {
  const resource = getResource(serviceKey);
  return (
    <div className={'resource-details resource-' + resource.key}>
      <div className="resource-title"><span aria-hidden="true">{resource.icon}</span><h3>{resource.title}</h3></div>
      <p>{resource.description}</p>
      <ul>{resource.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
      {resource.sourceUrl && <p><a href={resource.sourceUrl} target="_blank" rel="noreferrer">{resource.sourceLabel}（另開分頁）</a></p>}
      <p className="resource-source">{resource.sourceUrl ? '官方頁面查閱：2026-10-06；資格、額度及部分負擔以現行規定與個別核定為準。' : resource.sourceLabel}</p>
      {resource.poster && (
        <details className="poster-archive">
          <summary>查看原圖給付資料（歷史文宣）</summary>
          <p>原圖未標示日期，以下為原圖數字存檔，不作現行申請依據。</p>
          <dl><dt>原圖額度</dt><dd>{resource.poster.amount}</dd><dt>原圖週期</dt><dd>{resource.poster.period}</dd></dl>
          <ul>{resource.poster.shares.map((share) => <li key={share}>{share}</li>)}</ul>
        </details>
      )}
    </div>
  );
}

export function ResourceBook({ selected, onSelect, onClose }: { selected: ServiceKey; onSelect: (key: ServiceKey) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const active = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => { dialog.current?.close(); active?.focus(); };
  }, []);
  return (
    <dialog ref={dialog} className="resource-dialog" aria-label="社區資源手冊" onCancel={onClose}>
      <header className="resource-header"><div><span className="section-eyebrow">隨時查閱，不影響回合</span><h2>社區資源手冊</h2></div><button className="icon-button" type="button" aria-label="關閉資源手冊" onClick={onClose}><X /></button></header>
      <nav className="resource-tabs" aria-label="選擇服務類別">{RESOURCES.map((resource) => <button key={resource.key} type="button" className={'resource-tab' + (selected === resource.key ? ' is-selected' : '')} aria-pressed={selected === resource.key} onClick={() => onSelect(resource.key)}>{resource.icon} {resource.shortTitle}</button>)}</nav>
      <ResourceDetails serviceKey={selected} />
    </dialog>
  );
}
