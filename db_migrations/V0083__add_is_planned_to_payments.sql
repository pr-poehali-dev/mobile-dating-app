-- Add is_planned column to payments table
ALTER TABLE t_p61788166_html_to_frontend.payments 
ADD COLUMN is_planned BOOLEAN DEFAULT FALSE;