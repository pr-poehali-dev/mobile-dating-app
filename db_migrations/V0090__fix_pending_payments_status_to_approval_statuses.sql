UPDATE t_p61788166_html_to_frontend.payments
SET status = CASE (id % 3)
  WHEN 0 THEN 'pending_ib'
  WHEN 1 THEN 'pending_ceo'
  WHEN 2 THEN 'pending_cfo'
END
WHERE status = 'pending';
