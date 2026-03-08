-- Исправление существующих временных меток: добавляем 3 часа (UTC -> Moscow)

UPDATE t_p61788166_html_to_frontend.approvals 
SET created_at = created_at + INTERVAL '3 hours'
WHERE created_at < '2026-02-17 15:00:00';

UPDATE t_p61788166_html_to_frontend.payments
SET created_at = created_at + INTERVAL '3 hours',
    payment_date = payment_date + INTERVAL '3 hours',
    submitted_at = CASE WHEN submitted_at IS NOT NULL AND submitted_at < '2026-02-17 15:00:00' 
                        THEN submitted_at + INTERVAL '3 hours' 
                        ELSE submitted_at END,
    ceo_approved_at = CASE WHEN ceo_approved_at IS NOT NULL AND ceo_approved_at < '2026-02-17 15:00:00'
                           THEN ceo_approved_at + INTERVAL '3 hours'
                           ELSE ceo_approved_at END,
    tech_director_approved_at = CASE WHEN tech_director_approved_at IS NOT NULL AND tech_director_approved_at < '2026-02-17 15:00:00'
                                     THEN tech_director_approved_at + INTERVAL '3 hours'
                                     ELSE tech_director_approved_at END
WHERE created_at < '2026-02-17 15:00:00';