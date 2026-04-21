import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { USER_EXISTS_CACHE_TTL, USER_EXISTS_CACHE_MAX_SIZE } from '../config/security.config';

interface JwtPayload {
  sub: number;
  login: string;
  role: 'master' | 'director' | 'admin' | 'operator' | 'callcentre_admin' | 'callcentre_operator';
  cityIds?: number[];
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
  private userExistsCache = new Map<string, CacheEntry>();

  constructor(private prisma: PrismaService) {
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
    if (!payload.sub || !payload.login || !payload.role) {
      this.logger.warn('Invalid JWT payload: missing required fields');
      throw new UnauthorizedException('Invalid token payload');
    }

    const validRoles = ['master', 'director', 'admin', 'operator', 'callcentre_admin', 'callcentre_operator'];
    if (!validRoles.includes(payload.role)) {
      this.logger.warn(`Invalid role in JWT: ${payload.role}`);
      throw new UnauthorizedException('Invalid role in token');
    }

    const userExists = await this.validateUserExistsCached(payload.sub, payload.role);
    if (!userExists) {
      this.logger.warn(`User not found: id=${payload.sub}, role=${payload.role}`);
      throw new UnauthorizedException('User not found');
    }

    return {
      userId: payload.sub,
      login: payload.login,
      role: payload.role,
      cityIds: payload.cityIds,
    };
  }

  private async validateUserExistsCached(userId: number, role: string): Promise<boolean> {
    const cacheKey = `${role}:${userId}`;
    const now = Date.now();
    const cached = this.userExistsCache.get(cacheKey);

    if (cached && now - cached.timestamp < USER_EXISTS_CACHE_TTL) {
      return cached.exists;
    }

    const exists = await this.validateUserExists(userId, role);

    if (this.userExistsCache.size >= USER_EXISTS_CACHE_MAX_SIZE) {
      this.cleanupCache();
    }

    this.userExistsCache.set(cacheKey, { exists, timestamp: now });
    return exists;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.userExistsCache.entries()) {
      if (now - entry.timestamp >= USER_EXISTS_CACHE_TTL) {
        this.userExistsCache.delete(key);
      }
    }

    if (this.userExistsCache.size >= USER_EXISTS_CACHE_MAX_SIZE * 0.9) {
      const entries = Array.from(this.userExistsCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
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
          return !!(await this.prisma.master.findUnique({ where: { id: userId }, select: { id: true } }));
        case 'director':
          return !!(await this.prisma.director.findUnique({ where: { id: userId }, select: { id: true } }));
        case 'admin':
        case 'callcentre_admin':
          return !!(await this.prisma.callcentreAdmin.findUnique({ where: { id: userId }, select: { id: true } }));
        case 'operator':
        case 'callcentre_operator':
          return !!(await this.prisma.callcentreOperator.findUnique({ where: { id: userId }, select: { id: true } }));
        default:
          return false;
      }
    } catch (error: any) {
      this.logger.error(`Error validating user existence: ${error.message}`);
      return false;
    }
  }
}


