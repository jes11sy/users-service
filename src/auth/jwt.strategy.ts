import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub: number;
  login: string;
  role: 'master' | 'director' | 'callcentre_admin' | 'callcentre_operator';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

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
    const validRoles = ['master', 'director', 'callcentre_admin', 'callcentre_operator'];
    if (!validRoles.includes(payload.role)) {
      this.logger.warn(`Invalid role in JWT: ${payload.role}`);
      throw new UnauthorizedException('Invalid role in token');
    }

    // Проверяем существование пользователя в БД
    const userExists = await this.validateUserExists(payload.sub, payload.role);
    
    if (!userExists) {
      this.logger.warn(`User not found: id=${payload.sub}, role=${payload.role}`);
      throw new UnauthorizedException('User not found');
    }

    return {
      userId: payload.sub,
      login: payload.login,
      role: payload.role,
    };
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


