"""API для уведомлений"""
import json
import os
from typing import Dict, Any
import jwt
import psycopg2
from psycopg2.extras import RealDictCursor

# Environment
SCHEMA = 't_p61788166_html_to_frontend'
DSN = os.environ['DATABASE_URL']

def response(status: int, body: Any) -> Dict[str, Any]:
    """Формирует HTTP ответ"""
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-Auth-Token, X-User-Id, X-Session-Id'
        },
        'body': json.dumps(body, ensure_ascii=False, default=str)
    }

def verify_token(event: Dict[str, Any], conn=None) -> tuple:
    """Проверяет JWT токен"""
    headers = event.get('headers', {})
    token = (headers.get('X-Auth-Token') or 
             headers.get('x-auth-token') or 
             headers.get('X-Authorization') or
             headers.get('x-authorization', ''))
    if token:
        token = token.replace('Bearer ', '').strip()
    
    if not token:
        return None, response(401, {'error': 'Unauthorized'})
    
    try:
        secret = os.environ.get('JWT_SECRET')
        if not secret:
            return None, response(500, {'error': 'Server configuration error'})
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, response(401, {'error': 'Token expired'})
    except jwt.InvalidTokenError:
        return None, response(401, {'error': 'Invalid token'})

def handler(event: dict, context) -> dict:
    """
    API для уведомлений.
    
    Endpoints:
    - GET /notifications - получить список уведомлений
    - PUT /notifications/{id}/read - отметить как прочитанное
    """
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    
    # CORS preflight
    if method == 'OPTIONS':
        return response(200, {})
    
    conn = psycopg2.connect(DSN)
    
    try:
        payload, error = verify_token(event, conn)
        if error:
            return error
        
        user_id = payload['user_id']
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            # Получить уведомления пользователя
            cur.execute(f"""
                SELECT id, user_id, type, title, message, is_read, created_at, data
                FROM {SCHEMA}.notifications
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 50
            """, (user_id,))
            
            notifications = [dict(row) for row in cur.fetchall()]
            cur.close()
            
            return response(200, {'notifications': notifications})
        
        elif method == 'PUT':
            # Отметить уведомление как прочитанное
            path_parts = path.rstrip('/').split('/')
            notification_id = None
            if len(path_parts) > 0 and path_parts[-2].isdigit():
                notification_id = int(path_parts[-2])
            
            if not notification_id:
                return response(400, {'error': 'ID уведомления не указан'})
            
            cur.execute(f"""
                UPDATE {SCHEMA}.notifications
                SET is_read = true
                WHERE id = %s AND user_id = %s
            """, (notification_id, user_id))
            
            if cur.rowcount == 0:
                cur.close()
                return response(404, {'error': 'Уведомление не найдено'})
            
            conn.commit()
            cur.close()
            
            return response(200, {'message': 'Уведомление прочитано'})
        
        return response(405, {'error': 'Method not allowed'})
    
    finally:
        conn.close()