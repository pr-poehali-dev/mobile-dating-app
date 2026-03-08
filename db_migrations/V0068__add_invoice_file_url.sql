-- Добавление поля для хранения файла счёта в таблицу payments
ALTER TABLE payments 
ADD COLUMN invoice_file_url TEXT;