import { useCallback, useEffect, useState } from 'react';
import type { AdminOrder, OrderStatus } from '@pi/shared';
import { api, rub } from './api';

const STATUS: Record<OrderStatus, string> = {
  new: 'Новая', in_progress: 'В работе', confirmed: 'Подтверждена', done: 'Проведена', cancelled: 'Отменена',
};
const STATUSES = Object.keys(STATUS) as OrderStatus[];

export function Orders() {
  const [filter, setFilter] = useState<OrderStatus | ''>('');
  const [rows, setRows] = useState<AdminOrder[] | null>(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    setRows(null);
    setErr('');
    api<{ orders: AdminOrder[] }>('/orders' + (filter ? `?status=${filter}` : ''))
      .then((r) => setRows(r.orders), () => setErr('Не удалось загрузить заявки'));
  }, [filter]);
  useEffect(load, [load]);

  const patch = async (id: string, body: { status?: OrderStatus; adminNote?: string }) => {
    try {
      const r = await api<{ order: AdminOrder }>(`/orders/${id}`, { method: 'PATCH', body });
      setRows((rs) => rs && rs.map((o) => (o.id === id ? r.order : o)));
    } catch {
      setErr('Изменение не сохранилось — обновите страницу');
    }
  };

  return (
    <section>
      <div className="bar">
        <h1>Заявки</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value as OrderStatus | '')}>
          <option value="">Все статусы</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}
        </select>
        <button onClick={load}>Обновить</button>
        {rows && <span className="muted">{rows.length} шт.</span>}
      </div>
      {err && <p className="err">{err}</p>}
      {!rows ? <p className="muted">Загрузка…</p> : rows.length === 0 ? <p className="muted">Заявок нет</p> : (
        <div className="scroll">
          <table>
            <thead><tr><th>№</th><th>Создана</th><th>Клиент</th><th>Праздник</th><th>Состав</th><th>Сумма</th><th>Статус</th><th>Заметка</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className={'st-' + o.status}>
                  <td className="num">{o.number}</td>
                  <td className="nowrap">{o.createdAt.replace('T', ' ')}</td>
                  <td>{o.customerName}<br /><a href={'tel:' + o.phone}>{o.phone}</a>{o.childName && <div className="muted">ребёнок: {o.childName}</div>}</td>
                  <td className="nowrap">{o.eventDate ?? '—'} {o.eventTime ?? ''}</td>
                  <td>{o.items.length
                    ? o.items.map((i, n) => <div key={n}>{i.title}{i.qty > 1 ? ` × ${i.qty}` : ''}</div>)
                    : <span className="muted">{o.comment ?? '—'}</span>}</td>
                  <td className="nowrap">{rub(o.total)}</td>
                  <td>
                    <select value={o.status} onChange={(e) => void patch(o.id, { status: e.target.value as OrderStatus })}>
                      {STATUSES.map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}
                    </select>
                  </td>
                  <td>
                    <textarea defaultValue={o.adminNote} placeholder="заметка"
                      onBlur={(e) => { if (e.target.value !== o.adminNote) void patch(o.id, { adminNote: e.target.value }); }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
