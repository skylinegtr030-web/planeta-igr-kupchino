import { useEffect, useState } from 'react';
import { api, type Me } from './api';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { Orders } from './Orders';
import { Catalog } from './Catalog';
import { Photos } from './Photos';
import { Content } from './Content';
import { Reviews, Settings } from './Settings';
import { Users } from './Users';
import { ToastHost } from './ui';

const TABS = {
  dashboard: ['Статистика', '📈'], orders: ['Заявки', '🗓'], catalog: ['Каталог и цены', '🏷'], photos: ['Фото', '🖼'],
  content: ['Тексты и документы', '✎'], reviews: ['Отзывы', '★'], settings: ['Тарифы и промокоды', '⚙'], users: ['Пользователи', '👤'],
} as const;
type Tab = keyof typeof TABS;
const initialTab = (): Tab => { const h = location.hash.slice(1); return h in TABS ? (h as Tab) : 'dashboard'; };

export function App() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [menu, setMenu] = useState(false);
  useEffect(() => { api<{ admin: Me }>('/me').then((r) => setMe(r.admin), () => setMe(null)); }, []);
  useEffect(() => { location.hash = tab; setMenu(false); }, [tab]);
  useEffect(() => { const h = () => setTab(initialTab()); addEventListener('hashchange', h); return () => removeEventListener('hashchange', h); }, []);

  if (me === undefined) return <div className="center muted">Загрузка…</div>;
  if (me === null) return <Login onDone={setMe} />;
  const logout = async () => { await api('/logout', { method: 'POST' }).catch(() => undefined); setMe(null); };
  const tabs = (Object.keys(TABS) as Tab[]).filter((t) => t !== 'users' || me.role === 'owner');

  return (
    <ToastHost>
      <div className={'shell' + (menu ? ' menu' : '')}>
        <aside className="side">
          <div className="brand"><img src="/favicon.png" alt="" width="36" height="36" /><div><b>Планета Игр</b><span>панель управления</span></div></div>
          <nav>{tabs.map((t) => <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}><i>{TABS[t][1]}</i>{TABS[t][0]}</button>)}</nav>
          <div className="side-foot">
            <a href="/" target="_blank" rel="noopener">Открыть сайт ↗</a>
            <span className="muted small">{me.email}</span>
            <button className="ghost sm" onClick={() => void logout()}>Выйти</button>
          </div>
        </aside>
        <header className="mob-top"><button className="burger" onClick={() => setMenu(!menu)} aria-label="Меню">☰</button><b>{TABS[tab][0]}</b></header>
        <main>
          {tab === 'dashboard' ? <Dashboard /> : tab === 'orders' ? <Orders isOwner={me.role === 'owner'} /> : tab === 'catalog' ? <Catalog /> : tab === 'photos' ? <Photos />
            : tab === 'content' ? <Content /> : tab === 'reviews' ? <Reviews /> : tab === 'settings' ? <Settings /> : <Users meId={me.id} />}
        </main>
      </div>
    </ToastHost>
  );
}
