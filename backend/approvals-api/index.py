"""API для управления согласованиями платежей"""
import json
import os
import base64
from typing import Dict, Any
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

class ApprovalActionRequest(BaseModel):
    """Модель запроса на утверждение/отклонение/отзыв"""
    payment_id: int = Field(..., gt=0)
    action: str = Field(..., pattern='^(approve|reject|submit|revoke)$')
    comment: str = Field(default='')

def handle_payment_history(event: Dict[str, Any], conn, payment_id: int) -> Dict[str, Any]:
    """Получение истории согласования платежа"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(f"""
        SELECT 
            a.id,
            a.payment_id,
            a.approver_id,
            a.approver_role,
            a.action,
            a.comment,
            a.created_at,
            u.username,
            u.full_name
        FROM {SCHEMA}.approvals a
        LEFT JOIN {SCHEMA}.users u ON a.approver_id = u.id
        WHERE a.payment_id = %s
        ORDER BY a.created_at DESC
    """, (payment_id,))
    
    history = [dict(row) for row in cur.fetchall()]
    cur.close()
    
    return response(200, {'history': history})

def handle_approvals_list(event: Dict[str, Any], conn, user_id: int) -> Dict[str, Any]:
    """Получение списка платежей на утверждение"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Получаем платежи, где текущий пользователь - промежуточный или финальный утверждающий
    cur.execute(f"""
        SELECT DISTINCT
            p.id, p.category_id, p.amount, p.description, p.payment_date,
            p.status, p.created_at, p.created_by,
            p.legal_entity_id, p.contractor_id, p.department_id, p.service_id,
            p.invoice_number, p.invoice_date, p.invoice_file_url, p.payment_type,
            c.name as category_name,
            le.name as legal_entity_name,
            cont.name as contractor_name,
            dep.name as department_name,
            s.name as service_name,
            u.username as created_by_username,
            u.full_name as created_by_full_name
        FROM {SCHEMA}.payments p
        LEFT JOIN {SCHEMA}.categories c ON p.category_id = c.id
        LEFT JOIN {SCHEMA}.legal_entities le ON p.legal_entity_id = le.id
        LEFT JOIN {SCHEMA}.contractors cont ON p.contractor_id = cont.id
        LEFT JOIN {SCHEMA}.customer_departments dep ON p.department_id = dep.id
        LEFT JOIN {SCHEMA}.services s ON p.service_id = s.id
        LEFT JOIN {SCHEMA}.users u ON p.created_by = u.id
        WHERE p.status IN ('pending_ceo', 'pending_tech_director', 'pending_ib', 'pending_cfo')
        ORDER BY p.created_at DESC
    """)
    
    payments_data = cur.fetchall()
    payments = []
    
    for payment in payments_data:
        payment_dict = dict(payment)
        
        # Получаем историю утверждений
        cur.execute(f"""
            SELECT a.id, a.payment_id, a.approver_id, a.action, a.comment, a.created_at,
                   u.username as approver_username,
                   u.full_name as approver_full_name
            FROM {SCHEMA}.approvals a
            LEFT JOIN {SCHEMA}.users u ON a.approver_id = u.id
            WHERE a.payment_id = %s
            ORDER BY a.created_at DESC
        """, (payment['id'],))
        
        approval_history = [dict(row) for row in cur.fetchall()]
        payment_dict['approval_history'] = approval_history
        
        # Получаем информацию об утверждающих через сервис
        if payment['service_id']:
            cur.execute(f"""
                SELECT intermediate_approver_id, final_approver_id
                FROM {SCHEMA}.services
                WHERE id = %s
            """, (payment['service_id'],))
            service_info = cur.fetchone()
            
            if service_info:
                # Получаем информацию о промежуточном утверждающем
                cur.execute(f"""
                    SELECT id, username, full_name
                    FROM {SCHEMA}.users
                    WHERE id = %s
                """, (service_info['intermediate_approver_id'],))
                intermediate_approver = cur.fetchone()
                payment_dict['intermediate_approver'] = dict(intermediate_approver) if intermediate_approver else None
                
                # Получаем информацию о финальном утверждающем
                cur.execute(f"""
                    SELECT id, username, full_name
                    FROM {SCHEMA}.users
                    WHERE id = %s
                """, (service_info['final_approver_id'],))
                final_approver = cur.fetchone()
                payment_dict['final_approver'] = dict(final_approver) if final_approver else None
        
        payments.append(payment_dict)
    
    cur.close()
    return response(200, {'payments': payments})

