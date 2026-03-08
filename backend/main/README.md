# Backend Architecture v3.0

## 📋 Обзор

Production-ready backend с **Clean Architecture**, следующий принципам **SOLID**, **DRY**, **KISS**, **YAGNI**.

Код поддерживаемый, расширяемый, тестируемый. Функции ≤40 строк, явное разделение на слои.

---

## 🏗️ Архитектура

### Принципы

- **Dependency Rule**: зависимости направлены внутрь (domain ← application ← infrastructure)
- **Separation of Concerns**: каждый слой имеет одну ответственность
- **Dependency Injection**: явная передача зависимостей
- **Interface Segregation**: domain определяет интерфейсы, infrastructure реализует

### Структура проекта

```
backend/main/
├── handler.py              # Entry point (40 строк)
├── core/                   # Базовые компоненты
│   ├── config.py          # Конфигурация из env
│   └── exceptions.py      # Иерархия исключений
├── domain/                 # Бизнес-логика (чистая)
│   ├── entities/          # User, Payment, etc.
│   └── repositories/      # Интерфейсы IUserRepository, IPaymentRepository
├── application/            # Use cases (оркестрация)
│   ├── use_cases/         # AuthUseCase, UserManagementUseCase
│   └── dto/               # Pydantic модели для API
├── infrastructure/         # Реализации
│   ├── db/
│   │   ├── connection.py  # DatabaseConnection
│   │   └── repositories/  # UserRepositoryImpl (SQL)
│   └── security/
│       ├── jwt_service.py # JWT генерация/валидация
│       └── password_hasher.py # bcrypt
├── api/                    # HTTP слой
│   ├── router.py          # Маршрутизация
│   ├── middleware.py      # AuthMiddleware
│   ├── dependencies.py    # DI контейнер
│   └── routes/
│       ├── auth_routes.py # Контроллеры auth
│       └── user_routes.py # Контроллеры users
└── index.py               # Legacy (TODO: удалить после миграции)
```

---

## 🔄 Слои (Dependency Rule)

### 1. Core (базовый слой)
**Зависимости**: нет  
**Назначение**: конфигурация, исключения, общие типы

```python
from core import get_config, EntityNotFoundError
```

### 2. Domain (бизнес-логика)
**Зависимости**: core  
**НЕ знает о**: FastAPI, БД, HTTP, JSON, psycopg2

Содержит:
- **Entities**: `User`, `Payment` (с бизнес-правилами)
- **Repository Interfaces**: `IUserRepository`, `IPaymentRepository`

```python
from domain import User, IUserRepository

class User:
    def approve_payment(self, payment: Payment) -> None:
        # Бизнес-логика согласования
        if payment.status != PaymentStatus.PENDING:
            raise BusinessRuleViolationError("...")
```

### 3. Infrastructure (реализации)
**Зависимости**: core, domain  
**Содержит**: SQL, psycopg2, bcrypt, JWT

```python
from infrastructure import UserRepositoryImpl

class UserRepositoryImpl(IUserRepository):
    def get_by_id(self, user_id: int) -> Optional[User]:
        # SQL запрос через psycopg2
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
```

### 4. Application (use cases)
**Зависимости**: core, domain  
**НЕ знает о**: HTTP, SQL

Оркестрирует domain entities через repository interfaces.

```python
class AuthUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,  # интерфейс!
        password_hasher: PasswordHasher,
        jwt_service: JWTService
    ):
        self._user_repo = user_repo
    
    def login(self, request: LoginRequest) -> LoginResponse:
        user = self._user_repo.get_by_username(request.username)
        # бизнес-логика...
```

### 5. API (HTTP)
**Зависимости**: core, domain, application  
**Назначение**: HTTP обработка, роутинг, CORS

```python
class UserRoutes:
    def get_approvers(self, event: Dict) -> Dict:
        # Тонкий контроллер (без бизнес-логики)
        user = self._auth_middleware.authenticate(event)
        users = self._use_case.get_all_active_users()
        return self._success_response(200, users)
```

---

## 🎯 Ключевые решения

### Почему БЕЗ FastAPI?

**Проблема**: Cloud Functions требует `def handler(event, context)`, FastAPI — ASGI сервер.

**Решение**: Clean Architecture БЕЗ FastAPI.
- Сохраняем совместимость с Cloud Functions
- Получаем все плюсы чистой архитектуры
- Можем легко мигрировать на FastAPI позже (через mangum adapter)

