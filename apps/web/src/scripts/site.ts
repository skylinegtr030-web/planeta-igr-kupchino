/* Планета Игр — клиентская логика сайта. Все данные приходят из API (PostgreSQL). Без canvas. */
type Img = { src: string; alt: string; w: number; h: number };
type Block = { key: string; data: { title: string; kind: string; gallery: string; sort: number; text: string; published: boolean }; images: Img[] };
type Product = { slug: string; title: string; description: string; features: string[]; priceWeekday: number; priceWeekend: number; priceFrom: boolean; durationMin: number | null; cover: string | null; mark: string | null };
type Category = { slug: string; title: string; kind: string; items: Product[] };
type Settings = { contacts: { phone: string; hours: string; addressFull: string; addressShort: string; mapQuery: string }; ages: Record<string, number>; tiers: Record<string, number>; weekendDays: number[]; holidays: string[] };
type Review = { author: string; text: string; rating: number; source: string | null };

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n: number) => n.toString().padStart(2, '0');

const ZONE_TEXT: Record<string, string> = {
  'park.tower': 'Многоуровневый лабиринт высотой с трёхэтажный дом: тоннели, сетки, горки и тайные комнаты.',
  'park.slides': 'Быстрые горки и мягкий сухой бассейн с тысячами шариков — любимое место для прыжков.',
  'park.maze': 'Лабиринт с пневматическими пушками: баталии мягкими шариками для всей компании.',
  'park.climb': 'Скалодром с безопасной страховкой и батуты — для тех, кто хочет выше и быстрее.',
  'park.tubing': 'Крутая тюбинг-горка внутри парка: спуск на надувных «ватрушках» круглый год.',
  'park.neon': 'Неоновая арена с ультрафиолетом и музыкой — светящиеся игры и лазертаг Q-ZAR.',
  'park.arcade': 'Игровые автоматы, гонки и призовые аппараты. Тайм-карты на 30 и 60 минут.',
  'park.party': 'Праздники с аниматорами и шоу-программами прямо в парке.',
  'park.banquet': 'Уютные банкетные комнаты для торта, подарков и родительского отдыха.',
};
const PACK_TONE: Record<string, string> = { malysh: 't-berry', jungle: 't-jungle', king: 't-king', cyber: 't-cyber' };

// ───────── состояние ─────────
const state = { dayKind: 'weekday' as 'weekday' | 'weekend', extras: new Set<string>(), catalog: [] as Category[], settings: null as Settings | null, galleries: [] as { title: string; images: Img[] }[] };
const byKind = (k: string) => state.catalog.filter((c) => c.kind === k).flatMap((c) => c.items);
const price = (p: Product, k = state.dayKind) => (k === 'weekend' ? p.priceWeekend : p.priceWeekday);

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json() as Promise<T>;
}

// ───────── появление блоков ─────────
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -5% 0px', threshold: 0.04 });
const observe = (root: ParentNode = document) => $$('.rv:not(.in), .words:not(.in)', root).forEach((el) => io.observe(el));
requestAnimationFrame(() => { $('#h1')?.classList.add('in'); observe(); });

// ───────── шапка ─────────
const hdr = $('#hdr')!;
let lastY = 0, ticking = false;
addEventListener('scroll', () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => { const y = scrollY; hdr.classList.toggle('solid', y > 40); lastY = y; parallax(y); ticking = false; });
}, { passive: true });
const burger = $('#burger') as HTMLButtonElement;
burger.addEventListener('click', () => { const open = document.body.classList.toggle('menu-open'); burger.setAttribute('aria-expanded', String(open)); });
$$('#nav a').forEach((a) => a.addEventListener('click', () => { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); }));

// ───────── hero: параллакс и наклон ─────────
const strip = $('#strip'), stripInner = $('#stripInner');
function parallax(y: number) {
  if (reduced || !stripInner || y > innerHeight) return;
  $$('.card-ph', stripInner).forEach((c, i) => c.style.setProperty('--py', `${y * (0.06 + i * 0.05)}px`));
}
if (strip && stripInner && !reduced && matchMedia('(pointer:fine)').matches) {
  let rx = 0, ry = 0, raf = 0;
  strip.addEventListener('pointermove', (e) => {
    const b = strip.getBoundingClientRect(); ry = ((e.clientX - b.left) / b.width - 0.5) * 10; rx = -((e.clientY - b.top) / b.height - 0.5) * 8;
    if (!raf) raf = requestAnimationFrame(() => { stripInner.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; raf = 0; });
  });
  strip.addEventListener('pointerleave', () => { stripInner.style.transform = ''; });
}