def handle_approval_action(event: Dict[str, Any], conn, user_id: int) -> Dict[str, Any]:
    """Утверждение или отклонение платежа"""
    try:
        body_str = event.get('body', '{}')
        
        # Проверяем, закодировано ли body в base64
        if event.get('isBase64Encoded', False):
            body_str = base64.b64decode(body_str).decode('utf-8')
        
        body = json.loads(body_str)
        print(f"[DEBUG] Received body: {body}")
        approval_action = ApprovalActionRequest(**body)
    except Exception as e:
        print(f"[ERROR] Validation failed: {str(e)}, body: {event.get('body', '{}')}")
        return response(400, {'error': f'Ошибка валидации: {str(e)}'})
    
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Проверяем существование платежа и получаем его статус
    cur.execute(f"""
        SELECT p.id, p.status, p.service_id, p.created_by, s.intermediate_approver_id, s.final_approver_id
        FROM {SCHEMA}.payments p
        LEFT JOIN {SCHEMA}.services s ON p.service_id = s.id
        WHERE p.id = %s
    """, (approval_action.payment_id,))
    
    payment = cur.fetchone()
    
    if not payment:
        cur.close()
        return response(404, {'error': 'Платеж не найден'})
    
    is_intermediate_approver = payment['intermediate_approver_id'] == user_id
    is_final_approver = payment['final_approver_id'] == user_id
    
    # Проверяем, является ли пользователь администратором или CEO
    cur.execute(f"""
        SELECT r.name FROM {SCHEMA}.user_roles ur
        JOIN {SCHEMA}.roles r ON ur.role_id = r.id
        WHERE ur.user_id = %s
    """, (user_id,))
    user_roles = [row['name'] for row in cur.fetchall()]
    is_admin = 'Администратор' in user_roles or 'Admin' in user_roles
    is_ceo = 'CEO' in user_roles or 'Генеральный директор' in user_roles
    
    # Определяем новый статус
    if approval_action.action == 'submit':
        if payment['status'] not in ('draft', 'rejected', None):
            cur.close()
            return response(400, {'error': 'Только черновики и отклонённые платежи можно отправить на согласование'})
        new_status = 'pending_ceo'
    elif approval_action.action == 'approve':
        # Администратор и CEO могут согласовывать любые платежи
        if not is_admin and not is_ceo and not is_intermediate_approver and not is_final_approver:
            cur.close()
            return response(403, {'error': 'Вы не являетесь утверждающим для этого платежа'})
        if not str(payment['status']).startswith('pending_'):
            cur.close()
            return response(400, {'error': 'Неверный статус платежа для утверждения'})
        new_status = 'approved'
    elif approval_action.action == 'revoke':
        # Проверяем, что платёж можно отозвать (на согласовании или одобрен)
        if payment['status'] not in ('pending_ceo', 'pending_tech_director', 'approved'):
            cur.close()
            return response(400, {'error': 'Можно отозвать только платежи на согласовании или одобренные'})
        
        # Проверяем, что отзывает создатель платежа, администратор или CEO
        is_creator = payment.get('created_by') == user_id
        
        if not is_creator and not is_admin and not is_ceo:
            cur.close()
            return response(403, {'error': 'Только создатель платежа, администратор или CEO может его отозвать'})
        
        # Проверяем наличие причины отзыва
        if not approval_action.comment or not approval_action.comment.strip():
            cur.close()
            return response(400, {'error': 'Причина отзыва обязательна'})
        
        new_status = 'draft'  # Возвращаем в черновики
    elif approval_action.action == 'reject':
        # Администратор и CEO могут отклонять любые платежи
        if not is_admin and not is_ceo and not is_intermediate_approver and not is_final_approver:
            cur.close()
            return response(403, {'error': 'Вы не являетесь утверждающим для этого платежа'})
        new_status = 'rejected'
    else:
        new_status = 'rejected'
    
    # Московское время без timezone info (для timestamp without time zone)
    moscow_tz = ZoneInfo('Europe/Moscow')
    now_moscow = datetime.now(moscow_tz).replace(tzinfo=None)
    
    # Обновляем статус платежа
    if new_status == 'approved' and (is_final_approver or is_admin or is_ceo or str(payment['status']).startswith('pending_')):
        cur.execute(f"""
            UPDATE {SCHEMA}.payments
            SET status = %s, 
                ceo_approved_at = %s,
                ceo_approved_by = %s,
                submitted_at = CASE WHEN submitted_at IS NULL THEN %s ELSE submitted_at END
            WHERE id = %s
        """, (new_status, now_moscow, user_id, now_moscow, approval_action.payment_id))
    elif new_status == 'pending_ceo':
        cur.execute(f"""
            UPDATE {SCHEMA}.payments
            SET status = %s,
                submitted_at = %s
            WHERE id = %s
        """, (new_status, now_moscow, approval_action.payment_id))
    else:
        cur.execute(f"""
            UPDATE {SCHEMA}.payments
            SET status = %s
            WHERE id = %s
        """, (new_status, approval_action.payment_id))
    
    # Добавляем запись в историю утверждений с московским временем
    cur.execute(f"""
        INSERT INTO {SCHEMA}.approvals (payment_id, approver_id, approver_role, action, comment, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (approval_action.payment_id, user_id, 'submitter', approval_action.action, approval_action.comment, now_moscow))
    
    conn.commit()
    cur.close()
    
    return response(200, {'message': 'Действие выполнено успешно', 'new_status': new_status})

def handle_approvers_list(event: Dict[str, Any], conn) -> Dict[str, Any]:
    """Получение списка утверждающих"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Получаем всех активных пользователей которые могут быть утверждающими
    cur.execute(f"""
        SELECT DISTINCT u.id, u.username, u.full_name, u.email
        FROM {SCHEMA}.users u
        WHERE u.is_active = true
        ORDER BY u.full_name
    """)
    
    approvers = [dict(row) for row in cur.fetchall()]
    cur.close()
    
    return response(200, {'approvers': approvers})

def handler(event: dict, context) -> dict:
    """
    API для управления согласованиями платежей.
    
    Endpoints:
    - GET /approvals - список платежей на утверждение
    - POST /approvals - утвердить/отклонить платеж
    - GET /approvers - список всех утверждающих
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
        
        # Если endpoint не в query, пробуем извлечь из пути
        if not endpoint:
            path_parts = [p for p in path.strip('/').split('/') if p]
            endpoint = path_parts[-1] if path_parts else ''
        
        if endpoint == 'approvers':
            if method == 'GET':
                payload, error = verify_token_and_permission(event, conn, 'approvals.read')
                if error:
                    return error
                return handle_approvers_list(event, conn)
            return response(405, {'error': 'Method not allowed'})
        
        else:
            payload, error = verify_token_and_permission(event, conn, 'approvals.read' if method == 'GET' else 'payments.update')
            if error:
                return error
            
            user_id = payload['user_id']
            
            if method == 'GET':
                # Проверяем, запрашивается ли история конкретного платежа
                query_params = event.get('queryStringParameters') or {}
                if query_params.get('history') == 'true' and query_params.get('payment_id'):
                    payment_id = int(query_params.get('payment_id'))
                    return handle_payment_history(event, conn, payment_id)
                return handle_approvals_list(event, conn, user_id)
            elif method == 'POST' or method == 'PUT':
                return handle_approval_action(event, conn, user_id)
            
            return response(405, {'error': 'Method not allowed'})
    
    finally:
        conn.close()