import json
import os
import sys
import jwt
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

SCHEMA = 't_p61788166_html_to_frontend'

def log(msg):
    print(msg, file=sys.stderr, flush=True)

class PaymentRequest(BaseModel):
    category_id: int = Field(..., gt=0)
    amount: float = Field(..., gt=0)
    description: str = Field(default='')
    payment_date: str = Field(default='')
    legal_entity_id: int | None = None
    contractor_id: int | None = None
    department_id: int | None = None
    service_id: int | None = None
    invoice_number: str | None = None
    invoice_date: str | None = None

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

def verify_token(event: Dict[str, Any]) -> Dict[str, Any]:
    headers = event.get('headers', {})
    # Try different case variations as cloud functions may normalize headers
    token = (headers.get('X-Auth-Token') or 
             headers.get('x-auth-token') or 
             headers.get('X-Authorization') or
             headers.get('x-authorization', ''))
    
    if token:
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

def check_user_permission(conn, user_id: int, required_permission: str) -> bool:
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(f"""
            SELECT COUNT(*) as count
            FROM {SCHEMA}.user_roles ur
            JOIN {SCHEMA}.role_permissions rp ON ur.role_id = rp.role_id
            JOIN {SCHEMA}.permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = %s AND p.name = %s
        """, (user_id, required_permission))
        result = cur.fetchone()
        return result['count'] > 0
    finally:
        cur.close()

