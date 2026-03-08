CREATE TABLE IF NOT EXISTS service_balances (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
    status VARCHAR(20) NOT NULL DEFAULT 'ok',
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    api_endpoint TEXT,
    api_key_secret_name VARCHAR(255),
    threshold_warning DECIMAL(15, 2),
    threshold_critical DECIMAL(15, 2),
    auto_refresh BOOLEAN DEFAULT false,
    refresh_interval_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_balances_status ON service_balances(status);
CREATE INDEX IF NOT EXISTS idx_service_balances_service_name ON service_balances(service_name);

COMMENT ON TABLE service_balances IS 'Мониторинг балансов внешних сервисов';
COMMENT ON COLUMN service_balances.service_name IS 'Название сервиса (Яндекс.Директ, VK Реклама и т.д.)';
COMMENT ON COLUMN service_balances.status IS 'Статус баланса: ok, warning, critical';
COMMENT ON COLUMN service_balances.api_endpoint IS 'URL API для получения баланса';
COMMENT ON COLUMN service_balances.api_key_secret_name IS 'Имя секрета с API ключом';
COMMENT ON COLUMN service_balances.threshold_warning IS 'Порог предупреждения';
COMMENT ON COLUMN service_balances.threshold_critical IS 'Критический порог';
COMMENT ON COLUMN service_balances.auto_refresh IS 'Автоматическое обновление баланса';
COMMENT ON COLUMN service_balances.refresh_interval_minutes IS 'Интервал обновления в минутах';
