import json
from datetime import datetime
from zoneinfo import ZoneInfo

def handler(event: dict, context) -> dict:
    """Тестовая функция для проверки деплоя и времени"""
    
    # UTC время
    utc_now = datetime.now(ZoneInfo('UTC'))
    
    # Московское время
    moscow_now = datetime.now(ZoneInfo('Europe/Moscow'))
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps({
            'status': 'ok',
            'version': '1.0.0',
            'utc_time': utc_now.isoformat(),
            'moscow_time': moscow_now.isoformat(),
            'moscow_time_formatted': moscow_now.strftime('%d.%m.%Y %H:%M:%S')
        }),
        'isBase64Encoded': False
    }