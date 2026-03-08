INSERT INTO t_p61788166_html_to_frontend.permissions (name, resource, action)
VALUES ('services.remove', 'services', 'remove')
ON CONFLICT DO NOTHING;

INSERT INTO t_p61788166_html_to_frontend.role_permissions (role_id, permission_id)
SELECT 1, id FROM t_p61788166_html_to_frontend.permissions WHERE name = 'services.remove'
ON CONFLICT DO NOTHING;
