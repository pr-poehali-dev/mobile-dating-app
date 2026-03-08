"""API для управления пользователями, ролями и правами доступа"""
import json
import os
from typing import Dict, Any, List
from datetime import datetime
from zoneinfo import ZoneInfo
import jwt
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel, Field

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
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

def verify_token_and_permission(event: Dict[str, Any], conn, required_permission: str) -> tuple:
    """Проверяет токен и права доступа"""
    payload, error = verify_token(event, conn)
    if error:
        return None, error
    
    cur = conn.cursor()
    cur.execute(f"""
        SELECT COUNT(*) FROM {SCHEMA}.permissions p
        JOIN {SCHEMA}.role_permissions rp ON p.id = rp.permission_id
        JOIN {SCHEMA}.user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = %s AND p.name = %s
    """, (payload['user_id'], required_permission))
    
    has_permission = cur.fetchone()[0] > 0
    cur.close()
    
    if not has_permission:
        return None, response(403, {'error': 'Forbidden'})
    
    return payload, None

class RoleRequest(BaseModel):
    """Модель запроса роли"""
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default='')
    permission_ids: List[int] = Field(default_factory=list)

class PermissionRequest(BaseModel):
    """Модель запроса разрешения"""
    name: str = Field(..., min_length=1, max_length=255)
    resource: str = Field(..., min_length=1, max_length=255)
    action: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default='')

def get_user_with_permissions(conn, user_id: int) -> Dict[str, Any]:
    """Получает пользователя с ролями и правами"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT id, username, email, full_name, is_active, created_at, last_login
        FROM {SCHEMA}.users
        WHERE id = %s
    """, (user_id,))
    
    user = cur.fetchone()
    if not user:
        cur.close()
        return None
    
    user = dict(user)
    
    # Получаем роли пользователя
    cur.execute(f"""
        SELECT r.id, r.name, r.description
        FROM {SCHEMA}.roles r
        JOIN {SCHEMA}.user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = %s
    """, (user_id,))
    user['roles'] = [dict(row) for row in cur.fetchall()]
    
    # Получаем все права пользователя
    cur.execute(f"""
        SELECT DISTINCT p.id, p.name, p.resource, p.action
        FROM {SCHEMA}.permissions p
        JOIN {SCHEMA}.role_permissions rp ON p.id = rp.permission_id
        JOIN {SCHEMA}.user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = %s
    """, (user_id,))
    user['permissions'] = [dict(row) for row in cur.fetchall()]
    
    cur.close()
    return user

