INSERT INTO t_p61788166_html_to_frontend.role_permissions (role_id, permission_id)
SELECT 7, 3 WHERE NOT EXISTS (
  SELECT 1 FROM t_p61788166_html_to_frontend.role_permissions WHERE role_id = 7 AND permission_id = 3
);