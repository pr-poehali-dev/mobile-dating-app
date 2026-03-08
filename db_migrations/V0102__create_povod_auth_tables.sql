
CREATE TABLE povod_users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100),
    birthday DATE,
    photo_url TEXT,
    interests TEXT[] DEFAULT '{}',
    goal VARCHAR(20) DEFAULT 'friends',
    about TEXT DEFAULT '',
    city VARCHAR(100) DEFAULT 'Москва',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE povod_sms_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    used BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0
);

CREATE TABLE povod_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES povod_users(id),
    token VARCHAR(128) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_povod_sms_phone ON povod_sms_codes(phone, created_at);
CREATE INDEX idx_povod_sessions_token ON povod_sessions(token);
CREATE INDEX idx_povod_users_phone ON povod_users(phone);
