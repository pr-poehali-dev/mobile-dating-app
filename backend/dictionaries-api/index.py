import json
import os
import sys
import jwt
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, Optional, Union
from pydantic import BaseModel, Field, model_validator, field_validator, ValidationError

SCHEMA = 't_p61788166_html_to_frontend'

def log(msg):
    print(msg, file=sys.stderr, flush=True)

def _none_to_str(values: dict, fields: list) -> dict:
    for f in fields:
        if isinstance(values, dict) and values.get(f) is None:
            values[f] = ''
    return values

class CategoryRequest(BaseModel):
    name: str = Field(..., min_length=1)
    icon: Optional[str] = Field(default='Tag')

    @model_validator(mode='before')
    @classmethod
    def _fix(cls, v): return _none_to_str(v, ['icon'])

class LegalEntityRequest(BaseModel):
    model_config = {'populate_by_name': True}
    name: str = Field(..., min_length=1)
    inn: str = Field(default='')
    kpp: str = Field(default='')
    address: str = Field(default='')
    postal_code: str = Field(default='')

    @model_validator(mode='before')
    @classmethod
    def _coerce(cls, v):
        if isinstance(v, dict):
            for f in ('inn', 'kpp', 'address', 'postal_code'):
                if v.get(f) is None:
                    v[f] = ''
        return v

class ContractorRequest(BaseModel):
    name: str = Field(..., min_length=1)
    inn: Optional[str] = Field(default='')
    kpp: Optional[str] = Field(default='')
    ogrn: Optional[str] = Field(default='')
    legal_address: Optional[str] = Field(default='')
    actual_address: Optional[str] = Field(default='')
    phone: Optional[str] = Field(default='')
    email: Optional[str] = Field(default='')
    contact_person: Optional[str] = Field(default='')
    bank_name: Optional[str] = Field(default='')
    bank_bik: Optional[str] = Field(default='')
    bank_account: Optional[str] = Field(default='')
    correspondent_account: Optional[str] = Field(default='')
    notes: Optional[str] = Field(default='')

    @field_validator('inn', 'kpp', 'ogrn', 'legal_address', 'actual_address', 'phone', 'email',
                     'contact_person', 'bank_name', 'bank_bik', 'bank_account', 'correspondent_account', 'notes', mode='before')
    @classmethod
    def _none_to_empty(cls, v): return '' if v is None else v

class CustomerDepartmentRequest(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = Field(default='')

    @field_validator('description', mode='before')
    @classmethod
    def _none_to_empty(cls, v): return '' if v is None else v

class CustomFieldRequest(BaseModel):
    name: str = Field(..., min_length=1)
    field_type: str = Field(..., pattern='^(text|select|file|toggle)$')
    options: Optional[str] = Field(default='')

    @field_validator('options', mode='before')
    @classmethod
    def _none_to_empty(cls, v): return '' if v is None else v

class ServiceRequest(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = Field(default='')
    intermediate_approver_id: int | None = None
    final_approver_id: int | None = None
    customer_department_id: int | None = None
    category_id: int | None = None
    legal_entity_id: int | None = None
    contractor_id: int | None = None

    @field_validator('description', mode='before')
    @classmethod
    def _none_to_empty(cls, v): return '' if v is None else v

def response(status_code: int, data: Any) -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data, ensure_ascii=False),
        'isBase64Encoded': False
    }

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise ValueError('DATABASE_URL not set')
    return psycopg2.connect(dsn)