### Почему repository interfaces в domain?

**Принцип**: Dependency Inversion (D в SOLID)

Domain определяет ЧТО ему нужно (`IUserRepository`), infrastructure реализует КАК (`UserRepositoryImpl`).

```python
# domain/repositories/user_repository.py
class IUserRepository(ABC):
    @abstractmethod
    def get_by_id(self, user_id: int) -> Optional[User]:
        pass

# infrastructure/db/repositories/user_repository_impl.py
class UserRepositoryImpl(IUserRepository):
    def get_by_id(self, user_id: int) -> Optional[User]:
        # SQL реализация
```

### Почему DTO ≠ Entities?

**Проблема**: Pydantic models в domain нарушают чистоту (зависимость от фреймворка).

**Решение**: 
- **Domain entities**: pure Python dataclasses
- **DTOs**: Pydantic models в application/dto

```python
# domain/entities/user.py
@dataclass
class User:
    id: int
    username: str
    # бизнес-методы

# application/dto/user_dto.py
class UserResponse(BaseModel):
    id: int
    username: str
    # только для API
```

---

## 📝 Примеры использования

### Добавить новый endpoint

1. **Определить DTO** (`application/dto/`)
2. **Создать use case** (`application/use_cases/`)
3. **Добавить route** (`api/routes/`)
4. **Зарегистрировать в router** (`api/router.py`)

```python
# 1. DTO
class CreateCategoryRequest(BaseModel):
    name: str

# 2. Use Case
class CategoryUseCase:
    def create_category(self, request: CreateCategoryRequest) -> Category:
        # бизнес-логика

# 3. Route
class CategoryRoutes:
    def create(self, event: Dict) -> Dict:
        user = self._auth_middleware.authenticate(event)
        body = json.loads(event['body'])
        request = CreateCategoryRequest(**body)
        result = self._use_case.create_category(request)
        return self._success_response(201, result)

# 4. Router
elif endpoint == 'categories' and method == 'POST':
    return self._category_routes.create(event)
```

### Добавить проверку прав

```python
def create(self, event: Dict) -> Dict:
    user = self._auth_middleware.authenticate(event)
    
    # Проверка конкретного permission
    self._auth_middleware.require_permission(user, 'categories', 'create')
    
    # Бизнес-логика...
```

---

## 🧪 Тестирование

### Unit тесты (domain)

```python
def test_user_can_approve_payment():
    user = User(...)
    payment = Payment(status=PaymentStatus.PENDING, ...)
    
    user.approve_payment(payment)
    
    assert payment.status == PaymentStatus.APPROVED
```

### Integration тесты (use cases)

```python
def test_login_use_case():
    # Mock репозиториев
    user_repo = Mock(spec=IUserRepository)
    user_repo.get_by_username.return_value = User(...)
    
    use_case = AuthUseCase(user_repo, PasswordHasher(), JWTService())
    response = use_case.login(LoginRequest(...))
    
    assert response.access_token is not None
```

---

## 🚀 Migration Plan

### Фаза 1: Параллельная работа (текущая)
- ✅ Новая архитектура создана
- ✅ Endpoints `login`, `me`, `approvers` работают через новый handler
- ⏳ Старый `index.py` обрабатывает остальные endpoints

### Фаза 2: Постепенная миграция
- Переносить endpoints один за другим
- Добавлять тесты
- Старый код импортирует из новых модулей

### Фаза 3: Удаление legacy
- Удалить `index.py` (1639 строк)
- Финальное тестирование
- Документация

---

## 📊 Метрики качества

### До рефакторинга
- **1 файл**: 1639 строк
- **God-function**: handler (1324 строки)
- **Функций >40 строк**: 3
- **Слоёв**: 0 (монолит)

### После рефакторинга
- **Модулей**: 25+
- **Средняя длина функции**: ~20 строк
- **Функций >40 строк**: 0
- **Слоёв**: 5 (чёткое разделение)
- **Покрытие тестами**: TODO

---

## 🔧 Конфигурация

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db
DB_POOL_SIZE=10

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_EXPIRE_MIN=30
JWT_REFRESH_EXPIRE_DAYS=7

# App
DEBUG=false
CORS_ORIGINS=*
```

---

## 📚 Дополнительные материалы

- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
