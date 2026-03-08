-- Расширяем поле phone для хранения нескольких номеров
ALTER TABLE t_p61788166_html_to_frontend.contractors
  ALTER COLUMN phone TYPE character varying(255);
