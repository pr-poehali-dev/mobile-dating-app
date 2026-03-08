-- Добавление новых сервисов
INSERT INTO t_p61788166_html_to_frontend.services 
  (name, description, intermediate_approver_id, final_approver_id, customer_department_id, category_id, created_at, updated_at) 
VALUES
  ('1Dedic', 'Серверы основной инфраструктуры (1С, Битрикс, удалённые рабочие столы и пр.).', NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('Mango Office', 'Резервная телефония контактного центра.', NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('Timeweb 2', 'Домен корпоративной почты dreamteamcompany.ru.', NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('Рег.ру (it-services@world-dent.ru)', 'Домены сайтов Департамента маркетинга.', NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('Сим-карты МТС', 'Сим-карты УК СПБ (М. Проскурдина), УК Краснодар (КЦ вторичного отдела продаж) и команды Юлии Вадимовны.', NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('Контур Фокус', 'Сервис для проверки контрагентов.', NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('Билайн Этикетка ЛК', 'Сим-карты «Этикетка» Билайн для г. Краснодар, СПБ, Ростов и КЦ вторичного отдела продаж.', NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('MyBI Connect', 'Сервис для добавления поставщиков рекламных интеграций в аналитику.', NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('SMS.RU', 'Сервис рассылки сообщений контактного центра.', NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('Calltouch', 'Сервис аналитики звонков и заявок.', NULL, NULL, NULL, NULL, NOW(), NOW());
