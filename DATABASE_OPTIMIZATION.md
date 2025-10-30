# Оптимизация подключения к базе данных

## Connection Pooling для Prisma

### Рекомендуемые настройки DATABASE_URL

```env
DATABASE_URL="postgresql://user:password@host:5432/users_db?connection_limit=10&pool_timeout=20&connect_timeout=10"
```

### Параметры:

1. **connection_limit** (default: без ограничений)
   - Development: 5-10
   - Production: 10-20
   - High-load: 20-50
   - Зависит от количества одновременных запросов

2. **pool_timeout** (default: 10 секунд)
   - Рекомендуется: 20-30 секунд
   - Время ожидания свободного соединения из пула

3. **connect_timeout** (default: 5 секунд)
   - Рекомендуется: 10 секунд
   - Время ожидания при подключении к БД

### Расчет оптимального количества соединений

Формула: `connection_limit = (cpu_count * 2) + disk_count`

Для большинства приложений:
- 1 instance: 10 connections
- 2-3 instances: 5-7 connections на instance
- 4+ instances: 3-5 connections на instance

### Мониторинг

Отслеживайте метрики:
- Количество активных соединений
- Время ожидания соединения
- Количество таймаутов
- CPU и Memory usage PostgreSQL

## Индексы базы данных

### Созданные индексы:

**Master:**
- `statusWork` - для фильтрации по статусу
- `name` - для поиска по имени
- `dateCreate` - для сортировки по дате

**Director:**
- `name` - для поиска
- `dateCreate` - для сортировки

**CallcentreOperator:**
- `statusWork` - для фильтрации
- `name` - для поиска
- `dateCreate` - для сортировки

### Применение индексов:

```bash
# Генерация миграции
npx prisma migrate dev --name add_performance_indexes

# Применение в production
npx prisma migrate deploy
```

## Дополнительные оптимизации

### 1. Включение логирования медленных запросов в PostgreSQL

```sql
-- В postgresql.conf
log_min_duration_statement = 1000  -- логировать запросы > 1 секунды
```

### 2. Анализ запросов

```sql
-- Посмотреть план выполнения
EXPLAIN ANALYZE SELECT * FROM master WHERE status_work = 'Работает';

-- Статистика по индексам
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 3. Vacuum и Analyze

```sql
-- Регулярная очистка и обновление статистики
VACUUM ANALYZE master;
VACUUM ANALYZE director;
VACUUM ANALYZE callcentre_operator;
```

## Best Practices

1. ✅ Используйте индексы для часто фильтруемых полей
2. ✅ Ограничивайте количество соединений
3. ✅ Настраивайте таймауты в зависимости от нагрузки
4. ✅ Мониторьте производительность БД
5. ✅ Регулярно обновляйте статистику (ANALYZE)
6. ⚠️ Не создавайте избыточные индексы (замедляют INSERT/UPDATE)
7. ⚠️ Избегайте N+1 запросов (используйте include/select)

