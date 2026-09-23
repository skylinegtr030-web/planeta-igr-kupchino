import { useEffect, useState } from 'react';
import type { AdminGallery } from '@pi/shared';
import { api } from './api';

export function Photos() {
  const [gs, setGs] = useState<AdminGallery[] | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api<{ galleries: AdminGallery[] }>('/galleries').then((r) => setGs(r.galleries), () => setMsg('Не удалось загрузить фото'));
  }, []);

  const toggle = async (id: string, isActive: boolean) => {
    try {
      await api(`/media/${id}`, { method: 'PATCH', body: { isActive } });
      setGs((g) => g && g.map((x) => ({ ...x, images: x.images.map((i) => (i.id === id ? { ...i, isActive } : i)) })));
    } catch {
      setMsg('Не сохранилось');
    }
  };

  if (!gs) return <p className="muted">{msg || 'Загрузка…'}</p>;
  return (
    <section>
      <div className="bar"><h1>Фото по блокам</h1><span className="muted">{msg}</span></div>
      {gs.map((g) => (
        <div key={g.slug} className="gal">
          <h2>{g.title || g.slug} <span className="muted">{g.images.filter((i) => i.isActive).length} из {g.images.length} на сайте</span></h2>
          <div className="grid">
            {g.images.map((i) => (
              <figure key={i.id} className={i.isActive ? '' : 'off'}>
                <img src={i.src} alt={i.alt} loading="lazy" />
                <label><input type="checkbox" checked={i.isActive} onChange={(e) => void toggle(i.id, e.target.checked)} /> на сайте</label>
              </figure>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
