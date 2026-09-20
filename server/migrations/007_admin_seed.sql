-- 007: первый админ (вход только по паролю)
-- pass_hash = bcrypt хэш пароля
insert into admins (email, pass_hash, role)
values ('admin', '$2a$06$xRhEDcYooNixNXFtrzXCROCuO6brUzebNt3TUteYyFnCdoaR0LI4C', 'admin')
on conflict (email) do update set pass_hash = excluded.pass_hash;
