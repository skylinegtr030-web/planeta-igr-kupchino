import { useEffect, useState } from 'react';
import type { AdminPromo, AdminReview, PromoInput, ReviewInput, SpecialDayInput } from '@pi/shared';
import { api } from './api';
import { Confirm, Field, Modal, Toggle, fmtRub, useLoad, useToast } from './ui';

/* ───────── настройки-словари (тарифы, возраст, правила) ───────── */
type Kv = Record<string, unknown>;
const TIERS: [string, string][] = [['unlimitedWeekday', 'Безлимит, будни'], ['unlimitedWeekend', 'Безлимит, выходные'], ['timeCards30', 'Тайм-карта 30 минут'], ['timeCards60', 'Тайм-карта 60 минут']];
function KvForm({ title, k, fields, hint }: { title: string; k: string; fields: [string, string][]; hint?: string }) {
  const toast = useToast();
  const { data } = useLoad<Kv>('/settings', (r: { settings: Record<string, Kv> }) => r.settings[k] ?? {});
  const [v, setV] = useState<Kv>({}); const [dirty, setDirty] = useState(false);
  useEffect(() => { if (data) setV(data); }, [data]);
  const save = async () => { try { await api(`/settings/${k}`, { method: 'PUT', body: { value: v } }); setDirty(false); toast(`Сохранено: ${title}`); } catch { toast('Не сохранилось', 'err'); } };
  return (
    <div className="card"><h2>{title}</h2>{hint && <p className="muted small">{hint}</p>}
      <div className="fgrid">{fields.map(([key, label]) => <Field key={key} label={label}><input inputMode="decimal" value={String(v[key] ?? '')} onChange={(e) => { const n = Number(e.target.value.replace(/\s/g, '')); setV({ ...v, [key]: e.target.value === '' ? undefined : Number.isFinite(n) ? n : e.target.value }); setDirty(true); }} /></Field>)}</div>
      <button className="primary" disabled={!dirty} onClick={() => void save()}>Сохранить</button>
    </div>
  );
}
function WeekendForm() {
  const toast = useToast();
  const { data } = useLoad<Kv>('/settings', (r: { settings: Record<string, Kv> }) => r.settings.booking_rules ?? {});
  const [days, setDays] = useState<number[]>([0, 6]); const [dirty, setDirty] = useState(false);
  useEffect(() => { if (data && Array.isArray(data.weekendDays)) setDays(data.weekendDays as number[]); }, [data]);
  const names = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const save = async () => { try { await api('/settings/booking_rules', { method: 'PUT', body: { value: { ...(data ?? {}), weekendDays: days } } }); setDirty(false); toast('Сохранено'); } catch { toast('Не сохранилось', 'err'); } };
  return (
    <div className="card"><h2>Какие дни считаются выходными</h2><p className="muted small">По этим дням (и по праздникам ниже) сайт показывает цену «выходные».</p>
      <div className="chips">{[1, 2, 3, 4, 5, 6, 0].map((d) => <button key={d} className={'chip' + (days.includes(d) ? ' on' : '')} onClick={() => { setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d]); setDirty(true); }}>{names[d]}</button>)}</div>
      <button className="primary" disabled={!dirty} onClick={() => void save()}>Сохранить</button>
    </div>
  );
}

/* ───────── особые дни ───────── */
const DAYKIND = { holiday: 'Праздник (цена выходного)', closed: 'Закрыто', short: 'Сокращённый день' } as const;
function SpecialDays() {
  const toast = useToast();
  const { data, setData } = useLoad<SpecialDayInput[]>('/special-days', (r: { days: SpecialDayInput[] }) => r.days);
  const [v, setV] = useState<SpecialDayInput>({ day: '', kind: 'holiday', openTime: null, closeTime: null, note: '' });
  const add = async () => {
    try { await api('/special-days', { method: 'PUT', body: v }); setData((d) => d && [...d.filter((x) => x.day !== v.day), v].sort((a, b) => a.day.localeCompare(b.day))); setV({ day: '', kind: 'holiday', openTime: null, closeTime: null, note: '' }); toast('Добавлено'); }
    catch { toast('Проверьте дату', 'err'); }
  };
  const del = async (day: string) => { try { await api(`/special-days/${day}`, { method: 'DELETE' }); setData((d) => d && d.filter((x) => x.day !== day)); } catch { toast('Не удалось', 'err'); } };
  return (
    <div className="card"><h2>Праздники и особые дни</h2>
      <div className="fgrid">
        <Field label="Дата"><input type="date" value={v.day} onChange={(e) => setV({ ...v, day: e.target.value })} /></Field>
        <Field label="Тип"><select value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value as SpecialDayInput['kind'] })}>{Object.entries(DAYKIND).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        {v.kind === 'short' && <><Field label="Открытие"><input type="time" value={v.openTime ?? ''} onChange={(e) => setV({ ...v, openTime: e.target.value || null })} /></Field><Field label="Закрытие"><input type="time" value={v.closeTime ?? ''} onChange={(e) => setV({ ...v, closeTime: e.target.value || null })} /></Field></>}
        <Field label="Заметка"><input value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} placeholder="День народного единства" /></Field>
      </div>
      <button className="primary" disabled={!v.day} onClick={() => void add()}>Добавить</button>
      {data && data.length > 0 && <table className="mini" style={{ marginTop: 14 }}><tbody>{data.map((d) => <tr key={d.day}><td className="nowrap">{d.day}</td><td>{DAYKIND[d.kind]}{d.kind === 'short' && d.openTime ? ` ${d.openTime}–${d.closeTime}` : ''}</td><td className="muted">{d.note}</td><td><button className="ghost sm danger-text" onClick={() => void del(d.day)}>✕</button></td></tr>)}</tbody></table>}
    </div>
  );
}

