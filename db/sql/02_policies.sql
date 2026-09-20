create schema if not exists private;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = public, private as $fn$
  select exists (select 1 from public.admin_profiles p where p.user_id = auth.uid());
$fn$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

do $do$ declare t text;
begin
  foreach t in array array['site_settings','pages','blocks','categories','products','media','product_media','galleries','gallery_media','orders','admin_profiles'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists p_admin_all on public.%I', t);
    execute format('create policy p_admin_all on public.%I for all to authenticated using (private.is_admin()) with check (private.is_admin())', t);
  end loop;
end $do$;

drop policy if exists p_pub_settings on site_settings;
create policy p_pub_settings on site_settings for select to anon using (true);
drop policy if exists p_pub_pages on pages;
create policy p_pub_pages on pages for select to anon using (is_published);
drop policy if exists p_pub_blocks on blocks;
create policy p_pub_blocks on blocks for select to anon using (is_published);
drop policy if exists p_pub_products on products;
create policy p_pub_products on products for select to anon using (is_published);
drop policy if exists p_pub_cat on categories;
create policy p_pub_cat on categories for select to anon using (true);
drop policy if exists p_pub_media on media;
create policy p_pub_media on media for select to anon using (true);
drop policy if exists p_pub_pm on product_media;
create policy p_pub_pm on product_media for select to anon using (true);
drop policy if exists p_pub_gal on galleries;
create policy p_pub_gal on galleries for select to anon using (true);
drop policy if exists p_pub_gm on gallery_media;
create policy p_pub_gm on gallery_media for select to anon using (true);
drop policy if exists p_anon_order_insert on orders;
create policy p_anon_order_insert on orders for insert to anon with check (true);
