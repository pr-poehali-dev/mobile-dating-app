UPDATE t_p61788166_html_to_frontend.payments 
SET ceo_approved_at = CURRENT_TIMESTAMP,
    ceo_approved_by = 1
WHERE status = 'approved' AND ceo_approved_at IS NULL;