// ───────── данные ─────────
function renderSettings(s: Settings) {
  state.settings = s;
  const tel = 'tel:' + s.contacts.phone.replace(/[^\d+]/g, '');
  $$<HTMLAnchorElement>('[data-phone-link]').forEach((a) => { a.href = tel; if (a.textContent?.trim() === '…' || a.classList.contains('big')) a.textContent = s.contacts.phone; });
  $$('[data-hours]').forEach((e) => (e.textContent = `Ежедневно ${s.contacts.hours}`));
  $$('[data-address]').forEach((e) => (e.textContent = s.contacts.addressFull));
  $$('[data-address-full]').forEach((e) => (e.textContent = `Санкт-Петербург, ${s.contacts.addressFull}`));
  const map = `https://yandex.ru/maps/?text=${encodeURIComponent(s.contacts.mapQuery || s.contacts.addressFull)}`;
  $$<HTMLAnchorElement>('[data-map-link]').forEach((a) => (a.href = map));
  const hf = $('[data-fact="hours"]'); if (hf) hf.textContent = s.contacts.hours;
  const af = $('[data-fact="age"]'); if (af) af.textContent = '1–14';
  const ages = $('#ages');
  if (ages) ages.innerHTML = [
    s.ages.lavaFloor ? `Лава-пол — с <b>${s.ages.lavaFloor}</b> лет` : '',
    s.ages.kuzar ? `Лазертаг Q-ZAR — с <b>${s.ages.kuzar}</b> лет` : '',
    `Носки обязательны · Родители бесплатно`,
  ].filter(Boolean).join('<span aria-hidden="true">·</span>');
  const hl = $('[data-hours-label]'); if (hl) hl.textContent = `Ежедневно ${s.contacts.hours}`;
}

function renderContent(blocks: Block[]) {
  const hero = blocks.find((b) => b.key === 'park.hero');
  if (hero?.images.length) {
    $$('.card-ph').forEach((f) => { const i = Number(f.dataset.hero); const img = hero.images[i] ?? hero.images[0]; f.classList.remove('sk'); f.innerHTML = `<img src="${img.src}" alt="${esc(img.alt || 'Планета Игр')}" width="${img.w}" height="${img.h}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} /><span class="tag"><i></i>${['Парк', 'Башня', 'Арена', 'Праздник'][i] ?? 'Парк'}</span>`; });
  }
  const zones = blocks.filter((b) => b.data.kind === 'zone' && b.data.published && b.images.length && b.key !== 'park.mascot').sort((a, b) => a.data.sort - b.data.sort);
  state.galleries = zones.map((z) => ({ title: z.data.title, images: z.images }));
  const zf = $('[data-fact="zones"]'); if (zf) zf.textContent = String(zones.length);
  const marq = $('#marq'); if (marq) { const names = zones.map((z) => `<span>${esc(z.data.title)}</span>`).join(''); marq.innerHTML = names + names; }
  const zEl = $('#zones')!;
  zEl.innerHTML = zones.map((z, i) => `<button type="button" class="zone rv" data-g="${i}" style="transition-delay:${Math.min(i, 4) * 0.08}s">
      <img src="${z.images[0].src}" alt="${esc(z.images[0].alt || z.data.title)}" width="${z.images[0].w}" height="${z.images[0].h}" loading="lazy" decoding="async" />
      <span class="n">Зона ${pad(i + 1)}</span><span class="cnt">${z.images.length} фото</span>
      <span class="t"><h3>${esc(z.data.title)}</h3><p>${esc(z.data.text || ZONE_TEXT[z.key] || '')}</p><span class="go">Смотреть фото →</span></span>
    </button>`).join('');
  observe(zEl);
  zEl.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('.zone'); if (b && !dragged) openLB(Number(b.dataset.g), 0); });
  // drag-scroll
  let down = false, sx = 0, sl = 0, dragged = false;
  zEl.addEventListener('pointerdown', (e) => { down = true; dragged = false; sx = e.clientX; sl = zEl.scrollLeft; });
  zEl.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 6) { dragged = true; zEl.classList.add('drag'); zEl.scrollLeft = sl - dx; } });
  const up = () => { down = false; zEl.classList.remove('drag'); setTimeout(() => (dragged = false), 0); };
  zEl.addEventListener('pointerup', up); zEl.addEventListener('pointerleave', up);
  $$<HTMLButtonElement>('[data-zn]').forEach((b) => b.addEventListener('click', () => zEl.scrollBy({ left: Number(b.dataset.zn) * (zEl.clientWidth * 0.8), behavior: 'smooth' })));
}

