-- Обновляем АО "Юнико" -> 1Dedic
UPDATE t_p61788166_html_to_frontend.contractors
SET name = '1Dedic',
    notes = 'АО "Юнико". Сервера основной инфраструктуры: 1С, Битрикс, Удалённые рабочие столы и пр.',
    inn = '9731118967',
    kpp = '773101001',
    bank_name = 'АО "АЛЬФА-БАНК"',
    bank_bik = '044525593',
    correspondent_account = '30101810200000000593',
    bank_account = '40702810102540005785'
WHERE id = 1;

-- MANGO OFFICE
INSERT INTO t_p61788166_html_to_frontend.contractors
(name, notes, inn, kpp, bank_name, bank_bik, bank_account, correspondent_account, phone, email, legal_address)
VALUES (
    'MANGO OFFICE',
    'Резервная телефония КЦ. Тел: 8-800-555-55-22, 8(495)540-45-45',
    '7709501144', '772801001',
    'БАНК ВТБ (ПАО), Г. МОСКВА', '044525187', '40702810506800002283', '30101810700000000187',
    '8-800-555-55-22',
    'mango@mango.ru',
    'г. Москва, вн.тер.г. муниципальный округ Черемушки, ул Профсоюзная, д. 57, помещ. 1/П.'
);

-- iSpring
INSERT INTO t_p61788166_html_to_frontend.contractors
(name, notes, inn, kpp, bank_name, bank_bik, bank_account, correspondent_account, email, legal_address)
VALUES (
    'iSpring',
    'Система iSpring для Отдела обучения',
    '1215139170', '121501001',
    'Филиал Приволжский ПАО Банка ФК Открытие, г. Нижний Новгород', '042282881', '40702810404180003278', '30101810300000000881',
    'sales@ispring.ru',
    '424000, Республика Марий Эл, г. Йошкар-Ола, ул. Вознесенская, д. 110, офис 302'
);

-- SMS.RU
INSERT INTO t_p61788166_html_to_frontend.contractors
(name, notes, inn, kpp, bank_name, bank_bik, bank_account, correspondent_account)
VALUES (
    'SMS.RU',
    'Рассылки сообщений КЦ',
    '7713461582', '771301001',
    'АО "ТБАНК" г. Москва', '044525974', '40702810510000507921', '30101810145250000974'
);

-- Плюсофон
INSERT INTO t_p61788166_html_to_frontend.contractors
(name, notes, inn, kpp, bank_name, bank_bik, bank_account, correspondent_account, legal_address)
VALUES (
    'Плюсофон',
    'Виртуальные сим-карты',
    '7722823704', '772201001',
    'ООО "Банк Точка"', '044525104', '40702810701270002372', '30101810745374525104',
    'г. Москва, вн.тер.г. муниципальный округ Лефортово, пер. Юрьевский, д. 11, помещ. 2/4'
);

-- MyBI Connect
INSERT INTO t_p61788166_html_to_frontend.contractors
(name, notes, inn, kpp, bank_name, bank_bik, bank_account, correspondent_account, legal_address)
VALUES (
    'MyBI Connect',
    'Сервис для добавления поставщиков рекламных интеграций в аналитику',
    '7743218786', '774301001',
    'АО "ТИНЬКОФФ БАНК" г Москва', '044525974', '40702810010000174317', '30101810145250000974',
    '125239, г. Москва, ул. Коптевская, д. 18Б, кв. 2'
);
