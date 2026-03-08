INSERT INTO t_p61788166_html_to_frontend.planned_payments
  (category_id, amount, description, planned_date, legal_entity_id, service_id, is_active)
VALUES
  (1, 85000.00,  'Аренда серверов AWS',           NOW() + INTERVAL '0 days', 1, 1, true),
  (1, 12400.00,  'Продление домена и SSL',         NOW() + INTERVAL '0 days', 2, 2, true),
  (3, 47500.00,  'Лицензия антивируса Kaspersky',  NOW() + INTERVAL '1 day',  1, 3, true),
  (1, 32000.00,  'Облачное хранилище Google Cloud', NOW() + INTERVAL '1 day', 3, 1, true),
  (2, 18900.00,  'Подписка Coursera for Business',  NOW() + INTERVAL '1 day', 4, 2, true),
  (1, 9800.00,   'Мониторинг Datadog',             NOW() + INTERVAL '2 days', 2, 3, true),
  (3, 55000.00,  'Сертификат ЭЦП для торгов',      NOW() + INTERVAL '2 days', 5, 1, true),
  (2, 24000.00,  'Конференция DevOps Days',         NOW() + INTERVAL '3 days', 1, 2, true),
  (1, 71300.00,  'Продление лицензии Microsoft 365', NOW() + INTERVAL '3 days', 3, 3, true),
  (3, 16500.00,  'VPN-сервис для удалённых сотрудников', NOW() + INTERVAL '3 days', 4, 1, true);
