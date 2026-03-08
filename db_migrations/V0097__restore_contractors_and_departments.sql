-- Восстановление контрагентов
INSERT INTO t_p61788166_html_to_frontend.contractors (name, inn, is_active) VALUES
  ('Microsoft Russia', '9909123456', true),
  ('Google LLC', '9909234567', true),
  ('Яндекс', '7736207543', true),
  ('1С', '7708234528', true),
  ('Ростелеком', '7707049388', true),
  ('МТС', '7740000076', true),
  ('Лаборатория Касперского', '7713140469', true),
  ('СКБ Контур', '6663003127', true),
  ('Selectel', '7810562062', true),
  ('Bitrix24', '3808211490', true);

-- Восстановление отделов-заказчиков
INSERT INTO t_p61788166_html_to_frontend.customer_departments (name, is_active) VALUES
  ('Отдел информационных технологий', true),
  ('Департамент маркетинга', true),
  ('Финансовый департамент', true),
  ('Отдел продаж', true),
  ('HR-отдел', true),
  ('Отдел обучения', true),
  ('Юридический отдел', true),
  ('Отдел безопасности', true);