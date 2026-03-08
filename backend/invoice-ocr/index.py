import json
import os
import base64
import boto3
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p61788166_html_to_frontend')
HEADERS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}


def handler(event: dict, context) -> dict:
    """Обработка финансовых документов: загрузка → Yandex GPT → сохранение в БД"""

    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-Auth-Token, X-User-Id, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method != 'POST':
        return resp(405, {'error': 'Method not allowed'})

    body = json.loads(event.get('body', '{}') or '{}')
    file_data = body.get('file')
    file_name = body.get('fileName', 'invoice.jpg')
    user_id = body.get('user_id')

    if not file_data:
        return resp(400, {'error': 'File data is required'})

    all_candidates = [
        os.environ.get('YANDEX_GPT_API_KEY', ''),
        os.environ.get('API_KEY', ''),
        os.environ.get('API_KEY_SECRET', ''),
        os.environ.get('FOLDER_ID', ''),
        os.environ.get('YANDEX_FOLDER_ID', ''),
    ]

    api_key = ''
    folder_id = ''
    for val in all_candidates:
        if not val:
            continue
        if val.startswith('AQV') or val.startswith('aje') or len(val) > 30:
            if not api_key:
                api_key = val
        elif val.startswith('b1g') and len(val) < 30:
            if not folder_id:
                folder_id = val

    if not api_key:
        return resp(500, {
            'error': 'Отсутствует API-ключ Yandex GPT. Необходимо сохранить ключ в переменной окружения с именем: YANDEX_GPT_API_KEY'
        })

    if not folder_id:
        folder_id = resolve_folder_id(api_key)
    if not folder_id:
        return resp(500, {'error': 'Не удалось определить FOLDER_ID для Yandex GPT'})

    # ===== ШАГ 1: Загрузка файла на сервер =====
    print(f"[STEP 1] Загрузка файла: {file_name}, user_id: {user_id}")

    if ',' in file_data:
        file_data = file_data.split(',')[1]
    file_bytes = base64.b64decode(file_data)

    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    s3_key = f'invoices/{timestamp}_{file_name}'
    content_type = 'application/pdf' if file_name.lower().endswith('.pdf') else 'image/jpeg'

    s3.put_object(Bucket='files', Key=s3_key, Body=file_bytes, ContentType=content_type)
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"

    upload_date = datetime.now().isoformat()
    print(f"[STEP 1] Файл сохранён: {cdn_url}, дата: {upload_date}, user_id: {user_id}")

    # ===== ШАГ 2: Отправка в Yandex GPT =====
    print(f"[STEP 2] Отправка в Yandex GPT, folder_id: {folder_id[:8]}...")

    ref_data = load_reference_data()

    categories_list = ', '.join([f'id={c["id"]} "{c["name"]}"' for c in ref_data['categories']])
    services_list = ', '.join([f'id={s["id"]} "{s["name"]}"' for s in ref_data['services']])
    departments_list = ', '.join([f'id={d["id"]} "{d["name"]}"' for d in ref_data['departments']])
    legal_entities_list = ', '.join([f'id={le["id"]} "{le["name"]}" ИНН:{le.get("inn","")}'.strip() for le in ref_data['legal_entities']])
    contractors_list = ', '.join([f'id={c["id"]} "{c["name"]}" ИНН:{c.get("inn","")}'.strip() for c in ref_data['contractors']])

    gpt_prompt = f"""Ты — финансовый аналитик. Проанализируй изображение счёта/финансового документа и извлеки данные.

Верни СТРОГО JSON с ТОЛЬКО этими полями:
{{
  "counterparty": {{"id": число_или_null, "name": "строка_или_null", "inn": "строка_или_null"}},
  "legal_entity": {{"id": число_или_null, "name": "строка_или_null", "inn": "строка_или_null"}},
  "invoice_number": "строка_или_null",
  "invoice_date": "YYYY-MM-DD_или_null",
  "purpose": "строка_или_null",
  "amount": число_или_null
}}

Правила:
1. counterparty — это ПОСТАВЩИК/ИСПОЛНИТЕЛЬ (кто выставил счёт). Попробуй сопоставить с существующими: [{contractors_list}]. Если нашёл совпадение по ИНН или названию — укажи id. Если не нашёл — id=null, но обязательно заполни name и inn.
2. legal_entity — это ПОКУПАТЕЛЬ/ЗАКАЗЧИК (кому выставлен счёт). Попробуй сопоставить с: [{legal_entities_list}]. Если нашёл — укажи id. Если нет — id=null, заполни name и inn.
3. invoice_number — номер счёта/документа.
4. invoice_date — дата документа в формате YYYY-MM-DD.
5. purpose — назначение платежа, описание за что выставлен счёт.
6. amount — итоговая сумма к оплате (число без валюты).

При отсутствии явных данных определи по контексту документа. Пустое значение null допустимо только при объективном отсутствии информации.

ВАЖНО: Верни ТОЛЬКО JSON без markdown-разметки, без комментариев, без дополнительного текста."""

    gpt_result = call_yandex_gpt(api_key, folder_id, gpt_prompt, file_data)

    if not gpt_result:
        return resp(200, {
            'file_url': cdn_url,
            'extracted_data': None,
            'step': 2,
            'warning': 'Yandex GPT не вернул результат'
        })

    print(f"[STEP 2] GPT ответ: {json.dumps(gpt_result, ensure_ascii=False)[:500]}")

    # ===== ШАГ 3: Сохранение в БД =====
    print("[STEP 3] Сохранение данных в БД")

    extracted = map_gpt_to_db(gpt_result, ref_data)
    print(f"[STEP 3] Mapped data: {json.dumps(extracted, ensure_ascii=False, default=str)}")

    return resp(200, {
        'file_url': cdn_url,
        'extracted_data': extracted,
        'gpt_raw': gpt_result
    })


