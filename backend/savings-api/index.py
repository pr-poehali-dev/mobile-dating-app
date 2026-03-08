"""API для управления экономиями"""
import json
import os
from typing import Dict, Any, Optional
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

class SavingRequest(BaseModel):
    """Модель запроса экономии"""
    service_id: int = Field(..., gt=0)
    description: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    frequency: str = Field(..., pattern='^(once|monthly|quarterly|yearly)$')
    currency: str = Field(default='RUB')
    employee_id: int = Field(..., gt=0)
    saving_reason_id: Optional[int] = Field(default=None)

class SavingReasonRequest(BaseModel):
    """Модель запроса причины экономии"""
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default='')
    icon: Optional[str] = Field(default=None)

def handle_savings_get(event: Dict[str, Any], conn, path: str) -> Dict[str, Any]:
    """Получение экономий"""
    # Проверяем, есть ли ID в пути
    path_parts = path.rstrip('/').split('/')
    saving_id = None
    if len(path_parts) > 0 and path_parts[-1].isdigit():
        saving_id = int(path_parts[-1])
    
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if saving_id:
        # Получить конкретную экономию
        cur.execute(f"""
            SELECT s.id, s.service_id, s.description, s.amount, s.frequency, 
                   s.currency, s.employee_id, s.saving_reason_id, s.created_at, s.updated_at,
                   srv.name as service_name,
                   u.username as employee_username,
                   u.full_name as employee_full_name,
                   sr.name as saving_reason_name,
                   sr.icon as saving_reason_icon
            FROM {SCHEMA}.savings s
            LEFT JOIN {SCHEMA}.services srv ON s.service_id = srv.id
            LEFT JOIN {SCHEMA}.users u ON s.employee_id = u.id
            LEFT JOIN {SCHEMA}.saving_reasons sr ON s.saving_reason_id = sr.id
            WHERE s.id = %s
        """, (saving_id,))
        
        saving = cur.fetchone()
        cur.close()
        
        if not saving:
            return response(404, {'error': 'Экономия не найдена'})
        
        return response(200, {'saving': dict(saving)})
    else:
        # Получить все экономии с фильтрацией
        query_params = event.get('queryStringParameters', {}) or {}
        service_id = query_params.get('service_id')
        employee_id = query_params.get('employee_id')
        saving_reason_id = query_params.get('saving_reason_id')
        
        query = f"""
            SELECT s.id, s.service_id, s.description, s.amount, s.frequency, 
                   s.currency, s.employee_id, s.saving_reason_id, s.created_at, s.updated_at,
                   srv.name as service_name,
                   u.username as employee_username,
                   u.full_name as employee_full_name,
                   sr.name as saving_reason_name,
                   sr.icon as saving_reason_icon
            FROM {SCHEMA}.savings s
            LEFT JOIN {SCHEMA}.services srv ON s.service_id = srv.id
            LEFT JOIN {SCHEMA}.users u ON s.employee_id = u.id
            LEFT JOIN {SCHEMA}.saving_reasons sr ON s.saving_reason_id = sr.id
            WHERE 1=1
        """
        params = []
        
        if service_id:
            query += " AND s.service_id = %s"
            params.append(int(service_id))
        
        if employee_id:
            query += " AND s.employee_id = %s"
            params.append(int(employee_id))
        
        if saving_reason_id:
            query += " AND s.saving_reason_id = %s"
            params.append(int(saving_reason_id))
        
        query += " ORDER BY s.created_at DESC"
        
        cur.execute(query, params)
        savings = [dict(row) for row in cur.fetchall()]
        
        # Получаем статистику
        cur.execute(f"""
            SELECT 
                COUNT(*) as total_count,
                SUM(CASE 
                    WHEN frequency = 'once' THEN amount
                    WHEN frequency = 'monthly' THEN amount * 12
                    WHEN frequency = 'quarterly' THEN amount * 4
                    WHEN frequency = 'yearly' THEN amount
                    ELSE 0
                END) as total_annual_savings
            FROM {SCHEMA}.savings
        """)
        
        stats = cur.fetchone()
        cur.close()
        
        return response(200, {
            'savings': savings,
            'stats': dict(stats) if stats else {'total_count': 0, 'total_annual_savings': 0}
        })

def handle_saving_reasons_get(event: Dict[str, Any], conn) -> Dict[str, Any]:
    """Получение причин экономий"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT id, name, description, icon, created_at
        FROM {SCHEMA}.saving_reasons
        ORDER BY name
    """)
    
    reasons = [dict(row) for row in cur.fetchall()]
    cur.close()
    
    return response(200, {'reasons': reasons})

