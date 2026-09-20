// Единый клиент данных для сайта и админки
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const BUCKET = 'public-site-assets';
export const mediaUrl = (path) =>
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

export async function getSettings() {
  const { data, error } = await sb.from('site_settings').select('key,value');
  if (error) throw error;
  return Object.fromEntries(data.map(r => [r.key, r.value]));
}

export async function getProducts(categorySlug) {
  let q = sb.from('products')
    .select('*, categories(slug), product_media(sort_order, media(storage_path, alt))')
    .eq('is_published', true).order('sort_order');
  const { data, error } = await q;
  if (error) throw error;
  return (categorySlug ? data.filter(p => p.categories?.slug === categorySlug) : data)
    .map(p => ({ ...p, images: (p.product_media || [])
      .sort((a,b)=>a.sort_order-b.sort_order)
      .map(pm => ({ url: mediaUrl(pm.media.storage_path), alt: pm.media.alt })) }));
}

export async function getGallery(slug) {
  const { data, error } = await sb.from('galleries')
    .select('slug, gallery_media(sort_order, media(storage_path, alt))').eq('slug', slug).single();
  if (error) throw error;
  return (data.gallery_media || []).sort((a,b)=>a.sort_order-b.sort_order)
    .map(gm => ({ url: mediaUrl(gm.media.storage_path), alt: gm.media.alt }));
}

export async function getPage(slug) {
  const { data, error } = await sb.from('pages')
    .select('*, blocks(*)').eq('slug', slug).eq('is_published', true).single();
  if (error) throw error;
  data.blocks = (data.blocks || []).filter(b => b.is_published)
    .sort((a,b)=>a.sort_order-b.sort_order);
  return data;
}

export async function createOrder(payload) {
  const { name, phone, event_date, ...rest } = payload;
  const { error } = await sb.from('orders')
    .insert({ name, phone, event_date: event_date || null, payload: rest });
  if (error) throw error;
  return true;
}