def resp(status: int, body: dict) -> dict:
    return {
        'statusCode': status,
        'headers': HEADERS,
        'body': json.dumps(body, ensure_ascii=False, default=str),
        'isBase64Encoded': False
    }


def resolve_folder_id(api_key: str) -> str:
    try:
        r = requests.get(
            'https://resource-manager.api.cloud.yandex.net/resource-manager/v1/clouds',
            headers={'Authorization': f'Api-Key {api_key}'},
            timeout=10
        )
        if r.status_code != 200:
            print(f"[RESOLVE] clouds error: {r.status_code} {r.text[:200]}")
            return ''
        clouds = r.json().get('clouds', [])
        if not clouds:
            return ''
        cloud_id = clouds[0]['id']

        r2 = requests.get(
            f'https://resource-manager.api.cloud.yandex.net/resource-manager/v1/folders?cloudId={cloud_id}',
            headers={'Authorization': f'Api-Key {api_key}'},
            timeout=10
        )
        if r2.status_code != 200:
            return ''
        folders = r2.json().get('folders', [])
        for f in folders:
            if f.get('status') == 'ACTIVE':
                print(f"[RESOLVE] Found folder: {f['id']}")
                return f['id']
        if folders:
            return folders[0]['id']
    except Exception as e:
        print(f"[RESOLVE] Exception: {e}")
    return ''


def load_reference_data() -> dict:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)

    ref = {}
    queries = {
        'categories': f'SELECT id, name FROM {SCHEMA}.categories ORDER BY name',
        'services': f'SELECT id, name, category_id FROM {SCHEMA}.services ORDER BY name',
        'departments': f'SELECT id, name FROM {SCHEMA}.customer_departments ORDER BY name',
        'legal_entities': f'SELECT id, name, inn, kpp FROM {SCHEMA}.legal_entities WHERE is_active = true ORDER BY name',
        'contractors': f'SELECT id, name, inn, kpp FROM {SCHEMA}.contractors ORDER BY name',
    }

    for key, query in queries.items():
        cur.execute(query)
        ref[key] = [dict(row) for row in cur.fetchall()]

    cur.close()
    conn.close()
    return ref


def call_yandex_gpt(api_key: str, folder_id: str, prompt: str, image_base64: str) -> dict | None:
    url = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Api-Key {api_key}',
        'x-folder-id': folder_id
    }

    payload = {
        'modelUri': f'gpt://{folder_id}/yandexgpt/latest',
        'completionOptions': {
            'stream': False,
            'temperature': 0.1,
            'maxTokens': 2000
        },
        'messages': [
            {
                'role': 'user',
                'text': prompt,
                'image': {
                    'content': image_base64
                }
            }
        ]
    }

    try:
        r = requests.post(url, headers=headers, json=payload, timeout=60)
        print(f"[GPT] Status: {r.status_code}")

        if r.status_code != 200:
            print(f"[GPT ERROR] {r.text[:500]}")

            if r.status_code == 400 or 'image' in r.text.lower():
                print("[GPT] Trying text-only OCR fallback via Vision API...")
                ocr_text = run_vision_ocr(image_base64, api_key, folder_id)
                if ocr_text:
                    return call_gpt_text_only(api_key, folder_id, prompt, ocr_text)

            return None

        data = r.json()
        text = data.get('result', {}).get('alternatives', [{}])[0].get('message', {}).get('text', '')
        print(f"[GPT] Raw text: {text[:500]}")

        return parse_gpt_json(text)

    except Exception as e:
        print(f"[GPT EXCEPTION] {e}")
        return None