function renderCatalog(cats: Category[]) {
  state.catalog = cats;
  const packs = byKind('package');
  const pf = $('[data-fact="programs"]'); if (pf) pf.textContent = String(packs.length);
  const pEl = $('#packs')!;
  pEl.innerHTML = packs.map((p, i) => `<article class="pack rv ${PACK_TONE[p.slug] ?? ''}" style="transition-delay:${i * 0.1}s">
      ${p.mark ? `<span class="mark">${esc(p.mark)}</span>` : ''}
      <h3>${esc(p.title)}</h3>
      ${p.description ? `<p class="sub">${esc(p.description)}</p>` : ''}
      <div class="price"><span data-price="${p.slug}">${fmt(price(p))}</span><small data-price-note>${state.dayKind === 'weekend' ? 'выходные и праздники' : 'будни'}</small></div>
      <ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      <a class="btn btn-ghost" href="#book" data-pick="${p.slug}">Забронировать <span class="ar">↗</span></a>
    </article>`).join('');
  observe(pEl);
  pEl.addEventListener('click', (e) => { const a = (e.target as HTMLElement).closest<HTMLElement>('[data-pick]'); if (a) { ($('#f-pack') as HTMLSelectElement).value = a.dataset.pick!; estimate(); } });
  // select
  const sel = $('#f-pack') as HTMLSelectElement;
  packs.forEach((p) => { const o = document.createElement('option'); o.value = p.slug; o.textContent = p.title; sel.append(o); });
  // shows + addons
  const services = cats.filter((c) => c.kind === 'service');
  const sEl = $('#showsList')!;
  let idx = 0;
  sEl.innerHTML = services.map((c) => `<div class="rows-title rv">${esc(c.title)}</div><div class="rows">${c.items.map((p) => `<div class="row rv"><span class="idx">${pad(++idx)}</span><div><h4>${esc(p.title)}</h4>${p.description ? `<p>${esc(p.description)}</p>` : ''}</div><div><div class="pr">${p.priceFrom ? 'от ' : ''}${fmt(p.priceWeekday)}</div><button type="button" class="add" data-extra="${p.slug}" aria-pressed="false">+ В заявку</button></div></div>`).join('')}</div>`).join('');
  observe(sEl);
  // extras chips in form
  const chips = $('#extraChips')!;
  chips.innerHTML = services.flatMap((c) => c.items).map((p) => `<button type="button" class="chip" data-extra="${p.slug}" aria-pressed="false">${esc(p.title)}</button>`).join('');
  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-extra]'); if (!b) return;
    const slug = b.dataset.extra!; state.extras.has(slug) ? state.extras.delete(slug) : state.extras.add(slug);
    $$<HTMLButtonElement>(`[data-extra="${slug}"]`).forEach((x) => { const on = state.extras.has(slug); x.setAttribute('aria-pressed', String(on)); if (x.classList.contains('add')) x.textContent = on ? '✓ В заявке' : '+ В заявку'; });
    estimate();
  });
  // tickets
  const tix = [...byKind('ticket'), ...byKind('activity')];
  const tEl = $('#tix')!;
  const t = state.settings?.tiers ?? {};
  tEl.innerHTML = tix.map((p, i) => {
    let big = fmt(p.priceWeekday), note = 'будни', extra = '';
    if (p.slug === 'unlimited' && t.unlimitedWeekend) extra = `<p>Выходные и праздники — ${fmt(t.unlimitedWeekend)}</p>`;
    if (p.slug === 'time-cards' && t.timeCards60) { big = fmt(t.timeCards30 ?? p.priceWeekday); note = '30 минут'; extra = `<p>60 минут — ${fmt(t.timeCards60)}</p>`; }
    if (p.slug === 'qzar') note = 'за игру · компания'; if (p.slug === 'lavaFloor') note = 'за сеанс';
    return `<article class="tix rv" style="transition-delay:${i * 0.08}s"><span class="label">${pad(i + 1)} · ${esc(p.slug === 'unlimited' ? 'Вход в парк' : p.slug === 'time-cards' ? 'Автоматы' : 'Активность')}</span><div><h4>${esc(p.title)}</h4><div class="big">${big}<small>${note}</small></div>${p.description ? `<p>${esc(p.description)}</p>` : ''}${extra}</div></article>`;
  }).join('');
  observe(tEl);
}

