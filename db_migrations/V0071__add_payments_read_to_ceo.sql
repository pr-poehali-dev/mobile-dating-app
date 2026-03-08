-- Добавление права payments.read для роли CEO
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 7, 2 
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions WHERE role_id = 7 AND permission_id = 2
);