def is_admin_user(conn, user_id: int) -> bool:
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(f"""
            SELECT r.name
            FROM {SCHEMA}.roles r
            JOIN {SCHEMA}.user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = %s
        """, (user_id,))
        roles = [row['name'] for row in cur.fetchall()]
        return 'Администратор' in roles or 'Admin' in roles
    finally:
        cur.close()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для управления платежами (создание, чтение, обновление, удаление).
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-Auth-Token, X-User-Id, X-Session-Id',
                'Access-Control-Max-Age': '86400'
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
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            if not check_user_permission(conn, payload['user_id'], 'payments.read'):
                conn.close()
                return response(403, {'error': 'Forbidden'})
            
            is_admin = is_admin_user(conn, payload['user_id'])
            query_params = event.get('queryStringParameters') or {}
            scope = query_params.get('scope', 'my')
            
            if scope == 'all':
                # Проверяем роли: администратор, CEO или утверждающий могут видеть все платежи
                cur2 = conn.cursor(cursor_factory=RealDictCursor)
                cur2.execute(f"""
                    SELECT r.name FROM {SCHEMA}.roles r
                    JOIN {SCHEMA}.user_roles ur ON r.id = ur.role_id
                    WHERE ur.user_id = %s
                """, (payload['user_id'],))
                user_roles_list = [row['name'] for row in cur2.fetchall()]
                cur2.close()
                is_ceo = 'CEO' in user_roles_list or 'Генеральный директор' in user_roles_list
                is_approver_role = check_user_permission(conn, payload['user_id'], 'approvals.read')
                if not is_admin and not is_ceo and not is_approver_role:
                    conn.close()
                    return response(403, {'error': 'Недостаточно прав для просмотра всех платежей'})
                where_clause = ""
                params = tuple()
            else:
                where_clause = "WHERE p.created_by = %s"
                params = (payload['user_id'],)
            
            cur.execute(f"""
                SELECT 
                    p.id, 
                    p.category_id,
                    c.name as category_name,
                    c.icon as category_icon,
                    p.amount, 
                    p.description, 
                    p.payment_date,
                    p.created_at,
                    p.legal_entity_id,
                    le.name as legal_entity_name,
                    p.contractor_id,
                    ct.name as contractor_name,
                    p.department_id,
                    cd.name as department_name,
                    p.status,
                    p.created_by,
                    u.username as created_by_name,
                    p.submitted_at,
                    p.tech_director_approved_at,
                    p.tech_director_approved_by,
                    p.ceo_approved_at,
                    p.ceo_approved_by,
                    p.service_id,
                    s.name as service_name,
                    s.description as service_description,
                    p.invoice_number,
                    p.invoice_date,
                    p.invoice_file_url,
                    p.payment_type,
                    p.cash_receipt_url
                FROM {SCHEMA}.payments p
                LEFT JOIN {SCHEMA}.categories c ON p.category_id = c.id
                LEFT JOIN {SCHEMA}.legal_entities le ON p.legal_entity_id = le.id
                LEFT JOIN {SCHEMA}.contractors ct ON p.contractor_id = ct.id
                LEFT JOIN {SCHEMA}.customer_departments cd ON p.department_id = cd.id
                LEFT JOIN {SCHEMA}.users u ON p.created_by = u.id
                LEFT JOIN {SCHEMA}.services s ON p.service_id = s.id
                {where_clause}
                ORDER BY p.payment_date DESC
            """, params)
            rows = cur.fetchall()
            payments = []

            payment_ids = [row['id'] for row in rows]
            custom_fields_map = {}
            if payment_ids:
                ids_placeholder = ','.join(['%s'] * len(payment_ids))
                cur.execute(f"""
                    SELECT cfv.payment_id, cf.id, cf.name, cf.field_type, cfv.value
                    FROM {SCHEMA}.custom_field_values cfv
                    JOIN {SCHEMA}.custom_fields cf ON cfv.custom_field_id = cf.id
                    WHERE cfv.payment_id IN ({ids_placeholder})
                """, tuple(payment_ids))
                for cf_row in cur.fetchall():
                    cf = dict(cf_row)
                    pid = cf.pop('payment_id')
                    custom_fields_map.setdefault(pid, []).append(cf)

            for row in rows:
                payment = dict(row)
                payment['amount'] = float(payment['amount'])
                
                if payment['payment_date']:
                    payment['payment_date'] = payment['payment_date'].isoformat()
                if payment['created_at']:
                    payment['created_at'] = payment['created_at'].isoformat()
                if payment['submitted_at']:
                    payment['submitted_at'] = payment['submitted_at'].isoformat()
                if payment['tech_director_approved_at']:
                    payment['tech_director_approved_at'] = payment['tech_director_approved_at'].isoformat()
                if payment['ceo_approved_at']:
                    payment['ceo_approved_at'] = payment['ceo_approved_at'].isoformat()
                if payment['invoice_date']:
                    payment['invoice_date'] = payment['invoice_date'].isoformat()
                
                payment['custom_fields'] = custom_fields_map.get(payment['id'], [])
                payments.append(payment)
            
            cur.close()
            conn.close()
            return response(200, payments)
        
        elif method == 'POST':
            if not check_user_permission(conn, payload['user_id'], 'payments.create'):
                conn.close()
                return response(403, {'error': 'Forbidden'})
            
            try:
                body = json.loads(event.get('body', '{}'))
                pay_req = PaymentRequest(**body)
            except Exception as e:
                conn.close()
                return response(400, {'error': f'Validation error: {str(e)}'})
            
            payment_date = pay_req.payment_date if pay_req.payment_date else datetime.now().isoformat()
            
            cur.execute(
                f"""SELECT name FROM {SCHEMA}.categories WHERE id = %s""",
                (pay_req.category_id,)
            )
            category = cur.fetchone()
            if not category:
                cur.close()
                conn.close()
                return response(400, {'error': 'Category not found'})
            
            category_name = category['name']
            
            cur.execute(
                f"""INSERT INTO {SCHEMA}.payments (category, category_id, amount, description, payment_date, legal_entity_id, contractor_id, department_id, service_id, invoice_number, invoice_date, created_by, status) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'draft') 
                   RETURNING id, category_id, amount, description, payment_date, created_at, legal_entity_id, contractor_id, department_id, service_id, invoice_number, invoice_date, status, created_by""",
                (category_name, pay_req.category_id, pay_req.amount, pay_req.description, payment_date, 
                 pay_req.legal_entity_id, pay_req.contractor_id, pay_req.department_id, pay_req.service_id, 
                 pay_req.invoice_number, pay_req.invoice_date, payload['user_id'])
            )
            row = cur.fetchone()
            payment_id = row['id']
            
            custom_fields_data = body.get('custom_fields', {})
            if custom_fields_data:
                for field_id_str, field_value in custom_fields_data.items():
                    field_id = int(field_id_str)
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.custom_field_values (payment_id, custom_field_id, value) VALUES (%s, %s, %s)",
                        (payment_id, field_id, str(field_value))
                    )
            
            conn.commit()
            
            result = dict(row)
            result['amount'] = float(result['amount'])
            if result['payment_date']:
                result['payment_date'] = result['payment_date'].isoformat()
            if result['created_at']:
                result['created_at'] = result['created_at'].isoformat()
            if result.get('invoice_date'):
                result['invoice_date'] = result['invoice_date'].isoformat()
            
            cur.close()
            conn.close()
            return response(200, result)
        
        elif method == 'PUT':
            if not check_user_permission(conn, payload['user_id'], 'payments.update'):
                conn.close()
                return response(403, {'error': 'Forbidden'})
            
            try:
                body = json.loads(event.get('body', '{}'))
                payment_id = body.get('payment_id') or body.get('id')
                
                # Извлекаем ID из пути, если он есть
                path = event.get('path', '')
                if not payment_id and '/' in path:
                    path_parts = path.rstrip('/').split('/')
                    if path_parts[-1].isdigit():
                        payment_id = int(path_parts[-1])
                
                if not payment_id:
                    conn.close()
                    return response(400, {'error': 'Payment ID is required'})
                
                # Если передан только статус, обновляем только его
                if 'status' in body and len(body) <= 2:  # payment_id/id + status
                    new_status = body.get('status')
                    cur.execute(
                        f"""UPDATE {SCHEMA}.payments SET status = %s WHERE id = %s""",
                        (new_status, payment_id)
                    )
                    conn.commit()
                    cur.close()
                    conn.close()
                    return response(200, {'success': True, 'payment_id': payment_id})
                
                # Полное обновление платежа
                pay_req = PaymentRequest(**body)
            except Exception as e:
                conn.close()
                return response(400, {'error': f'Validation error: {str(e)}'})
            
            cur.execute(
                f"""SELECT name FROM {SCHEMA}.categories WHERE id = %s""",
                (pay_req.category_id,)
            )
            category = cur.fetchone()
            if not category:
                cur.close()
                conn.close()
                return response(400, {'error': 'Category not found'})
            
            category_name = category['name']
            
            cur.execute(f"""
                UPDATE {SCHEMA}.payments 
                SET category = %s, category_id = %s, amount = %s, description = %s, 
                    payment_date = %s, legal_entity_id = %s, contractor_id = %s, 
                    department_id = %s, service_id = %s, invoice_number = %s, invoice_date = %s
                WHERE id = %s
                RETURNING id, category_id, amount, description, payment_date, created_at, status
            """, (category_name, pay_req.category_id, pay_req.amount, pay_req.description, 
                  pay_req.payment_date, pay_req.legal_entity_id, pay_req.contractor_id, 
                  pay_req.department_id, pay_req.service_id, pay_req.invoice_number, 
                  pay_req.invoice_date, payment_id))
            
            row = cur.fetchone()
            if not row:
                cur.close()
                conn.close()
                return response(404, {'error': 'Payment not found'})
            
            cur.execute(f"DELETE FROM {SCHEMA}.custom_field_values WHERE payment_id = %s", (payment_id,))
            
            custom_fields_data = body.get('custom_fields', {})
            if custom_fields_data:
                for field_id_str, field_value in custom_fields_data.items():
                    field_id = int(field_id_str)
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.custom_field_values (payment_id, custom_field_id, value) VALUES (%s, %s, %s)",
                        (payment_id, field_id, str(field_value))
                    )
            
            conn.commit()
            
            result = dict(row)
            result['amount'] = float(result['amount'])
            if result['payment_date']:
                result['payment_date'] = result['payment_date'].isoformat()
            if result['created_at']:
                result['created_at'] = result['created_at'].isoformat()
            
            cur.close()
            conn.close()
            return response(200, result)
        
        elif method == 'DELETE':
            if not check_user_permission(conn, payload['user_id'], 'payments.delete'):
                conn.close()
                return response(403, {'error': 'Forbidden'})
            
            params = event.get('queryStringParameters', {})
            payment_id = params.get('id')
            
            if not payment_id:
                conn.close()
                return response(400, {'error': 'Payment ID is required'})

            is_admin = is_admin_user(conn, payload['user_id'])

            cur.execute(f'SELECT created_by, status FROM {SCHEMA}.payments WHERE id = %s', (payment_id,))
            payment_row = cur.fetchone()
            if not payment_row:
                cur.close()
                conn.close()
                return response(404, {'error': 'Платёж не найден'})

            if not is_admin and payment_row['status'] != 'draft':
                cur.close()
                conn.close()
                return response(403, {'error': 'Можно удалять только платежи со статусом "Черновик"'})

            if not is_admin and payment_row['created_by'] != payload['user_id']:
                cur.close()
                conn.close()
                return response(403, {'error': 'Вы можете удалять только свои платежи'})

            cur.execute(f'DELETE FROM {SCHEMA}.custom_field_values WHERE payment_id = %s', (payment_id,))
            cur.execute(f'DELETE FROM {SCHEMA}.payments WHERE id = %s', (payment_id,))
            conn.commit()
            
            cur.close()
            conn.close()
            return response(200, {'success': True})
        
        conn.close()
        return response(405, {'error': 'Method not allowed'})
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        log(f"Error: {str(e)}")
        log(f"Traceback: {error_details}")
        if conn:
            conn.close()
        return response(500, {'error': str(e), 'details': error_details})