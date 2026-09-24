import { useState } from 'react';
import type { AdminUser, AuditEntry } from '@pi/shared';
import { api } from './api';
import { Field, Modal, Toggle, useLoad, useToast } from './ui';

const ROLE = { owner: 'Владелец', manager: 'Менеджер', editor: 'Редактор' } as const;
const ENTITY: Record<string, string> = { product: 'позиция', category: 'раздел', media: 'фото', gallery: 'галерея', content_block: 'блок', settings: 'настройки', review: 'отзыв', promo: 'промокод', special_day: 'особый день', order: 'заявка', admin: 'пользователь' };
const ACTION: Record<string, string> = { create: 'создал', update: 'изменил', delete: 'удалил', upload: 'загрузил', reorder: 'изменил порядок', detach: 'убрал из галереи', upsert: 'сохранил', gallery: 'привязал галерею' };

export function Users({ meId }: { meId: string }) {
  const toast = useToast();
  const users = useLoad<AdminUser[]>('/users', (r: { users: AdminUser[] }) => r.users);
  const audit = useLoad<AuditEntry[]>('/audit', (r: { entries: AuditEntry[] }) => r.entries);
  const [nu, setNu] = useState<{ email: string; password: string; role: keyof typeof ROLE } | null>(null);
  const [pw, setPw] = useState<{ id: string; password: string } | null>(null);
  const create = async () => {
    if (!nu) return;
    try { const r = await api<{ user: AdminUser }>('/users', { method: 'POST', body: nu }); users.setData((us) => us && [...us, r.user]); setNu(null); toast('Пользователь создан'); }
    catch (e) { toast((e as Error).message === 'exists' ? 'Такой e-mail уже есть' : 'Пароль от 8 символов, e-mail корректный', 'err'); }
  };
  const patch = async (id: string, body: { role?: keyof typeof ROLE; isActive?: boolean; password?: string }) => {
    try { const r = await api<{ user: AdminUser }>(`/users/${id}`, { method: 'PATCH', body }); users.setData((us) => us && us.map((u) => (u.id === id ? r.user : u))); toast('Сохранено'); }
    catch { toast('Не сохранилось', 'err'); }
  };
  if (users.err) return <p className="err">{users.err}</p>;
  return (
    <section>
      <div className="bar"><h1>Пользователи админки</h1><button className="primary" onClick={() => setNu({ email: '', password: '', role: 'manager' })}>+ Пользователь</button></div>
      <p className="muted small">Владелец — всё, включая пользователей и удаление заявок. Менеджер — заявки, каталог, фото, контент. Редактор — то же, но без удаления.</p>
      {!users.data ? <p className="muted">Загрузка…</p> : (
        <table><thead><tr><th>E-mail</th><th>Роль</th><th>Активен</th><th>Последний вход</th><th></th></tr></thead><tbody>
          {users.data.map((u) => <tr key={u.id} className={u.isActive ? '' : 'off'}>
            <td><b>{u.email}</b>{u.id === meId && <span className="muted"> · это вы</span>}</td>
            <td><select value={u.role} disabled={u.id === meId} onChange={(e) => void patch(u.id, { role: e.target.value as keyof typeof ROLE })}>{Object.entries(ROLE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td>
            <td>{u.id === meId ? <span className="muted">—</span> : <Toggle value={u.isActive} onChange={(b) => void patch(u.id, { isActive: b })} label="" />}</td>
            <td className="muted nowrap">{u.lastLoginAt ?? 'ещё не входил'}</td>
            <td><button className="sm" onClick={() => setPw({ id: u.id, password: '' })}>Сменить пароль</button></td>
          </tr>)}
        </tbody></table>
      )}
      <h2 className="sect">Журнал изменений</h2>
      {!audit.data ? <p className="muted">Загрузка…</p> : audit.data.length === 0 ? <p className="empty">Пока пусто</p> : (
        <div className="scroll"><table className="mini"><tbody>{audit.data.map((e) => <tr key={e.id}><td className="nowrap muted">{e.at}</td><td>{e.admin ?? 'система'}</td><td>{ACTION[e.action] ?? e.action} {ENTITY[e.entity] ?? e.entity}{e.entityId && <span className="muted"> {e.entityId.length > 20 ? e.entityId.slice(0, 8) + '…' : e.entityId}</span>}</td></tr>)}</tbody></table></div>
      )}
      {nu && <Modal title="Новый пользователь" onClose={() => setNu(null)}>
        <div className="fgrid">
          <Field label="E-mail" wide><input type="email" value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} /></Field>
          <Field label="Пароль (от 8 символов)"><input type="text" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} /></Field>
          <Field label="Роль"><select value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value as keyof typeof ROLE })}>{Object.entries(ROLE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        </div>
        <div className="row-end"><button onClick={() => setNu(null)}>Отмена</button><button className="primary" disabled={!nu.email || nu.password.length < 8} onClick={() => void create()}>Создать</button></div>
      </Modal>}
      {pw && <Modal title="Новый пароль" onClose={() => setPw(null)}>
        <Field label="Пароль (от 8 символов)" wide><input type="text" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></Field>
        <p className="muted small">После смены пароля все сессии этого пользователя завершатся.</p>
        <div className="row-end"><button onClick={() => setPw(null)}>Отмена</button><button className="primary" disabled={pw.password.length < 8} onClick={() => { void patch(pw.id, { password: pw.password }); setPw(null); }}>Сохранить</button></div>
      </Modal>}
    </section>
  );
}
