import json
import os
import sys
import jwt
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

SCHEMA = 't_p61788166_html_to_frontend'

def log(msg):
    print(msg, file=sys.stderr, flush=True)

class CategoryRequest(BaseModel):
    name: str = Field(..., min_length=1)
    icon: str = Field(default='Tag')

def response(status_code: int, body: Any) -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-Auth-Token, X-User-Id, X-Session-Id'
        },
        'body': json.dumps(body, ensure_ascii=False, default=str)
    }

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL not found')
    return psycopg2.connect(dsn)

def verify_token_and_permission(event: Dict[str, Any], conn, required_permission: str):
    token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
    if not token:
        return None, response(401, {'error': 'Требуется авторизация'})
    
    secret = os.environ.get('JWT_SECRET')
    if not secret:
        return None, response(500, {'error': 'Server configuration error'})
    
    try:
        payload = jwt.decode(token, secret, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None, response(401, {'error': 'Токен истек'})
    except jwt.InvalidTokenError:
        return None, response(401, {'error': 'Недействительный токен'})
    
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT r.name
        FROM {SCHEMA}.roles r
        JOIN {SCHEMA}.user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = %s
    """, (payload['user_id'],))
    
    roles = [row['name'] for row in cur.fetchall()]
    
    if 'Администратор' in roles or 'Admin' in roles:
        cur.close()
        return payload, None
    
    cur.execute(f"""
        SELECT DISTINCT p.name
        FROM {SCHEMA}.permissions p
        JOIN {SCHEMA}.role_permissions rp ON p.id = rp.permission_id
        JOIN {SCHEMA}.user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = %s
    """, (payload['user_id'],))
    
    permissions = [row['name'] for row in cur.fetchall()]
    cur.close()
    
    if required_permission not in permissions:
        return None, response(403, {'error': 'Недостаточно прав'})
    
    return payload, None

def handler(event: dict, context) -> dict:
    '''API для управления категориями платежей'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return response(200, {})
    
    try:
        conn = get_db_connection()
        
        if method == 'GET':
            payload, auth_error = verify_token_and_permission(event, conn, 'categories:read')
            if auth_error:
                conn.close()
                return auth_error
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(f"""
                SELECT id, name, icon, created_at
                FROM {SCHEMA}.categories
                ORDER BY name
            """)
            categories = [dict(row) for row in cur.fetchall()]
            cur.close()
            conn.close()
            return response(200, {'categories': categories})
        
        elif method == 'POST':
            payload, auth_error = verify_token_and_permission(event, conn, 'categories:create')
            if auth_error:
                conn.close()
                return auth_error
            
            try:
                body = json.loads(event.get('body', '{}'))
                validated = CategoryRequest(**body)
            except Exception as e:
                conn.close()
                return response(400, {'error': f'Ошибка валидации: {str(e)}'})
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(f"""
                INSERT INTO {SCHEMA}.categories (name, icon)
                VALUES (%s, %s)
                RETURNING id, name, icon, created_at
            """, (validated.name, validated.icon))
            new_category = dict(cur.fetchone())
            conn.commit()
            cur.close()
            conn.close()
            return response(201, {'category': new_category})
        
        elif method == 'PUT':
            payload, auth_error = verify_token_and_permission(event, conn, 'categories:update')
            if auth_error:
                conn.close()
                return auth_error
            
            try:
                body = json.loads(event.get('body', '{}'))
                category_id = body.get('id')
                if not category_id:
                    conn.close()
                    return response(400, {'error': 'Требуется id категории'})
                
                validated = CategoryRequest(**body)
            except Exception as e:
                conn.close()
                return response(400, {'error': f'Ошибка валидации: {str(e)}'})
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute(f"""
                SELECT id FROM {SCHEMA}.categories WHERE id = %s
            """, (category_id,))
            if not cur.fetchone():
                cur.close()
                conn.close()
                return response(404, {'error': 'Категория не найдена'})
            
            cur.execute(f"""
                UPDATE {SCHEMA}.categories
                SET name = %s, icon = %s
                WHERE id = %s
                RETURNING id, name, icon, created_at
            """, (validated.name, validated.icon, category_id))
            updated_category = dict(cur.fetchone())
            conn.commit()
            cur.close()
            conn.close()
            return response(200, {'category': updated_category})
        
        elif method == 'DELETE':
            payload, auth_error = verify_token_and_permission(event, conn, 'categories:delete')
            if auth_error:
                conn.close()
                return auth_error
            
            try:
                body = json.loads(event.get('body', '{}'))
                category_id = body.get('id')
                if not category_id:
                    conn.close()
                    return response(400, {'error': 'Требуется id категории'})
            except Exception as e:
                conn.close()
                return response(400, {'error': f'Ошибка парсинга: {str(e)}'})
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute(f"""
                SELECT COUNT(*) as cnt FROM {SCHEMA}.payments WHERE category_id = %s
            """, (category_id,))
            count = cur.fetchone()['cnt']
            if count > 0:
                cur.close()
                conn.close()
                return response(400, {'error': f'Невозможно удалить категорию: существует {count} платежей с этой категорией'})
            
            cur.execute(f"""
                DELETE FROM {SCHEMA}.categories WHERE id = %s
                RETURNING id
            """, (category_id,))
            deleted = cur.fetchone()
            if not deleted:
                cur.close()
                conn.close()
                return response(404, {'error': 'Категория не найдена'})
            
            conn.commit()
            cur.close()
            conn.close()
            return response(200, {'message': 'Категория успешно удалена'})
        
        conn.close()
        return response(405, {'error': 'Метод не поддерживается'})
    
    except Exception as e:
        log(f'Error in categories handler: {str(e)}')
        return response(500, {'error': 'Internal server error'})