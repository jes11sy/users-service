import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOperatorDto, UpdateOperatorDto } from './dto/operator.dto';

@Injectable()
export class OperatorsService {
  constructor(private prisma: PrismaService) {}

  async getOperators(type?: string) {
    if (type === 'admin') {
      const admins = await this.prisma.callcentreAdmin.findMany({
        orderBy: { dateCreate: 'desc' },
        select: {
          id: true,
          name: true,
          login: true,
          statusWork: true,
          dateCreate: true,
          note: true,
        },
      });

      return {
        success: true,
        data: admins,
      };
    }

    if (type === 'operator') {
      const operators = await this.prisma.callcentreOperator.findMany({
        orderBy: { dateCreate: 'desc' },
        select: {
          id: true,
          name: true,
          login: true,
          statusWork: true,
          dateCreate: true,
          note: true,
        },
      });

      return {
        success: true,
        data: operators,
      };
    }

    // Return both if no type specified
    const [admins, operators] = await Promise.all([
      this.prisma.callcentreAdmin.findMany({
        orderBy: { dateCreate: 'desc' },
        select: {
          id: true,
          name: true,
          login: true,
          statusWork: true,
          dateCreate: true,
          note: true,
        },
      }),
      this.prisma.callcentreOperator.findMany({
        orderBy: { dateCreate: 'desc' },
        select: {
          id: true,
          name: true,
          login: true,
          statusWork: true,
          dateCreate: true,
          note: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        admins,
        operators,
      },
    };
  }

  async getOperator(id: number, type: string) {
    if (type === 'admin') {
      const admin = await this.prisma.callcentreAdmin.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          login: true,
          statusWork: true,
          dateCreate: true,
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
          note: true,
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
    if (dto.type === 'admin') {
      const admin = await this.prisma.callcentreAdmin.create({
        data: {
          name: dto.name,
          login: dto.login,
          password: dto.password,
          statusWork: dto.statusWork || 'active',
          note: dto.note,
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
        message: 'Admin created successfully',
        data: admin,
      };
    }

    if (dto.type === 'operator') {
      const operator = await this.prisma.callcentreOperator.create({
        data: {
          name: dto.name,
          login: dto.login,
          password: dto.password,
          statusWork: dto.statusWork || 'active',
          note: dto.note,
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

    throw new BadRequestException('Type must be "admin" or "operator"');
  }

  async updateOperator(id: number, type: string, dto: UpdateOperatorDto) {
    const updateData = {
      ...(dto.name && { name: dto.name }),
      ...(dto.login && { login: dto.login }),
      ...(dto.password && { password: dto.password }),
      ...(dto.statusWork && { statusWork: dto.statusWork }),
      ...(dto.note !== undefined && { note: dto.note }),
    };

    if (type === 'admin') {
      const admin = await this.prisma.callcentreAdmin.update({
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
        message: 'Admin updated successfully',
        data: admin,
      };
    }

    if (type === 'operator') {
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




