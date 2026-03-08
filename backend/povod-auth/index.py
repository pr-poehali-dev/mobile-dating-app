"""API авторизации приложения Повод: отправка SMS-кода, верификация, управление профилем"""
import json
import os
import random
import string
import hashlib
import time
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def response(status, body):
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }

def generate_code():
    return ''.join(random.choices(string.digits, k=6))

def generate_token():
    raw = f"{time.time()}-{random.random()}-{os.urandom(32).hex()}"
    return hashlib.sha256(raw.encode()).hexdigest()

def normalize_phone(phone):
    digits = ''.join(c for c in phone if c.isdigit())
    if digits.startswith('8') and len(digits) == 11:
        digits = '7' + digits[1:]
    if not digits.startswith('7'):
        digits = '7' + digits
    if len(digits) != 11:
        return None
    return '+' + digits

def get_user_by_token(conn, token):
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.phone, u.name, u.birthday, u.photo_url, u.interests, u.goal, u.about, u.city "
        "FROM povod_sessions s JOIN povod_users u ON s.user_id = u.id "
        "WHERE s.token = '%s' AND s.is_active = TRUE AND s.expires_at > NOW() AND u.is_active = TRUE"
        % token.replace("'", "''")
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        return None
    return {
        'id': row[0], 'phone': row[1], 'name': row[2],
        'birthday': row[3], 'photo_url': row[4],
        'interests': row[5] or [], 'goal': row[6],
        'about': row[7], 'city': row[8],
    }

def handle_send_code(body, conn):
    phone = normalize_phone(body.get('phone', ''))
    if not phone:
        return response(400, {'error': 'Неверный формат телефона'})

    cur = conn.cursor()
    cur.execute(
        "SELECT COUNT(*) FROM povod_sms_codes WHERE phone = '%s' AND created_at > NOW() - INTERVAL '1 minute'"
        % phone.replace("'", "''")
    )
    recent = cur.fetchone()[0]
    if recent >= 3:
        cur.close()
        return response(429, {'error': 'Слишком много попыток, подождите минуту'})

    code = generate_code()
    cur.execute(
        "INSERT INTO povod_sms_codes (phone, code) VALUES ('%s', '%s')"
        % (phone.replace("'", "''"), code)
    )
    conn.commit()
    cur.close()

    # TODO: интеграция с SMS-провайдером. Пока код возвращаем в ответе для тестирования
    return response(200, {'ok': True, 'phone': phone, 'debug_code': code})

def handle_verify_code(body, conn):
    phone = normalize_phone(body.get('phone', ''))
    code = str(body.get('code', '')).strip()
    if not phone or len(code) != 6:
        return response(400, {'error': 'Неверный телефон или код'})

    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM povod_sms_codes WHERE phone = '%s' AND code = '%s' AND used = FALSE "
        "AND created_at > NOW() - INTERVAL '10 minutes' AND attempts < 5 ORDER BY created_at DESC LIMIT 1"
        % (phone.replace("'", "''"), code.replace("'", "''"))
    )
    sms_row = cur.fetchone()

    if not sms_row:
        cur.execute(
            "UPDATE povod_sms_codes SET attempts = attempts + 1 WHERE phone = '%s' "
            "AND used = FALSE AND created_at > NOW() - INTERVAL '10 minutes'"
            % phone.replace("'", "''")
        )
        conn.commit()
        cur.close()
        return response(400, {'error': 'Неверный код'})

    cur.execute("UPDATE povod_sms_codes SET used = TRUE WHERE id = %d" % sms_row[0])

    cur.execute(
        "SELECT id, name FROM povod_users WHERE phone = '%s' AND is_active = TRUE"
        % phone.replace("'", "''")
    )
    user_row = cur.fetchone()
    is_new = user_row is None

    if is_new:
        cur.execute(
            "INSERT INTO povod_users (phone) VALUES ('%s') RETURNING id"
            % phone.replace("'", "''")
        )
        user_id = cur.fetchone()[0]
    else:
        user_id = user_row[0]

    token = generate_token()
    cur.execute(
        "INSERT INTO povod_sessions (user_id, token) VALUES (%d, '%s')"
        % (user_id, token)
    )
    conn.commit()

    has_profile = not is_new and user_row[1] is not None and len(str(user_row[1]).strip()) > 0

    cur.close()
    return response(200, {
        'ok': True,
        'token': token,
        'is_new': is_new,
        'has_profile': has_profile,
        'user_id': user_id,
    })

def handle_update_profile(body, conn, token):
    user = get_user_by_token(conn, token)
    if not user:
        return response(401, {'error': 'Не авторизован'})

    name = str(body.get('name', '')).strip()
    birthday = str(body.get('birthday', '')).strip()
    interests = body.get('interests', [])
    goal = str(body.get('goal', 'friends')).strip()
    about = str(body.get('about', '')).strip()
    city = str(body.get('city', 'Москва')).strip()

    if not name:
        return response(400, {'error': 'Имя обязательно'})
    if not birthday:
        return response(400, {'error': 'Дата рождения обязательна'})
    if not interests or len(interests) == 0:
        return response(400, {'error': 'Выберите хотя бы один интерес'})

    interests_pg = '{' + ','.join('"' + i.replace('"', '\\"') + '"' for i in interests) + '}'

    cur = conn.cursor()
    cur.execute(
        "UPDATE povod_users SET name = '%s', birthday = '%s', interests = '%s', "
        "goal = '%s', about = '%s', city = '%s', updated_at = NOW() WHERE id = %d"
        % (
            name.replace("'", "''"),
            birthday.replace("'", "''"),
            interests_pg.replace("'", "''"),
            goal.replace("'", "''"),
            about.replace("'", "''"),
            city.replace("'", "''"),
            user['id'],
        )
    )
    conn.commit()
    cur.close()
    return response(200, {'ok': True})

def handle_get_profile(conn, token):
    user = get_user_by_token(conn, token)
    if not user:
        return response(401, {'error': 'Не авторизован'})
    return response(200, user)

def handle_logout(conn, token):
    if token:
        cur = conn.cursor()
        cur.execute(
            "UPDATE povod_sessions SET is_active = FALSE WHERE token = '%s'"
            % token.replace("'", "''")
        )
        conn.commit()
        cur.close()
    return response(200, {'ok': True})

def handler(event, context):
    """API авторизации Повод: отправка кода, верификация, профиль"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = event.get('headers', {})
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except:
            pass

    conn = get_db()
    try:
        if method == 'POST' and path == '/send-code':
            return handle_send_code(body, conn)
        elif method == 'POST' and path == '/verify-code':
            return handle_verify_code(body, conn)
        elif method == 'PUT' and path == '/profile':
            return handle_update_profile(body, conn, token)
        elif method == 'GET' and path == '/profile':
            return handle_get_profile(conn, token)
        elif method == 'POST' and path == '/logout':
            return handle_logout(conn, token)
        elif method == 'GET' and path == '/':
            return response(200, {'service': 'povod-auth', 'status': 'ok'})
        else:
            return response(404, {'error': 'Маршрут не найден'})
    finally:
        conn.close()