def handle_users_endpoint(event: Dict[str, Any], conn, method: str, path: str) -> Dict[str, Any]:
    """Обработка /users endpoint"""
    path_parts = path.rstrip('/').split('/')
    user_id = None
    if len(path_parts) > 0 and path_parts[-1].isdigit():
        user_id = int(path_parts[-1])
    
    if method == 'GET':
        payload, error = verify_token_and_permission(event, conn, 'users:read')
        if error:
            return error
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if user_id:
            # Получить конкретного пользователя
            user = get_user_with_permissions(conn, user_id)
            if not user:
                return response(404, {'error': 'Пользователь не найден'})
            return response(200, {'user': user})
        else:
            # Получить всех пользователей
            cur.execute(f"""
                SELECT id, username, email, full_name, is_active, created_at, last_login
                FROM {SCHEMA}.users
                ORDER BY created_at DESC
            """)
            
            users = [dict(row) for row in cur.fetchall()]
            
            # Для каждого пользователя получаем роли
            for user in users:
                cur.execute(f"""
                    SELECT r.id, r.name, r.description
                    FROM {SCHEMA}.roles r
                    JOIN {SCHEMA}.user_roles ur ON r.id = ur.role_id
                    WHERE ur.user_id = %s
                """, (user['id'],))
                user['roles'] = [dict(row) for row in cur.fetchall()]
            
            cur.close()
            return response(200, {'users': users})
    
    elif method == 'PUT':
        payload, error = verify_token_and_permission(event, conn, 'users:update')
        if error:
            return error
        
        if not user_id:
            return response(400, {'error': 'ID пользователя не указан'})
        
        body = json.loads(event.get('body', '{}'))
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Проверяем существование пользователя
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        if not cur.fetchone():
            cur.close()
            return response(404, {'error': 'Пользователь не найден'})
        
        # Обновляем поля пользователя
        update_fields = []
        update_values = []
        
        if 'full_name' in body:
            update_fields.append('full_name = %s')
            update_values.append(body['full_name'])
        
        if 'is_active' in body:
            update_fields.append('is_active = %s')
            update_values.append(body['is_active'])
        
        if 'role_ids' in body:
            # Обновляем роли пользователя
            cur.execute(f"DELETE FROM {SCHEMA}.user_roles WHERE user_id = %s", (user_id,))
            for role_id in body['role_ids']:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.user_roles (user_id, role_id)
                    VALUES (%s, %s)
                """, (user_id, role_id))
        
        if update_fields:
            update_values.append(user_id)
            query = f"UPDATE {SCHEMA}.users SET {', '.join(update_fields)} WHERE id = %s"
            cur.execute(query, update_values)
        
        conn.commit()
        cur.close()
        
        return response(200, {'message': 'Пользователь обновлён'})
    
    return response(405, {'error': 'Method not allowed'})

def handle_roles_endpoint(event: Dict[str, Any], conn, method: str, path: str) -> Dict[str, Any]:
    """Обработка /roles endpoint"""
    path_parts = path.rstrip('/').split('/')
    role_id = None
    if len(path_parts) > 0 and path_parts[-1].isdigit():
        role_id = int(path_parts[-1])
    
    if method == 'GET':
        payload, error = verify_token_and_permission(event, conn, 'roles:read')
        if error:
            return error
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(f"""
            SELECT id, name, description, created_at, updated_at
            FROM {SCHEMA}.roles
            ORDER BY name
        """)
        
        roles = [dict(row) for row in cur.fetchall()]
        
        # Для каждой роли получаем разрешения
        for role in roles:
            cur.execute(f"""
                SELECT p.id, p.name, p.resource, p.action, p.description
                FROM {SCHEMA}.permissions p
                JOIN {SCHEMA}.role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = %s
            """, (role['id'],))
            role['permissions'] = [dict(row) for row in cur.fetchall()]
        
        cur.close()
        return response(200, {'roles': roles})
    
    elif method == 'POST':
        payload, error = verify_token_and_permission(event, conn, 'roles:create')
        if error:
            return error
        
        body = json.loads(event.get('body', '{}'))
        role_req = RoleRequest(**body)
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Создаём роль
        cur.execute(f"""
            INSERT INTO {SCHEMA}.roles (name, description)
            VALUES (%s, %s)
            RETURNING id
        """, (role_req.name, role_req.description))
        
        role_id = cur.fetchone()['id']
        
        # Добавляем разрешения
        for permission_id in role_req.permission_ids:
            cur.execute(f"""
                INSERT INTO {SCHEMA}.role_permissions (role_id, permission_id)
                VALUES (%s, %s)
            """, (role_id, permission_id))
        
        conn.commit()
        cur.close()
        
        return response(201, {'id': role_id, 'message': 'Роль создана'})
    
    elif method == 'PUT':
        payload, error = verify_token_and_permission(event, conn, 'roles:update')
        if error:
            return error
        
        if not role_id:
            return response(400, {'error': 'ID роли не указан'})
        
        body = json.loads(event.get('body', '{}'))
        role_req = RoleRequest(**body)
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(f"SELECT id FROM {SCHEMA}.roles WHERE id = %s", (role_id,))
        if not cur.fetchone():
            cur.close()
            return response(404, {'error': 'Роль не найдена'})
        
        # Обновляем роль
        cur.execute(f"""
            UPDATE {SCHEMA}.roles
            SET name = %s, description = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (role_req.name, role_req.description, role_id))
        
        # Обновляем разрешения
        cur.execute(f"DELETE FROM {SCHEMA}.role_permissions WHERE role_id = %s", (role_id,))
        for permission_id in role_req.permission_ids:
            cur.execute(f"""
                INSERT INTO {SCHEMA}.role_permissions (role_id, permission_id)
                VALUES (%s, %s)
            """, (role_id, permission_id))
        
        conn.commit()
        cur.close()
        
        return response(200, {'message': 'Роль обновлена'})
    
    elif method == 'DELETE':
        payload, error = verify_token_and_permission(event, conn, 'roles:delete')
        if error:
            return error
        
        if not role_id:
            return response(400, {'error': 'ID роли не указан'})
        
        cur = conn.cursor()
        
        # Проверяем, что роль не используется
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.user_roles WHERE role_id = %s", (role_id,))
        if cur.fetchone()[0] > 0:
            cur.close()
            return response(400, {'error': 'Роль используется пользователями'})
        
        cur.execute(f"DELETE FROM {SCHEMA}.role_permissions WHERE role_id = %s", (role_id,))
        cur.execute(f"DELETE FROM {SCHEMA}.roles WHERE id = %s", (role_id,))
        
        if cur.rowcount == 0:
            cur.close()
            return response(404, {'error': 'Роль не найдена'})
        
        conn.commit()
        cur.close()
        return response(200, {'message': 'Роль удалена'})
    
    return response(405, {'error': 'Method not allowed'})

