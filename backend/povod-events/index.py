"""API событий приложения Повод: создание, лента, отклики, управление заявками"""
import json
import os
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

def calc_age(birthday):
    if not birthday:
        return None
    from datetime import date
    today = date.today()
    return today.year - birthday.year - ((today.month, today.day) < (birthday.month, birthday.day))

def handle_create_event(body, conn, user):
    title = str(body.get('title', '')).strip()
    description = str(body.get('description', '')).strip()
    category = str(body.get('category', '')).strip()
    place = str(body.get('place', '')).strip()
    event_date = str(body.get('event_date', '')).strip()
    max_people = int(body.get('max_people', 2))
    goal = str(body.get('goal', 'friends')).strip()
    photo_url = str(body.get('photo_url', '')).strip() or None

    if not title:
        return response(400, {'error': 'Введите название события'})
    if not category:
        return response(400, {'error': 'Выберите категорию'})
    if not place:
        return response(400, {'error': 'Укажите место'})
    if not event_date:
        return response(400, {'error': 'Укажите дату и время'})

    cur = conn.cursor()
    photo_val = "NULL" if not photo_url else "'%s'" % photo_url.replace("'", "''")
    cur.execute(
        "INSERT INTO povod_events (creator_id, title, description, category, place, event_date, max_people, goal, photo_url) "
        "VALUES (%d, '%s', '%s', '%s', '%s', '%s', %d, '%s', %s) RETURNING id"
        % (
            user['id'],
            title.replace("'", "''"),
            description.replace("'", "''"),
            category.replace("'", "''"),
            place.replace("'", "''"),
            event_date.replace("'", "''"),
            max_people,
            goal.replace("'", "''"),
            photo_val,
        )
    )
    event_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    return response(201, {'ok': True, 'event_id': event_id})

def handle_get_feed(conn, user):
    cur = conn.cursor()
    cur.execute(
        "SELECT e.id, e.title, e.description, e.category, e.place, e.event_date, "
        "e.max_people, e.goal, e.photo_url, e.created_at, "
        "u.id, u.name, u.birthday, u.photo_url, "
        "(SELECT COUNT(*) FROM povod_participants p WHERE p.event_id = e.id) as joined_count "
        "FROM povod_events e "
        "JOIN povod_users u ON e.creator_id = u.id "
        "WHERE e.is_active = TRUE AND e.event_date > NOW() "
        "ORDER BY e.event_date ASC "
        "LIMIT 50"
    )
    rows = cur.fetchall()

    my_responses = set()
    if user:
        cur.execute(
            "SELECT event_id, status FROM povod_responses WHERE user_id = %d" % user['id']
        )
        for r in cur.fetchall():
            my_responses.add((r[0], r[1]))

    events = []
    for r in rows:
        event_id = r[0]
        creator_age = calc_age(r[12])
        my_status = None
        for eid, st in my_responses:
            if eid == event_id:
                my_status = st
                break

        cur2 = conn.cursor()
        cur2.execute(
            "SELECT u.name, u.photo_url FROM povod_participants p "
            "JOIN povod_users u ON p.user_id = u.id WHERE p.event_id = %d LIMIT 10" % event_id
        )
        participants = [{'name': pr[0], 'photo_url': pr[1]} for pr in cur2.fetchall()]
        cur2.close()

        events.append({
            'id': event_id,
            'title': r[1],
            'description': r[2],
            'category': r[3],
            'place': r[4],
            'event_date': r[5],
            'max_people': r[6],
            'goal': r[7],
            'photo_url': r[8],
            'created_at': r[9],
            'creator': {
                'id': r[10],
                'name': r[11],
                'age': creator_age,
                'photo_url': r[13],
            },
            'joined': r[14],
            'participants': participants,
            'my_status': my_status,
            'is_mine': user and r[10] == user['id'],
        })
    cur.close()
    return response(200, {'events': events})

