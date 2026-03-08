-- Добавляем поля для связи сервиса с юр.лицом и контрагентом по умолчанию
ALTER TABLE t_p61788166_html_to_frontend.services
ADD COLUMN legal_entity_id INTEGER REFERENCES t_p61788166_html_to_frontend.legal_entities(id),
ADD COLUMN contractor_id INTEGER REFERENCES t_p61788166_html_to_frontend.contractors(id);