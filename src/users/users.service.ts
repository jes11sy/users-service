import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
<<<<<<< Updated upstream
          id: true, name: true, login: true, cityIds: true,
          status: true, note: true, chatId: true, createdAt: true,
=======
          id: true,
          name: true,
          login: true,
          cityIds: true,
          status: true,
          createdAt: true,
          note: true,
          chatId: true,
>>>>>>> Stashed changes
        },
      });
    } else if (role === 'director') {
      profile = await this.prisma.director.findUnique({
        where: { login },
        select: {
<<<<<<< Updated upstream
          id: true, name: true, login: true, cityIds: true,
          note: true, tgId: true, createdAt: true,
        },
      });
    } else if (role === 'operator') {
      profile = await this.prisma.operator.findUnique({
        where: { login },
        select: {
          id: true, name: true, login: true, cityIds: true,
          status: true, note: true, sipAddress: true, createdAt: true,
        },
      });
    } else if (role === 'admin') {
      profile = await this.prisma.admin.findUnique({
        where: { login },
        select: { id: true, login: true, note: true, createdAt: true },
=======
          id: true,
          name: true,
          login: true,
          cityIds: true,
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
          cityIds: true,
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
>>>>>>> Stashed changes
      });
    }

    if (!profile) {
      return { success: false, message: 'User not found' };
    }

    return { success: true, data: { ...profile, role } };
  }
}