def handle_get_event(event_id, conn, user):
    cur = conn.cursor()
    cur.execute(
        "SELECT e.id, e.title, e.description, e.category, e.place, e.event_date, "
        "e.max_people, e.goal, e.photo_url, e.created_at, "
        "u.id, u.name, u.birthday, u.photo_url, u.about, u.interests, u.goal "
        "FROM povod_events e JOIN povod_users u ON e.creator_id = u.id "
        "WHERE e.id = %d AND e.is_active = TRUE" % event_id
    )
    r = cur.fetchone()
    if not r:
        cur.close()
        return response(404, {'error': 'Событие не найдено'})

    cur.execute(
        "SELECT u.id, u.name, u.photo_url, u.birthday FROM povod_participants p "
        "JOIN povod_users u ON p.user_id = u.id WHERE p.event_id = %d" % event_id
    )
    participants = [{'id': pr[0], 'name': pr[1], 'photo_url': pr[2], 'age': calc_age(pr[3])} for pr in cur.fetchall()]

    my_status = None
    if user:
        cur.execute(
            "SELECT status FROM povod_responses WHERE event_id = %d AND user_id = %d"
            % (event_id, user['id'])
        )
        sr = cur.fetchone()
        if sr:
            my_status = sr[0]

    joined_count = len(participants)
    creator_age = calc_age(r[12])
    cur.close()

    return response(200, {
        'id': r[0], 'title': r[1], 'description': r[2],
        'category': r[3], 'place': r[4], 'event_date': r[5],
        'max_people': r[6], 'goal': r[7], 'photo_url': r[8],
        'created_at': r[9],
        'creator': {
            'id': r[10], 'name': r[11], 'age': creator_age,
            'photo_url': r[13], 'about': r[14],
            'interests': r[15] or [], 'goal': r[16],
        },
        'joined': joined_count,
        'participants': participants,
        'my_status': my_status,
        'is_mine': user and r[10] == user['id'],
    })

def handle_respond(event_id, body, conn, user):
    message = str(body.get('message', '')).strip()
    if not message:
        return response(400, {'error': 'Напишите сообщение организатору'})

    cur = conn.cursor()
    cur.execute("SELECT creator_id, max_people FROM povod_events WHERE id = %d AND is_active = TRUE" % event_id)
    ev = cur.fetchone()
    if not ev:
        cur.close()
        return response(404, {'error': 'Событие не найдено'})
    if ev[0] == user['id']:
        cur.close()
        return response(400, {'error': 'Нельзя откликнуться на своё событие'})

    cur.execute(
        "SELECT id, status FROM povod_responses WHERE event_id = %d AND user_id = %d" % (event_id, user['id'])
    )
    existing = cur.fetchone()
    if existing:
        if existing[1] == 'pending':
            cur.close()
            return response(400, {'error': 'Вы уже откликнулись'})
        if existing[1] == 'accepted':
            cur.close()
            return response(400, {'error': 'Вы уже участвуете'})
        cur.execute(
            "UPDATE povod_responses SET message = '%s', status = 'pending', created_at = NOW() WHERE id = %d"
            % (message.replace("'", "''"), existing[0])
        )
    else:
        cur.execute(
            "INSERT INTO povod_responses (event_id, user_id, message) VALUES (%d, %d, '%s')"
            % (event_id, user['id'], message.replace("'", "''"))
        )
    conn.commit()
    cur.close()
    return response(200, {'ok': True})

def handle_cancel_response(event_id, conn, user):
    cur = conn.cursor()
    cur.execute(
        "UPDATE povod_responses SET status = 'cancelled' WHERE event_id = %d AND user_id = %d AND status = 'pending'"
        % (event_id, user['id'])
    )
    conn.commit()
    cur.close()
    return response(200, {'ok': True})

def handle_get_my_events(conn, user):
    cur = conn.cursor()
    cur.execute(
        "SELECT e.id, e.title, e.category, e.place, e.event_date, e.max_people, e.goal, e.photo_url, "
        "(SELECT COUNT(*) FROM povod_participants p WHERE p.event_id = e.id) as joined, "
        "(SELECT COUNT(*) FROM povod_responses r WHERE r.event_id = e.id AND r.status = 'pending') as pending_responses "
        "FROM povod_events e WHERE e.creator_id = %d AND e.is_active = TRUE "
        "ORDER BY e.event_date ASC" % user['id']
    )
    events = []
    for r in cur.fetchall():
        events.append({
            'id': r[0], 'title': r[1], 'category': r[2], 'place': r[3],
            'event_date': r[4], 'max_people': r[5], 'goal': r[6], 'photo_url': r[7],
            'joined': r[8], 'pending_responses': r[9],
        })
    cur.close()
    return response(200, {'events': events})

def handle_get_participating(conn, user):
    cur = conn.cursor()
    cur.execute(
        "SELECT e.id, e.title, e.category, e.place, e.event_date, e.max_people, e.goal, e.photo_url, "
        "u.name as creator_name, "
        "(SELECT COUNT(*) FROM povod_participants p2 WHERE p2.event_id = e.id) as joined "
        "FROM povod_participants p JOIN povod_events e ON p.event_id = e.id "
        "JOIN povod_users u ON e.creator_id = u.id "
        "WHERE p.user_id = %d AND e.is_active = TRUE "
        "ORDER BY e.event_date ASC" % user['id']
    )
    events = []
    for r in cur.fetchall():
        events.append({
            'id': r[0], 'title': r[1], 'category': r[2], 'place': r[3],
            'event_date': r[4], 'max_people': r[5], 'goal': r[6], 'photo_url': r[7],
            'creator_name': r[8], 'joined': r[9],
        })
    cur.close()
    return response(200, {'events': events})

