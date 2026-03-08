import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from zoneinfo import ZoneInfo
from decimal import Decimal
from services import fetch_service_balance, calculate_status

def handler(event: dict, context) -> dict:
    '''API для мониторинга балансов сервисов - получение, обновление и управление интеграциями'''
    
    method = event.get('httpMethod', 'GET')
    path = event.get('pathParams', {})
    query = event.get('queryStringParameters', {})
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-Auth-Token, X-User-Id, X-Session-Id'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database connection not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'GET' and not path:
            return get_all_services(conn)
        elif method == 'POST' and query.get('action') == 'test':
            return test_connection(event)
        elif method == 'POST' and query.get('action') == 'refresh' and query.get('serviceId'):
            return refresh_service_balance(conn, int(query['serviceId']))
        elif method == 'POST':
            return create_service(conn, event)
        elif method == 'PUT' and query.get('serviceId'):
            return update_service(conn, int(query['serviceId']), event)
        elif method == 'DELETE' and query.get('serviceId'):
            return delete_service(conn, int(query['serviceId']))
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Endpoint not found'})
            }
    finally:
        conn.close()

def test_connection(event: dict) -> dict:
    '''Тестирование подключения к сервису перед добавлением'''
    raw_body = event.get('body', '{}')
    if isinstance(raw_body, str):
        body = json.loads(raw_body)
    else:
        body = raw_body
    
    service_name = body.get('service_name', 'Test Service')
    api_endpoint = body.get('api_endpoint')
    
    if not api_endpoint:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'api_endpoint is required', 'success': False})
        }
    
    try:
        balance = fetch_service_balance(service_name, api_endpoint, None)
        
        if balance is None:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': False,
                    'error': 'Не удалось получить баланс. Проверьте API ключи и настройки доступа.'
                })
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'balance': float(balance),
                'message': f'Подключение успешно! Текущий баланс: {balance}'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': False,
                'error': f'Ошибка подключения: {str(e)}'
            })
        }

