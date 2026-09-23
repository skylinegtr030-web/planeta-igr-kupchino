import { useEffect, useState } from 'react';
import type { AdminProduct } from '@pi/shared';
import { api } from './api';

type Row = AdminProduct & { dirty?: boolean };

export function Prices() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api<{ products: AdminProduct[] }>('/products').then((r) => setRows(r.products), () => setMsg('Не удалось загрузить цены'));
  }, []);

  const edit = (id: string, p: Partial<AdminProduct>) =>
    setRows((rs) => rs && rs.map((r) => (r.id === id ? { ...r, ...p, dirty: true } : r)));

  const save = async (r: Row) => {
    try {
      const res = await api<{ product: AdminProduct }>(`/products/${r.id}`, {
        method: 'PATCH', body: { priceWeekday: r.priceWeekday, priceWeekend: r.priceWeekend, isPublished: r.isPublished },
      });
      setRows((rs) => rs && rs.map((x) => (x.id === r.id ? res.product : x)));
      setMsg(`Сохранено: ${r.title}`);
    } catch {
      setMsg(`Не сохранилось: ${r.title}`);
    }
  };

  if (!rows) return <p className="muted">{msg || 'Загрузка…'}</p>;
  const groups = new Map<string, Row[]>();
  for (const r of rows) groups.set(r.category, [...(groups.get(r.category) ?? []), r]);

  return (
    <section>
      <div className="bar"><h1>Цены</h1><span className="muted">{msg}</span></div>
      <table>
        <thead><tr><th>Позиция</th><th>Будни, ₽</th><th>Выходные и праздники, ₽</th><th>На сайте</th><th /></tr></thead>
        {[...groups].map(([cat, items]) => (
          <tbody key={cat}>
            <tr className="cat"><td colSpan={5}>{cat}</td></tr>
            {items.map((r) => (
              <tr key={r.id} className={r.isPublished ? '' : 'off'}>
                <td>{r.title}</td>
                <td><input type="number" min={0} step={100} value={r.priceWeekday} onChange={(e) => edit(r.id, { priceWeekday: Number(e.target.value) })} /></td>
                <td><input type="number" min={0} step={100} value={r.priceWeekend} onChange={(e) => edit(r.id, { priceWeekend: Number(e.target.value) })} /></td>
                <td><input type="checkbox" checked={r.isPublished} onChange={(e) => edit(r.id, { isPublished: e.target.checked })} /></td>
                <td><button className="primary" disabled={!r.dirty} onClick={() => void save(r)}>Сохранить</button></td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </section>
  );
}
