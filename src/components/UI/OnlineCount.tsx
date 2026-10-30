import { useEffect, useState } from 'react';
import { UsersRound } from 'lucide-react';

const STORAGE_PREFIX = 'lohas-islands:online-tab:';
const HEARTBEAT_INTERVAL = 10_000;
const STALE_AFTER = 30_000;
const TAB_ID = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const OnlineCount = () => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const key = STORAGE_PREFIX + TAB_ID;
    let storage: Storage;
    try {
      storage = window.localStorage;
    } catch (error) {
      console.warn('無法存取本機在線分頁統計。', error);
      return;
    }

    let storageErrorLogged = false;
    const refreshCount = () => {
      try {
        const now = Date.now();
        const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
          .filter((item): item is string => item?.startsWith(STORAGE_PREFIX) === true);
        let activeTabs = 0;

        for (const item of keys) {
          const heartbeat = Number(storage.getItem(item));
          const age = now - heartbeat;
          if (Number.isFinite(heartbeat) && age >= 0 && age <= STALE_AFTER) {
            activeTabs++;
          } else if (item !== key) {
            storage.removeItem(item);
          }
        }

        storageErrorLogged = false;
        setCount(Math.max(1, activeTabs));
      } catch (error) {
        if (!storageErrorLogged) {
          console.warn('更新本機在線分頁統計時發生錯誤。', error);
          storageErrorLogged = true;
        }
        setCount(null);
      }
    };

    const publishHeartbeat = () => {
      try {
        storage.setItem(key, String(Date.now()));
        refreshCount();
      } catch (error) {
        if (!storageErrorLogged) {
          console.warn('發布本機在線分頁狀態時發生錯誤。', error);
          storageErrorLogged = true;
        }
        setCount(null);
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith(STORAGE_PREFIX)) refreshCount();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') publishHeartbeat();
    };
    const removeHeartbeat = () => {
      try {
        storage.removeItem(key);
      } catch (error) {
        console.warn('無法清除本機在線分頁狀態。', error);
      }
    };

    publishHeartbeat();
    const interval = window.setInterval(publishHeartbeat, HEARTBEAT_INTERVAL);
    window.addEventListener('storage', onStorage);
    window.addEventListener('pagehide', removeHeartbeat);
    window.addEventListener('pageshow', publishHeartbeat);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pagehide', removeHeartbeat);
      window.removeEventListener('pageshow', publishHeartbeat);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      removeHeartbeat();
    };
  }, []);

  return (
    <aside
      className="online-count"
      title="僅統計此瀏覽器中最近 30 秒有回應的本站分頁，並非全站即時人數。"
      aria-label={`本機在線分頁數：${count ?? '暫無法統計'}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="online-count-indicator" aria-hidden="true" />
      <UsersRound size={17} aria-hidden="true" />
      <span>本機在線</span>
      <strong>{count ?? '—'}</strong>
    </aside>
  );
};
