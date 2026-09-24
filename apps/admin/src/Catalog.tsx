import { useState } from 'react';
import type { AdminCategory, AdminGallery, AdminProductFull, CategoryKind, ProductInput } from '@pi/shared';
import { api } from './api';
import { Confirm, Field, ListInput, Modal, Toggle, fmtRub, useLoad, useToast } from './ui';

const KIND: Record<CategoryKind, string> = { package: 'Программы праздника', room: 'Банкетные комнаты', service: 'Шоу и дополнения', ticket: 'Билеты', activity: 'Активности' };
const KINDS = Object.keys(KIND) as CategoryKind[];

const blank = (categoryId: string): ProductInput => ({
  categoryId, title: '', shortDesc: '', description: '', badge: null, priceWeekday: 0, priceWeekend: 0, priceFrom: false, durationMin: 0, guests: null, minAge: null,
  capacity: null, extendPerHour: null, features: [], options: [], coverMediaId: null, isPublished: true, sort: 100,
});
const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(/\s/g, '').replace(',', '.')));

function ProductForm({ init, cats, galleries, onClose, onSaved }: { init: ProductInput & { id?: string }; cats: AdminCategory[]; galleries: AdminGallery[]; onClose: () => void; onSaved: (p: AdminProductFull) => void }) {
  const toast = useToast();
  const [v, setV] = useState<ProductInput>({ ...init });
  const [saving, setSaving] = useState(false);
  const [pick, setPick] = useState(false);
  const set = <K extends keyof ProductInput>(k: K, val: ProductInput[K]) => setV((x) => ({ ...x, [k]: val }));
  const kind = cats.find((c) => c.id === v.categoryId)?.kind ?? 'service';
  const cover = galleries.flatMap((g) => g.images).find((i) => i.id === v.coverMediaId);
  const save = async () => {
    setSaving(true);
    try {
      const body = { ...v, features: v.features.filter((f) => f.trim()), options: v.options.filter((o) => o.label.trim()) };
      const r = init.id ? await api<{ product: AdminProductFull }>(`/products/${init.id}/full`, { method: 'PATCH', body }) : await api<{ product: AdminProductFull }>('/products', { method: 'POST', body });
      onSaved(r.product); toast(init.id ? 'Сохранено' : 'Добавлено'); onClose();
    } catch (e) { toast((e as Error).message === 'validation' ? 'Проверьте поля: название обязательно, цены — числа' : 'Не сохранилось', 'err'); }
    setSaving(false);
  };
  return (
    <Modal title={init.id ? `Редактирование: ${init.title}` : 'Новая позиция'} onClose={onClose} wide>
      <div className="fgrid">
        <Field label="Раздел"><select value={v.categoryId} onChange={(e) => set('categoryId', e.target.value)}>{cats.map((c) => <option key={c.id} value={c.id}>{c.title} · {KIND[c.kind]}</option>)}</select></Field>
        <Field label="Название" wide><input value={v.title} onChange={(e) => set('title', e.target.value)} placeholder="Например: Шоу мыльных пузырей" /></Field>
        <Field label="Короткое описание (под заголовком)" wide><input value={v.shortDesc} onChange={(e) => set('shortDesc', e.target.value)} placeholder="До 10 детей · 3 часа" /></Field>
        <Field label="Подробное описание" wide><textarea className="txt" value={v.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <Field label="Цена в будни, ₽"><input inputMode="decimal" value={v.priceWeekday} onChange={(e) => set('priceWeekday', num(e.target.value) ?? 0)} /></Field>
        <Field label="Цена в выходные, ₽"><input inputMode="decimal" value={v.priceWeekend} onChange={(e) => set('priceWeekend', num(e.target.value) ?? 0)} /></Field>
        <Field label="Метка на карточке"><input value={v.badge ?? ''} onChange={(e) => set('badge', e.target.value || null)} placeholder="Хит / Для малышей" /></Field>
        <Field label="Длительность, минут"><input inputMode="numeric" value={v.durationMin || ''} onChange={(e) => set('durationMin', num(e.target.value) ?? 0)} /></Field>
        {(kind === 'package' || kind === 'room') && <Field label="Гостей (число)"><input inputMode="numeric" value={v.guests ?? ''} onChange={(e) => set('guests', num(e.target.value))} /></Field>}
        {kind === 'room' && <Field label="Вместимость (текст)"><input value={v.capacity ?? ''} onChange={(e) => set('capacity', e.target.value || null)} placeholder="до 12 гостей" /></Field>}
        {kind === 'room' && <Field label="Доп. час, ₽"><input inputMode="decimal" value={v.extendPerHour ?? ''} onChange={(e) => set('extendPerHour', num(e.target.value))} /></Field>}
        {(kind === 'activity' || kind === 'ticket') && <Field label="Возраст от"><input inputMode="numeric" value={v.minAge ?? ''} onChange={(e) => set('minAge', num(e.target.value))} /></Field>}
        <Field label="Порядок (меньше — выше)"><input inputMode="numeric" value={v.sort} onChange={(e) => set('sort', num(e.target.value) ?? 100)} /></Field>
        <div className="fld wide row"><Toggle value={v.priceFrom} onChange={(b) => set('priceFrom', b)} label="Цена «от»" /><Toggle value={v.isPublished} onChange={(b) => set('isPublished', b)} label="Показывать на сайте" /></div>
        <Field label="Что входит (список на карточке)" wide><ListInput value={v.features} onChange={(f) => set('features', f)} placeholder="Аниматор 1 час" /></Field>
        <Field label="Варианты цены (например 30 минут / 60 минут — первый показывается крупно)" wide>
          <div className="list-in">
            {v.options.map((o, i) => (
              <div key={i} className="list-row three">
                <input value={o.label} placeholder="30 минут" onChange={(e) => set('options', v.options.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
                <input inputMode="decimal" value={o.price} placeholder="1290" onChange={(e) => set('options', v.options.map((x, k) => (k === i ? { ...x, price: num(e.target.value) ?? 0 } : x)))} />
                <label className="tgl"><input type="checkbox" checked={Boolean(o.from)} onChange={(e) => set('options', v.options.map((x, k) => (k === i ? { ...x, from: e.target.checked } : x)))} /><i /> <span>от</span></label>
                <button className="ghost sm" onClick={() => set('options', v.options.filter((_, k) => k !== i))}>✕</button>
              </div>
            ))}
            <button className="ghost sm" onClick={() => set('options', [...v.options, { label: '', price: 0 }])}>+ добавить вариант</button>
          </div>
        </Field>
        <Field label="Обложка (фото из галерей)" wide>
          <div className="cover-pick">
            {cover ? <img src={cover.src} alt="" /> : <span className="muted">не выбрана</span>}
            <button onClick={() => setPick(true)}>Выбрать</button>{cover && <button className="ghost" onClick={() => set('coverMediaId', null)}>Убрать</button>}
          </div>
        </Field>
      </div>
      <div className="row-end"><button onClick={onClose}>Отмена</button><button className="primary" disabled={saving || !v.title.trim()} onClick={() => void save()}>{saving ? 'Сохраняю…' : 'Сохранить'}</button></div>
      {pick && <Modal title="Выберите фото" onClose={() => setPick(false)} wide>
        {galleries.map((g) => g.images.length > 0 && <div key={g.slug}><h3>{g.title || g.slug}</h3><div className="pgrid small">{g.images.map((i) => <figure key={i.id} className={i.id === v.coverMediaId ? 'sel' : ''} onClick={() => { set('coverMediaId', i.id); setPick(false); }}><img src={i.src.startsWith('/media/') ? `/media/w/480/${i.src.slice(7)}` : i.src} alt={i.alt} loading="lazy" /></figure>)}</div></div>)}
      </Modal>}
    </Modal>
  );
}

function CategoryForm({ init, onClose, onSaved }: { init: Partial<AdminCategory>; onClose: () => void; onSaved: (c: AdminCategory) => void }) {
  const toast = useToast();
  const [v, setV] = useState({ title: init.title ?? '', kind: init.kind ?? 'service', description: init.description ?? '', isPublished: init.isPublished ?? true, sort: init.sort ?? 100 });
  const save = async () => {
    try {
      const r = init.id ? await api<{ category: AdminCategory }>(`/categories/${init.id}`, { method: 'PATCH', body: v }) : await api<{ category: AdminCategory }>('/categories', { method: 'POST', body: v });
      onSaved(r.category); toast('Сохранено'); onClose();
    } catch { toast('Не сохранилось', 'err'); }
  };
  return (
    <Modal title={init.id ? 'Раздел' : 'Новый раздел'} onClose={onClose}>
      <div className="fgrid">
        <Field label="Название" wide><input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} /></Field>
        <Field label="Тип"><select value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value as CategoryKind })}>{KINDS.map((k) => <option key={k} value={k}>{KIND[k]}</option>)}</select></Field>
        <Field label="Порядок"><input inputMode="numeric" value={v.sort} onChange={(e) => setV({ ...v, sort: Number(e.target.value) || 0 })} /></Field>
        <Field label="Описание (для менеджеров)" wide><input value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></Field>
        <div className="fld wide row"><Toggle value={v.isPublished} onChange={(b) => setV({ ...v, isPublished: b })} label="Показывать на сайте" /></div>
      </div>
      <div className="row-end"><button onClick={onClose}>Отмена</button><button className="primary" disabled={!v.title.trim()} onClick={() => void save()}>Сохранить</button></div>
    </Modal>
  );
}

