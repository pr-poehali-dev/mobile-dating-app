-- Add users.read permission to CEO role for approver selection
INSERT INTO t_p61788166_html_to_frontend.role_permissions (role_id, permission_id)
VALUES (7, 14)
ON CONFLICT (role_id, permission_id) DO NOTHING;