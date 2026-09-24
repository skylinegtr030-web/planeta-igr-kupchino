-- Контакты центра (адрес и режим работы подтверждены заказчиком 24.09.2026)
insert into settings (key, value) values ('contacts', jsonb_build_object(
  'phone', '', 'hours', '10:00–22:00',
  'addressFull', 'Балканская ул., 17, ТРК «Балкания Nova», 3 этаж', 'addressShort', 'Купчино · Балкания Nova',
  'mapQuery', 'Санкт-Петербург, Балканская улица, 17, ТРК Балкания Nova'))
on conflict (key) do update set value = settings.value || excluded.value;
select value from settings where key = 'contacts';