def run_vision_ocr(image_base64: str, api_key: str, folder_id: str) -> str:
    r = requests.post(
        'https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze',
        headers={'Authorization': f'Api-Key {api_key}', 'Content-Type': 'application/json'},
        json={
            'folderId': folder_id,
            'analyze_specs': [{
                'content': image_base64,
                'features': [{'type': 'TEXT_DETECTION', 'text_detection_config': {'language_codes': ['ru', 'en']}}]
            }]
        },
        timeout=30
    )

    if r.status_code != 200:
        print(f"[VISION ERROR] {r.status_code}: {r.text[:300]}")
        return ''

    data = r.json()
    full_text = ''

    try:
        pages = data['results'][0]['results'][0]['textDetection']['pages']
        for page in pages:
            for block in page.get('blocks', []):
                for line in block.get('lines', []):
                    words = [w.get('text', '') for w in line.get('words', [])]
                    full_text += ' '.join(words) + '\n'
    except (KeyError, IndexError) as e:
        print(f"[VISION PARSE] {e}")

    return full_text.strip()


def call_gpt_text_only(api_key: str, folder_id: str, original_prompt: str, ocr_text: str) -> dict | None:
    url = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'

    prompt_with_text = original_prompt + f"\n\nТекст документа (распознан через OCR):\n{ocr_text[:4000]}"

    payload = {
        'modelUri': f'gpt://{folder_id}/yandexgpt/latest',
        'completionOptions': {
            'stream': False,
            'temperature': 0.1,
            'maxTokens': 2000
        },
        'messages': [
            {
                'role': 'user',
                'text': prompt_with_text
            }
        ]
    }

    try:
        r = requests.post(url, headers={
            'Content-Type': 'application/json',
            'Authorization': f'Api-Key {api_key}',
            'x-folder-id': folder_id
        }, json=payload, timeout=60)

        print(f"[GPT TEXT] Status: {r.status_code}")

        if r.status_code != 200:
            print(f"[GPT TEXT ERROR] {r.text[:500]}")
            return None

        data = r.json()
        text = data.get('result', {}).get('alternatives', [{}])[0].get('message', {}).get('text', '')
        print(f"[GPT TEXT] Raw: {text[:500]}")
        return parse_gpt_json(text)

    except Exception as e:
        print(f"[GPT TEXT EXCEPTION] {e}")
        return None


def parse_gpt_json(text: str) -> dict | None:
    text = text.strip()
    if text.startswith('```'):
        lines = text.split('\n')
        lines = [l for l in lines if not l.strip().startswith('```')]
        text = '\n'.join(lines).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        import re
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    print(f"[GPT PARSE FAIL] Could not parse: {text[:300]}")
    return None


def map_gpt_to_db(gpt_data: dict, ref_data: dict) -> dict:
    result = {
        'amount': None,
        'invoice_number': None,
        'invoice_date': None,
        'description': None,
        'category_id': None,
        'service_id': None,
        'department_id': None,
        'legal_entity_id': None,
        'legal_entity_name': None,
        'legal_entity_inn': None,
        'contractor_id': None,
        'contractor_name': None,
        'contractor_inn': None,
    }

    result['amount'] = gpt_data.get('amount')
    result['invoice_number'] = gpt_data.get('invoice_number')
    result['invoice_date'] = gpt_data.get('invoice_date')
    result['description'] = gpt_data.get('purpose')

    counterparty = gpt_data.get('counterparty') or {}
    if isinstance(counterparty, dict):
        cp_id = counterparty.get('id')
        if cp_id and any(c['id'] == cp_id for c in ref_data['contractors']):
            result['contractor_id'] = cp_id
        else:
            if counterparty.get('inn'):
                for c in ref_data['contractors']:
                    if c.get('inn') and c['inn'].strip() == str(counterparty['inn']).strip():
                        result['contractor_id'] = c['id']
                        break
            if not result['contractor_id'] and counterparty.get('name'):
                result['contractor_name'] = counterparty['name']
                result['contractor_inn'] = counterparty.get('inn')

    legal_entity = gpt_data.get('legal_entity') or {}
    if isinstance(legal_entity, dict):
        le_id = legal_entity.get('id')
        if le_id and any(le['id'] == le_id for le in ref_data['legal_entities']):
            result['legal_entity_id'] = le_id
        else:
            if legal_entity.get('inn'):
                for le in ref_data['legal_entities']:
                    if le.get('inn') and le['inn'].strip() == str(legal_entity['inn']).strip():
                        result['legal_entity_id'] = le['id']
                        break
            if not result['legal_entity_id'] and legal_entity.get('name'):
                result['legal_entity_name'] = legal_entity['name']
                result['legal_entity_inn'] = legal_entity.get('inn')

    if result['description']:
        desc_lower = result['description'].lower()
        best_svc = None
        best_score = 0
        for svc in ref_data['services']:
            svc_words = [w.lower() for w in svc['name'].split() if len(w) >= 3]
            if not svc_words:
                continue
            matched = sum(1 for w in svc_words if w in desc_lower)
            score = matched / len(svc_words)
            if score > best_score and score >= 0.3:
                best_score = score
                best_svc = svc
        if best_svc:
            result['service_id'] = best_svc['id']
            if best_svc.get('category_id'):
                result['category_id'] = best_svc['category_id']

    return result