def verify_token(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
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
    API для управления справочниками: категории, юрлица, контрагенты, подразделения, сервисы, кастомные поля.
    '''
    method = event.get('httpMethod', 'GET')
    endpoint = event.get('queryStringParameters', {}).get('endpoint', '')
    
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
        
        user_id = payload['user_id']
        is_admin = is_admin_user(conn, user_id)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Categories
        if endpoint == 'categories':
            if method == 'GET':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.read'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                cur.execute(f'SELECT id, name, icon FROM {SCHEMA}.categories ORDER BY name')
                categories = [dict(row) for row in cur.fetchall()]
                
                cur.close()
                conn.close()
                return response(200, categories)
            
            elif method == 'POST':
                if not is_admin and not check_user_permission(conn, user_id, 'categories.create'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                data = json.loads(event.get('body', '{}'))
                cat_req = CategoryRequest(**data)
                
                cur.execute(
                    f"INSERT INTO {SCHEMA}.categories (name, icon) VALUES (%s, %s) RETURNING id, name, icon",
                    (cat_req.name, cat_req.icon)
                )
                row = cur.fetchone()
                conn.commit()
                
                cur.close()
                conn.close()
                return response(201, dict(row))
            
            elif method == 'PUT':
                if not is_admin and not check_user_permission(conn, user_id, 'categories.update'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                data = json.loads(event.get('body', '{}'))
                cat_id = data.get('id')
                cat_req = CategoryRequest(**data)
                
                if not cat_id:
                    conn.close()
                    return response(400, {'error': 'ID is required'})
                
                cur.execute(
                    f"UPDATE {SCHEMA}.categories SET name = %s, icon = %s WHERE id = %s RETURNING id, name, icon",
                    (cat_req.name, cat_req.icon, cat_id)
                )
                row = cur.fetchone()
                
                if not row:
                    conn.close()
                    return response(404, {'error': 'Category not found'})
                
                conn.commit()
                cur.close()
                conn.close()
                return response(200, dict(row))
            
            elif method == 'DELETE':
                if not is_admin and not check_user_permission(conn, user_id, 'categories.delete'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                params = event.get('queryStringParameters', {})
                cat_id = params.get('id')
                
                if not cat_id:
                    conn.close()
                    return response(400, {'error': 'ID is required'})
                
                cur.execute(f'DELETE FROM {SCHEMA}.categories WHERE id = %s', (cat_id,))
                conn.commit()
                
                cur.close()
                conn.close()
                return response(200, {'success': True})
        
        # Legal Entities
        elif endpoint == 'legal-entities':
            if method == 'GET':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.read'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                cur.execute(f'SELECT id, name, inn, kpp, address, postal_code FROM {SCHEMA}.legal_entities WHERE is_active = true ORDER BY name')
                entities = [dict(row) for row in cur.fetchall()]
                
                cur.close()
                conn.close()
                return response(200, entities)
            
            elif method == 'POST':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.create'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                data = json.loads(event.get('body', '{}'))
                le_req = LegalEntityRequest(**data)
                
                cur.execute(
                    f"INSERT INTO {SCHEMA}.legal_entities (name, inn, kpp, address, postal_code, is_active) VALUES (%s, %s, %s, %s, %s, true) RETURNING id, name, inn, kpp, address, postal_code",
                    (le_req.name, le_req.inn, le_req.kpp, le_req.address, le_req.postal_code)
                )
                row = cur.fetchone()
                conn.commit()
                
                cur.close()
                conn.close()
                return response(201, dict(row))
            
            elif method == 'PUT':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.update'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                data = json.loads(event.get('body', '{}'))
                le_id = data.get('id')
                le_req = LegalEntityRequest(**data)
                
                if not le_id:
                    conn.close()
                    return response(400, {'error': 'ID is required'})
                
                cur.execute(
                    f"UPDATE {SCHEMA}.legal_entities SET name = %s, inn = %s, kpp = %s, address = %s, postal_code = %s WHERE id = %s RETURNING id, name, inn, kpp, address, postal_code",
                    (le_req.name, le_req.inn, le_req.kpp, le_req.address, le_req.postal_code, le_id)
                )
                row = cur.fetchone()
                
                if not row:
                    conn.close()
                    return response(404, {'error': 'Legal entity not found'})
                
                conn.commit()
                cur.close()
                conn.close()
                return response(200, dict(row))
            
            elif method == 'DELETE':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.delete'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                params = event.get('queryStringParameters', {})
                le_id = params.get('id')
                
                if not le_id:
                    conn.close()
                    return response(400, {'error': 'ID is required'})
                
                cur.execute(f'DELETE FROM {SCHEMA}.legal_entities WHERE id = %s', (le_id,))
                conn.commit()
                
                cur.close()
                conn.close()
                return response(200, {'success': True})
        
        # Contractors
        elif endpoint == 'contractors':
            if method == 'GET':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.read'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                cur.execute(f"""
                    SELECT id, name, inn, kpp, ogrn, legal_address, actual_address, 
                           phone, email, contact_person, bank_name, bank_bik, 
                           bank_account, correspondent_account, notes 
                    FROM {SCHEMA}.contractors WHERE is_active = true ORDER BY name
                """)
                contractors = [dict(row) for row in cur.fetchall()]
                
                cur.close()
                conn.close()
                return response(200, contractors)
            
            elif method == 'POST':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.create'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                data = json.loads(event.get('body', '{}'))
                cont_req = ContractorRequest(**data)
                
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.contractors 
                    (name, inn, kpp, ogrn, legal_address, actual_address, phone, email, contact_person, 
                     bank_name, bank_bik, bank_account, correspondent_account, notes) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
                    RETURNING id, name, inn, kpp, ogrn, legal_address, actual_address, phone, email, contact_person, 
                              bank_name, bank_bik, bank_account, correspondent_account, notes
                """, (cont_req.name, cont_req.inn, cont_req.kpp, cont_req.ogrn, cont_req.legal_address,
                      cont_req.actual_address, cont_req.phone, cont_req.email, cont_req.contact_person,
                      cont_req.bank_name, cont_req.bank_bik, cont_req.bank_account, 
                      cont_req.correspondent_account, cont_req.notes))
                row = cur.fetchone()
                conn.commit()
                
                cur.close()
                conn.close()
                return response(201, dict(row))
            
            elif method == 'PUT':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.update'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                data = json.loads(event.get('body', '{}'))
                cont_id = data.get('id')
                cont_req = ContractorRequest(**data)
                
                if not cont_id:
                    conn.close()
                    return response(400, {'error': 'ID is required'})
                
                cur.execute(f"""
                    UPDATE {SCHEMA}.contractors 
                    SET name = %s, inn = %s, kpp = %s, ogrn = %s, legal_address = %s, actual_address = %s,
                        phone = %s, email = %s, contact_person = %s, bank_name = %s, bank_bik = %s,
                        bank_account = %s, correspondent_account = %s, notes = %s
                    WHERE id = %s
                    RETURNING id, name, inn, kpp, ogrn, legal_address, actual_address, phone, email, contact_person,
                              bank_name, bank_bik, bank_account, correspondent_account, notes
                """, (cont_req.name, cont_req.inn, cont_req.kpp, cont_req.ogrn, cont_req.legal_address,
                      cont_req.actual_address, cont_req.phone, cont_req.email, cont_req.contact_person,
                      cont_req.bank_name, cont_req.bank_bik, cont_req.bank_account,
                      cont_req.correspondent_account, cont_req.notes, cont_id))
                row = cur.fetchone()
                
                if not row:
                    conn.close()
                    return response(404, {'error': 'Contractor not found'})
                
                conn.commit()
                cur.close()
                conn.close()
                return response(200, dict(row))
            
            elif method == 'DELETE':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.delete'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                params = event.get('queryStringParameters', {})
                cont_id = params.get('id')
                
                if not cont_id:
                    conn.close()
                    return response(400, {'error': 'ID is required'})
                
                cur.execute(f'DELETE FROM {SCHEMA}.contractors WHERE id = %s', (cont_id,))
                conn.commit()
                
                cur.close()
                conn.close()
                return response(200, {'success': True})
        
        # Customer Departments
        elif endpoint == 'customer-departments' or endpoint == 'customer_departments' or endpoint == 'departments':
            if method == 'GET':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.read'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                cur.execute(f'SELECT id, name, description FROM {SCHEMA}.customer_departments ORDER BY name')
                departments = [dict(row) for row in cur.fetchall()]
                
                cur.close()
                conn.close()
                return response(200, departments)
            
            elif method == 'POST':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.create'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                data = json.loads(event.get('body', '{}'))
                dept_req = CustomerDepartmentRequest(**data)
                
                cur.execute(
                    f"INSERT INTO {SCHEMA}.customer_departments (name, description) VALUES (%s, %s) RETURNING id, name, description",
                    (dept_req.name, dept_req.description)
                )
                row = cur.fetchone()
                conn.commit()
                
                cur.close()
                conn.close()
                return response(201, dict(row))
            
            elif method == 'PUT':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.update'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                data = json.loads(event.get('body', '{}'))
                dept_id = data.get('id')
                dept_req = CustomerDepartmentRequest(**data)
                
                if not dept_id:
                    conn.close()
                    return response(400, {'error': 'ID is required'})
                
                cur.execute(
                    f"UPDATE {SCHEMA}.customer_departments SET name = %s, description = %s WHERE id = %s RETURNING id, name, description",
                    (dept_req.name, dept_req.description, dept_id)
                )
                row = cur.fetchone()
                
                if not row:
                    conn.close()
                    return response(404, {'error': 'Department not found'})
                
                conn.commit()
                cur.close()
                conn.close()
                return response(200, dict(row))
            
            elif method == 'DELETE':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.delete'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                params = event.get('queryStringParameters', {})
                dept_id = params.get('id')
                
                if not dept_id:
                    conn.close()
                    return response(400, {'error': 'ID is required'})
                
                cur.execute(f'DELETE FROM {SCHEMA}.customer_departments WHERE id = %s', (dept_id,))
                conn.commit()
                
                cur.close()
                conn.close()
                return response(200, {'success': True})
        
        # Services
        elif endpoint == 'services':
            if method == 'GET':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.read'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                cur.execute(f"""
                    SELECT s.id, s.name, s.description, s.intermediate_approver_id, s.final_approver_id,
                           s.customer_department_id, s.category_id, s.legal_entity_id, s.contractor_id,
                           c.name as category_name, c.icon as category_icon,
                           cd.name as customer_department_name,
                           u1.username as intermediate_approver_name,
                           u2.username as final_approver_name,
                           le.name as legal_entity_name,
                           ct.name as contractor_name
                    FROM {SCHEMA}.services s
                    LEFT JOIN {SCHEMA}.categories c ON s.category_id = c.id
                    LEFT JOIN {SCHEMA}.customer_departments cd ON s.customer_department_id = cd.id
                    LEFT JOIN {SCHEMA}.users u1 ON s.intermediate_approver_id = u1.id
                    LEFT JOIN {SCHEMA}.users u2 ON s.final_approver_id = u2.id
                    LEFT JOIN {SCHEMA}.legal_entities le ON s.legal_entity_id = le.id
                    LEFT JOIN {SCHEMA}.contractors ct ON s.contractor_id = ct.id
                    ORDER BY s.name
                """)
                services = [dict(row) for row in cur.fetchall()]
                
                cur.close()
                conn.close()
                return response(200, services)
            
            elif method == 'POST':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.create'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                data = json.loads(event.get('body', '{}'))
                try:
                    svc_req = ServiceRequest(**data)
                except ValidationError as ve:
                    conn.close()
                    return response(400, {'error': ve.errors()[0]['msg'] if ve.errors() else 'Validation error'})
                
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.services 
                    (name, description, intermediate_approver_id, final_approver_id, customer_department_id, category_id, legal_entity_id, contractor_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, name, description, intermediate_approver_id, final_approver_id,
                              customer_department_id, category_id, legal_entity_id, contractor_id, created_at
                """, (svc_req.name, svc_req.description, svc_req.intermediate_approver_id, 
                      svc_req.final_approver_id, svc_req.customer_department_id, svc_req.category_id,
                      svc_req.legal_entity_id, svc_req.contractor_id))
                row = cur.fetchone()
                conn.commit()
                
                result = dict(row)
                if result.get('created_at'):
                    result['created_at'] = result['created_at'].isoformat()
                
                cur.close()
                conn.close()
                return response(201, result)
            
            elif method == 'PUT':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.update'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                data = json.loads(event.get('body', '{}'))
                svc_id = data.get('id')
                svc_req = ServiceRequest(**data)
                
                if not svc_id:
                    conn.close()
                    return response(400, {'error': 'ID is required'})
                
                cur.execute(f"""
                    UPDATE {SCHEMA}.services 
                    SET name = %s, description = %s, intermediate_approver_id = %s, final_approver_id = %s,
                        customer_department_id = %s, category_id = %s, legal_entity_id = %s, contractor_id = %s
                    WHERE id = %s
                """, (svc_req.name, svc_req.description, svc_req.intermediate_approver_id,
                      svc_req.final_approver_id, svc_req.customer_department_id, svc_req.category_id,
                      svc_req.legal_entity_id, svc_req.contractor_id, svc_id))
                
                if cur.rowcount == 0:
                    conn.close()
                    return response(404, {'error': 'Service not found'})
                
                conn.commit()
                
                cur.execute(f"""
                    SELECT s.id, s.name, s.description, s.intermediate_approver_id, s.final_approver_id,
                           s.customer_department_id, s.category_id, s.legal_entity_id, s.contractor_id,
                           c.name as category_name, c.icon as category_icon,
                           cd.name as customer_department_name,
                           u1.username as intermediate_approver_name,
                           u2.username as final_approver_name,
                           le.name as legal_entity_name,
                           ct.name as contractor_name
                    FROM {SCHEMA}.services s
                    LEFT JOIN {SCHEMA}.categories c ON s.category_id = c.id
                    LEFT JOIN {SCHEMA}.customer_departments cd ON s.customer_department_id = cd.id
                    LEFT JOIN {SCHEMA}.users u1 ON s.intermediate_approver_id = u1.id
                    LEFT JOIN {SCHEMA}.users u2 ON s.final_approver_id = u2.id
                    LEFT JOIN {SCHEMA}.legal_entities le ON s.legal_entity_id = le.id
                    LEFT JOIN {SCHEMA}.contractors ct ON s.contractor_id = ct.id
                    WHERE s.id = %s
                """, (svc_id,))
                row = cur.fetchone()
                
                cur.close()
                conn.close()
                return response(200, dict(row))
            
            elif method == 'DELETE':
                if not is_admin and not check_user_permission(conn, user_id, 'services.remove'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                params = event.get('queryStringParameters', {})
                svc_id = params.get('id')
                
                if not svc_id:
                    conn.close()
                    return response(400, {'error': 'ID is required'})
                
                cur.execute(f'UPDATE {SCHEMA}.payments SET service_id = NULL WHERE service_id = %s', (svc_id,))
                cur.execute(f'UPDATE {SCHEMA}.savings SET service_id = NULL WHERE service_id = %s', (svc_id,))
                cur.execute(f'UPDATE {SCHEMA}.tickets SET service_id = NULL WHERE service_id = %s', (svc_id,))
                cur.execute(f'UPDATE {SCHEMA}.planned_payments SET service_id = NULL WHERE service_id = %s', (svc_id,))
                cur.execute(f'DELETE FROM {SCHEMA}.services WHERE id = %s', (svc_id,))
                conn.commit()
                
                cur.close()
                conn.close()
                return response(200, {'success': True})
        
        # Custom Fields
        elif endpoint == 'custom-fields':
            if method == 'GET':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.read'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                cur.execute(f'SELECT id, name, field_type, options FROM {SCHEMA}.custom_fields ORDER BY name')
                fields = [dict(row) for row in cur.fetchall()]
                
                cur.close()
                conn.close()
                return response(200, fields)
            
            elif method == 'POST':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.create'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                data = json.loads(event.get('body', '{}'))
                field_req = CustomFieldRequest(**data)
                
                cur.execute(
                    f"INSERT INTO {SCHEMA}.custom_fields (name, field_type, options) VALUES (%s, %s, %s) RETURNING id, name, field_type, options",
                    (field_req.name, field_req.field_type, field_req.options)
                )
                row = cur.fetchone()
                conn.commit()
                
                cur.close()
                conn.close()
                return response(201, dict(row))
            
            elif method == 'PUT':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.update'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                data = json.loads(event.get('body', '{}'))
                field_id = data.get('id')
                field_req = CustomFieldRequest(**data)
                
                if not field_id:
                    conn.close()
                    return response(400, {'error': 'ID is required'})
                
                cur.execute(
                    f"UPDATE {SCHEMA}.custom_fields SET name = %s, field_type = %s, options = %s WHERE id = %s RETURNING id, name, field_type, options",
                    (field_req.name, field_req.field_type, field_req.options, field_id)
                )
                row = cur.fetchone()
                
                if not row:
                    conn.close()
                    return response(404, {'error': 'Custom field not found'})
                
                conn.commit()
                cur.close()
                conn.close()
                return response(200, dict(row))
            
            elif method == 'DELETE':
                if not is_admin and not check_user_permission(conn, user_id, 'payments.delete'):
                    conn.close()
                    return response(403, {'error': 'Forbidden'})
                
                params = event.get('queryStringParameters', {}) or {}
                field_id = params.get('id')
                
                if not field_id:
                    conn.close()
                    return response(400, {'error': 'ID is required'})
                
                try:
                    field_id_int = int(field_id)
                except (ValueError, TypeError):
                    conn.close()
                    return response(400, {'error': 'Invalid ID format'})
                
                cur.execute(f'DELETE FROM {SCHEMA}.custom_field_values WHERE custom_field_id = %s', (field_id_int,))
                cur.execute(f'DELETE FROM {SCHEMA}.custom_fields WHERE id = %s', (field_id_int,))
                conn.commit()
                
                cur.close()
                conn.close()
                return response(200, {'success': True})
        
        cur.close()
        conn.close()
        return response(404, {'error': f'Endpoint not found: {endpoint}'})
        
    except ValidationError as e:
        if conn:
            conn.close()
        return response(400, {'error': str(e)})
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        log(f"Error: {str(e)}")
        log(f"Traceback: {error_details}")
        if conn:
            conn.close()
        return response(500, {'error': str(e), 'details': error_details})