import { useEffect, useState } from 'react';
import type { AdminBlock } from '@pi/shared';
import { api } from './api';
import { Confirm, Field, Modal, useToast } from './ui';

type Settings = Record<string, Record<string, unknown>>;
type FieldDef = { key: string; label: string; wide?: boolean };

const CONTACT_FIELDS: FieldDef[] = [
  { key: 'phone', label: 'Телефон для гостей' }, { key: 'hours', label: 'Режим работы (напр. 10:00–22:00)' },
  { key: 'addressFull', label: 'Адрес парка', wide: true }, { key: 'addressShort', label: 'Короткий адрес' }, { key: 'mapQuery', label: 'Запрос для карты' },
];
const COMPANY_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Полное наименование', wide: true }, { key: 'shortName', label: 'Короткое наименование' }, { key: 'legalAddress', label: 'Юридический адрес', wide: true },
  { key: 'inn', label: 'ИНН' }, { key: 'kpp', label: 'КПП' }, { key: 'ogrn', label: 'ОГРН' },
  { key: 'email', label: 'E-mail' },
];

function SettingsForm({ title, k, fields, value, onSaved }: { title: string; k: string; fields: FieldDef[]; value: Record<string, unknown>; onSaved: (m: string) => void }) {
  const [v, setV] = useState(value); const [dirty, setDirty] = useState(false);
  useEffect(() => { setV(value); setDirty(false); }, [value]);
  const save = async () => {
    try { await api(`/settings/${k}`, { method: 'PUT', body: { value: v } }); setDirty(false); onSaved(`Сохранено: ${title}`); } catch { onSaved(`Не сохранилось: ${title}`); }
  };
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="fgrid">
        {fields.map((f) => (
          <label key={f.key} className={f.wide ? 'wide' : ''}><span>{f.label}</span>
            <input value={String(v[f.key] ?? '')} onChange={(e) => { setV({ ...v, [f.key]: e.target.value }); setDirty(true); }} />
          </label>
        ))}
      </div>
      <button className="primary" disabled={!dirty} onClick={() => void save()}>Сохранить</button>
    </div>
  );
}

function BlockEditor({ b, galleries, onSaved, onDelete }: { b: AdminBlock; galleries: { slug: string; title: string }[]; onSaved: (m: string, nb?: AdminBlock) => void; onDelete: (key: string) => void }) {
  const isDoc = b.key.startsWith('doc.');
  const d = b.data as { title?: string; text?: string; body?: string; published?: boolean; kind?: string; gallery?: string };
  const [gallery, setGallery] = useState(d.gallery ?? ''); const [ask, setAsk] = useState(false);
  const [title, setTitle] = useState(d.title ?? ''); const [text, setText] = useState(d.text ?? ''); const [body, setBody] = useState(d.body ?? '');
  const [published, setPublished] = useState(d.published !== false); const [dirty, setDirty] = useState(false);
  const save = async () => {
    try {
      const patch: Record<string, unknown> = { title, published }; if (isDoc) patch.body = body; else { patch.text = text; patch.gallery = gallery; }
      const r = await api<{ block: AdminBlock }>(`/blocks/${b.key}`, { method: 'PATCH', body: patch }); setDirty(false); onSaved(`Сохранено: ${title}`, r.block);
    } catch { onSaved(`Не сохранилось: ${title}`); }
  };
  return (
    <details className="card block">
      <summary><b>{d.title || b.key}</b> <span className="muted">{b.key}{d.published === false ? ' · скрыт' : ''}</span>{isDoc && <a href={`/docs/${b.key.slice(4)}`} target="_blank" rel="noopener" className="muted"> открыть ↗</a>}</summary>
      <div className="fgrid">
        <label className="wide"><span>Заголовок</span><input value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} /></label>
        {isDoc
          ? <label className="wide"><span>Текст документа (## заголовок, - пункт, **жирный**, ссылки [текст](/docs/privacy), плейсхолдеры {'{{company.name}}'}, {'{{contacts.phone}}'})</span><textarea className="doc" value={body} onChange={(e) => { setBody(e.target.value); setDirty(true); }} /></label>
          : <label className="wide"><span>Описание на сайте</span><textarea className="txt" value={text} onChange={(e) => { setText(e.target.value); setDirty(true); }} /></label>}
        {!isDoc && <label><span>Галерея фотографий</span><select value={gallery} onChange={(e) => { setGallery(e.target.value); setDirty(true); }}><option value="">— без фото —</option>{galleries.map((g) => <option key={g.slug} value={g.slug}>{g.title || g.slug}</option>)}</select></label>}
        <label className="row"><input type="checkbox" checked={published} onChange={(e) => { setPublished(e.target.checked); setDirty(true); }} /> показывать на сайте</label>
      </div>
      <div className="row-between"><button className="primary" disabled={!dirty} onClick={() => void save()}>Сохранить</button>{b.key !== 'park.hero' && <button className="ghost sm danger-text" onClick={() => setAsk(true)}>Удалить блок</button>}</div>
      {ask && <Confirm danger text={`Удалить блок «${title}»? Фотографии останутся в галерее.`} onYes={() => { setAsk(false); onDelete(b.key); }} onNo={() => setAsk(false)} />}
    </details>
  );
}

