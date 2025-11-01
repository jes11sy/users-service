import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async getProfile(user: any) {
    // Логируем только id и роль, без чувствительных данных
    this.logger.debug(`Profile requested for user: id=${user.userId}, role=${user.role}`);
    const { id, login, role } = user;

    // Получаем профиль пользователя в зависимости от роли
    let profile;
    
    if (role === 'master') {
      profile = await this.prisma.master.findUnique({
        where: { login },
        select: {
          id: true,
          name: true,
          login: true,
          cities: true,
          statusWork: true,
          dateCreate: true,
          note: true,
          tgId: true,
          chatId: true,
        },
      });
    } else if (role === 'director') {
      profile = await this.prisma.director.findUnique({
        where: { login },
        select: {
          id: true,
          name: true,
          login: true,
          cities: true,
          dateCreate: true,
          note: true,
          tgId: true,
        },
      });
    } else if (role === 'operator') {
      profile = await this.prisma.callcentreOperator.findUnique({
        where: { login },
        select: {
          id: true,
          name: true,
          login: true,
          city: true,
          status: true,
          statusWork: true,
          dateCreate: true,
          note: true,
          sipAddress: true,
        },
      });
    } else if (role === 'admin') {
      profile = await this.prisma.callcentreAdmin.findUnique({
        where: { login },
        select: {
          id: true,
          login: true,
          note: true,
          createdAt: true,
        },
      });
    }

    if (!profile) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    return {
      success: true,
      data: {
        ...profile,
        role,
      },
    };
  }
}