/* ───────── промокоды ───────── */
function Promos() {
  const toast = useToast();
  const { data, setData } = useLoad<AdminPromo[]>('/promos', (r: { promos: AdminPromo[] }) => r.promos);
  const empty: PromoInput = { code: '', kind: 'percent', value: 10, minTotal: 0, validFrom: null, validTo: null, maxUses: null, active: true };
  const [v, setV] = useState<PromoInput | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const save = async () => {
    if (!v) return;
    try { const r = await api<{ promo: AdminPromo }>('/promos', { method: 'PUT', body: v }); setData((ps) => ps && [...ps.filter((p) => p.code !== r.promo.code), r.promo]); setV(null); toast('Промокод сохранён'); }
    catch { toast('Проверьте поля', 'err'); }
  };
  const remove = async () => { if (!del) return; const c = del; setDel(null); try { await api(`/promos/${c}`, { method: 'DELETE' }); setData((ps) => ps && ps.filter((p) => p.code !== c)); } catch { toast('Не удалось', 'err'); } };
  return (
    <div className="card"><div className="card-head"><h2>Промокоды</h2><button onClick={() => setV(empty)}>+ Промокод</button></div>
      {!data ? <p className="muted">Загрузка…</p> : data.length === 0 ? <p className="empty">Промокодов нет</p> : (
        <table className="mini"><thead><tr><th>Код</th><th>Скидка</th><th>Мин. сумма</th><th>Срок</th><th>Использован</th><th></th></tr></thead><tbody>
          {data.map((p) => <tr key={p.code} className={p.active ? '' : 'off'}><td><b>{p.code}</b></td><td>{p.kind === 'percent' ? `${p.value}%` : fmtRub(p.value)}</td><td>{p.minTotal ? fmtRub(p.minTotal) : '—'}</td><td className="muted">{p.validFrom ?? '…'} — {p.validTo ?? '…'}</td><td>{p.usedCount}{p.maxUses ? ` / ${p.maxUses}` : ''}</td><td className="nowrap"><button className="sm" onClick={() => setV({ ...p })}>Изменить</button> <button className="sm ghost danger-text" onClick={() => setDel(p.code)}>✕</button></td></tr>)}
        </tbody></table>
      )}
      {v && <Modal title="Промокод" onClose={() => setV(null)}>
        <div className="fgrid">
          <Field label="Код"><input value={v.code} onChange={(e) => setV({ ...v, code: e.target.value.toUpperCase() })} placeholder="ЛЕТО10" /></Field>
          <Field label="Тип"><select value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value as 'percent' | 'fixed' })}><option value="percent">Процент</option><option value="fixed">Сумма, ₽</option></select></Field>
          <Field label="Размер"><input inputMode="decimal" value={v.value} onChange={(e) => setV({ ...v, value: Number(e.target.value) || 0 })} /></Field>
          <Field label="Минимальная сумма заказа"><input inputMode="decimal" value={v.minTotal} onChange={(e) => setV({ ...v, minTotal: Number(e.target.value) || 0 })} /></Field>
          <Field label="Действует с"><input type="date" value={v.validFrom ?? ''} onChange={(e) => setV({ ...v, validFrom: e.target.value || null })} /></Field>
          <Field label="Действует до"><input type="date" value={v.validTo ?? ''} onChange={(e) => setV({ ...v, validTo: e.target.value || null })} /></Field>
          <Field label="Лимит использований"><input inputMode="numeric" value={v.maxUses ?? ''} onChange={(e) => setV({ ...v, maxUses: e.target.value ? Number(e.target.value) : null })} placeholder="без лимита" /></Field>
          <div className="fld row"><Toggle value={v.active} onChange={(b) => setV({ ...v, active: b })} label="Активен" /></div>
        </div>
        <div className="row-end"><button onClick={() => setV(null)}>Отмена</button><button className="primary" disabled={v.code.length < 2} onClick={() => void save()}>Сохранить</button></div>
      </Modal>}
      {del && <Confirm danger text={`Удалить промокод ${del}?`} onYes={() => void remove()} onNo={() => setDel(null)} />}
    </div>
  );
}

