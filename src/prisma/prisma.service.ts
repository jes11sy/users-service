import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // ✅ ОПТИМИЗИРОВАНО: Users Service - низкая/средняя нагрузка
    // CRUD операции с пользователями, операторами, мастерами
    const databaseUrl = process.env.DATABASE_URL || '';
    const hasParams = databaseUrl.includes('?');
    
    const connectionParams = [
      'connection_limit=20',      // Умеренное значение для user management
      'pool_timeout=20',
      'connect_timeout=10',
      'socket_timeout=60',
    ];
    
    const needsParams = !databaseUrl.includes('connection_limit');
    const enhancedUrl = needsParams
      ? `${databaseUrl}${hasParams ? '&' : '?'}${connectionParams.join('&')}`
      : databaseUrl;

    super({
      datasources: {
        db: {
          url: enhancedUrl,
        },
      },
      log: [
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
      errorFormat: isDevelopment ? 'pretty' : 'minimal',
    });

    if (needsParams) {
      this.logger.log('✅ Connection pool configured: limit=20');
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
      
      // Проверка здоровья подключения
      await this.$queryRaw`SELECT 1`;
      this.logger.log('✅ Database health check passed');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('🔌 Database disconnected gracefully');
    } catch (error) {
      this.logger.error('❌ Error disconnecting from database', error);
    }
  }

  async enableShutdownHooks() {
    process.on('beforeExit', async () => {
      await this.$disconnect();
    });
  }
}