def handle_permissions_endpoint(event: Dict[str, Any], conn, method: str, path: str) -> Dict[str, Any]:
    """Обработка /permissions endpoint"""
    path_parts = path.rstrip('/').split('/')
    perm_id = None
    if len(path_parts) > 0 and path_parts[-1].isdigit():
        perm_id = int(path_parts[-1])
    
    if method == 'GET':
        payload, error = verify_token_and_permission(event, conn, 'permissions:read')
        if error:
            return error
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(f"""
            SELECT id, name, resource, action, description, created_at
            FROM {SCHEMA}.permissions
            ORDER BY resource, action
        """)
        
        permissions = [dict(row) for row in cur.fetchall()]
        cur.close()
        
        return response(200, {'permissions': permissions})
    
    elif method == 'POST':
        payload, error = verify_token_and_permission(event, conn, 'permissions:create')
        if error:
            return error
        
        body = json.loads(event.get('body', '{}'))
        perm_req = PermissionRequest(**body)
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(f"""
            INSERT INTO {SCHEMA}.permissions (name, resource, action, description)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (perm_req.name, perm_req.resource, perm_req.action, perm_req.description))
        
        perm_id = cur.fetchone()['id']
        conn.commit()
        cur.close()
        
        return response(201, {'id': perm_id, 'message': 'Разрешение создано'})
    
    elif method == 'PUT':
        payload, error = verify_token_and_permission(event, conn, 'permissions:update')
        if error:
            return error
        
        if not perm_id:
            return response(400, {'error': 'ID разрешения не указан'})
        
        body = json.loads(event.get('body', '{}'))
        perm_req = PermissionRequest(**body)
        
        cur = conn.cursor()
        
        cur.execute(f"""
            UPDATE {SCHEMA}.permissions
            SET name = %s, resource = %s, action = %s, description = %s
            WHERE id = %s
        """, (perm_req.name, perm_req.resource, perm_req.action, perm_req.description, perm_id))
        
        if cur.rowcount == 0:
            cur.close()
            return response(404, {'error': 'Разрешение не найдено'})
        
        conn.commit()
        cur.close()
        
        return response(200, {'message': 'Разрешение обновлено'})
    
    elif method == 'DELETE':
        payload, error = verify_token_and_permission(event, conn, 'permissions:delete')
        if error:
            return error
        
        if not perm_id:
            return response(400, {'error': 'ID разрешения не указан'})
        
        cur = conn.cursor()
        
        cur.execute(f"DELETE FROM {SCHEMA}.role_permissions WHERE permission_id = %s", (perm_id,))
        cur.execute(f"DELETE FROM {SCHEMA}.permissions WHERE id = %s", (perm_id,))
        
        if cur.rowcount == 0:
            cur.close()
            return response(404, {'error': 'Разрешение не найдено'})
        
        conn.commit()
        cur.close()
        return response(200, {'message': 'Разрешение удалено'})
    
    return response(405, {'error': 'Method not allowed'})

def handler(event: dict, context) -> dict:
    """
    API для управления пользователями, ролями и правами доступа.
    
    Endpoints:
    - GET/PUT /users - работа с пользователями
    - GET/POST/PUT/DELETE /roles - работа с ролями
    - GET/POST/PUT/DELETE /permissions - работа с правами доступа
    """
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    
    # CORS preflight
    if method == 'OPTIONS':
        return response(200, {})
    
    conn = psycopg2.connect(DSN)
    
    try:
        # Определяем endpoint из query параметров или пути
        query_params = event.get('queryStringParameters', {}) or {}
        endpoint = query_params.get('endpoint', '')
        
        # Если endpoint не в query, проверяем путь
        if not endpoint:
            if 'permissions' in path or 'permission' in path:
                endpoint = 'permissions'
            elif 'roles' in path or 'role' in path:
                endpoint = 'roles'
            else:
                endpoint = 'users'
        
        if endpoint == 'permissions':
            return handle_permissions_endpoint(event, conn, method, path)
        elif endpoint == 'roles':
            return handle_roles_endpoint(event, conn, method, path)
        else:
            # users endpoint
            return handle_users_endpoint(event, conn, method, path)
    
    finally:
        conn.close()