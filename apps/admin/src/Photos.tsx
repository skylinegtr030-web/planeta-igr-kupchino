import { useRef, useState } from 'react';
import type { AdminBlock, AdminGallery, AdminImage } from '@pi/shared';
import { api } from './api';
import { Confirm, Field, Modal, useLoad, useToast } from './ui';

type Block = AdminBlock & { data: { title?: string; gallery?: string; kind?: string; published?: boolean } };

function Gallery({ g, blocks, onChange }: { g: AdminGallery; blocks: Block[]; onChange: (g: AdminGallery) => void }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [drag, setDrag] = useState<string | null>(null);
  const [ask, setAsk] = useState<{ img: AdminImage; hard: boolean } | null>(null);
  const [alt, setAlt] = useState<AdminImage | null>(null);
  const usedBy = blocks.filter((b) => b.data.gallery === g.slug).map((b) => b.data.title || b.key);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(files.length);
    let cur = g;
    for (const f of Array.from(files)) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { toast(`${f.name}: только JPG, PNG или WebP`, 'err'); setBusy((b) => b - 1); continue; }
      const fd = new FormData(); fd.append('file', f);
      try {
        const r = await fetch(`/api/admin/galleries/${g.slug}/upload`, { method: 'POST', body: fd, credentials: 'same-origin' });
        const j = (await r.json()) as { ok: boolean; image?: AdminImage; error?: string };
        if (!r.ok || !j.image) throw new Error(j.error ?? 'error');
        cur = { ...cur, images: [...cur.images, j.image] }; onChange(cur);
      } catch { toast(`${f.name}: не загрузилось`, 'err'); }
      setBusy((b) => b - 1);
    }
    if (fileRef.current) fileRef.current.value = '';
  };
  const saveOrder = async (imgs: AdminImage[]) => {
    onChange({ ...g, images: imgs });
    try { await api(`/galleries/${g.slug}/order`, { method: 'PUT', body: { mediaIds: imgs.map((i) => i.id) } }); } catch { toast('Порядок не сохранился', 'err'); }
  };
  const drop = (targetId: string) => {
    if (!drag || drag === targetId) return;
    const imgs = [...g.images]; const from = imgs.findIndex((i) => i.id === drag); const to = imgs.findIndex((i) => i.id === targetId);
    const [m] = imgs.splice(from, 1); imgs.splice(to, 0, m!); setDrag(null); void saveOrder(imgs);
  };
  const move = (id: string, dir: -1 | 1) => {
    const imgs = [...g.images]; const i = imgs.findIndex((x) => x.id === id); const j = i + dir; if (j < 0 || j >= imgs.length) return;
    [imgs[i], imgs[j]] = [imgs[j]!, imgs[i]!]; void saveOrder(imgs);
  };
  const toggle = async (img: AdminImage, isActive: boolean) => {
    onChange({ ...g, images: g.images.map((i) => (i.id === img.id ? { ...i, isActive } : i)) });
    try { await api(`/media/${img.id}`, { method: 'PATCH', body: { isActive } }); } catch { toast('Не сохранилось', 'err'); }
  };
  const remove = async () => {
    if (!ask) return; const { img, hard } = ask; setAsk(null);
    try {
      await api(hard ? `/media/${img.id}` : `/galleries/${g.slug}/media/${img.id}`, { method: 'DELETE' });
      onChange({ ...g, images: g.images.filter((i) => i.id !== img.id) }); toast(hard ? 'Фото удалено с сервера' : 'Фото убрано из галереи');
    } catch { toast('Не удалось удалить', 'err'); }
  };
  const saveAlt = async () => {
    if (!alt) return;
    try { await api(`/media/${alt.id}`, { method: 'PATCH', body: { alt: alt.alt } }); onChange({ ...g, images: g.images.map((i) => (i.id === alt.id ? alt : i)) }); toast('Подпись сохранена'); setAlt(null); }
    catch { toast('Не сохранилось', 'err'); }
  };

  return (
    <div className="card gal">
      <div className="card-head">
        <div><h2>{g.title || g.slug}</h2><span className="muted small">{g.slug}{usedBy.length ? ` · используется: ${usedBy.join(', ')}` : ' · ни к чему не привязана'} · {g.images.filter((i) => i.isActive).length} из {g.images.length} на сайте</span></div>
        <div className="row-end">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => void upload(e.target.files)} />
          <button className="primary" disabled={busy > 0} onClick={() => fileRef.current?.click()}>{busy ? `Загружаю… ${busy}` : '+ Загрузить фото'}</button>
        </div>
      </div>
      <div className="drop" onDragOver={(e) => { e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) void upload(e.dataTransfer.files); }}>
        {g.images.length === 0 && <p className="empty">Перетащите сюда фотографии или нажмите «Загрузить фото»</p>}
        <div className="pgrid">
          {g.images.map((i, n) => (
            <figure key={i.id} className={(i.isActive ? '' : 'off') + (drag === i.id ? ' dragging' : '')} draggable
              onDragStart={() => setDrag(i.id)} onDragEnd={() => setDrag(null)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); drop(i.id); }}>
              <img src={i.src.startsWith('/media/') ? `/media/w/480/${i.src.slice(7)}` : i.src} alt={i.alt} loading="lazy" />
              <span className="n">{n + 1}{n === 0 ? ' · обложка' : ''}</span>
              <div className="tools">
                <button title="Раньше" onClick={() => move(i.id, -1)} disabled={n === 0}>←</button>
                <button title="Позже" onClick={() => move(i.id, 1)} disabled={n === g.images.length - 1}>→</button>
                <button title="Подпись (alt)" onClick={() => setAlt(i)}>Aa</button>
                <button title={i.isActive ? 'Скрыть с сайта' : 'Показать на сайте'} onClick={() => void toggle(i, !i.isActive)}>{i.isActive ? '👁' : '🚫'}</button>
                <button title="Убрать из галереи" onClick={() => setAsk({ img: i, hard: false })}>−</button>
                <button title="Удалить файл навсегда" className="danger" onClick={() => setAsk({ img: i, hard: true })}>🗑</button>
              </div>
            </figure>
          ))}
        </div>
      </div>
      {ask && <Confirm danger={ask.hard} text={ask.hard ? 'Удалить файл с сервера навсегда? Он пропадёт из всех галерей.' : 'Убрать фото из этой галереи? Файл останется на сервере.'} onYes={() => void remove()} onNo={() => setAsk(null)} />}
      {alt && <Modal title="Подпись к фото" onClose={() => setAlt(null)}>
        <img src={alt.src} alt="" style={{ maxWidth: '100%', borderRadius: 10, marginBottom: 12 }} />
        <Field label="Подпись (alt) — для поисковиков и людей с нарушением зрения" wide><input value={alt.alt} onChange={(e) => setAlt({ ...alt, alt: e.target.value })} /></Field>
        <div className="row-end"><button onClick={() => setAlt(null)}>Отмена</button><button className="primary" onClick={() => void saveAlt()}>Сохранить</button></div>
      </Modal>}
    </div>
  );
}

