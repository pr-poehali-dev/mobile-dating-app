"""API для статистики и дашбордов"""
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
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    API для статистики и дашбордов.
    
    Endpoints:
    - GET /stats - общая статистика
    - GET /dashboard-stats - статистика для дашборда
    - GET /budget-breakdown - детализация бюджета
    
    Query params:
    - date_from: фильтр от даты (YYYY-MM-DD)
    - date_to: фильтр по дату (YYYY-MM-DD)
    """
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    
    # CORS preflight
    if method == 'OPTIONS':
        return response(200, {})
    
    if method != 'GET':
        return response(405, {'error': 'Method not allowed'})
    
    # Параметры фильтрации по периоду
    params = event.get('queryStringParameters') or {}
    date_from = params.get('date_from')
    date_to = params.get('date_to')
    
    conn = psycopg2.connect(DSN)
    
    try:
        payload, error = verify_token(event, conn)
        if error:
            return error
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Общая статистика
        cur.execute(f"""
            SELECT 
                COUNT(*) as total_payments,
                COALESCE(SUM(amount), 0) as total_amount,
                COUNT(CASE WHEN status = 'pending_approval' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
                COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count
            FROM {SCHEMA}.payments
        """)
        
        general_stats = dict(cur.fetchone())
        
        # Топ категорий
        cur.execute(f"""
            SELECT c.name, c.icon, COALESCE(SUM(p.amount), 0) as total_amount
            FROM {SCHEMA}.categories c
            LEFT JOIN {SCHEMA}.payments p ON c.id = p.category_id
            GROUP BY c.id, c.name, c.icon
            ORDER BY total_amount DESC
            LIMIT 10
        """)
        
        top_categories = [dict(row) for row in cur.fetchall()]
        
        # Топ-5 платежей с фильтром по периоду
        period_filter_top = ""
        if date_from and date_to:
            period_filter_top = f"AND p.payment_date >= '{date_from}' AND p.payment_date <= '{date_to}'"
        
        cur.execute(f"""
            SELECT 
                p.id,
                p.description,
                p.amount,
                c.name as category_name,
                c.icon as category_icon,
                s.name as service_name,
                p.status
            FROM {SCHEMA}.payments p
            LEFT JOIN {SCHEMA}.categories c ON p.category_id = c.id
            LEFT JOIN {SCHEMA}.services s ON p.service_id = s.id
            WHERE p.status IN ('approved', 'paid')
            {period_filter_top}
            ORDER BY p.amount DESC
            LIMIT 5
        """)
        
        top_payments = [dict(row) for row in cur.fetchall()]
        
        # Средняя скорость согласования (в часах) с фильтром по периоду
        period_filter_speed = ""
        if date_from and date_to:
            period_filter_speed = f"AND ceo_approved_at::date >= '{date_from}' AND ceo_approved_at::date <= '{date_to}'"
        
        cur.execute(f"""
            SELECT 
                AVG(EXTRACT(EPOCH FROM (ceo_approved_at - submitted_at)) / 3600) as avg_hours,
                COUNT(*) as total_approved
            FROM {SCHEMA}.payments
            WHERE status = 'approved' 
            AND submitted_at IS NOT NULL 
            AND ceo_approved_at IS NOT NULL
            {period_filter_speed}
        """)
        
        approval_speed = dict(cur.fetchone())
        
        # Средняя скорость за прошлый месяц для сравнения
        cur.execute(f"""
            SELECT 
                AVG(EXTRACT(EPOCH FROM (ceo_approved_at - submitted_at)) / 3600) as avg_hours
            FROM {SCHEMA}.payments
            WHERE status = 'approved' 
            AND submitted_at IS NOT NULL 
            AND ceo_approved_at IS NOT NULL
            AND ceo_approved_at >= CURRENT_DATE - INTERVAL '2 months'
            AND ceo_approved_at < CURRENT_DATE - INTERVAL '1 month'
        """)
        
        prev_month_speed = dict(cur.fetchone())
        
        # Динамика по месяцам
        cur.execute(f"""
            SELECT 
                TO_CHAR(payment_date, 'YYYY-MM') as month,
                COALESCE(SUM(amount), 0) as total_amount
            FROM {SCHEMA}.payments
            WHERE payment_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY TO_CHAR(payment_date, 'YYYY-MM')
            ORDER BY month
        """)
        
        monthly_trend = [dict(row) for row in cur.fetchall()]
        
        # Статистика по экономиям
        cur.execute(f"""
            SELECT 
                COUNT(*) as total_savings_count,
                SUM(CASE 
                    WHEN frequency = 'once' THEN amount
                    WHEN frequency = 'monthly' THEN amount * 12
                    WHEN frequency = 'quarterly' THEN amount * 4
                    WHEN frequency = 'yearly' THEN amount
                    ELSE 0
                END) as total_annual_savings
            FROM {SCHEMA}.savings
        """)
        
        savings_stats = dict(cur.fetchone())
        
        # Активные пользователи (создавшие хотя бы 1 платёж за последние 30 дней)
        cur.execute(f"""
            SELECT COUNT(DISTINCT created_by) as active_users
            FROM {SCHEMA}.payments
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        """)
        
        active_users_stat = dict(cur.fetchone())
        
        # Пользователи по отделам (на основе платежей за последние 30 дней)
        cur.execute(f"""
            SELECT 
                COALESCE(d.name, 'Без отдела') as department_name,
                COUNT(DISTINCT p.created_by) as user_count
            FROM {SCHEMA}.payments p
            LEFT JOIN {SCHEMA}.customer_departments d ON p.department_id = d.id
            WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY d.name
            ORDER BY user_count DESC
            LIMIT 5
        """)
        
        department_users = [dict(row) for row in cur.fetchall()]
        
        cur.close()
        
        return response(200, {
            'general': general_stats,
            'top_categories': top_categories,
            'top_payments': top_payments,
            'approval_speed': approval_speed,
            'prev_month_speed': prev_month_speed,
            'active_users': active_users_stat,
            'department_users': department_users,
            'monthly_trend': monthly_trend,
            'savings': savings_stats
        })
    
    finally:
        conn.close()