export function Catalog() {
  const toast = useToast();
  const cats = useLoad<AdminCategory[]>('/categories', (r: { categories: AdminCategory[] }) => r.categories);
  const prods = useLoad<AdminProductFull[]>('/products/full', (r: { products: AdminProductFull[] }) => r.products);
  const gal = useLoad<AdminGallery[]>('/galleries', (r: { galleries: AdminGallery[] }) => r.galleries);
  const [catId, setCatId] = useState<string>('');
  const [edit, setEdit] = useState<(ProductInput & { id?: string }) | null>(null);
  const [editCat, setEditCat] = useState<Partial<AdminCategory> | null>(null);
  const [del, setDel] = useState<AdminProductFull | null>(null);
  const [delCat, setDelCat] = useState<AdminCategory | null>(null);
  const [q, setQ] = useState('');
  if (cats.err || prods.err) return <p className="err">{cats.err || prods.err}</p>;
  if (!cats.data || !prods.data) return <p className="muted">Загрузка…</p>;
  const list = prods.data.filter((p) => (!catId || p.categoryId === catId) && (!q || p.title.toLowerCase().includes(q.toLowerCase())));
  const toInput = (p: AdminProductFull): ProductInput & { id: string } => ({ id: p.id, categoryId: p.categoryId, title: p.title, shortDesc: p.shortDesc, description: p.description, badge: p.badge, priceWeekday: p.priceWeekday, priceWeekend: p.priceWeekend, priceFrom: p.priceFrom, durationMin: p.durationMin, guests: p.guests, minAge: p.minAge, capacity: p.capacity, extendPerHour: p.extendPerHour, features: p.features, options: p.options, coverMediaId: p.coverMediaId, isPublished: p.isPublished, sort: p.sort });
  const quick = async (p: AdminProductFull, body: Partial<ProductInput>) => {
    try { const r = await api<{ product: AdminProductFull }>(`/products/${p.id}/full`, { method: 'PATCH', body }); prods.setData((ps) => ps && ps.map((x) => (x.id === p.id ? r.product : x))); }
    catch { toast('Не сохранилось', 'err'); }
  };
  const remove = async () => {
    if (!del) return; const p = del; setDel(null);
    try { await api(`/products/${p.id}`, { method: 'DELETE' }); prods.setData((ps) => ps && ps.filter((x) => x.id !== p.id)); toast('Удалено'); } catch { toast('Не удалось удалить', 'err'); }
  };
  const removeCat = async () => {
    if (!delCat) return; const c = delCat; setDelCat(null);
    try { await api(`/categories/${c.id}`, { method: 'DELETE' }); cats.setData((cs) => cs && cs.filter((x) => x.id !== c.id)); if (catId === c.id) setCatId(''); toast('Раздел удалён'); }
    catch (e) { toast((e as Error).message === 'has_products' ? 'Сначала перенесите или удалите позиции этого раздела' : 'Не удалось удалить', 'err'); }
  };
  return (
    <section>
      <div className="bar"><h1>Каталог и цены</h1>
        <input placeholder="Поиск…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="primary" onClick={() => setEdit(blank(catId || cats.data![0]?.id || ''))} disabled={!cats.data.length}>+ Позиция</button>
        <button onClick={() => setEditCat({})}>+ Раздел</button>
      </div>
      <div className="chips">
        <button className={!catId ? 'chip on' : 'chip'} onClick={() => setCatId('')}>Все · {prods.data.length}</button>
        {cats.data.map((c) => <button key={c.id} className={'chip' + (catId === c.id ? ' on' : '') + (c.isPublished ? '' : ' off')} onClick={() => setCatId(c.id)}>{c.title} · {c.productCount}</button>)}
      </div>
      {catId && (() => { const c = cats.data!.find((x) => x.id === catId)!; return <div className="cat-line"><span className="muted">{KIND[c.kind]}{c.isPublished ? '' : ' · скрыт с сайта'}</span><button className="ghost sm" onClick={() => setEditCat(c)}>Настроить раздел</button><button className="ghost sm danger-text" onClick={() => setDelCat(c)}>Удалить раздел</button></div>; })()}
      {list.length === 0 ? <p className="empty">Пока пусто — добавьте первую позицию</p> : (
        <div className="scroll"><table>
          <thead><tr><th></th><th>Название</th><th>Раздел</th><th>Будни</th><th>Выходные</th><th>Детали</th><th>На сайте</th><th></th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className={p.isPublished ? '' : 'off'}>
                <td className="thumb">{p.cover ? <img src={p.cover.startsWith('/media/') ? `/media/w/480/${p.cover.slice(7)}` : p.cover} alt="" /> : <i />}</td>
                <td><b>{p.title}</b>{p.badge && <span className="badge">{p.badge}</span>}<div className="muted small">{p.shortDesc || p.description.slice(0, 80)}</div></td>
                <td className="nowrap muted">{p.category}</td>
                <td><input className="price" inputMode="decimal" defaultValue={p.priceWeekday} onBlur={(e) => { const n = num(e.target.value) ?? 0; if (n !== p.priceWeekday) void quick(p, { priceWeekday: n }); }} /></td>
                <td><input className="price" inputMode="decimal" defaultValue={p.priceWeekend} onBlur={(e) => { const n = num(e.target.value) ?? 0; if (n !== p.priceWeekend) void quick(p, { priceWeekend: n }); }} /></td>
                <td className="muted small">{[p.priceFrom && 'от', p.durationMin && `${p.durationMin} мин`, p.capacity, p.guests && `${p.guests} гостей`, p.options.length && `${p.options.length} варианта`, p.features.length && `${p.features.length} пунктов`].filter(Boolean).join(' · ')}</td>
                <td><Toggle value={p.isPublished} onChange={(b) => void quick(p, { isPublished: b })} label="" /></td>
                <td className="nowrap"><button className="sm" onClick={() => setEdit(toInput(p))}>Изменить</button> <button className="sm ghost danger-text" onClick={() => setDel(p)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {edit && <ProductForm init={edit} cats={cats.data} galleries={gal.data ?? []} onClose={() => setEdit(null)} onSaved={(p) => prods.setData((ps) => { if (!ps) return ps; const i = ps.findIndex((x) => x.id === p.id); return i < 0 ? [...ps, p] : ps.map((x) => (x.id === p.id ? p : x)); })} />}
      {editCat && <CategoryForm init={editCat} onClose={() => setEditCat(null)} onSaved={(c) => cats.setData((cs) => { if (!cs) return cs; const i = cs.findIndex((x) => x.id === c.id); return i < 0 ? [...cs, c] : cs.map((x) => (x.id === c.id ? c : x)); })} />}
      {del && <Confirm danger text={`Удалить «${del.title}» безвозвратно? Если позиция уже есть в заявках, лучше просто скрыть её с сайта.`} onYes={() => void remove()} onNo={() => setDel(null)} />}
      {delCat && <Confirm danger text={`Удалить раздел «${delCat.title}»?`} onYes={() => void removeCat()} onNo={() => setDelCat(null)} />}
      <p className="muted small">Цены можно править прямо в таблице — сохраняются при переходе к следующему полю. Позиция с «Цена от» показывается на сайте как «от N ₽».</p>
    </section>
  );
}
