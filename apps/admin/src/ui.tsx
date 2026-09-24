import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';

/* ───────── уведомления ───────── */
type Toast = { id: number; text: string; kind: 'ok' | 'err' };
const ToastCtx = createContext<(text: string, kind?: 'ok' | 'err') => void>(() => undefined);
export const useToast = () => useContext(ToastCtx);
export function ToastHost({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, text, kind }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), kind === 'err' ? 6000 : 3000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts">{list.map((t) => <div key={t.id} className={'toast ' + t.kind}>{t.text}</div>)}</div>
    </ToastCtx.Provider>
  );
}

/* ───────── загрузка данных ───────── */
export function useLoad<T>(path: string, pick: (r: never) => T, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setErr('');
    api<never>(path).then((r) => { if (alive) setData(pick(r)); }, (e: Error) => { if (alive) setErr(e.message === 'forbidden' ? 'Недостаточно прав' : 'Не удалось загрузить'); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, ...deps]);
  return { data, setData, err, reload: () => setTick((t) => t + 1) };
}

/* ───────── примитивы форм ───────── */
export function Field({ label, children, wide, hint }: { label: string; children: ReactNode; wide?: boolean; hint?: string }) {
  return <label className={'fld' + (wide ? ' wide' : '')}><span>{label}{hint && <i className="hint">{hint}</i>}</span>{children}</label>;
}
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return <label className="tgl"><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /><i /> <span>{label}</span></label>;
}
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; addEventListener('keydown', h); return () => removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className="modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true">
        <header><h2>{title}</h2><button className="x" onClick={onClose} aria-label="Закрыть">✕</button></header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
export function Confirm({ text, onYes, onNo, danger }: { text: string; onYes: () => void; onNo: () => void; danger?: boolean }) {
  return (
    <Modal title="Подтвердите" onClose={onNo}>
      <p>{text}</p>
      <div className="row-end"><button onClick={onNo}>Отмена</button><button className={danger ? 'danger' : 'primary'} onClick={onYes}>Да, выполнить</button></div>
    </Modal>
  );
}
export function Empty({ text }: { text: string }) { return <p className="empty">{text}</p>; }
export function ListInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div className="list-in">
      {value.map((v, i) => (
        <div key={i} className="list-row">
          <input value={v} onChange={(e) => onChange(value.map((x, k) => (k === i ? e.target.value : x)))} placeholder={placeholder} />
          <button className="ghost sm" onClick={() => onChange(value.filter((_, k) => k !== i))} title="Убрать">✕</button>
        </div>
      ))}
      <button className="ghost sm" onClick={() => onChange([...value, ''])}>+ добавить пункт</button>
    </div>
  );
}
export const fmtRub = (n: number) => n.toLocaleString('ru-RU') + ' ₽';
export const pct = (cur: number, prev: number) => (prev ? Math.round(((cur - prev) / prev) * 100) : cur ? 100 : 0);
