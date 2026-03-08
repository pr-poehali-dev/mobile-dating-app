-- Add users.read permission to CEO role to allow viewing user list for approver selection
INSERT INTO t_p61788166_html_to_frontend.role_permissions (role_id, permission_id)
SELECT 7, 14
WHERE NOT EXISTS (
    SELECT 1 FROM t_p61788166_html_to_frontend.role_permissions 
    WHERE role_id = 7 AND permission_id = 14
);