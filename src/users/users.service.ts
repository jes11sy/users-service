import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getUserCityIds } from '../common/user-cities';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async getProfile(user: any) {
    this.logger.debug(`Profile requested for user: id=${user.userId}, role=${user.role}`);
    const { login, role } = user;

    let profile;

    if (role === 'master') {
      profile = await this.prisma.master.findUnique({
        where: { login },
        select: {
          id: true,
          name: true,
          login: true,
          status: true,
          createdAt: true,
          note: true,
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
          createdAt: true,
          status: true,
          note: true,
          tgId: true,
        },
      });
    } else if (role === 'operator' || role === 'callcentre_operator') {
      profile = await this.prisma.callcentreOperator.findUnique({
        where: { login },
        select: {
          id: true,
          name: true,
          login: true,
          status: true,
          createdAt: true,
          note: true,
          sipAddress: true,
        },
      });
    } else if (role === 'admin' || role === 'callcentre_admin') {
      profile = await this.prisma.callcentreAdmin.findUnique({
        where: { login },
        select: {
          id: true,
          name: true,
          login: true,
          status: true,
          note: true,
          createdAt: true,
        },
      });
    }

    if (!profile) {
      return { success: false, message: 'User not found' };
    }

    let cityIds: number[] | undefined;
    if (role === 'master') {
      cityIds = await getUserCityIds(this.prisma, 'master', profile.id);
    } else if (role === 'director') {
      cityIds = await getUserCityIds(this.prisma, 'director', profile.id);
    } else if (role === 'operator' || role === 'callcentre_operator') {
      cityIds = await getUserCityIds(this.prisma, 'operator', profile.id);
    }

    return {
      success: true,
      data: {
        ...profile,
        ...(cityIds !== undefined ? { cityIds } : {}),
        role,
      },
    };
  }
}