/* ───────── отзывы ───────── */
export function Reviews() {
  const toast = useToast();
  const { data, setData } = useLoad<AdminReview[]>('/reviews', (r: { reviews: AdminReview[] }) => r.reviews);
  const empty: ReviewInput = { author: '', text: '', rating: 5, source: null, isPublished: true, sort: 100 };
  const [v, setV] = useState<(ReviewInput & { id?: string }) | null>(null);
  const [del, setDel] = useState<AdminReview | null>(null);
  const save = async () => {
    if (!v) return;
    try {
      const r = v.id ? await api<{ review: AdminReview }>(`/reviews/${v.id}`, { method: 'PATCH', body: v }) : await api<{ review: AdminReview }>('/reviews', { method: 'POST', body: v });
      setData((rs) => { if (!rs) return rs; const i = rs.findIndex((x) => x.id === r.review.id); return i < 0 ? [...rs, r.review] : rs.map((x) => (x.id === r.review.id ? r.review : x)); }); setV(null); toast('Сохранено');
    } catch { toast('Проверьте поля', 'err'); }
  };
  const quick = async (r: AdminReview, isPublished: boolean) => { try { await api(`/reviews/${r.id}`, { method: 'PATCH', body: { isPublished } }); setData((rs) => rs && rs.map((x) => (x.id === r.id ? { ...x, isPublished } : x))); } catch { toast('Не сохранилось', 'err'); } };
  const remove = async () => { if (!del) return; const r = del; setDel(null); try { await api(`/reviews/${r.id}`, { method: 'DELETE' }); setData((rs) => rs && rs.filter((x) => x.id !== r.id)); } catch { toast('Не удалось', 'err'); } };
  return (
    <section>
      <div className="bar"><h1>Отзывы</h1><button className="primary" onClick={() => setV(empty)}>+ Отзыв</button>{data && <span className="muted">{data.filter((r) => r.isPublished).length} из {data.length} на сайте</span>}</div>
      {!data ? <p className="muted">Загрузка…</p> : data.length === 0 ? <p className="empty">Отзывов пока нет — добавьте первый, и на сайте появится раздел «Говорят родители»</p> : (
        <div className="rev-grid">{data.map((r) => (
          <div key={r.id} className={'card rev' + (r.isPublished ? '' : ' off')}>
            <div className="card-head"><b>{r.author}</b><span className="stars">{'★'.repeat(r.rating)}</span></div>
            <p>{r.text}</p>
            <div className="row-between"><span className="muted small">{r.source ?? 'источник не указан'} · {r.createdAt}</span><span className="nowrap"><Toggle value={r.isPublished} onChange={(b) => void quick(r, b)} label="" /><button className="sm" onClick={() => setV({ ...r })}>Изменить</button> <button className="sm ghost danger-text" onClick={() => setDel(r)}>✕</button></span></div>
          </div>
        ))}</div>
      )}
      {v && <Modal title={v.id ? 'Отзыв' : 'Новый отзыв'} onClose={() => setV(null)}>
        <div className="fgrid">
          <Field label="Имя автора"><input value={v.author} onChange={(e) => setV({ ...v, author: e.target.value })} /></Field>
          <Field label="Оценка"><select value={v.rating} onChange={(e) => setV({ ...v, rating: Number(e.target.value) })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}</select></Field>
          <Field label="Текст" wide><textarea className="txt" value={v.text} onChange={(e) => setV({ ...v, text: e.target.value })} /></Field>
          <Field label="Источник"><input value={v.source ?? ''} onChange={(e) => setV({ ...v, source: e.target.value || null })} placeholder="Яндекс Карты / 2ГИС / ВКонтакте" /></Field>
          <Field label="Порядок"><input inputMode="numeric" value={v.sort} onChange={(e) => setV({ ...v, sort: Number(e.target.value) || 0 })} /></Field>
          <div className="fld wide row"><Toggle value={v.isPublished} onChange={(b) => setV({ ...v, isPublished: b })} label="Показывать на сайте" /></div>
        </div>
        <div className="row-end"><button onClick={() => setV(null)}>Отмена</button><button className="primary" disabled={!v.author.trim() || !v.text.trim()} onClick={() => void save()}>Сохранить</button></div>
      </Modal>}
      {del && <Confirm danger text={`Удалить отзыв от ${del.author}?`} onYes={() => void remove()} onNo={() => setDel(null)} />}
    </section>
  );
}

export function Settings() {
  return (
    <section>
      <div className="bar"><h1>Цены билетов, дни и промокоды</h1></div>
      <div className="grid2">
        <KvForm title="Тарифы билетов" k="tiers" fields={TIERS} hint="Резервные значения для карточек билетов; основные цены — в Каталоге." />
        <KvForm title="Возрастные ограничения" k="ages" fields={[['kuzar', 'Лазертаг Q-ZAR, лет от'], ['lavaFloor', 'Лавапол, лет от']]} />
        <WeekendForm />
        <SpecialDays />
      </div>
      <Promos />
    </section>
  );
}
