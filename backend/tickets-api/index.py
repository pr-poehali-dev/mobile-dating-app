import json
import os
import sys
import jwt
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, Optional
from datetime import datetime
from zoneinfo import ZoneInfo

SCHEMA = 't_p61788166_html_to_frontend'

def log(msg):
    print(msg, file=sys.stderr, flush=True)

def response(status_code: int, data: Any) -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data, ensure_ascii=False, default=str),
        'isBase64Encoded': False
    }

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise ValueError('DATABASE_URL not set')
    return psycopg2.connect(dsn)

def verify_token(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    headers = event.get('headers', {})
    token = (headers.get('X-Auth-Token') or headers.get('x-auth-token') or
             headers.get('X-Authorization') or headers.get('x-authorization', ''))
    token = token.replace('Bearer ', '').strip()
    
    if not token:
        return None
    
    try:
        secret = os.environ.get('JWT_SECRET')
        if not secret:
            return None
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def safe_date_format(date_value):
    if not date_value:
        return None
    try:
        if hasattr(date_value, 'year') and (date_value.year < 1900 or date_value.year > 2100):
            return None
        return date_value.isoformat()
    except:
        return None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для управления заявками (тикетами), комментариями и истории изменений.
    '''
    method = event.get('httpMethod', 'GET')
    endpoint = event.get('queryStringParameters', {}).get('endpoint', 'tickets')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-Auth-Token, X-User-Id, X-Session-Id',
                'Access-Control-Allow-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
    except Exception as e:
        return response(500, {'error': f'Database connection failed: {str(e)}'})
    
    try:
        payload = verify_token(event)
        if not payload:
            conn.close()
            return response(401, {'error': 'Unauthorized'})
        
        user_id = payload['user_id']
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Tickets endpoint
        if endpoint == 'tickets' or endpoint == 'tickets-api':
            if method == 'GET':
                query_params = event.get('queryStringParameters', {})
                search = query_params.get('search', '')
                
                query = f"""
                    SELECT 
                        t.id, t.title, t.description, t.due_date,
                        t.category_id, c.name as category_name, c.icon as category_icon,
                        t.priority_id, p.name as priority_name, p.level as priority_level, p.color as priority_color,
                        t.status_id, s.name as status_name, s.color as status_color,
                        t.department_id, d.name as department_name,
                        t.created_by, u.username as creator_name, u.email as creator_email,
                        t.assigned_to, ua.username as assignee_name, ua.email as assignee_email,
                        t.created_at, t.updated_at,
                        t.has_response,
                        COALESCE((
                            SELECT COUNT(*) 
                            FROM {SCHEMA}.ticket_comments tc 
                            WHERE tc.ticket_id = t.id 
                            AND tc.is_read = FALSE 
                            AND tc.user_id != %s
                        ), 0) as unread_comments
                    FROM {SCHEMA}.tickets t
                    LEFT JOIN {SCHEMA}.ticket_categories c ON t.category_id = c.id
                    LEFT JOIN {SCHEMA}.ticket_priorities p ON t.priority_id = p.id
                    LEFT JOIN {SCHEMA}.ticket_statuses s ON t.status_id = s.id
                    LEFT JOIN {SCHEMA}.departments d ON t.department_id = d.id
                    LEFT JOIN {SCHEMA}.users u ON t.created_by = u.id
                    LEFT JOIN {SCHEMA}.users ua ON t.assigned_to = ua.id
                    WHERE 1=1
                """
                
                params = [user_id]
                if search:
                    query += " AND (t.title ILIKE %s OR t.description ILIKE %s OR c.name ILIKE %s)"
                    search_pattern = f'%{search}%'
                    params.extend([search_pattern, search_pattern, search_pattern])
                
                query += " ORDER BY t.created_at DESC"
                
                cur.execute(query, params)
                tickets = []
                for row in cur.fetchall():
                    tickets.append({
                        'id': row['id'],
                        'title': row['title'],
                        'description': row['description'],
                        'due_date': safe_date_format(row['due_date']),
                        'category_id': row['category_id'],
                        'category_name': row['category_name'],
                        'category_icon': row['category_icon'],
                        'priority_id': row['priority_id'],
                        'priority_name': row['priority_name'],
                        'priority_color': row['priority_color'],
                        'status_id': row['status_id'],
                        'status_name': row['status_name'],
                        'status_color': row['status_color'],
                        'department_id': row['department_id'],
                        'department_name': row['department_name'],
                        'created_by': row['created_by'],
                        'creator_name': row['creator_name'],
                        'creator_email': row['creator_email'],
                        'assigned_to': row['assigned_to'],
                        'assignee_name': row['assignee_name'],
                        'assignee_email': row['assignee_email'],
                        'created_at': safe_date_format(row['created_at']),
                        'updated_at': safe_date_format(row['updated_at']),
                        'unread_comments': row['unread_comments']
                    })
                
                cur.close()
                conn.close()
                return response(200, {'tickets': tickets})
            
            elif method == 'POST':
                data = json.loads(event.get('body', '{}'))
                
                title = data.get('title')
                description = data.get('description')
                category_id = data.get('category_id')
                priority_id = data.get('priority_id')
                department_id = data.get('department_id')
                due_date = data.get('due_date')
                
                if not title or not description:
                    cur.close()
                    conn.close()
                    return response(400, {'error': 'Название и описание обязательны'})
                
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.tickets (title, description, category_id, priority_id, department_id, due_date, created_by, status_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 1)
                    RETURNING id
                """, (title, description, category_id, priority_id, department_id, due_date, user_id))
                
                ticket_id = cur.fetchone()['id']
                conn.commit()
                
                cur.execute(f"SELECT username FROM {SCHEMA}.users WHERE id = %s", (user_id,))
                username = cur.fetchone()['username']
                
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.audit_logs 
                    (entity_type, entity_id, action, user_id, username, new_values)
                    VALUES ('ticket', %s, 'created', %s, %s, %s::jsonb)
                """, (ticket_id, user_id, username, json.dumps({'title': title, 'description': description})))
                conn.commit()
                
                cur.close()
                conn.close()
                return response(201, {'id': ticket_id, 'message': 'Заявка создана'})
            
            elif method == 'PUT':
                data = json.loads(event.get('body', '{}'))
                ticket_id = data.get('ticket_id')
                
                if not ticket_id:
                    cur.close()
                    conn.close()
                    return response(400, {'error': 'ID заявки не указан'})
                
                updates = []
                params = []
                
                if 'title' in data:
                    updates.append('title = %s')
                    params.append(data['title'])
                if 'description' in data:
                    updates.append('description = %s')
                    params.append(data['description'])
                if 'status_id' in data:
                    updates.append('status_id = %s')
                    params.append(data['status_id'])
                if 'assigned_to' in data:
                    updates.append('assigned_to = %s')
                    params.append(data['assigned_to'])
                if 'priority_id' in data:
                    updates.append('priority_id = %s')
                    params.append(data['priority_id'])
                if 'category_id' in data:
                    updates.append('category_id = %s')
                    params.append(data['category_id'])
                if 'department_id' in data:
                    updates.append('department_id = %s')
                    params.append(data['department_id'])
                if 'due_date' in data:
                    updates.append('due_date = %s')
                    params.append(data['due_date'])
                
                if updates:
                    moscow_tz = ZoneInfo('Europe/Moscow')
                    now_moscow = datetime.now(moscow_tz).replace(tzinfo=None)
                    params.append(now_moscow)
                    params.append(ticket_id)
                    cur.execute(f"""
                        UPDATE {SCHEMA}.tickets 
                        SET {', '.join(updates)}, updated_at = %s
                        WHERE id = %s
                    """, params)
                    conn.commit()
                
                cur.close()
                conn.close()
                return response(200, {'message': 'Заявка обновлена'})
        
        # Dictionaries endpoint
        elif endpoint == 'ticket-dictionaries-api':
            cur.execute(f"SELECT id, name, icon FROM {SCHEMA}.ticket_categories ORDER BY name")
            categories = [dict(row) for row in cur.fetchall()]
            
            cur.execute(f"SELECT id, name, level, color FROM {SCHEMA}.ticket_priorities ORDER BY level")
            priorities = [dict(row) for row in cur.fetchall()]
            
            cur.execute(f"SELECT id, name, color FROM {SCHEMA}.ticket_statuses ORDER BY id")
            statuses = [dict(row) for row in cur.fetchall()]
            
            cur.execute(f"SELECT id, name, description FROM {SCHEMA}.departments ORDER BY name")
            departments = [dict(row) for row in cur.fetchall()]
            
            cur.close()
            conn.close()
            return response(200, {
                'categories': categories,
                'priorities': priorities,
                'statuses': statuses,
                'departments': departments,
                'custom_fields': []
            })
        
        # Comments endpoint
        elif endpoint == 'ticket-comments-api':
            if method == 'GET':
                ticket_id = event.get('queryStringParameters', {}).get('ticket_id')
                if not ticket_id:
                    cur.close()
                    conn.close()
                    return response(400, {'error': 'ticket_id required'})
                
                cur.execute(f"""
                    SELECT 
                        tc.id, tc.comment, tc.user_id, tc.created_at, tc.parent_id, tc.is_read,
                        u.username, u.email, u.full_name,
                        COALESCE(json_agg(
                            json_build_object('url', tca.file_url, 'file_name', tca.file_name)
                        ) FILTER (WHERE tca.id IS NOT NULL), '[]') as attachments
                    FROM {SCHEMA}.ticket_comments tc
                    JOIN {SCHEMA}.users u ON tc.user_id = u.id
                    LEFT JOIN {SCHEMA}.ticket_comment_attachments tca ON tca.comment_id = tc.id
                    WHERE tc.ticket_id = %s
                    GROUP BY tc.id, u.id
                    ORDER BY tc.created_at ASC
                """, (ticket_id,))
                
                comments = [dict(row) for row in cur.fetchall()]
                
                for comment in comments:
                    if comment.get('created_at'):
                        comment['created_at'] = comment['created_at'].isoformat()
                
                cur.execute(f"""
                    UPDATE {SCHEMA}.ticket_comments 
                    SET is_read = TRUE 
                    WHERE ticket_id = %s AND user_id != %s
                """, (ticket_id, user_id))
                conn.commit()
                
                cur.close()
                conn.close()
                return response(200, {'comments': comments})
            
            elif method == 'POST':
                data = json.loads(event.get('body', '{}'))
                ticket_id = data.get('ticket_id')
                comment = data.get('comment')
                parent_id = data.get('parent_id')
                
                if not ticket_id or not comment:
                    cur.close()
                    conn.close()
                    return response(400, {'error': 'ticket_id and comment required'})
                
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.ticket_comments (ticket_id, user_id, comment, parent_id)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                """, (ticket_id, user_id, comment, parent_id))
                
                comment_id = cur.fetchone()['id']
                conn.commit()
                
                cur.close()
                conn.close()
                return response(201, {'id': comment_id, 'message': 'Комментарий добавлен'})
        
        # History endpoint
        elif endpoint == 'ticket-history':
            ticket_id = event.get('queryStringParameters', {}).get('ticket_id')
            if not ticket_id:
                cur.close()
                conn.close()
                return response(400, {'error': 'ticket_id required'})
            
            cur.execute(f"""
                SELECT id, action, username, old_values, new_values, created_at
                FROM {SCHEMA}.audit_logs
                WHERE entity_type = 'ticket' AND entity_id = %s
                ORDER BY created_at DESC
            """, (ticket_id,))
            
            history = []
            for row in cur.fetchall():
                history.append({
                    'id': row['id'],
                    'action': row['action'],
                    'username': row['username'],
                    'old_values': row['old_values'],
                    'new_values': row['new_values'],
                    'created_at': safe_date_format(row['created_at'])
                })
            
            cur.close()
            conn.close()
            return response(200, {'history': history})
        
        cur.close()
        conn.close()
        return response(404, {'error': f'Endpoint not found: {endpoint}'})
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        log(f"Error: {str(e)}")
        log(f"Traceback: {error_details}")
        if conn:
            conn.close()
        return response(500, {'error': str(e), 'details': error_details})