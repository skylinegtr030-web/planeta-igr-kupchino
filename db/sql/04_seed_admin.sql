-- 1) Authentication > Users > Add user (ваш email)
-- 2) Замените email ниже и выполните:
insert into admin_profiles (user_id, email, role)
select id, email, 'admin' from auth.users where email = 'VASH_EMAIL@example.com'
on conflict (user_id) do nothing;
