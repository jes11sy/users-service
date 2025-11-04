import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMasterDto, UpdateMasterDto } from './dto/master.dto';

@Injectable()
export class MastersService {
  constructor(private prisma: PrismaService) {}

  private validateSearchQuery(search: string | undefined): void {
    if (search && search.length > 100) {
      throw new BadRequestException('Search query must not exceed 100 characters');
    }
  }

  async getMasters(query: any, user?: any) {
    const { city, statusWork, search } = query;

    // Валидация поискового запроса
    this.validateSearchQuery(search);

    const where: any = {};

    // Фильтрация по городам директора
    if (user?.role === 'director' && user?.cities && user.cities.length > 0) {
      // Для директора показываем только мастеров его городов
      where.cities = { hasSome: user.cities };
    }

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
      total: masters.length,
    };
  }

  async getEmployees(query: any, user?: any) {
    const { search, role } = query;

    // Валидация поискового запроса
    this.validateSearchQuery(search);

    // Формируем условие для фильтрации по городам директора
    const mastersWhere: any = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { login: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const directorsWhere: any = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { login: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    // Для директора показываем только сотрудников его городов
    if (user?.role === 'director' && user?.cities && user.cities.length > 0) {
      mastersWhere.cities = { hasSome: user.cities };
      directorsWhere.cities = { hasSome: user.cities };
    }

    // Получаем всех сотрудников (мастеров и директоров)
    // ✅ Оптимизация: используем Promise.all для параллельного выполнения запросов
    // Это предотвращает N+1 проблему и уменьшает время ответа
    const [masters, directors] = await Promise.all([
      this.prisma.master.findMany({
        where: mastersWhere,
        select: {
          id: true,
          name: true,
          login: true,
          cities: true,
          statusWork: true,
          dateCreate: true,
          note: true,
        },
        orderBy: { dateCreate: 'desc' },
      }),
      this.prisma.director.findMany({
        where: directorsWhere,
        select: {
          id: true,
          name: true,
          login: true,
          cities: true,
          dateCreate: true,
          note: true,
        },
        orderBy: { dateCreate: 'desc' },
      }),
    ]);

    // Объединяем всех сотрудников
    const allEmployees = [
      ...masters.map(m => ({ ...m, role: 'master' })),
      ...directors.map(d => ({ ...d, role: 'director' })),
    ];

    // Фильтруем по роли если указана
    const filteredEmployees = role 
      ? allEmployees.filter(emp => emp.role === role)
      : allEmployees;

    return {
      success: true,
      data: filteredEmployees,
      total: filteredEmployees.length,
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
        tgId: true,
        chatId: true,
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


