/* Рендер юридических страниц: простой markdown-подобный текст из БД → HTML. Без внешних зависимостей. */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export function fill(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, k: string) => vars[k] ?? '');
}

export function mdToHtml(src: string): string {
  const lines = src.replace(/\r/g, '').split('\n');
  const out: string[] = []; let list: string[] | null = null; let para: string[] = [];
  const flushP = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushL = () => { if (list) { out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join('')}</ul>`); list = null; } };
  const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[(.+?)\]\((https?:\/\/[^\s)]+|\/[^\s)]*|tel:[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2">$1</a>');
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) { flushP(); flushL(); continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(l);
    if (h) { flushP(); flushL(); const n = Math.min(4, Math.max(2, h[1]!.length)); out.push(`<h${n}>${inline(h[2]!)}</h${n}>`); continue; }
    if (/^[-*]\s+/.test(l)) { flushP(); (list ??= []).push(l.replace(/^[-*]\s+/, '')); continue; }
    flushL(); para.push(l);
  }
  flushP(); flushL();
  return out.join('\n');
}

export function docPage(o: { title: string; html: string; updatedAt: string | null; nav: { slug: string; title: string }[]; company: string; phone: string; current: string }) {
  const date = o.updatedAt ? new Date(o.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow">
<title>${esc(o.title)} — ${esc(o.company || 'Планета Игр')}</title><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
:root{--ink:#101633;--paper:#f7f3ea;--mute:#5a6079;--line:rgba(16,22,51,.12);--red:#e2231a;--yellow:#ffc72c}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 Manrope,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}.top{display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;justify-content:space-between;padding:20px clamp(16px,4vw,48px);border-bottom:1px solid var(--line)}
.logo{font-weight:800;text-transform:uppercase;letter-spacing:.02em;text-decoration:none;display:flex;gap:10px;align-items:center}.logo svg{width:30px;height:30px}
.nav{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:.85rem;font-weight:600}.nav a{text-decoration:none;padding:6px 0;border-bottom:2px solid transparent}.nav a.on{border-color:var(--red)}
main{max-width:820px;margin:0 auto;padding:clamp(28px,5vw,64px) clamp(16px,4vw,48px) 80px}
.label{font:600 .7rem/1 ui-monospace,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--mute)}
h1{font-size:clamp(1.7rem,4vw,2.8rem);line-height:1.05;text-transform:uppercase;letter-spacing:-.01em;margin:14px 0 30px;font-weight:800}
h2{font-size:1.25rem;margin:36px 0 12px;line-height:1.2}h3{font-size:1.05rem;margin:26px 0 10px}p{margin:0 0 14px}ul{padding-left:22px;margin:0 0 16px}li{margin-bottom:6px}
table{border-collapse:collapse;width:100%;margin:10px 0 20px}td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}td:first-child{color:var(--mute);font-size:.85rem;width:38%}
.foot{margin-top:60px;padding-top:20px;border-top:1px solid var(--line);font-size:.82rem;color:var(--mute);display:flex;flex-wrap:wrap;gap:8px 24px;justify-content:space-between}
.btn{display:inline-block;background:var(--ink);color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;font-size:.9rem}
</style></head><body>
<header class="top"><a class="logo" href="/"><svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="13" fill="#1f5fd6"/><path d="M13 19c4-3 9-4 15-3 4 1 7 3 8 6" stroke="#22a559" stroke-width="3.2" stroke-linecap="round"/><path d="M12 27c5 3 12 4 19 1" stroke="#ffc72c" stroke-width="3.2" stroke-linecap="round"/><ellipse cx="24" cy="26" rx="21" ry="7" stroke="#e2231a" stroke-width="2.6" transform="rotate(-18 24 26)"/></svg>Планета Игр</a>
<nav class="nav">${o.nav.map((n) => `<a href="/docs/${esc(n.slug)}"${n.slug === o.current ? ' class="on"' : ''}>${esc(n.title)}</a>`).join('')}</nav></header>
<main><span class="label">Документы</span><h1>${esc(o.title)}</h1>${o.html}
<div class="foot"><span>${date ? `Редакция от ${date}` : ''}</span><span>${esc(o.company)}${o.phone ? ` · ${esc(o.phone)}` : ''}</span></div>
<p style="margin-top:30px"><a class="btn" href="/">← На главную</a></p></main></body></html>`;
}
