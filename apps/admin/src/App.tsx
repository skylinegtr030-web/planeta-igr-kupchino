import { useEffect, useState } from 'react';
import { api, type Me } from './api';
import { Login } from './Login';
import { Orders } from './Orders';
import { Prices } from './Prices';
import { Photos } from './Photos';
import { Content } from './Content';

const TABS = { orders: 'Заявки', prices: 'Цены', photos: 'Фото', content: 'Контент' } as const;
type Tab = keyof typeof TABS;
const initialTab = (): Tab => { const h = location.hash.slice(1); return h in TABS ? (h as Tab) : 'orders'; };

export function App() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>(initialTab);
  useEffect(() => { api<{ admin: Me }>('/me').then((r) => setMe(r.admin), () => setMe(null)); }, []);
  useEffect(() => { location.hash = tab; }, [tab]);

  if (me === undefined) return <div className="center muted">Загрузка…</div>;
  if (me === null) return <Login onDone={setMe} />;
  const logout = async () => { await api('/logout', { method: 'POST' }).catch(() => undefined); setMe(null); };

  return (
    <div className="shell">
      <header className="top">
        <b className="brand">Планета Игр</b>
        <nav>
          {(Object.keys(TABS) as Tab[]).map((t) => (
            <button key={t} className={t === tab ? 'tab on' : 'tab'} onClick={() => setTab(t)}>{TABS[t]}</button>
          ))}
        </nav>
        <span className="muted">{me.email}</span>
        <button className="ghost" onClick={logout}>Выйти</button>
      </header>
      <main>{tab === 'orders' ? <Orders /> : tab === 'prices' ? <Prices /> : tab === 'photos' ? <Photos /> : <Content />}</main>
    </div>
  );
}