def get_all_services(conn) -> dict:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT 
                id, service_name, balance, currency, status, 
                last_updated, api_endpoint, threshold_warning, 
                threshold_critical, auto_refresh, refresh_interval_minutes, description
            FROM service_balances
            ORDER BY service_name
        ''')
        services = cur.fetchall()
        
        services_list = []
        for service in services:
            service_dict = dict(service)
            service_dict['balance'] = float(service_dict['balance']) if service_dict['balance'] else 0
            service_dict['threshold_warning'] = float(service_dict['threshold_warning']) if service_dict['threshold_warning'] else None
            service_dict['threshold_critical'] = float(service_dict['threshold_critical']) if service_dict['threshold_critical'] else None
            if service_dict['last_updated']:
                service_dict['last_updated'] = service_dict['last_updated'].isoformat() + 'Z'
            else:
                service_dict['last_updated'] = None
            services_list.append(service_dict)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'services': services_list})
        }

def create_service(conn, event: dict) -> dict:
    raw_body = event.get('body', '{}')
    print(f"[DEBUG] Raw body type: {type(raw_body)}, value: {raw_body}")
    
    if isinstance(raw_body, str):
        if not raw_body or raw_body.strip() == '':
            raw_body = '{}'
        body = json.loads(raw_body)
    else:
        body = raw_body
    
    print(f"[DEBUG] Parsed body: {body}")
    
    required_fields = ['service_name', 'currency']
    for field in required_fields:
        if field not in body:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Missing required field: {field}'})
            }
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('SELECT id FROM service_balances WHERE service_name = %s', (body['service_name'],))
        existing = cur.fetchone()
        if existing:
            return {
                'statusCode': 409,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Сервис "{body["service_name"]}" уже добавлен в мониторинг'})
            }
        
        cur.execute('''
            INSERT INTO service_balances (
                service_name, balance, currency, status, 
                api_endpoint, api_key_secret_name, 
                threshold_warning, threshold_critical,
                auto_refresh, refresh_interval_minutes, description
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, service_name, balance, currency, status, last_updated, description
        ''', (
            body['service_name'],
            body.get('balance', 0),
            body['currency'],
            body.get('status', 'ok'),
            body.get('api_endpoint'),
            body.get('api_key_secret_name'),
            body.get('threshold_warning'),
            body.get('threshold_critical'),
            body.get('auto_refresh', False),
            body.get('refresh_interval_minutes', 60),
            body.get('description')
        ))
        
        service = cur.fetchone()
        conn.commit()
        
        service_dict = dict(service)
        service_dict['balance'] = float(service_dict['balance'])
        service_dict['last_updated'] = service_dict['last_updated'].isoformat()
        
        if body.get('api_endpoint') and body.get('api_key_secret_name'):
            try:
                from services import fetch_service_balance, calculate_status
                balance_data = fetch_service_balance(
                    body['service_name'],
                    body.get('api_endpoint'),
                    body.get('api_key_secret_name')
                )
                
                new_status = calculate_status(
                    balance_data['balance'],
                    body.get('threshold_warning'),
                    body.get('threshold_critical')
                )
                
                cur.execute('''
                    UPDATE service_balances 
                    SET balance = %s, currency = %s, status = %s, last_updated = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING balance, currency, status, last_updated
                ''', (balance_data['balance'], balance_data['currency'], new_status, service_dict['id']))
                
                updated = cur.fetchone()
                conn.commit()
                
                service_dict['balance'] = float(updated['balance'])
                service_dict['currency'] = updated['currency']
                service_dict['status'] = updated['status']
                service_dict['last_updated'] = updated['last_updated'].isoformat()
            except ValueError as e:
                error_msg = str(e)
                if 'not configured' in error_msg:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'error': f'Ошибка подключения: {error_msg}',
                            'hint': 'Добавьте секрет в настройках проекта перед созданием интеграции'
                        })
                    }
                print(f"[WARNING] Failed to fetch initial balance: {e}")
            except Exception as e:
                print(f"[WARNING] Failed to fetch initial balance: {e}")
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'service': service_dict})
        }

def update_service(conn, service_id: int, event: dict) -> dict:
    body = json.loads(event.get('body', '{}'))
    
    with conn.cursor() as cur:
        cur.execute('SELECT id FROM service_balances WHERE id = %s', (service_id,))
        if not cur.fetchone():
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Service not found'})
            }
        
        fields = []
        values = []
        
        if 'service_name' in body:
            fields.append('service_name = %s')
            values.append(body['service_name'])
        if 'balance' in body:
            fields.append('balance = %s')
            values.append(body['balance'])
        if 'currency' in body:
            fields.append('currency = %s')
            values.append(body['currency'])
        if 'status' in body:
            fields.append('status = %s')
            values.append(body['status'])
        if 'api_endpoint' in body:
            fields.append('api_endpoint = %s')
            values.append(body['api_endpoint'])
        if 'api_key_secret_name' in body:
            fields.append('api_key_secret_name = %s')
            values.append(body['api_key_secret_name'])
        if 'threshold_warning' in body:
            fields.append('threshold_warning = %s')
            values.append(body['threshold_warning'])
        if 'threshold_critical' in body:
            fields.append('threshold_critical = %s')
            values.append(body['threshold_critical'])
        if 'auto_refresh' in body:
            fields.append('auto_refresh = %s')
            values.append(body['auto_refresh'])
        if 'refresh_interval_minutes' in body:
            fields.append('refresh_interval_minutes = %s')
            values.append(body['refresh_interval_minutes'])
        if 'description' in body:
            fields.append('description = %s')
            values.append(body['description'])
        
        fields.append('updated_at = CURRENT_TIMESTAMP')
        values.append(service_id)
        
        cur.execute(f'''
            UPDATE service_balances 
            SET {', '.join(fields)}
            WHERE id = %s
        ''', values)
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True})
        }

def refresh_service_balance(conn, service_id: int) -> dict:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT id, service_name, api_endpoint, api_key_secret_name,
                   threshold_warning, threshold_critical, account_id
            FROM service_balances 
            WHERE id = %s
        ''', (service_id,))
        
        service = cur.fetchone()
        if not service:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Service not found'})
            }
        
        try:
            balance_data = fetch_service_balance(
                service['service_name'],
                service['api_endpoint'],
                service['api_key_secret_name'],
                service.get('account_id')
            )
            
            balance = balance_data['balance']
            currency = balance_data.get('currency', 'RUB')
            status = calculate_status(
                balance,
                float(service['threshold_warning']) if service['threshold_warning'] else None,
                float(service['threshold_critical']) if service['threshold_critical'] else None
            )
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Failed to fetch balance: {str(e)}'})
            }
        
        cur.execute('''
            UPDATE service_balances 
            SET balance = %s, 
                currency = %s,
                status = %s, 
                last_updated = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        ''', (balance, currency, status, service_id))
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'balance': balance,
                'currency': currency,
                'status': status
            })
        }

def delete_service(conn, service_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute('DELETE FROM service_balances WHERE id = %s', (service_id,))
        
        if cur.rowcount == 0:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Service not found'})
            }
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True})
        }