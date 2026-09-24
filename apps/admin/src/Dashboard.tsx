import { useState } from 'react';
import { useLoad, fmtRub, pct } from './ui';

type Stats = {
  range: number;
  totals: { pageviews: number; visitors: number; orders: number; conversion: number; prevPageviews: number; prevVisitors: number; prevOrders: number };
  days: { day: string; pageviews: number; visitors: number; orders: number }[];
  devices: { device: string; visitors: number }[];
  sources: { source: string; visitors: number }[];
  events: { name: string; label: string | null; count: number }[];
  hours: { hour: number; pageviews: number }[];
  orders: { status: string; count: number; total: number }[];
  popular: { title: string; count: number }[];
};
const STATUS: Record<string, string> = { new: 'Новые', in_progress: 'В работе', confirmed: 'Подтверждены', done: 'Проведены', cancelled: 'Отменены' };
const DEVICE: Record<string, string> = { desktop: 'Компьютер', mobile: 'Телефон', tablet: 'Планшет' };
const SECTION: Record<string, string> = { top: 'Первый экран', cmp: 'Сравнение', park: 'Парк', rooms: 'Комнаты', programs: 'Программы', shows: 'Шоу', tickets: 'Билеты', reviews: 'Отзывы', faq: 'Вопросы', book: 'Бронь', contacts: 'Контакты' };

function Kpi({ label, value, prev, suffix = '' }: { label: string; value: number; prev?: number; suffix?: string }) {
  const d = prev === undefined ? null : pct(value, prev);
  return (
    <div className="kpi">
      <span>{label}</span>
      <b>{value.toLocaleString('ru-RU')}{suffix}</b>
      {d !== null && <i className={d > 0 ? 'up' : d < 0 ? 'down' : ''}>{d > 0 ? '+' : ''}{d}% к прошлому периоду</i>}
    </div>
  );
}

