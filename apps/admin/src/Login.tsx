import { useState, type FormEvent } from 'react';
import { api, ApiErr, type Me } from './api';

export function Login({ onDone }: { onDone: (m: Me) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await api<{ admin: Me }>('/login', { method: 'POST', body: { email, password } });
      onDone(r.admin);
    } catch (x) {
      const s = x instanceof ApiErr ? x.status : 0;
      setErr(s === 429 ? 'Слишком много попыток — подождите 15 минут' : s === 401 ? 'Неверный логин или пароль' : 'Ошибка входа');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="login" onSubmit={submit}>
      <h1>Вход в админку</h1>
      <label>Логин<input autoFocus autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Пароль<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {err && <p className="err">{err}</p>}
      <button className="primary" disabled={busy || !email || !password}>{busy ? 'Входим…' : 'Войти'}</button>
    </form>
  );
}
