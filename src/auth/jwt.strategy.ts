import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { USER_EXISTS_CACHE_TTL, USER_EXISTS_CACHE_MAX_SIZE } from '../config/security.config';

interface JwtPayload {
  sub: number;
  login: string;
  role: 'master' | 'director' | 'admin' | 'callcentre_admin' | 'callcentre_operator';
  cities?: string[];
  iat?: number;
  exp?: number;
}

interface CacheEntry {
  exists: boolean;
  timestamp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  
  // ✅ FIX: In-memory кэш для проверки существования пользователей
  // Снижает нагрузку на БД при частых запросах с одним токеном
  private userExistsCache = new Map<string, CacheEntry>();

  constructor(private prisma: PrismaService) {
    // Проверяем наличие и длину JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    if (jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    // Валидация обязательных полей
    if (!payload.sub || !payload.login || !payload.role) {
      this.logger.warn(`Invalid JWT payload: missing required fields`);
      throw new UnauthorizedException('Invalid token payload');
    }

    // Проверка валидности роли
    const validRoles = ['master', 'director', 'admin', 'callcentre_admin', 'callcentre_operator'];
    if (!validRoles.includes(payload.role)) {
      this.logger.warn(`Invalid role in JWT: ${payload.role}`);
      throw new UnauthorizedException('Invalid role in token');
    }

    // Проверяем существование пользователя в БД (с кэшированием)
    const userExists = await this.validateUserExistsCached(payload.sub, payload.role);
    
    if (!userExists) {
      this.logger.warn(`User not found: id=${payload.sub}, role=${payload.role}`);
      throw new UnauthorizedException('User not found');
    }

    return {
      userId: payload.sub,
      login: payload.login,
      role: payload.role,
      cities: payload.cities,
    };
  }

  /**
   * Проверяет существование пользователя с кэшированием результата
   */
  private async validateUserExistsCached(userId: number, role: string): Promise<boolean> {
    const cacheKey = `${role}:${userId}`;
    const now = Date.now();
    
    // Проверяем кэш
    const cached = this.userExistsCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < USER_EXISTS_CACHE_TTL) {
      return cached.exists;
    }
    
    // Запрашиваем из БД
    const exists = await this.validateUserExists(userId, role);
    
    // Очищаем кэш если превышен лимит
    if (this.userExistsCache.size >= USER_EXISTS_CACHE_MAX_SIZE) {
      this.cleanupCache();
    }
    
    // Сохраняем в кэш
    this.userExistsCache.set(cacheKey, { exists, timestamp: now });
    
    return exists;
  }

  /**
   * Удаляет устаревшие записи из кэша
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.userExistsCache.entries()) {
      if (now - entry.timestamp >= USER_EXISTS_CACHE_TTL) {
        this.userExistsCache.delete(key);
      }
    }
    
    // Если после очистки всё ещё много записей, удаляем половину самых старых
    if (this.userExistsCache.size >= USER_EXISTS_CACHE_MAX_SIZE * 0.9) {
      const entries = Array.from(this.userExistsCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = Math.floor(entries.length / 2);
      for (let i = 0; i < toDelete; i++) {
        this.userExistsCache.delete(entries[i][0]);
      }
    }
  }

  private async validateUserExists(userId: number, role: string): Promise<boolean> {
    try {
      switch (role) {
        case 'master':
          const master = await this.prisma.master.findUnique({
            where: { id: userId },
            select: { id: true },
          });
          return !!master;

        case 'director':
          const director = await this.prisma.director.findUnique({
            where: { id: userId },
            select: { id: true },
          });
          return !!director;

        case 'admin':
        case 'callcentre_admin':
          const admin = await this.prisma.callcentreAdmin.findUnique({
            where: { id: userId },
            select: { id: true },
          });
          return !!admin;

        case 'callcentre_operator':
          const operator = await this.prisma.callcentreOperator.findUnique({
            where: { id: userId },
            select: { id: true },
          });
          return !!operator;

        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Error validating user existence: ${error.message}`);
      return false;
    }
  }
}


