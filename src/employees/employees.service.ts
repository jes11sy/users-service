import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMasterDto, UpdateMasterDto } from '../masters/dto/master.dto';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../config/security.config';
import { MastersService } from '../masters/masters.service';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => MastersService))
    private mastersService: MastersService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  /**
   * ✅ FIX: Убрано дублирование - делегируем в MastersService.getEmployees
   * который уже реализует правильную логику с пагинацией
   */
  async getEmployees(query: any) {
    return this.mastersService.getEmployees(query);
  }

  async getEmployee(id: number, role?: 'master' | 'director') {
    // ✅ FIX: Добавлен параметр role для избежания IDOR уязвимости (коллизия id между таблицами)
    // ✅ FIX: Убран password из select
    
    if (role === 'master' || !role) {
      const master = await this.prisma.master.findUnique({
        where: { id },
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
          passportDoc: true,
          contractDoc: true,
        },
      });

      if (master) {
        return {
          success: true,
          data: { ...master, role: 'master' },
        };
      }
    }

    if (role === 'director' || !role) {
      const director = await this.prisma.director.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          login: true,
          cities: true,
          dateCreate: true,
          note: true,
          tgId: true,
          passportDoc: true,
          contractDoc: true,
        },
      });

      if (director) {
        return {
          success: true,
          data: { ...director, role: 'director' },
        };
      }
    }

    throw new NotFoundException('Employee not found');
  }

  async createEmployee(dto: CreateMasterDto) {
    // ✅ FIX #85: Полная проверка уникальности login по всем таблицам
    const [existingMaster, existingDirector, existingOperator, existingAdmin] = await Promise.all([
      this.prisma.master.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.director.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.callcentreOperator.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.callcentreAdmin.findFirst({ where: { login: dto.login }, select: { id: true } }),
    ]);

    if (existingMaster) {
      throw new BadRequestException(`Мастер с логином "${dto.login}" уже существует`);
    }
    if (existingDirector) {
      throw new BadRequestException(`Пользователь с логином "${dto.login}" уже существует (директор)`);
    }
    if (existingOperator) {
      throw new BadRequestException(`Пользователь с логином "${dto.login}" уже существует (оператор)`);
    }
    if (existingAdmin) {
      throw new BadRequestException(`Пользователь с логином "${dto.login}" уже существует (админ)`);
    }

    const master = await this.prisma.master.create({
      data: {
        name: dto.name,
        login: dto.login,
        password: dto.password ? await this.hashPassword(dto.password) : null,
        cities: dto.cities || [],
        statusWork: dto.statusWork || 'работает',
        note: dto.note,
        tgId: dto.tgId,
        chatId: dto.chatId,
        passportDoc: dto.passportDoc,
        contractDoc: dto.contractDoc,
      },
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
        passportDoc: true,
        contractDoc: true,
      },
    });

    return {
      success: true,
      message: 'Employee created successfully',
      data: { ...master, role: 'master' },
    };
  }

  async updateEmployee(id: number, dto: UpdateMasterDto) {
    const master = await this.prisma.master.findUnique({
      where: { id },
    });

    if (!master) {
      throw new NotFoundException('Employee not found');
    }

    const updateData: any = {
      ...(dto.name && { name: dto.name }),
      ...(dto.login && { login: dto.login }),
      ...(dto.cities && { cities: dto.cities }),
      ...(dto.statusWork && { statusWork: dto.statusWork }),
      ...(dto.note !== undefined && { note: dto.note }),
      ...(dto.tgId !== undefined && { tgId: dto.tgId }),
      ...(dto.chatId !== undefined && { chatId: dto.chatId }),
      ...(dto.passportDoc !== undefined && { passportDoc: dto.passportDoc }),
      ...(dto.contractDoc !== undefined && { contractDoc: dto.contractDoc }),
    };

    // Хэшируем пароль если он передан
    if (dto.password) {
      updateData.password = await this.hashPassword(dto.password);
    }

    const updated = await this.prisma.master.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        login: true,
        cities: true,
        statusWork: true,
        note: true,
        tgId: true,
        chatId: true,
        passportDoc: true,
        contractDoc: true,
      },
    });

    return {
      success: true,
      message: 'Employee updated successfully',
      data: { ...updated, role: 'master' },
    };
  }
}