def handle_get_responses(event_id, conn, user):
    cur = conn.cursor()
    cur.execute("SELECT creator_id FROM povod_events WHERE id = %d" % event_id)
    ev = cur.fetchone()
    if not ev or ev[0] != user['id']:
        cur.close()
        return response(403, {'error': 'Только организатор может просматривать заявки'})

    cur.execute(
        "SELECT r.id, r.message, r.status, r.created_at, "
        "u.id, u.name, u.birthday, u.photo_url, u.interests, u.about "
        "FROM povod_responses r JOIN povod_users u ON r.user_id = u.id "
        "WHERE r.event_id = %d AND r.status = 'pending' ORDER BY r.created_at ASC" % event_id
    )
    responses = []
    for r in cur.fetchall():
        responses.append({
            'id': r[0], 'message': r[1], 'status': r[2], 'created_at': r[3],
            'user': {
                'id': r[4], 'name': r[5], 'age': calc_age(r[6]),
                'photo_url': r[7], 'interests': r[8] or [], 'about': r[9],
            },
        })
    cur.close()
    return response(200, {'responses': responses})

def handle_accept_response(response_id, conn, user):
    cur = conn.cursor()
    cur.execute(
        "SELECT r.event_id, r.user_id, e.creator_id, e.max_people "
        "FROM povod_responses r JOIN povod_events e ON r.event_id = e.id "
        "WHERE r.id = %d AND r.status = 'pending'" % response_id
    )
    row = cur.fetchone()
    if not row:
        cur.close()
        return response(404, {'error': 'Заявка не найдена'})
    if row[2] != user['id']:
        cur.close()
        return response(403, {'error': 'Только организатор может принимать заявки'})

    event_id, applicant_id, _, max_people = row

    cur.execute("SELECT COUNT(*) FROM povod_participants WHERE event_id = %d" % event_id)
    current = cur.fetchone()[0]
    if current >= max_people:
        cur.close()
        return response(400, {'error': 'Достигнут лимит участников'})

    cur.execute("UPDATE povod_responses SET status = 'accepted' WHERE id = %d" % response_id)
    cur.execute(
        "INSERT INTO povod_participants (event_id, user_id) VALUES (%d, %d) ON CONFLICT DO NOTHING"
        % (event_id, applicant_id)
    )
    conn.commit()
    cur.close()
    return response(200, {'ok': True})

def handle_reject_response(response_id, conn, user):
    cur = conn.cursor()
    cur.execute(
        "SELECT r.event_id, e.creator_id FROM povod_responses r "
        "JOIN povod_events e ON r.event_id = e.id WHERE r.id = %d" % response_id
    )
    row = cur.fetchone()
    if not row:
        cur.close()
        return response(404, {'error': 'Заявка не найдена'})
    if row[1] != user['id']:
        cur.close()
        return response(403, {'error': 'Только организатор может отклонять заявки'})

    cur.execute("UPDATE povod_responses SET status = 'rejected' WHERE id = %d" % response_id)
    conn.commit()
    cur.close()
    return response(200, {'ok': True})

def handler(event, context):
    """API событий Повод: лента, создание, отклики, управление заявками"""
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
        user = get_user_by_token(conn, token)

        if method == 'GET' and path == '/':
            return response(200, {'service': 'povod-events', 'status': 'ok'})

        if method == 'GET' and path == '/feed':
            return handle_get_feed(conn, user)

        if not user:
            return response(401, {'error': 'Не авторизован'})

        if method == 'POST' and path == '/create':
            return handle_create_event(body, conn, user)

        if method == 'GET' and path == '/my':
            return handle_get_my_events(conn, user)

        if method == 'GET' and path == '/participating':
            return handle_get_participating(conn, user)

        if path.startswith('/event/'):
            parts = path.split('/')
            if len(parts) >= 3:
                event_id = int(parts[2])

                if method == 'GET' and len(parts) == 3:
                    return handle_get_event(event_id, conn, user)

                if method == 'POST' and len(parts) == 4 and parts[3] == 'respond':
                    return handle_respond(event_id, body, conn, user)

                if method == 'DELETE' and len(parts) == 4 and parts[3] == 'respond':
                    return handle_cancel_response(event_id, conn, user)

                if method == 'GET' and len(parts) == 4 and parts[3] == 'responses':
                    return handle_get_responses(event_id, conn, user)

        if path.startswith('/response/'):
            parts = path.split('/')
            if len(parts) >= 3:
                resp_id = int(parts[2])
                if method == 'POST' and len(parts) == 4 and parts[3] == 'accept':
                    return handle_accept_response(resp_id, conn, user)
                if method == 'POST' and len(parts) == 4 and parts[3] == 'reject':
                    return handle_reject_response(resp_id, conn, user)

        return response(404, {'error': 'Маршрут не найден'})
    finally:
        conn.close()
