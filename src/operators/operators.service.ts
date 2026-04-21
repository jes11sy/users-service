import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOperatorDto, UpdateOperatorDto } from './dto/operator.dto';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../config/security.config';
import { getUserCityIds, syncUserCityIds } from '../common/user-cities';

@Injectable()
export class OperatorsService {
  constructor(private prisma: PrismaService) {}

  private async checkLoginUniqueness(login: string): Promise<void> {
    const [existingAdmin, existingOperator, existingMaster, existingDirector] = await Promise.all([
      this.prisma.callcentreAdmin.findFirst({ where: { login }, select: { id: true } }),
      this.prisma.callcentreOperator.findFirst({ where: { login }, select: { id: true } }),
      this.prisma.master.findFirst({ where: { login }, select: { id: true } }),
      this.prisma.director.findFirst({ where: { login }, select: { id: true } }),
    ]);

    if (existingAdmin) {
      throw new BadRequestException(`Пользователь с логином "${login}" уже существует (админ)`);
    }
    if (existingOperator) {
      throw new BadRequestException(`Пользователь с логином "${login}" уже существует (оператор)`);
    }
    if (existingMaster) {
      throw new BadRequestException(`Пользователь с логином "${login}" уже существует (мастер)`);
    }
    if (existingDirector) {
      throw new BadRequestException(`Пользователь с логином "${login}" уже существует (директор)`);
    }
  }

  async getOperators(query: any = {}) {
    const { type, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    if (type === 'admin') {
      const [admins, total] = await Promise.all([
        this.prisma.callcentreAdmin.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            login: true,
            status: true,
            note: true,
            createdAt: true,
          },
        }),
        this.prisma.callcentreAdmin.count({ where: { deletedAt: null } }),
      ]);

