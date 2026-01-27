import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaService } from '../prisma/prisma.service';

// ✅ Список чувствительных полей, которые не должны логироваться
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apiKey', 'refreshToken', 'accessToken'];

/**
 * Санитизирует объект, удаляя чувствительные поля
 */
function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly prisma: PrismaService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorMessage =
      exception instanceof HttpException
        ? exception.message
        : exception instanceof Error
        ? exception.message
        : 'Unknown error';

    const errorType =
      exception instanceof Error ? exception.constructor.name : 'UnknownError';

    const stackTrace =
      exception instanceof Error ? exception.stack : undefined;

    if (status >= 500) {
      try {
        // ✅ FIX: Санитизируем body перед логированием
        const sanitizedBody = sanitizeObject(request.body);
        
        await this.prisma.errorLog.create({
          data: {
            service: 'users-service',
            errorType,
            errorMessage,
            stackTrace,
            userId: (request as any).user?.userId || null,
            userRole: (request as any).user?.role || null,
            requestUrl: request.url,
            requestMethod: request.method,
            ip: request.ip || (request.headers['x-forwarded-for'] as string) || null,
            userAgent: request.headers['user-agent'] as string || null,
            metadata: {
              body: sanitizedBody,
              params: request.params as Record<string, unknown>,
              query: request.query as Record<string, unknown>,
            } as Record<string, unknown>,
          },
        });
      } catch (dbError) {
        this.logger.error(`🔥 Failed to write error log to DB`, dbError);
      }
    }

    this.logger.error(
      `[users-service] ${request.method} ${request.url} - ${status} ${errorMessage}`,
      stackTrace,
    );

    response.status(status).send({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorMessage,
    });
  }
}

