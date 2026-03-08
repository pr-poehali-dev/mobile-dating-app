CREATE TABLE IF NOT EXISTS t_p61788166_html_to_frontend.payment_views (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(payment_id, user_id)
);