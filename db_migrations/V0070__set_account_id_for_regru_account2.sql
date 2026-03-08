-- Set account_id for existing Reg.ru account2 service
UPDATE service_balances 
SET account_id = 'account2' 
WHERE service_name LIKE '%account2%' OR service_name LIKE '%Reg.ru%2%';