      return {
        success: true,
        data: admins,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    if (type === 'operator') {
      const [operators, total] = await Promise.all([
        this.prisma.callcentreOperator.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            login: true,
            status: true,
            createdAt: true,
            sipAddress: true,
            note: true,
          },
        }),
        this.prisma.callcentreOperator.count({ where: { deletedAt: null } }),
      ]);

      return {
        success: true,
        data: operators,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    const halfLimit = Math.ceil(limit / 2);
    const halfSkip = (page - 1) * halfLimit;

    const [admins, operators, adminsCount, operatorsCount] = await Promise.all([
      this.prisma.callcentreAdmin.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: halfSkip,
        take: halfLimit,
        select: {
          id: true,
          name: true,
          login: true,
          status: true,
          note: true,
          createdAt: true,
        },
      }),
      this.prisma.callcentreOperator.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: halfSkip,
        take: halfLimit,
        select: {
          id: true,
          name: true,
          login: true,
          status: true,
          createdAt: true,
          note: true,
          sipAddress: true,
        },
      }),
      this.prisma.callcentreAdmin.count({ where: { deletedAt: null } }),
      this.prisma.callcentreOperator.count({ where: { deletedAt: null } }),
    ]);

    return {
      success: true,
      data: { admins, operators },
      total: adminsCount + operatorsCount,
      page,
      limit,
      totalPages: Math.ceil((adminsCount + operatorsCount) / limit),
    };
  }

  async getOperator(id: number, type?: string) {
    let resolvedType = type;

    if (!resolvedType) {
      const [admin, operator] = await Promise.all([
        this.prisma.callcentreAdmin.findUnique({ where: { id }, select: { id: true } }),
        this.prisma.callcentreOperator.findUnique({ where: { id }, select: { id: true } }),
      ]);

      if (admin) resolvedType = 'admin';
      else if (operator) resolvedType = 'operator';
      else throw new NotFoundException(`User with id ${id} not found`);
    }

    if (resolvedType === 'admin') {
      const admin = await this.prisma.callcentreAdmin.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          login: true,
          status: true,
          note: true,
          createdAt: true,
        },
      });

      if (!admin) {
        throw new NotFoundException('Admin not found');
      }

      return { success: true, data: { ...admin, type: 'admin' } };
    }

    if (resolvedType === 'operator') {
      const operator = await this.prisma.callcentreOperator.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          login: true,
          status: true,
          createdAt: true,
          sipAddress: true,
          note: true,
          passport: true,
          contract: true,
        },
      });

      if (!operator) {
        throw new NotFoundException('Operator not found');
      }

      return {
        success: true,
        data: {
          ...operator,
          cityIds: await getUserCityIds(this.prisma, 'operator', operator.id),
          type: 'operator',
        },
      };
    }

    throw new BadRequestException('Type must be "admin" or "operator"');
  }

  async createOperator(dto: CreateOperatorDto) {
    await this.checkLoginUniqueness(dto.login);

    if (dto.type === 'admin') {
      const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

      const admin = await this.prisma.callcentreAdmin.create({
        data: {
          role: 'admin',
          name: dto.name,
          login: dto.login,
          password: hashedPassword,
          status: 'active',
          note: dto.note,
        },
        select: {
          id: true,
          name: true,
          login: true,
          status: true,
        },
      });

      return { success: true, message: 'Admin created successfully', data: admin };
    }

    if (dto.type === 'operator') {
      const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

      try {
        const operator = await this.prisma.callcentreOperator.create({
          data: {
            role: 'operator',
            name: dto.name,
            login: dto.login,
            password: hashedPassword,
            status: dto.statusWork || 'active',
            note: dto.note,
            sipAddress: dto.sipAddress,
            passport: dto.passport,
            contract: dto.contract,
          },
          select: {
            id: true,
            name: true,
            login: true,
            status: true,
            createdAt: true,
          },
        });

        await syncUserCityIds(this.prisma, 'operator', operator.id, dto.cityIds);

        return {
          success: true,
          message: 'Operator created successfully',
          data: { ...operator, cityIds: dto.cityIds ?? [] },
        };
      } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('id')) {
          await this.prisma.$executeRawUnsafe(
            `SELECT setval(pg_get_serial_sequence('"auth_service"."operators"', 'id'), COALESCE((SELECT MAX(id) FROM "auth_service"."operators"), 1), true);`
          );

          const operator = await this.prisma.callcentreOperator.create({
            data: {
              role: 'operator',
              name: dto.name,
              login: dto.login,
              password: hashedPassword,
              status: dto.statusWork || 'active',
              note: dto.note,
              sipAddress: dto.sipAddress,
              passport: dto.passport,
              contract: dto.contract,
            },
            select: {
              id: true,
              name: true,
              login: true,
              status: true,
              createdAt: true,
            },
          });

          await syncUserCityIds(this.prisma, 'operator', operator.id, dto.cityIds);

          return {
            success: true,
            message: 'Operator created successfully',
            data: { ...operator, cityIds: dto.cityIds ?? [] },
          };
        }

        throw error;
      }
    }

    throw new BadRequestException('Type must be "admin" or "operator"');
  }

  async updateOperator(id: number, type: string | undefined, dto: UpdateOperatorDto) {
    let resolvedType = type;

    if (!resolvedType) {
      const [admin, operator] = await Promise.all([
        this.prisma.callcentreAdmin.findUnique({ where: { id }, select: { id: true } }),
        this.prisma.callcentreOperator.findUnique({ where: { id }, select: { id: true } }),
      ]);

      if (admin) resolvedType = 'admin';
      else if (operator) resolvedType = 'operator';
      else throw new NotFoundException(`User with id ${id} not found`);
    }

    if (resolvedType === 'admin') {
      const updateData: any = {
        ...(dto.login && { login: dto.login }),
        ...(dto.name && { name: dto.name }),
        ...(dto.status && { status: dto.status }),
        ...(dto.note !== undefined && { note: dto.note }),
      };

      if (dto.password) {
        updateData.password = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
      }

      const admin = await this.prisma.callcentreAdmin.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          login: true,
          status: true,
          note: true,
        },
      });

      return { success: true, message: 'Admin updated successfully', data: admin };
    }

    if (resolvedType === 'operator') {
      const updateData: any = {
        ...(dto.name && { name: dto.name }),
        ...(dto.login && { login: dto.login }),
        ...(dto.status && { status: dto.status }),
        ...(dto.statusWork && { status: dto.statusWork }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.sipAddress !== undefined && { sipAddress: dto.sipAddress }),
        ...(dto.passport !== undefined && { passport: dto.passport }),
        ...(dto.contract !== undefined && { contract: dto.contract }),
      };

      if (dto.password) {
        updateData.password = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
      }

      const operator = await this.prisma.callcentreOperator.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          login: true,
          status: true,
          note: true,
          sipAddress: true,
          passport: true,
          contract: true,
        },
      });

      await syncUserCityIds(this.prisma, 'operator', id, dto.cityIds);

      return {
        success: true,
        message: 'Operator updated successfully',
        data: {
          ...operator,
          cityIds: dto.cityIds ?? await getUserCityIds(this.prisma, 'operator', id),
        },
      };
    }

    throw new BadRequestException('Type must be "admin" or "operator"');
  }

  async updateWorkStatus(userId: number, statusWork: string) {
    const operator = await this.prisma.callcentreOperator.findUnique({
      where: { id: userId },
    });

    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    const updated = await this.prisma.callcentreOperator.update({
      where: { id: userId },
      data: { status: statusWork },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    return { success: true, message: 'Work status updated successfully', data: updated };
  }

  async deleteOperator(id: number, type?: string) {
    let resolvedType = type;

    if (!resolvedType) {
      const [admin, operator] = await Promise.all([
        this.prisma.callcentreAdmin.findUnique({ where: { id }, select: { id: true } }),
        this.prisma.callcentreOperator.findUnique({ where: { id }, select: { id: true } }),
      ]);

      if (admin) resolvedType = 'admin';
      else if (operator) resolvedType = 'operator';
      else throw new NotFoundException(`User with id ${id} not found`);
    }

    if (resolvedType === 'admin') {
      await this.prisma.callcentreAdmin.delete({ where: { id } });
      return { success: true, message: 'Admin deleted successfully' };
    }

    if (resolvedType === 'operator') {
      await this.prisma.callcentreOperator.delete({ where: { id } });
      return { success: true, message: 'Operator deleted successfully' };
    }

    throw new BadRequestException('Type must be "admin" or "operator"');
  }
}