export function Content() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [blocks, setBlocks] = useState<AdminBlock[] | null>(null);
  const [msg, setMsg] = useState(''); const [newDoc, setNewDoc] = useState({ slug: '', title: '' });
  const toast = useToast();
  const [galleries, setGalleries] = useState<{ slug: string; title: string }[]>([]);
  const [newZone, setNewZone] = useState<{ key: string; title: string } | null>(null);
  const addZone = async () => {
    if (!newZone) return;
    try { await api('/blocks', { method: 'POST', body: { key: 'park.' + newZone.key, title: newZone.title, kind: 'zone' } }); const r = await api<{ blocks: AdminBlock[] }>('/blocks'); setBlocks(r.blocks); setNewZone(null); toast('Зона создана — загрузите фото в её галерею во вкладке «Фото» и включите показ'); }
    catch (e) { toast((e as Error).message === 'exists' ? 'Такой ключ уже есть' : 'Ключ — латиница, цифры и дефис', 'err'); }
  };
  const delBlock = async (key: string) => { try { await api(`/blocks/${key}`, { method: 'DELETE' }); setBlocks((bs) => bs && bs.filter((b) => b.key !== key)); toast('Блок удалён'); } catch { toast('Не удалось удалить', 'err'); } };
  useEffect(() => {
    api<{ settings: Settings }>('/settings').then((r) => setSettings(r.settings), () => setMsg('Не удалось загрузить настройки'));
    api<{ blocks: AdminBlock[] }>('/blocks').then((r) => setBlocks(r.blocks), () => setMsg('Не удалось загрузить блоки'));
    api<{ galleries: { slug: string; title: string }[] }>('/galleries').then((r) => setGalleries(r.galleries.map((g) => ({ slug: g.slug, title: g.title }))), () => undefined);
  }, []);
  const saved = (m: string, nb?: AdminBlock) => { setMsg(m); if (nb) setBlocks((bs) => bs && bs.map((x) => (x.key === nb.key ? nb : x))); };
  const addDoc = async () => {
    try { const r = await api<{ block: AdminBlock }>('/docs', { method: 'POST', body: newDoc }); setBlocks((bs) => bs && [...bs, r.block]); setNewDoc({ slug: '', title: '' }); setMsg('Документ создан (пока скрыт)'); }
    catch (e) { setMsg((e as Error).message === 'exists' ? 'Такой адрес уже есть' : 'Не удалось создать: адрес — латиница, цифры и дефис'); }
  };
  if (!settings || !blocks) return <p className="muted">{msg || 'Загрузка…'}</p>;
  const zones = blocks.filter((b) => !b.key.startsWith('doc.')); const docs = blocks.filter((b) => b.key.startsWith('doc.'));
  return (
    <section>
      <div className="bar"><h1>Контент сайта</h1><span className="muted">{msg}</span></div>
      <SettingsForm title="Контакты на сайте" k="contacts" fields={CONTACT_FIELDS} value={settings.contacts ?? {}} onSaved={setMsg} />
      <SettingsForm title="Реквизиты компании" k="company" fields={COMPANY_FIELDS} value={settings.company ?? {}} onSaved={setMsg} />
      <div className="row-between"><h2 className="sect">Блоки и зоны парка</h2><button onClick={() => setNewZone({ key: '', title: '' })}>+ Новая зона</button></div>
      {zones.map((b) => <BlockEditor key={b.key} b={b} galleries={galleries} onSaved={saved} onDelete={(k) => void delBlock(k)} />)}
      <h2 className="sect">Юридические документы</h2>
      {docs.map((b) => <BlockEditor key={b.key} b={b} galleries={galleries} onSaved={saved} onDelete={(k) => void delBlock(k)} />)}
      {newZone && <Modal title="Новая зона парка" onClose={() => setNewZone(null)}>
        <div className="fgrid">
          <Field label="Название" wide><input value={newZone.title} onChange={(e) => setNewZone({ ...newZone, title: e.target.value })} placeholder="Верёвочный парк" /></Field>
          <Field label="Ключ (латиница)" hint="park."><input value={newZone.key} onChange={(e) => setNewZone({ ...newZone, key: e.target.value })} placeholder="ropes" /></Field>
        </div>
        <p className="muted small">Галерея park-{newZone.key || '…'} создастся автоматически. Зона появится на сайте после загрузки фото и включения показа.</p>
        <div className="row-end"><button onClick={() => setNewZone(null)}>Отмена</button><button className="primary" disabled={!newZone.key || !newZone.title} onClick={() => void addZone()}>Создать</button></div>
      </Modal>}
      <div className="card">
        <h2>Новый документ</h2>
        <div className="fgrid">
          <label><span>Адрес (/docs/…)</span><input value={newDoc.slug} placeholder="refund" onChange={(e) => setNewDoc({ ...newDoc, slug: e.target.value })} /></label>
          <label><span>Название</span><input value={newDoc.title} placeholder="Условия возврата" onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })} /></label>
        </div>
        <button className="primary" disabled={!newDoc.slug || !newDoc.title} onClick={() => void addDoc()}>Создать</button>
      </div>
    </section>
  );
}