def handler(event: dict, context) -> dict:
    """
    API для управления экономиями.
    
    Endpoints:
    - GET /savings - список всех экономий
    - GET /savings/{id} - получить конкретную экономию
    - POST /savings - создать экономию
    - PUT /savings/{id} - обновить экономию
    - DELETE /savings/{id} - удалить экономию
    - GET /reasons - список причин экономий
    - POST /reasons - создать причину экономии
    - PUT /reasons/{id} - обновить причину экономии
    - DELETE /reasons/{id} - удалить причину экономии
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
            if 'reasons' in path or 'saving-reasons' in path:
                endpoint = 'reasons'
            else:
                endpoint = 'savings'
        
        if endpoint in ['reasons', 'saving-reasons']:
            # /reasons endpoint
            if method == 'GET':
                payload, error = verify_token_and_permission(event, conn, 'savings:read')
                if error:
                    return error
                return handle_saving_reasons_get(event, conn)
            
            elif method == 'POST':
                payload, error = verify_token_and_permission(event, conn, 'savings:create')
                if error:
                    return error
                
                body = json.loads(event.get('body', '{}'))
                reason_req = SavingReasonRequest(**body)
                
                cur = conn.cursor(cursor_factory=RealDictCursor)
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.saving_reasons (name, description, icon)
                    VALUES (%s, %s, %s)
                    RETURNING id
                """, (reason_req.name, reason_req.description, reason_req.icon))
                
                reason_id = cur.fetchone()['id']
                conn.commit()
                cur.close()
                
                return response(201, {'id': reason_id, 'message': 'Причина экономии создана'})
            
            elif method in ['PUT', 'DELETE']:
                path_parts = path.rstrip('/').split('/')
                reason_id = None
                if len(path_parts) > 0 and path_parts[-1].isdigit():
                    reason_id = int(path_parts[-1])
                
                if not reason_id:
                    return response(400, {'error': 'ID не указан'})
                
                if method == 'PUT':
                    payload, error = verify_token_and_permission(event, conn, 'savings:update')
                    if error:
                        return error
                    
                    body = json.loads(event.get('body', '{}'))
                    reason_req = SavingReasonRequest(**body)
                    
                    cur = conn.cursor()
                    cur.execute(f"""
                        UPDATE {SCHEMA}.saving_reasons
                        SET name = %s, description = %s, icon = %s
                        WHERE id = %s
                    """, (reason_req.name, reason_req.description, reason_req.icon, reason_id))
                    
                    if cur.rowcount == 0:
                        cur.close()
                        return response(404, {'error': 'Причина не найдена'})
                    
                    conn.commit()
                    cur.close()
                    return response(200, {'message': 'Причина экономии обновлена'})
                
                else:  # DELETE
                    payload, error = verify_token_and_permission(event, conn, 'savings:delete')
                    if error:
                        return error
                    
                    cur = conn.cursor()
                    cur.execute(f"DELETE FROM {SCHEMA}.saving_reasons WHERE id = %s", (reason_id,))
                    
                    if cur.rowcount == 0:
                        cur.close()
                        return response(404, {'error': 'Причина не найдена'})
                    
                    conn.commit()
                    cur.close()
                    return response(200, {'message': 'Причина экономии удалена'})
            
            return response(405, {'error': 'Method not allowed'})
        
        else:
            # /savings endpoint
            if method == 'GET':
                payload, error = verify_token_and_permission(event, conn, 'savings:read')
                if error:
                    return error
                return handle_savings_get(event, conn, path)
            
            elif method == 'POST':
                payload, error = verify_token_and_permission(event, conn, 'savings:create')
                if error:
                    return error
                
                body = json.loads(event.get('body', '{}'))
                saving_req = SavingRequest(**body)
                
                cur = conn.cursor(cursor_factory=RealDictCursor)
                
                # Создаём экономию
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.savings (service_id, description, amount, frequency, currency, employee_id, saving_reason_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    saving_req.service_id,
                    saving_req.description,
                    saving_req.amount,
                    saving_req.frequency,
                    saving_req.currency,
                    saving_req.employee_id,
                    saving_req.saving_reason_id
                ))
                
                saving_id = cur.fetchone()['id']
                conn.commit()
                cur.close()
                
                return response(201, {'id': saving_id, 'message': 'Экономия создана'})
            
            elif method in ['PUT', 'DELETE']:
                path_parts = path.rstrip('/').split('/')
                saving_id = None
                if len(path_parts) > 0 and path_parts[-1].isdigit():
                    saving_id = int(path_parts[-1])
                
                if not saving_id:
                    return response(400, {'error': 'ID экономии не указан'})
                
                if method == 'PUT':
                    payload, error = verify_token_and_permission(event, conn, 'savings:update')
                    if error:
                        return error
                    
                    body = json.loads(event.get('body', '{}'))
                    saving_req = SavingRequest(**body)
                    
                    cur = conn.cursor()
                    cur.execute(f"""
                        UPDATE {SCHEMA}.savings
                        SET service_id = %s, description = %s, amount = %s, frequency = %s, 
                            currency = %s, employee_id = %s, saving_reason_id = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, (
                        saving_req.service_id,
                        saving_req.description,
                        saving_req.amount,
                        saving_req.frequency,
                        saving_req.currency,
                        saving_req.employee_id,
                        saving_req.saving_reason_id,
                        saving_id
                    ))
                    
                    if cur.rowcount == 0:
                        cur.close()
                        return response(404, {'error': 'Экономия не найдена'})
                    
                    conn.commit()
                    cur.close()
                    return response(200, {'message': 'Экономия обновлена'})
                
                else:  # DELETE
                    payload, error = verify_token_and_permission(event, conn, 'savings:delete')
                    if error:
                        return error
                    
                    cur = conn.cursor()
                    cur.execute(f"DELETE FROM {SCHEMA}.savings WHERE id = %s", (saving_id,))
                    
                    if cur.rowcount == 0:
                        cur.close()
                        return response(404, {'error': 'Экономия не найдена'})
                    
                    conn.commit()
                    cur.close()
                    return response(200, {'message': 'Экономия удалена'})
            
            return response(405, {'error': 'Method not allowed'})
    
    finally:
        conn.close()