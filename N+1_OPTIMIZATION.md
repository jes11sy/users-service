# Оптимизация N+1 проблемы

## Текущее состояние

### ✅ Уже оптимизировано в MastersService.getEmployees()

```typescript
// Используется Promise.all для параллельного выполнения запросов
const [masters, directors] = await Promise.all([
  this.prisma.master.findMany({...}),
  this.prisma.director.findMany({...}),
]);
```

**Преимущества:**
- Запросы выполняются параллельно, а не последовательно
- Время ответа = max(query1_time, query2_time) вместо query1_time + query2_time
- Использование Promise.all оптимально для независимых запросов

## Дополнительные рекомендации

### 1. Использование Prisma include для связанных данных

Вместо:
```typescript
// ❌ N+1 проблема
const masters = await prisma.master.findMany();
for (const master of masters) {
  const orders = await prisma.order.findMany({ 
    where: { masterId: master.id } 
  });
}
```

Используйте:
```typescript
// ✅ Один запрос с JOIN
const masters = await prisma.master.findMany({
  include: {
    orders: true,
  },
});
```

### 2. Кеширование для часто запрашиваемых данных

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class MastersService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getMasters(query: any) {
    const cacheKey = `masters:${JSON.stringify(query)}`;
    
    // Проверяем кеш
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Запрос к БД
    const result = await this.prisma.master.findMany({...});
    
    // Сохраняем в кеш на 5 минут
    await this.cacheManager.set(cacheKey, result, 300);
    
    return result;
  }
}
```

### 3. Использование DataLoader для batch запросов

```typescript
import DataLoader from 'dataloader';

// Создаем DataLoader для загрузки мастеров по ID
const masterLoader = new DataLoader(async (ids: number[]) => {
  const masters = await prisma.master.findMany({
    where: { id: { in: ids } },
  });
  
  // Сортируем результаты в том же порядке, что и ids
  return ids.map(id => masters.find(m => m.id === id));
});

// Использование
const master1 = await masterLoader.load(1);
const master2 = await masterLoader.load(2);
// Будет выполнен только ОДИН запрос в БД для обоих ID
```

### 4. Pagination для больших списков

```typescript
async getMasters(query: any, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const [masters, total] = await Promise.all([
    this.prisma.master.findMany({
      where: {...},
      skip,
      take: limit,
      orderBy: { dateCreate: 'desc' },
    }),
    this.prisma.master.count({ where: {...} }),
  ]);

  return {
    data: masters,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

## Настройка кеширования

### Установка зависимостей

```bash
npm install @nestjs/cache-manager cache-manager
npm install cache-manager-redis-store redis
```

### Настройка модуля

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 300, // 5 минут по умолчанию
    }),
  ],
})
export class AppModule {}
```

## Мониторинг производительности

### Добавление interceptor для отслеживания времени запросов

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        
        if (duration > 1000) {
          this.logger.warn(`Slow request: ${method} ${url} took ${duration}ms`);
        } else {
          this.logger.debug(`${method} ${url} completed in ${duration}ms`);
        }
      }),
    );
  }
}
```

## Best Practices

1. ✅ Используйте `Promise.all()` для параллельных независимых запросов
2. ✅ Используйте `include` вместо множественных `findUnique`
3. ✅ Добавьте pagination для всех списочных эндпоинтов
4. ✅ Кешируйте часто запрашиваемые данные
5. ✅ Мониторьте медленные запросы
6. ⚠️ Не загружайте связанные данные если они не нужны
7. ⚠️ Избегайте глубоких nested includes (> 2 уровней)
8. ⚠️ Используйте select для ограничения возвращаемых полей

## Метрики для отслеживания

- Среднее время ответа API endpoints
- Количество запросов к БД на endpoint
- Cache hit/miss ratio
- Количество медленных запросов (>1s)
- Использование памяти и CPU

