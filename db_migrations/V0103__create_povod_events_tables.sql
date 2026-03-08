
CREATE TABLE povod_events (
    id SERIAL PRIMARY KEY,
    creator_id INT NOT NULL REFERENCES povod_users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    category VARCHAR(50) NOT NULL,
    place VARCHAR(300) NOT NULL,
    event_date TIMESTAMP NOT NULL,
    max_people INT DEFAULT 2,
    goal VARCHAR(20) DEFAULT 'friends',
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE povod_responses (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES povod_events(id),
    user_id INT NOT NULL REFERENCES povod_users(id),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

CREATE TABLE povod_participants (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES povod_events(id),
    user_id INT NOT NULL REFERENCES povod_users(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_povod_events_date ON povod_events(event_date);
CREATE INDEX idx_povod_events_creator ON povod_events(creator_id);
CREATE INDEX idx_povod_responses_event ON povod_responses(event_id);
CREATE INDEX idx_povod_responses_user ON povod_responses(user_id);
CREATE INDEX idx_povod_participants_event ON povod_participants(event_id);
