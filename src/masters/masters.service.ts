import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMasterDto, UpdateMasterDto } from './dto/master.dto';

@Injectable()
export class MastersService {
  constructor(private prisma: PrismaService) {}

  async getMasters(query: any) {
    const { city, statusWork, search } = query;

    const where: any = {};

    if (city) {
      where.cities = { has: city };
    }

    if (statusWork) {
      where.statusWork = statusWork;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { login: { contains: search, mode: 'insensitive' } },
      ];
    }

    const masters = await this.prisma.master.findMany({
      where,
      orderBy: { dateCreate: 'desc' },
      select: {
        id: true,
        name: true,
        login: true,
        cities: true,
        statusWork: true,
        dateCreate: true,
        note: true,
        contractDoc: true,
        passportDoc: true,
      },
    });

    return {
      success: true,
      data: masters,
    };
  }

  async getEmployees(query: any) {
    const { search, role } = query;

    // Получаем всех сотрудников (мастеров, директоров, операторов)
    const [masters, directors, operators] = await Promise.all([
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
          cities: true,
          statusWork: true,
          dateCreate: true,
          note: true,
          role: true,
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
          cities: true,
          dateCreate: true,
          note: true,
          role: true,
        },
        orderBy: { dateCreate: 'desc' },
      }),
      this.prisma.operator.findMany({
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
          dateCreate: true,
          note: true,
          role: true,
        },
        orderBy: { dateCreate: 'desc' },
      }),
    ]);

    // Объединяем всех сотрудников
    const allEmployees = [
      ...masters.map(m => ({ ...m, role: 'master' })),
      ...directors.map(d => ({ ...d, role: 'director' })),
      ...operators.map(o => ({ ...o, role: 'operator' })),
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

  async getMaster(id: number) {
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
        contractDoc: true,
        passportDoc: true,
      },
    });

    if (!master) {
      throw new NotFoundException('Master not found');
    }

    return {
      success: true,
      data: master,
    };
  }

  async createMaster(dto: CreateMasterDto) {
    const master = await this.prisma.master.create({
      data: {
        name: dto.name,
        login: dto.login,
        password: dto.password,
        cities: dto.cities || [],
        statusWork: dto.statusWork || 'Работает',
        note: dto.note,
      },
      select: {
        id: true,
        name: true,
        login: true,
        cities: true,
        statusWork: true,
        dateCreate: true,
      },
    });

    return {
      success: true,
      message: 'Master created successfully',
      data: master,
    };
  }

  async updateMaster(id: number, dto: UpdateMasterDto) {
    const master = await this.prisma.master.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.login && { login: dto.login }),
        ...(dto.password && { password: dto.password }),
        ...(dto.cities && { cities: dto.cities }),
        ...(dto.statusWork && { statusWork: dto.statusWork }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
      select: {
        id: true,
        name: true,
        login: true,
        cities: true,
        statusWork: true,
        note: true,
      },
    });

    return {
      success: true,
      message: 'Master updated successfully',
      data: master,
    };
  }

  async deleteMaster(id: number) {
    await this.prisma.master.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Master deleted successfully',
    };
  }

  async updateDocuments(id: number, body: { contractDoc?: string; passportDoc?: string }) {
    const master = await this.prisma.master.update({
      where: { id },
      data: {
        ...(body.contractDoc && { contractDoc: body.contractDoc }),
        ...(body.passportDoc && { passportDoc: body.passportDoc }),
      },
      select: {
        id: true,
        name: true,
        contractDoc: true,
        passportDoc: true,
      },
    });

    return {
      success: true,
      message: 'Documents updated successfully',
      data: master,
    };
  }
}


