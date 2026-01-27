import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOperatorDto, UpdateOperatorDto } from './dto/operator.dto';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../config/security.config';

@Injectable()
export class OperatorsService {
  constructor(private prisma: PrismaService) {}

  // ✅ FIX #85: Проверка уникальности login по всем таблицам пользователей
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
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            login: true,
            note: true,
          },
        }),
        this.prisma.callcentreAdmin.count(),
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
          orderBy: { dateCreate: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            login: true,
            statusWork: true,
            dateCreate: true,
            sipAddress: true,
            note: true,
          },
        }),
        this.prisma.callcentreOperator.count(),
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

    // Return both if no type specified (пагинация для каждого типа отдельно)
    const halfLimit = Math.ceil(limit / 2);
    const halfSkip = (page - 1) * halfLimit;

    const [admins, operators, adminsCount, operatorsCount] = await Promise.all([
      this.prisma.callcentreAdmin.findMany({
        orderBy: { createdAt: 'desc' },
        skip: halfSkip,
        take: halfLimit,
        select: {
          id: true,
          login: true,
          note: true,
        },
      }),
      this.prisma.callcentreOperator.findMany({
        orderBy: { dateCreate: 'desc' },
        skip: halfSkip,
        take: halfLimit,
        select: {
          id: true,
          name: true,
          login: true,
          statusWork: true,
          dateCreate: true,
          note: true,
        },
      }),
      this.prisma.callcentreAdmin.count(),
      this.prisma.callcentreOperator.count(),
    ]);

    const total = adminsCount + operatorsCount;

    return {
      success: true,
      data: {
        admins,
        operators,
      },
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOperator(id: number, type: string) {
    if (type === 'admin') {
      const admin = await this.prisma.callcentreAdmin.findUnique({
        where: { id },
        select: {
          id: true,
          login: true,
          note: true,
        },
      });

      if (!admin) {
        throw new NotFoundException('Admin not found');
      }

      return {
        success: true,
        data: admin,
      };
    }

    if (type === 'operator') {
      const operator = await this.prisma.callcentreOperator.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          login: true,
          statusWork: true,
          dateCreate: true,
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
        data: operator,
      };
    }

    throw new BadRequestException('Type must be "admin" or "operator"');
  }

  async createOperator(dto: CreateOperatorDto) {
    // ✅ FIX #85: Проверка уникальности login по всем таблицам
    await this.checkLoginUniqueness(dto.login);

    if (dto.type === 'admin') {
      // Хешируем пароль с унифицированным количеством раундов
      const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
      
      const admin = await this.prisma.callcentreAdmin.create({
        data: {
          login: dto.login,
          password: hashedPassword,
          note: dto.note,
        },
        select: {
          id: true,
          login: true,
        },
      });

      return {
        success: true,
        message: 'Admin created successfully',
        data: admin,
      };
    }

    if (dto.type === 'operator') {
      // Хешируем пароль с унифицированным количеством раундов
      const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
      
      try {
        const operator = await this.prisma.callcentreOperator.create({
          data: {
            name: dto.name,
            login: dto.login,
            password: hashedPassword,
            city: '',
            status: 'active',
            statusWork: dto.statusWork || 'active',
            dateCreate: new Date(),
            note: dto.note,
            sipAddress: dto.sipAddress,
            passport: dto.passport,
            contract: dto.contract,
          },
          select: {
            id: true,
            name: true,
            login: true,
            statusWork: true,
            dateCreate: true,
          },
        });

        return {
          success: true,
          message: 'Operator created successfully',
          data: operator,
        };
      } catch (error: any) {
        // Если ошибка связана с уникальным ограничением на ID (сбилась последовательность)
        if (error.code === 'P2002' && error.meta?.target?.includes('id')) {
          // Исправляем последовательность
          await this.prisma.$executeRawUnsafe(
            `SELECT setval('callcentre_operator_id_seq', COALESCE((SELECT MAX(id) FROM callcentre_operator), 1), true);`
          );
          
          // Повторяем попытку создания
          const operator = await this.prisma.callcentreOperator.create({
            data: {
              name: dto.name,
              login: dto.login,
              password: hashedPassword,
              city: '',
              status: 'active',
              statusWork: dto.statusWork || 'active',
              dateCreate: new Date(),
              note: dto.note,
              sipAddress: dto.sipAddress,
              passport: dto.passport,
              contract: dto.contract,
            },
            select: {
              id: true,
              name: true,
              login: true,
              statusWork: true,
              dateCreate: true,
            },
          });

          return {
            success: true,
            message: 'Operator created successfully',
            data: operator,
          };
        }
        throw error;
      }
    }

    throw new BadRequestException('Type must be "admin" or "operator"');
  }

  async updateOperator(id: number, type: string, dto: UpdateOperatorDto) {
    if (type === 'admin') {
      const updateData: any = {
        ...(dto.login && { login: dto.login }),
        ...(dto.note !== undefined && { note: dto.note }),
      };
      
      // Хешируем пароль, если он передан
      if (dto.password) {
        updateData.password = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
      }

      const admin = await this.prisma.callcentreAdmin.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          login: true,
          note: true,
        },
      });

      return {
        success: true,
        message: 'Admin updated successfully',
        data: admin,
      };
    }

    if (type === 'operator') {
      const updateData: any = {
        ...(dto.name && { name: dto.name }),
        ...(dto.login && { login: dto.login }),
        ...(dto.statusWork && { statusWork: dto.statusWork }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.sipAddress !== undefined && { sipAddress: dto.sipAddress }),
        ...(dto.passport !== undefined && { passport: dto.passport }),
        ...(dto.contract !== undefined && { contract: dto.contract }),
      };
      
      // Хешируем пароль, если он передан
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
          statusWork: true,
          note: true,
        },
      });

      return {
        success: true,
        message: 'Operator updated successfully',
        data: operator,
      };
    }

    throw new BadRequestException('Type must be "admin" or "operator"');
  }

  async updateWorkStatus(userId: number, statusWork: string) {
    // Try to find operator by id
    const operator = await this.prisma.callcentreOperator.findUnique({
      where: { id: userId },
    });

    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    const updated = await this.prisma.callcentreOperator.update({
      where: { id: userId },
      data: { statusWork },
      select: {
        id: true,
        name: true,
        statusWork: true,
      },
    });

    return {
      success: true,
      message: 'Work status updated successfully',
      data: updated,
    };
  }

  async deleteOperator(id: number, type: string) {
    if (type === 'admin') {
      await this.prisma.callcentreAdmin.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Admin deleted successfully',
      };
    }

    if (type === 'operator') {
      await this.prisma.callcentreOperator.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Operator deleted successfully',
      };
    }

    throw new BadRequestException('Type must be "admin" or "operator"');
  }
}