/** Линейный график по дням — чистый SVG, без библиотек */
function Line({ days }: { days: Stats['days'] }) {
  const W = 720, H = 220, P = 28;
  const max = Math.max(1, ...days.map((d) => d.pageviews));
  const x = (i: number) => P + (i * (W - P * 2)) / Math.max(1, days.length - 1);
  const y = (v: number) => H - P - (v / max) * (H - P * 2);
  const path = (k: 'pageviews' | 'visitors') => days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d[k]).toFixed(1)}`).join(' ');
  const area = `${path('pageviews')} L${x(days.length - 1).toFixed(1)} ${H - P} L${P} ${H - P} Z`;
  const step = Math.max(1, Math.ceil(days.length / 10));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Просмотры и посетители по дням">
      <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff5c8a" stopOpacity=".35" /><stop offset="1" stopColor="#ff5c8a" stopOpacity="0" /></linearGradient></defs>
      {[0, .25, .5, .75, 1].map((k) => <g key={k}><line x1={P} x2={W - P} y1={y(max * k)} y2={y(max * k)} className="grid" /><text x={P - 6} y={y(max * k) + 4} className="ax" textAnchor="end">{Math.round(max * k)}</text></g>)}
      <path d={area} fill="url(#ga)" />
      <path d={path('pageviews')} className="l1" />
      <path d={path('visitors')} className="l2" />
      {days.map((d, i) => (i % step === 0 || i === days.length - 1) && <text key={d.day} x={x(i)} y={H - 8} className="ax" textAnchor="middle">{d.day.slice(8)}.{d.day.slice(5, 7)}</text>)}
      {days.map((d, i) => d.orders > 0 && <g key={'o' + d.day}><circle cx={x(i)} cy={y(d.pageviews)} r="5" className="dot" /><text x={x(i)} y={y(d.pageviews) - 9} className="ax dark" textAnchor="middle">{d.orders}</text></g>)}
    </svg>
  );
}
function Bars({ rows, label }: { rows: { k: string; v: number }[]; label: (k: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.v));
  return <div className="bars">{rows.map((r) => <div key={r.k} className="brow"><span>{label(r.k)}</span><i style={{ width: `${(r.v / max) * 100}%` }} /><b>{r.v.toLocaleString('ru-RU')}</b></div>)}</div>;
}
function Hours({ hours }: { hours: Stats['hours'] }) {
  const map = new Map(hours.map((h) => [h.hour, h.pageviews]));
  const max = Math.max(1, ...hours.map((h) => h.pageviews));
  return (
    <div className="hours">{Array.from({ length: 24 }, (_, h) => <div key={h} title={`${h}:00 — ${map.get(h) ?? 0}`}><i style={{ height: `${((map.get(h) ?? 0) / max) * 100}%` }} /><span>{h % 3 === 0 ? h : ''}</span></div>)}</div>
  );
}

export function Dashboard() {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const { data: s, err } = useLoad<Stats>(`/stats?range=${range}`, (r) => r as Stats, [range]);
  if (err) return <p className="err">{err}</p>;
  if (!s) return <p className="muted">Загрузка…</p>;
  const t = s.totals;
  const ordersTotal = s.orders.reduce((a, o) => a + o.total, 0);
  return (
    <section>
      <div className="bar"><h1>Статистика сайта</h1>
        <div className="seg">{([7, 30, 90] as const).map((r) => <button key={r} className={r === range ? 'on' : ''} onClick={() => setRange(r)}>{r} дней</button>)}</div>
      </div>
      <div className="kpis">
        <Kpi label="Просмотры" value={t.pageviews} prev={t.prevPageviews} />
        <Kpi label="Посетители" value={t.visitors} prev={t.prevVisitors} />
        <Kpi label="Заявки" value={t.orders} prev={t.prevOrders} />
        <Kpi label="Конверсия в заявку" value={t.conversion} suffix="%" />
        <Kpi label="Сумма заявок" value={Math.round(ordersTotal)} suffix=" ₽" />
      </div>
      <div className="card">
        <div className="card-head"><h2>Просмотры и посетители по дням</h2><span className="legend"><i className="c1" /> просмотры <i className="c2" /> посетители <i className="c3" /> заявки</span></div>
        {t.pageviews ? <Line days={s.days} /> : <p className="empty">Данных пока нет — статистика начинает собираться с момента обновления сайта.</p>}
      </div>
      <div className="grid2">
        <div className="card"><h2>Откуда приходят</h2>{s.sources.length ? <Bars rows={s.sources.map((r) => ({ k: r.source, v: r.visitors }))} label={(k) => k} /> : <p className="empty">Пока пусто</p>}</div>
        <div className="card"><h2>Устройства</h2>{s.devices.length ? <Bars rows={s.devices.map((r) => ({ k: r.device, v: r.visitors }))} label={(k) => DEVICE[k] ?? k} /> : <p className="empty">Пока пусто</p>}</div>
        <div className="card"><h2>Какие разделы смотрят</h2>{(() => { const rows = s.events.filter((e) => e.name === 'section').map((e) => ({ k: e.label ?? '', v: e.count })); return rows.length ? <Bars rows={rows} label={(k) => SECTION[k] ?? k} /> : <p className="empty">Пока пусто</p>; })()}</div>
        <div className="card"><h2>На что нажимают</h2>{(() => { const rows = s.events.filter((e) => e.name === 'click').slice(0, 10).map((e) => ({ k: e.label ?? '', v: e.count })); return rows.length ? <Bars rows={rows} label={(k) => k} /> : <p className="empty">Пока пусто</p>; })()}</div>
        <div className="card"><h2>Время суток (просмотры)</h2><Hours hours={s.hours} /></div>
        <div className="card"><h2>Заявки по статусам</h2>
          {s.orders.length ? <table className="mini"><tbody>{s.orders.map((o) => <tr key={o.status}><td>{STATUS[o.status] ?? o.status}</td><td className="num">{o.count}</td><td className="muted">{fmtRub(o.total)}</td></tr>)}</tbody></table> : <p className="empty">Заявок за период нет</p>}
          {s.popular.length > 0 && <><h3>Что заказывают</h3><Bars rows={s.popular.map((p) => ({ k: p.title, v: p.count }))} label={(k) => k} /></>}
        </div>
      </div>
      <p className="muted small">Статистика обезличена: cookie не ставятся, IP не хранится — посетитель считается по суточному хэшу. Это соответствует требованиям 152-ФЗ к обезличенным данным.</p>
    </section>
  );
}
