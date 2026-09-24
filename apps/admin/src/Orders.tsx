import { useState } from 'react';
import type { AdminOrder, OrderStatus } from '@pi/shared';
import { api, rub } from './api';
import { Confirm, Modal, useLoad, useToast } from './ui';

const STATUS: Record<OrderStatus, string> = { new: 'Новая', in_progress: 'В работе', confirmed: 'Подтверждена', done: 'Проведена', cancelled: 'Отменена' };
const STATUSES = Object.keys(STATUS) as OrderStatus[];
type Ev = { type: string; data: { from?: string; to?: string }; at: string; admin: string | null };

function Details({ o, onClose }: { o: AdminOrder; onClose: () => void }) {
  const ev = useLoad<Ev[]>(`/orders/${o.id}/events`, (r: { events: Ev[] }) => r.events);
  return (
    <Modal title={`Заявка № ${o.number}`} onClose={onClose}>
      <dl className="dl">
        <dt>Клиент</dt><dd>{o.customerName} · <a href={'tel:' + o.phone}>{o.phone}</a></dd>
        <dt>Дата праздника</dt><dd>{o.eventDate ?? '—'} {o.eventTime ?? ''}</dd>
        {o.childName && <><dt>Ребёнок</dt><dd>{o.childName}</dd></>}
        <dt>Состав</dt><dd>{o.items.length ? o.items.map((i, n) => <div key={n}>{i.title}{i.qty > 1 ? ` × ${i.qty}` : ''} — {rub(i.unitPrice * i.qty)}</div>) : '—'}</dd>
        <dt>Сумма</dt><dd>{rub(o.total)}</dd>
        {o.comment && <><dt>Комментарий</dt><dd>{o.comment}</dd></>}
        <dt>Создана</dt><dd>{o.createdAt.replace('T', ' ')}</dd>
      </dl>
      <h3>История</h3>
      {!ev.data ? <p className="muted">Загрузка…</p> : ev.data.length === 0 ? <p className="muted">Изменений не было</p> : (
        <ul className="timeline">{ev.data.map((e, i) => <li key={i}><span className="muted">{e.at}</span> {e.type === 'status' ? `статус: ${STATUS[(e.data.from ?? '') as OrderStatus] ?? e.data.from} → ${STATUS[(e.data.to ?? '') as OrderStatus] ?? e.data.to}` : e.type === 'note' ? 'изменена заметка' : e.type}{e.admin && <span className="muted"> · {e.admin}</span>}</li>)}</ul>
      )}
    </Modal>
  );
}

export function Orders({ isOwner }: { isOwner: boolean }) {
  const toast = useToast();
  const [filter, setFilter] = useState<OrderStatus | ''>('');
  const [q, setQ] = useState('');
  const { data: rows, setData, err, reload } = useLoad<AdminOrder[]>('/orders' + (filter ? `?status=${filter}` : ''), (r: { orders: AdminOrder[] }) => r.orders, [filter]);
  const [open, setOpen] = useState<AdminOrder | null>(null);
  const [del, setDel] = useState<AdminOrder | null>(null);
  const patch = async (id: string, body: { status?: OrderStatus; adminNote?: string }) => {
    try { const r = await api<{ order: AdminOrder }>(`/orders/${id}`, { method: 'PATCH', body }); setData((rs) => rs && rs.map((o) => (o.id === id ? r.order : o))); }
    catch { toast('Изменение не сохранилось', 'err'); }
  };
  const remove = async () => {
    if (!del) return; const o = del; setDel(null);
    try { await api(`/orders/${o.id}`, { method: 'DELETE' }); setData((rs) => rs && rs.filter((x) => x.id !== o.id)); toast('Заявка удалена'); } catch { toast('Не удалось удалить', 'err'); }
  };
  const list = (rows ?? []).filter((o) => !q || `${o.number} ${o.customerName} ${o.phone} ${o.comment ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  const csv = () => {
    const head = ['№', 'Создана', 'Статус', 'Клиент', 'Телефон', 'Дата', 'Состав', 'Сумма', 'Комментарий', 'Заметка'];
    const esc = (s: unknown) => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const body = list.map((o) => [o.number, o.createdAt, STATUS[o.status], o.customerName, o.phone, o.eventDate, o.items.map((i) => i.title).join('; '), o.total, o.comment, o.adminNote].map(esc).join(';'));
    const blob = new Blob(['\ufeff' + [head.join(';'), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `заявки-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };
  const counts = STATUSES.map((s) => [s, (rows ?? []).filter((o) => o.status === s).length] as const);
  return (
    <section>
      <div className="bar"><h1>Заявки</h1>
        <input placeholder="Поиск по имени, телефону, номеру…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button onClick={reload}>Обновить</button><button onClick={csv} disabled={!list.length}>Скачать CSV</button>
        {rows && <span className="muted">{list.length} шт.</span>}
      </div>
      <div className="chips">
        <button className={!filter ? 'chip on' : 'chip'} onClick={() => setFilter('')}>Все</button>
        {counts.map(([s, n]) => <button key={s} className={'chip st-' + s + (filter === s ? ' on' : '')} onClick={() => setFilter(s)}>{STATUS[s]}{!filter && n ? ` · ${n}` : ''}</button>)}
      </div>
      {err && <p className="err">{err}</p>}
      {!rows ? <p className="muted">Загрузка…</p> : list.length === 0 ? <p className="empty">Заявок нет</p> : (
        <div className="scroll"><table>
          <thead><tr><th>№</th><th>Создана</th><th>Клиент</th><th>Праздник</th><th>Состав</th><th>Сумма</th><th>Статус</th><th>Заметка</th><th></th></tr></thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className={'st-' + o.status}>
                <td className="num"><button className="link" onClick={() => setOpen(o)}>{o.number}</button></td>
                <td className="nowrap muted">{o.createdAt.replace('T', ' ')}</td>
                <td>{o.customerName}<br /><a href={'tel:' + o.phone}>{o.phone}</a>{o.childName && <div className="muted small">ребёнок: {o.childName}</div>}</td>
                <td className="nowrap">{o.eventDate ?? '—'} {o.eventTime ?? ''}</td>
                <td>{o.items.length ? o.items.map((i, n) => <div key={n}>{i.title}{i.qty > 1 ? ` × ${i.qty}` : ''}</div>) : <span className="muted">{o.comment ?? '—'}</span>}</td>
                <td className="nowrap">{rub(o.total)}</td>
                <td><select value={o.status} onChange={(e) => void patch(o.id, { status: e.target.value as OrderStatus })}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}</select></td>
                <td><textarea defaultValue={o.adminNote} placeholder="заметка" onBlur={(e) => { if (e.target.value !== o.adminNote) void patch(o.id, { adminNote: e.target.value }); }} /></td>
                <td className="nowrap"><button className="sm" onClick={() => setOpen(o)}>Открыть</button>{isOwner && <> <button className="sm ghost danger-text" onClick={() => setDel(o)}>✕</button></>}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {open && <Details o={open} onClose={() => setOpen(null)} />}
      {del && <Confirm danger text={`Удалить заявку № ${del.number} безвозвратно?`} onYes={() => void remove()} onNo={() => setDel(null)} />}
    </section>
  );
}
