import json
import os
import psycopg2
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    '''API для получения данных дашборда с реальной статистикой из БД'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-Auth-Token, X-User-Id, X-Session-Id'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    conn = None
    try:
        dsn = os.environ.get('DATABASE_URL')
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        # KPI: Активные источники (сервисы)
        cur.execute(f'''
            SELECT COUNT(DISTINCT service_id) 
            FROM {schema}.payments 
            WHERE service_id IS NOT NULL
        ''')
        active_services = cur.fetchone()[0] or 0
        
        # KPI: Операций за последние 30 дней
        cur.execute(f'''
            SELECT COUNT(*) 
            FROM {schema}.payments 
            WHERE payment_date >= CURRENT_DATE - INTERVAL '30 days'
        ''')
        operations_count = cur.fetchone()[0] or 0
        
        # KPI: Счетов за последние 30 дней (с invoice_number)
        cur.execute(f'''
            SELECT COUNT(*) 
            FROM {schema}.payments 
            WHERE invoice_number IS NOT NULL 
            AND payment_date >= CURRENT_DATE - INTERVAL '30 days'
        ''')
        invoices_count = cur.fetchone()[0] or 0
        
        # KPI: Счетов ожидают согласования
        cur.execute(f'''
            SELECT COUNT(*) 
            FROM {schema}.payments 
            WHERE status = 'pending_approval'
        ''')
        pending_count = cur.fetchone()[0] or 0
        
        # График активности за 30 дней
        cur.execute(f'''
            SELECT 
                DATE(payment_date) as date,
                COUNT(*) as count
            FROM {schema}.payments
            WHERE payment_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(payment_date)
            ORDER BY date ASC
        ''')
        activity_data = []
        activity_rows = cur.fetchall()
        
        # Заполняем пробелы в датах
        if activity_rows:
            start_date = datetime.now().date() - timedelta(days=29)
            date_map = {row[0]: row[1] for row in activity_rows}
            
            for i in range(30):
                current_date = start_date + timedelta(days=i)
                activity_data.append({
                    'date': current_date.isoformat(),
                    'value': date_map.get(current_date, 0)
                })
        else:
            # Если нет данных, показываем пустые даты
            start_date = datetime.now().date() - timedelta(days=29)
            for i in range(30):
                current_date = start_date + timedelta(days=i)
                activity_data.append({
                    'date': current_date.isoformat(),
                    'value': 0
                })
        
        # Последние события
        cur.execute(f'''
            SELECT 
                p.id,
                p.status,
                p.amount,
                p.invoice_number,
                p.payment_date,
                p.created_at,
                le.name as legal_entity,
                c.name as contractor
            FROM {schema}.payments p
            LEFT JOIN {schema}.legal_entities le ON p.legal_entity_id = le.id
            LEFT JOIN {schema}.contractors c ON p.contractor_id = c.id
            ORDER BY p.created_at DESC
            LIMIT 5
        ''')
        
        recent_events = []
        for row in cur.fetchall():
            payment_id, status, amount, invoice_num, payment_date, created_at, legal_entity, contractor = row
            
            if status == 'approved':
                event_type = 'approval'
                title = f'Счёт #{invoice_num or payment_id} согласован'
            elif status == 'pending_approval':
                event_type = 'pending'
                title = f'Счёт #{invoice_num or payment_id} на согласовании'
            else:
                event_type = 'payment'
                title = f'Создан счёт #{invoice_num or payment_id}'
            
            description = f'{amount:,.2f} ₽'
            if contractor:
                description += f' для {contractor}'
            
            recent_events.append({
                'id': str(payment_id),
                'type': event_type,
                'title': title,
                'description': description,
                'timestamp': created_at.isoformat() if created_at else datetime.now().isoformat(),
                'detailsLink': '/payments'
            })
        
        cur.close()
        conn.close()
        
        # Формируем ответ
        dashboard_data = {
            'state': 'ready',
            'kpis': [
                {
                    'id': 'sources',
                    'title': 'Активные источники',
                    'value': active_services,
                    'icon': 'Database'
                },
                {
                    'id': 'operations',
                    'title': 'Операций за период',
                    'value': operations_count,
                    'icon': 'Activity'
                },
                {
                    'id': 'invoices',
                    'title': 'Счетов за период',
                    'value': invoices_count,
                    'icon': 'FileText'
                },
                {
                    'id': 'pending',
                    'title': 'Ожидают согласования',
                    'value': pending_count,
                    'icon': 'Clock'
                }
            ],
            'systemStatus': {
                'status': 'healthy' if pending_count == 0 else 'warning',
                'message': 'Система работает в штатном режиме',
                'alerts': [
                    {
                        'id': '1',
                        'type': 'info',
                        'title': f'{pending_count} счетов ожидают согласования',
                        'description': 'Проверьте раздел "Ожидают согласования"',
                        'timestamp': datetime.now().isoformat()
                    }
                ] if pending_count > 0 else []
            },
            'activity': activity_data,
            'recentEvents': recent_events,
            'lastUpdate': datetime.now().isoformat()
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(dashboard_data, ensure_ascii=False)
        }
        
    except Exception as e:
        if conn:
            conn.close()
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Failed to load dashboard data',
                'details': str(e)
            })
        }