function renderReviews(list: Review[]) {
  const sec = $('#reviews') as HTMLElement; if (!list.length) return;
  sec.hidden = false;
  $('#revs')!.innerHTML = list.map((r, i) => `<article class="rev rv" style="transition-delay:${i * 0.08}s"><span class="stars" aria-label="${r.rating} из 5">${'★'.repeat(r.rating)}</span><p>${esc(r.text)}</p><b>${esc(r.author)}${r.source ? ` · ${esc(r.source)}` : ''}</b></article>`).join('');
  observe(sec);
}

// ───────── будни / выходные ─────────
function animateNumber(el: HTMLElement, to: number) {
  const from = Number(el.textContent?.replace(/\D/g, '')) || 0; if (reduced || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now(); const dur = 500;
  const step = (t: number) => { const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
$('#dayKind')?.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-k]'); if (!b) return;
  state.dayKind = b.dataset.k as 'weekday' | 'weekend';
  const seg = $('#dayKind')!; seg.dataset.k = state.dayKind;
  $$('button', seg).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  byKind('package').forEach((p) => { const el = $(`[data-price="${p.slug}"]`); if (el) animateNumber(el, price(p)); });
  $$('[data-price-note]').forEach((n) => (n.textContent = state.dayKind === 'weekend' ? 'выходные и праздники' : 'будни'));
});

// ───────── лайтбокс ─────────
const lb = $('#lb')!, lbImg = $('#lbImg') as HTMLImageElement; let g = 0, gi = 0;
function openLB(gIdx: number, i: number) { g = gIdx; gi = i; showLB(); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
function showLB() { const gal = state.galleries[g]; if (!gal) return; const img = gal.images[gi]; lbImg.src = img.src; lbImg.alt = img.alt || gal.title; $('#lbTitle')!.textContent = gal.title; $('#lbIdx')!.textContent = `${gi + 1} / ${gal.images.length}`; const nx = gal.images[(gi + 1) % gal.images.length]; new Image().src = nx.src; }
function closeLB() { lb.classList.remove('open'); document.body.style.overflow = ''; }
lb.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-lb]'); if (b) { const v = b.dataset.lb!; if (v === 'close') return closeLB(); const n = state.galleries[g].images.length; gi = (gi + Number(v) + n) % n; showLB(); } else if (e.target === lb) closeLB(); });
addEventListener('keydown', (e) => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') closeLB(); if (e.key === 'ArrowRight') { gi = (gi + 1) % state.galleries[g].images.length; showLB(); } if (e.key === 'ArrowLeft') { const n = state.galleries[g].images.length; gi = (gi - 1 + n) % n; showLB(); } });
let tx = 0; lb.addEventListener('touchstart', (e) => (tx = e.touches[0].clientX), { passive: true }); lb.addEventListener('touchend', (e) => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) { const n = state.galleries[g].images.length; gi = (gi + (d < 0 ? 1 : -1) + n) % n; showLB(); } });

