# Users Service

Микросервис для управления пользователями (Masters, Directors, Call Centre Operators/Admins).

## Функционал

### Masters
- CRUD операции для мастеров
- Фильтрация по городам и статусам
- Загрузка документов (договоры, паспорта)

### Directors
- CRUD операции для директоров
- Управление правами доступа

### Operators
- CRUD операции для операторов и администраторов call-центра
- Разделение на два типа: admin и operator

## API Endpoints

- `GET /api/v1/masters` - Получить всех мастеров
- `POST /api/v1/masters` - Создать мастера
- `PUT /api/v1/masters/:id` - Обновить мастера
- `DELETE /api/v1/masters/:id` - Удалить мастера

- `GET /api/v1/directors` - Получить всех директоров
- `POST /api/v1/directors` - Создать директора

- `GET /api/v1/operators?type=admin` - Получить операторов
- `POST /api/v1/operators` - Создать оператора

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-secret
PORT=5005
```

## Docker

```bash
docker build -t users-service .
docker run -p 5005:5005 users-service
```















