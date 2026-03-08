-- Добавление полного набора прав доступа для всех модулей

-- Контрагенты
INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description) 
VALUES
('contractors.create', 'contractors', 'create', 'Создание контрагентов')
ON CONFLICT (name) DO NOTHING;

INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description) 
VALUES
('contractors.read', 'contractors', 'read', 'Просмотр контрагентов')
ON CONFLICT (name) DO NOTHING;

INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description) 
VALUES
('contractors.update', 'contractors', 'update', 'Редактирование контрагентов')
ON CONFLICT (name) DO NOTHING;

-- Доп. поля
INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('custom_fields.create', 'custom_fields', 'create', 'Создание доп. полей')
ON CONFLICT (name) DO NOTHING;

INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('custom_fields.read', 'custom_fields', 'read', 'Просмотр доп. полей')
ON CONFLICT (name) DO NOTHING;

INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('custom_fields.update', 'custom_fields', 'update', 'Редактирование доп. полей')
ON CONFLICT (name) DO NOTHING;

-- Услуги
INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('services.create', 'services', 'create', 'Создание услуг')
ON CONFLICT (name) DO NOTHING;

INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('services.update', 'services', 'update', 'Редактирование услуг')
ON CONFLICT (name) DO NOTHING;

-- Экономии
INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('savings.create', 'savings', 'create', 'Создание экономий')
ON CONFLICT (name) DO NOTHING;

INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('savings.read', 'savings', 'read', 'Просмотр экономий')
ON CONFLICT (name) DO NOTHING;

INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('savings.update', 'savings', 'update', 'Редактирование экономий')
ON CONFLICT (name) DO NOTHING;

-- Причины экономии
INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('saving_reasons.create', 'saving_reasons', 'create', 'Создание причин экономии')
ON CONFLICT (name) DO NOTHING;

INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('saving_reasons.read', 'saving_reasons', 'read', 'Просмотр причин экономии')
ON CONFLICT (name) DO NOTHING;

INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('saving_reasons.update', 'saving_reasons', 'update', 'Редактирование причин экономии')
ON CONFLICT (name) DO NOTHING;

-- Согласования
INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('approvals.read', 'approvals', 'read', 'Просмотр согласований')
ON CONFLICT (name) DO NOTHING;

INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('approvals.approve', 'approvals', 'approve', 'Согласование платежей')
ON CONFLICT (name) DO NOTHING;

INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('approvals.reject', 'approvals', 'reject', 'Отклонение платежей')
ON CONFLICT (name) DO NOTHING;

-- Запланированные платежи
INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('planned_payments.create', 'planned_payments', 'create', 'Создание запланированных платежей')
ON CONFLICT (name) DO NOTHING;

INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('planned_payments.read', 'planned_payments', 'read', 'Просмотр запланированных платежей')
ON CONFLICT (name) DO NOTHING;

INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('planned_payments.update', 'planned_payments', 'update', 'Редактирование запланированных платежей')
ON CONFLICT (name) DO NOTHING;

-- Аудит-логи
INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('audit_logs.read', 'audit_logs', 'read', 'Просмотр журнала аудита')
ON CONFLICT (name) DO NOTHING;

-- Дашборд и статистика
INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('dashboard.read', 'dashboard', 'read', 'Просмотр дашборда')
ON CONFLICT (name) DO NOTHING;

INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('stats.read', 'stats', 'read', 'Просмотр статистики')
ON CONFLICT (name) DO NOTHING;

-- Мониторинг
INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('monitoring.read', 'monitoring', 'read', 'Просмотр мониторинга системы')
ON CONFLICT (name) DO NOTHING;