// ───────── форма ─────────
const form = $('#orderForm') as HTMLFormElement;
const dateInp = $('#f-date') as HTMLInputElement;
const today = new Date(); dateInp.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
function dayKindFor(dateStr: string): 'weekday' | 'weekend' | null {
  if (!dateStr || !state.settings) return null;
  if (state.settings.holidays.includes(dateStr)) return 'weekend';
  const d = new Date(dateStr + 'T12:00:00'); return state.settings.weekendDays.includes(d.getDay()) ? 'weekend' : 'weekday';
}
function estimate() {
  const est = $('#est') as HTMLElement; const pack = byKind('package').find((p) => p.slug === (($('#f-pack') as HTMLSelectElement).value));
  const kind = dayKindFor(dateInp.value) ?? state.dayKind;
  let sum = pack ? price(pack, kind) : 0; let from = pack?.priceFrom ?? false;
  const all = byKind('service'); state.extras.forEach((s) => { const p = all.find((x) => x.slug === s); if (p) { sum += price(p, kind); from = from || p.priceFrom; } });
  if (!sum) { est.hidden = true; return; }
  est.hidden = false; animateNumber($('[data-est-sum]')!, sum); ($('[data-est-sum]') as HTMLElement).textContent = (from ? 'от ' : '') + fmt(sum);
  $('[data-est-note]')!.textContent = kind === 'weekend' ? 'по тарифу выходного/праздничного дня' : 'по тарифу буднего дня';
}
form.addEventListener('input', estimate); form.addEventListener('change', estimate);
const setErr = (name: string, msg: string) => { const inp = form.elements.namedItem(name) as HTMLElement | null; const fld = inp?.closest('.fld'); if (!fld) return; fld.classList.toggle('err', !!msg); const e = fld.querySelector('.e'); if (e) e.textContent = msg; };
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form); const errBox = $('#formErr') as HTMLElement; errBox.hidden = true;
  ['name', 'phone', 'eventDate', 'kids', 'comment', 'consent'].forEach((n) => setErr(n, ''));
  let bad = false;
  const name = String(fd.get('name') ?? '').trim(), phone = String(fd.get('phone') ?? '').trim(), eventDate = String(fd.get('eventDate') ?? '');
  if (name.length < 2) { setErr('name', 'Напишите имя'); bad = true; }
  if (phone.replace(/\D/g, '').length < 10) { setErr('phone', 'Проверьте номер телефона'); bad = true; }
  if (!eventDate) { setErr('eventDate', 'Выберите дату'); bad = true; }
  if (!fd.get('consent')) { setErr('consent', 'Нужно согласие на обработку данных'); bad = true; }
  if (bad) return;
  const btn = $('#submitBtn') as HTMLButtonElement; btn.disabled = true; btn.textContent = 'Отправляем…';
  const kids = Number(fd.get('kids')); const body: Record<string, unknown> = { name, phone, eventDate, extras: [...state.extras], consent: true, consentAt: new Date().toISOString() };
  if (kids > 0) body.kids = kids; const ps = String(fd.get('packageSlug') ?? ''); if (ps) body.packageSlug = ps; const cm = String(fd.get('comment') ?? '').trim(); if (cm) body.comment = cm;
  try {
    const r = await fetch('/api/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (r.status === 201 && j.ok) { $('#okNum')!.textContent = `№ ${j.id}`; form.classList.add('done'); form.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (r.status === 422 && j.fields) { Object.entries(j.fields as Record<string, string>).forEach(([k, v]) => setErr(k, v)); }
    else { errBox.textContent = 'Не удалось отправить заявку. Позвоните нам — мы всё оформим по телефону.'; errBox.hidden = false; }
  } catch { errBox.textContent = 'Нет связи с сервером. Попробуйте ещё раз или позвоните нам.'; errBox.hidden = false; }
  finally { btn.disabled = false; btn.innerHTML = 'Отправить заявку <span class="ar">↗</span>'; }
});

// ───────── cookie ─────────
const ck = $('#cookie') as HTMLElement;
if (ck && !localStorage.getItem('pi.cookie')) { ck.hidden = false; $('#cookieOk')?.addEventListener('click', () => { localStorage.setItem('pi.cookie', '1'); ck.hidden = true; }); }

// ───────── загрузка ─────────
(async () => {
  const [settings, content, catalog, reviews] = await Promise.allSettled([
    getJSON<Settings>('/api/settings'), getJSON<{ blocks: Block[] }>('/api/content'), getJSON<{ categories: Category[] }>('/api/catalog'), getJSON<{ reviews: Review[] }>('/api/reviews'),
  ]);
  if (settings.status === 'fulfilled') renderSettings(settings.value);
  if (content.status === 'fulfilled') renderContent(content.value.blocks); else $('#zones')!.innerHTML = '<p class="err-msg">Не удалось загрузить фотографии парка.</p>';
  if (catalog.status === 'fulfilled') renderCatalog(catalog.value.categories); else $('#packs')!.innerHTML = '<p class="err-msg">Не удалось загрузить программы. Позвоните нам.</p>';
  if (reviews.status === 'fulfilled') renderReviews(reviews.value.reviews);
  estimate();
})();
