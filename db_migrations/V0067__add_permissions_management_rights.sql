-- Добавление прав для управления самими правами доступа

INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action, description)
VALUES
('permissions.read', 'permissions', 'read', 'Просмотр списка прав доступа')
ON CONFLICT (name) DO NOTHING;

-- Назначаем это право роли Администратора
INSERT INTO t_p61788166_html_to_frontend.role_permissions (role_id, permission_id)
SELECT 1, p.id
FROM t_p61788166_html_to_frontend.permissions p
WHERE p.name = 'permissions.read'
AND NOT EXISTS (
    SELECT 1 
    FROM t_p61788166_html_to_frontend.role_permissions rp 
    WHERE rp.role_id = 1 AND rp.permission_id = p.id
);