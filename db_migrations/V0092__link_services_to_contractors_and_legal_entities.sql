-- Привязываем сервисы к контрагентам и юридическому лицу ООО "Дрим Тим" (id=1)
-- на основании совпадения имён сервисов и контрагентов в системе

-- Timeweb Cloud (id=4) → контрагент Timeweb Cloud (id=2), юрлицо ООО Дрим Тим (id=1)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 2, legal_entity_id = 1 WHERE id = 4;

-- Timeweb 1 (id=15) → контрагент Timeweb Cloud (server41) (id=12)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 12, legal_entity_id = 1 WHERE id = 15;

-- Timeweb 2 (id=8) → контрагент Timeweb Cloud (id=2) (dreamteamcompany.ru)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 2, legal_entity_id = 1 WHERE id = 8;

-- Timeweb 3 (id=13) → контрагент Timeweb Cloud (id=2) (permdental.ru)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 2, legal_entity_id = 1 WHERE id = 13;

-- Timeweb 4 (id=14) → контрагент Timeweb Cloud (id=2) (omskdental.ru)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 2, legal_entity_id = 1 WHERE id = 14;

-- Рег.ру 1 (id=16) → контрагент Рег.ру 1 (id=13)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 13, legal_entity_id = 1 WHERE id = 16;

-- Рег.ру 2 (id=17) → контрагент Рег.ру 2 (id=3)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 3, legal_entity_id = 1 WHERE id = 17;

-- Voximplant Control Panel (id=35) → контрагент Voximplant Control Panel (id=4)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 4, legal_entity_id = 1 WHERE id = 35;

-- Контур Фокус (id=26) → контрагент Контур Фокус (id=5)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 5, legal_entity_id = 1 WHERE id = 26;

-- Сим-карты Предприниматели Патриоты (ООО) (id=20) → контрагент id=6
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 6, legal_entity_id = 1 WHERE id = 20;

-- Сим-карты Предприниматели Патриоты (ИП) (id=21) → контрагент id=6
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 6, legal_entity_id = 1 WHERE id = 21;

-- Сим-карты МТС (СПБ) (id=22) → контрагент Сим-карты МТС (id=7)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 7, legal_entity_id = 1 WHERE id = 22;

-- Сим-карты МТС (Краснодар) (id=23) → контрагент Сим-карты МТС 2 (id=8)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 8, legal_entity_id = 1 WHERE id = 23;

-- Билайн Этикетка ЛК (id=27) → контрагент id=9
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 9, legal_entity_id = 1 WHERE id = 27;

-- Билайн Этикетка ОАТС (id=28) → контрагент id=10
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 10, legal_entity_id = 1 WHERE id = 28;

-- Kaspersky Password Manager (id=30) → контрагент id=14
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 14, legal_entity_id = 1 WHERE id = 30;

-- SmsFast (id=18) → контрагент id=15
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 15, legal_entity_id = 1 WHERE id = 18;

-- Zoom 1 (id=24) → контрагент Zoom 1 (id=17)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 17, legal_entity_id = 1 WHERE id = 24;

-- Zoom 2 (id=25) → контрагент Zoom 2 (id=16)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 16, legal_entity_id = 1 WHERE id = 25;

-- Power BI 1 (id=33) → контрагент Power BI 1 (id=18)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 18, legal_entity_id = 1 WHERE id = 33;

-- Power BI 2 (id=34) → контрагент Power BI 2 (id=19)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 19, legal_entity_id = 1 WHERE id = 34;

-- OpenAI (id=11) → контрагент OpenAI (id=20)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 20, legal_entity_id = 1 WHERE id = 11;

-- ChatGPT (id=12) → контрагент ChatGPT (id=21)
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 21, legal_entity_id = 1 WHERE id = 12;

-- Telegram Предприниматели Патриоты (id=9) → контрагент id=22
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 22, legal_entity_id = 1 WHERE id = 9;

-- iSpring (id=19, новый) → юрлицо ООО Дрим Тим (id=1), контрагент АО Юнико (id=1) — как у id=2
UPDATE t_p61788166_html_to_frontend.services SET contractor_id = 1, legal_entity_id = 1 WHERE id = 19;

-- SMS.RU (id=31, новый) → юрлицо ООО Дрим Тим (id=1)
UPDATE t_p61788166_html_to_frontend.services SET legal_entity_id = 1 WHERE id = 31;

-- 1Dedic (id=5) → юрлицо ООО Дрим Тим (id=1)
UPDATE t_p61788166_html_to_frontend.services SET legal_entity_id = 1 WHERE id = 5;

-- Mango Office (id=6) → юрлицо ООО Дрим Тим (id=1)
UPDATE t_p61788166_html_to_frontend.services SET legal_entity_id = 1 WHERE id = 6;

-- Плюсофон (id=7) → юрлицо ООО Дрим Тим (id=1)
UPDATE t_p61788166_html_to_frontend.services SET legal_entity_id = 1 WHERE id = 7;

-- Wazzup (id=10) → юрлицо ООО Дрим Тим (id=1)
UPDATE t_p61788166_html_to_frontend.services SET legal_entity_id = 1 WHERE id = 10;

-- MyBI Connect (id=29) → юрлицо ООО Дрим Тим (id=1)
UPDATE t_p61788166_html_to_frontend.services SET legal_entity_id = 1 WHERE id = 29;

-- Calltouch (id=32) → юрлицо ООО Дрим Тим (id=1)
UPDATE t_p61788166_html_to_frontend.services SET legal_entity_id = 1 WHERE id = 32;
