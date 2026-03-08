-- Откат неверной миграции: вычитаем 3 часа обратно

UPDATE t_p61788166_html_to_frontend.approvals 
SET created_at = created_at - INTERVAL '3 hours';

UPDATE t_p61788166_html_to_frontend.payments
SET created_at = created_at - INTERVAL '3 hours',
    payment_date = payment_date - INTERVAL '3 hours',
    submitted_at = CASE WHEN submitted_at IS NOT NULL THEN submitted_at - INTERVAL '3 hours' ELSE NULL END,
    ceo_approved_at = CASE WHEN ceo_approved_at IS NOT NULL THEN ceo_approved_at - INTERVAL '3 hours' ELSE NULL END,
    tech_director_approved_at = CASE WHEN tech_director_approved_at IS NOT NULL THEN tech_director_approved_at - INTERVAL '3 hours' ELSE NULL END;