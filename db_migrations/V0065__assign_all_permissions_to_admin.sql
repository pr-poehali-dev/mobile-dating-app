-- Назначение всех новых прав роли Администратора

-- Получаем все разрешения, которых нет у администратора, и добавляем их
INSERT INTO t_p61788166_html_to_frontend.role_permissions (role_id, permission_id)
SELECT 1, p.id
FROM t_p61788166_html_to_frontend.permissions p
WHERE NOT EXISTS (
    SELECT 1 
    FROM t_p61788166_html_to_frontend.role_permissions rp 
    WHERE rp.role_id = 1 AND rp.permission_id = p.id
);