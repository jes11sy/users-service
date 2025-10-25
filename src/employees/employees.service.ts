import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMasterDto, UpdateMasterDto } from '../masters/dto/master.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async getEmployees(query: any) {
    const { search, role } = query;

    // Получаем всех сотрудников (мастеров и директоров)
    const [masters, directors] = await Promise.all([
      this.prisma.master.findMany({
        where: search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { login: { contains: search, mode: 'insensitive' } },
          ],
        } : {},
        select: {
          id: true,
          name: true,
          login: true,
          password: true,
          cities: true,
          statusWork: true,
          dateCreate: true,
          note: true,
          tgId: true,
          chatId: true,
          passportDoc: true,
          contractDoc: true,
        },
        orderBy: { dateCreate: 'desc' },
      }),
      this.prisma.director.findMany({
        where: search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { login: { contains: search, mode: 'insensitive' } },
          ],
        } : {},
        select: {
          id: true,
          name: true,
          login: true,
          password: true,
          cities: true,
          dateCreate: true,
          note: true,
          tgId: true,
          passportDoc: true,
          contractDoc: true,
        },
        orderBy: { dateCreate: 'desc' },
      }),
    ]);

    // Объединяем всех сотрудников
    const allEmployees = [
      ...masters.map(m => ({ 
        ...m, 
        role: 'master',
        hasPassword: !!m.password 
      })),
      ...directors.map(d => ({ 
        ...d, 
        role: 'director',
        hasPassword: !!d.password 
      })),
    ];

    // Фильтруем по роли если указана
    const filteredEmployees = role 
      ? allEmployees.filter(emp => emp.role === role)
      : allEmployees;

    return {
      success: true,
      data: filteredEmployees,
    };
  }

  async getEmployee(id: number) {
    // Ищем мастера или директора
    const master = await this.prisma.master.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        login: true,
        password: true,
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
        data: { ...master, role: 'master', hasPassword: !!master.password },
      };
    }

    const director = await this.prisma.director.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        login: true,
        password: true,
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
        data: { ...director, role: 'director', hasPassword: !!director.password },
      };
    }

    throw new NotFoundException('Employee not found');
  }

  async createEmployee(dto: CreateMasterDto) {
    const master = await this.prisma.master.create({
      data: {
        name: dto.name,
        login: dto.login,
        password: dto.password,
        cities: dto.cities || [],
        statusWork: dto.statusWork || 'Работает',
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
        password: true,
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
      data: { ...master, role: 'master', hasPassword: !!master.password },
    };
  }

  async updateEmployee(id: number, dto: UpdateMasterDto) {
    const master = await this.prisma.master.findUnique({
      where: { id },
    });

    if (!master) {
      throw new NotFoundException('Employee not found');
    }

    const updated = await this.prisma.master.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.login && { login: dto.login }),
        ...(dto.password && { password: dto.password }),
        ...(dto.cities && { cities: dto.cities }),
        ...(dto.statusWork && { statusWork: dto.statusWork }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.tgId !== undefined && { tgId: dto.tgId }),
        ...(dto.chatId !== undefined && { chatId: dto.chatId }),
        ...(dto.passportDoc !== undefined && { passportDoc: dto.passportDoc }),
        ...(dto.contractDoc !== undefined && { contractDoc: dto.contractDoc }),
      },
      select: {
        id: true,
        name: true,
        login: true,
        password: true,
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
      data: { ...updated, role: 'master', hasPassword: !!updated.password },
    };
  }
}
