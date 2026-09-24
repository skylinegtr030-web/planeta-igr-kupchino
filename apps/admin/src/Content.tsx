import { useEffect, useState } from 'react';
import type { AdminBlock } from '@pi/shared';
import { api } from './api';

type Settings = Record<string, Record<string, unknown>>;
type Field = { key: string; label: string; wide?: boolean };

const CONTACT_FIELDS: Field[] = [
  { key: 'phone', label: 'Телефон для гостей' }, { key: 'hours', label: 'Режим работы (напр. 10:00–22:00)' },
  { key: 'addressFull', label: 'Адрес парка', wide: true }, { key: 'addressShort', label: 'Короткий адрес' }, { key: 'mapQuery', label: 'Запрос для карты' },
];
const COMPANY_FIELDS: Field[] = [
  { key: 'name', label: 'Полное наименование', wide: true }, { key: 'shortName', label: 'Короткое наименование' }, { key: 'legalAddress', label: 'Юридический адрес', wide: true },
  { key: 'inn', label: 'ИНН' }, { key: 'kpp', label: 'КПП' }, { key: 'ogrn', label: 'ОГРН' },
  { key: 'email', label: 'E-mail' },
];

function SettingsForm({ title, k, fields, value, onSaved }: { title: string; k: string; fields: Field[]; value: Record<string, unknown>; onSaved: (m: string) => void }) {
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

function BlockEditor({ b, onSaved }: { b: AdminBlock; onSaved: (m: string, nb?: AdminBlock) => void }) {
  const isDoc = b.key.startsWith('doc.');
  const d = b.data as { title?: string; text?: string; body?: string; published?: boolean; kind?: string };
  const [title, setTitle] = useState(d.title ?? ''); const [text, setText] = useState(d.text ?? ''); const [body, setBody] = useState(d.body ?? '');
  const [published, setPublished] = useState(d.published !== false); const [dirty, setDirty] = useState(false);
  const save = async () => {
    try {
      const patch: Record<string, unknown> = { title, published }; if (isDoc) patch.body = body; else patch.text = text;
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
        <label className="row"><input type="checkbox" checked={published} onChange={(e) => { setPublished(e.target.checked); setDirty(true); }} /> показывать на сайте</label>
      </div>
      <button className="primary" disabled={!dirty} onClick={() => void save()}>Сохранить</button>
    </details>
  );
}

export function Content() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [blocks, setBlocks] = useState<AdminBlock[] | null>(null);
  const [msg, setMsg] = useState(''); const [newDoc, setNewDoc] = useState({ slug: '', title: '' });
  useEffect(() => {
    api<{ settings: Settings }>('/settings').then((r) => setSettings(r.settings), () => setMsg('Не удалось загрузить настройки'));
    api<{ blocks: AdminBlock[] }>('/blocks').then((r) => setBlocks(r.blocks), () => setMsg('Не удалось загрузить блоки'));
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
      <h2 className="sect">Блоки и зоны парка</h2>
      {zones.map((b) => <BlockEditor key={b.key} b={b} onSaved={saved} />)}
      <h2 className="sect">Юридические документы</h2>
      {docs.map((b) => <BlockEditor key={b.key} b={b} onSaved={saved} />)}
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