export function Photos() {
  const toast = useToast();
  const gal = useLoad<AdminGallery[]>('/galleries', (r: { galleries: AdminGallery[] }) => r.galleries);
  const bl = useLoad<Block[]>('/blocks', (r: { blocks: Block[] }) => r.blocks);
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [ng, setNg] = useState({ slug: '', title: '' });
  if (gal.err || bl.err) return <p className="err">{gal.err || bl.err}</p>;
  if (!gal.data || !bl.data) return <p className="muted">Загрузка…</p>;
  const list = gal.data.filter((g) => !q || (g.title + g.slug).toLowerCase().includes(q.toLowerCase()));
  const create = async () => {
    try { await api('/galleries', { method: 'POST', body: ng }); toast('Галерея создана'); setCreating(false); setNg({ slug: '', title: '' }); gal.reload(); }
    catch (e) { toast((e as Error).message === 'exists' ? 'Такой адрес уже есть' : 'Адрес — латиница и дефис', 'err'); }
  };
  return (
    <section>
      <div className="bar"><h1>Фотографии</h1><input placeholder="Найти галерею…" value={q} onChange={(e) => setQ(e.target.value)} /><span className="muted">{gal.data.reduce((a, g) => a + g.images.length, 0)} фото в {gal.data.length} галереях</span><button onClick={() => setCreating(true)}>+ Новая галерея</button></div>
      <p className="muted small">Первое фото в галерее — обложка зоны и карточки на первом экране. Порядок меняется перетаскиванием или стрелками. Большие фото автоматически сжимаются до 2400 px.</p>
      {list.map((g) => <Gallery key={g.slug} g={g} blocks={bl.data!} onChange={(ng2) => gal.setData((gs) => gs && gs.map((x) => (x.slug === ng2.slug ? ng2 : x)))} />)}
      {creating && <Modal title="Новая галерея" onClose={() => setCreating(false)}>
        <div className="fgrid">
          <Field label="Название"><input value={ng.title} onChange={(e) => setNg({ ...ng, title: e.target.value })} placeholder="Новогодняя ёлка" /></Field>
          <Field label="Адрес (латиница)"><input value={ng.slug} onChange={(e) => setNg({ ...ng, slug: e.target.value })} placeholder="park-newyear" /></Field>
        </div>
        <div className="row-end"><button onClick={() => setCreating(false)}>Отмена</button><button className="primary" disabled={!ng.slug || !ng.title} onClick={() => void create()}>Создать</button></div>
      </Modal>}
    </section>
  );
}
