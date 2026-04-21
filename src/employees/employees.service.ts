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

  async getEmployees(query: any) {
    return this.mastersService.getEmployees(query);
  }

  async getEmployee(id: number, role?: 'master' | 'director') {
    if (role === 'master' || !role) {
      const master = await this.prisma.master.findUnique({
        where: { id },
        select: {
<<<<<<< Updated upstream
          id: true, name: true, login: true, cityIds: true,
          status: true, note: true, chatId: true, passport: true, contract: true, createdAt: true,
=======
          id: true,
          name: true,
          login: true,
          cityIds: true,
          status: true,
          createdAt: true,
          note: true,
          chatId: true,
          passport: true,
          contract: true,
>>>>>>> Stashed changes
        },
      });

      if (master) return { success: true, data: { ...master, role: 'master' } };
    }

    if (role === 'director' || !role) {
      const director = await this.prisma.director.findUnique({
        where: { id },
        select: {
<<<<<<< Updated upstream
          id: true, name: true, login: true, cityIds: true,
          note: true, tgId: true, passport: true, contract: true, createdAt: true,
=======
          id: true,
          name: true,
          login: true,
          cityIds: true,
          createdAt: true,
          status: true,
          note: true,
          tgId: true,
          passport: true,
          contract: true,
>>>>>>> Stashed changes
        },
      });

      if (director) return { success: true, data: { ...director, role: 'director' } };
    }

    throw new NotFoundException('Employee not found');
  }

  async createEmployee(dto: CreateMasterDto) {
    const [existingMaster, existingDirector, existingOperator, existingAdmin] = await Promise.all([
      this.prisma.master.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.director.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.operator.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.admin.findFirst({ where: { login: dto.login }, select: { id: true } }),
    ]);

    if (existingMaster) throw new BadRequestException(`Мастер с логином "${dto.login}" уже существует`);
    if (existingDirector) throw new BadRequestException(`Пользователь с логином "${dto.login}" уже существует (директор)`);
    if (existingOperator) throw new BadRequestException(`Пользователь с логином "${dto.login}" уже существует (оператор)`);
    if (existingAdmin) throw new BadRequestException(`Пользователь с логином "${dto.login}" уже существует (админ)`);

    const master = await this.prisma.master.create({
      data: {
        role: 'master',
        name: dto.name,
        login: dto.login,
        password: dto.password ? await this.hashPassword(dto.password) : null,
<<<<<<< Updated upstream
        role: 'master',
=======
>>>>>>> Stashed changes
        cityIds: dto.cityIds || [],
        status: dto.status || 'active',
        note: dto.note,
        chatId: dto.chatId,
        passport: dto.passport,
        contract: dto.contract,
      },
      select: {
<<<<<<< Updated upstream
        id: true, name: true, login: true, cityIds: true,
        status: true, note: true, chatId: true, passport: true, contract: true, createdAt: true,
=======
        id: true,
        name: true,
        login: true,
        cityIds: true,
        status: true,
        createdAt: true,
        note: true,
        chatId: true,
        passport: true,
        contract: true,
>>>>>>> Stashed changes
      },
    });

    return { success: true, message: 'Employee created successfully', data: { ...master, role: 'master' } };
  }

  async updateEmployee(id: number, dto: UpdateMasterDto) {
    const master = await this.prisma.master.findUnique({ where: { id } });
    if (!master) throw new NotFoundException('Employee not found');

    const updateData: any = {
      ...(dto.name && { name: dto.name }),
      ...(dto.login && { login: dto.login }),
      ...(dto.cityIds && { cityIds: dto.cityIds }),
      ...(dto.status && { status: dto.status }),
      ...(dto.note !== undefined && { note: dto.note }),
      ...(dto.chatId !== undefined && { chatId: dto.chatId }),
      ...(dto.passport !== undefined && { passport: dto.passport }),
      ...(dto.contract !== undefined && { contract: dto.contract }),
    };

    if (dto.password) updateData.password = await this.hashPassword(dto.password);

    const updated = await this.prisma.master.update({
      where: { id },
      data: updateData,
      select: {
<<<<<<< Updated upstream
        id: true, name: true, login: true, cityIds: true,
        status: true, note: true, chatId: true, passport: true, contract: true,
=======
        id: true,
        name: true,
        login: true,
        cityIds: true,
        status: true,
        note: true,
        chatId: true,
        passport: true,
        contract: true,
>>>>>>> Stashed changes
      },
    });

    return { success: true, message: 'Employee updated successfully', data: { ...updated, role: 'master' } };
  }
}
