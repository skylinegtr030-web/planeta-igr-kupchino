import type { AdminRole } from '@pi/shared';

export type Me = { id: string; email: string; role: AdminRole };

export class ApiErr extends Error {
  readonly status: number;
  constructor(status: number, code: string) { super(code); this.status = status; }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch('/api/admin' + path, {
    method: init.method ?? 'GET',
    credentials: 'same-origin',
    headers: init.body === undefined ? {} : { 'content-type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new ApiErr(r.status, j.error ?? 'error');
  return j as T;
}

export const rub = (n: number) => n.toLocaleString('ru-RU') + ' ₽';
