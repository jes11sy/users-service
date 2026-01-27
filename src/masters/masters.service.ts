import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMasterDto, UpdateMasterDto } from './dto/master.dto';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../config/security.config';

@Injectable()
export class MastersService {
  constructor(private prisma: PrismaService) {}

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  private validateSearchQuery(search: string | undefined): void {
    if (search && search.length > 100) {
      throw new BadRequestException('Search query must not exceed 100 characters');
    }
  }

  async getMasters(query: any, user?: any) {
    const { city, statusWork, search, page = 1, limit = 50 } = query;

    // Валидация поискового запроса
    this.validateSearchQuery(search);

    const where: any = {};

    // Фильтрация по городам директора
    if (user?.role === 'director' && user?.cities && user.cities.length > 0) {
      // Для директора показываем только мастеров его городов
      where.cities = { hasSome: user.cities };
      
      // Если директор дополнительно фильтрует по конкретному городу из своего списка
      if (city && user.cities.includes(city)) {
        where.cities = { has: city };
      }
    } else if (city) {
      // Для админа можно фильтровать по любому городу
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

    // ✅ FIX: Добавлена пагинация
    const skip = (page - 1) * limit;
    
    const [masters, total] = await Promise.all([
      this.prisma.master.findMany({
        where,
        orderBy: { dateCreate: 'desc' },
        skip,
        take: limit,
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
      }),
      this.prisma.master.count({ where }),
    ]);

    return {
      success: true,
      data: masters,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEmployees(query: any, user?: any) {
    const { search, role, page = 1, limit = 50 } = query;

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

    // ✅ FIX: Если указана конкретная роль, запрашиваем только её с пагинацией
    if (role === 'master') {
      const skip = (page - 1) * limit;
      const [masters, total] = await Promise.all([
        this.prisma.master.findMany({
          where: mastersWhere,
          skip,
          take: limit,
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
        this.prisma.master.count({ where: mastersWhere }),
      ]);

      return {
        success: true,
        data: masters.map(m => ({ ...m, role: 'master' })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    if (role === 'director') {
      const skip = (page - 1) * limit;
      const [directors, total] = await Promise.all([
        this.prisma.director.findMany({
          where: directorsWhere,
          skip,
          take: limit,
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
        this.prisma.director.count({ where: directorsWhere }),
      ]);

      return {
        success: true,
        data: directors.map(d => ({ ...d, role: 'director' })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // Если роль не указана - получаем обоих с пагинацией (сложнее, т.к. две таблицы)
    // Для простоты пагинируем каждую таблицу отдельно и объединяем
    const halfLimit = Math.ceil(limit / 2);
    const skip = (page - 1) * halfLimit;

    const [masters, directors, mastersCount, directorsCount] = await Promise.all([
      this.prisma.master.findMany({
        where: mastersWhere,
        skip,
        take: halfLimit,
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
        skip,
        take: halfLimit,
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
      this.prisma.master.count({ where: mastersWhere }),
      this.prisma.director.count({ where: directorsWhere }),
    ]);

    const allEmployees = [
      ...masters.map(m => ({ ...m, role: 'master' })),
      ...directors.map(d => ({ ...d, role: 'director' })),
    ];

    const total = mastersCount + directorsCount;

    return {
      success: true,
      data: allEmployees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * ✅ FIX IDOR: Проверяет, что директор имеет доступ к мастеру (мастер в городах директора)
   */
  async validateDirectorAccessToMaster(masterId: number, directorCities: string[]): Promise<void> {
    if (!directorCities || directorCities.length === 0) {
      throw new ForbiddenException('Director has no assigned cities');
    }

    const master = await this.prisma.master.findUnique({
      where: { id: masterId },
      select: { id: true, cities: true },
    });

    if (!master) {
      throw new NotFoundException('Master not found');
    }

    // Проверяем, что хотя бы один город мастера входит в города директора
    const hasCommonCity = master.cities.some(city => directorCities.includes(city));
    if (!hasCommonCity) {
      throw new ForbiddenException('You do not have access to this master');
    }
  }

  /**
   * ✅ FIX IDOR: Проверяет, что все указанные города мастера входят в города директора
   */
  validateDirectorCitiesForMaster(masterCities: string[] | undefined, directorCities: string[]): void {
    if (!directorCities || directorCities.length === 0) {
      throw new ForbiddenException('Director has no assigned cities');
    }

    if (!masterCities || masterCities.length === 0) {
      return; // Пустые города допустимы
    }

    const invalidCities = masterCities.filter(city => !directorCities.includes(city));
    if (invalidCities.length > 0) {
      throw new ForbiddenException(`You cannot assign master to cities: ${invalidCities.join(', ')}`);
    }
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
    const updateData: any = {
      ...(dto.name && { name: dto.name }),
      ...(dto.login && { login: dto.login }),
      ...(dto.cities && { cities: dto.cities }),
      ...(dto.statusWork && { statusWork: dto.statusWork }),
      ...(dto.note !== undefined && { note: dto.note }),
    };

    // Хэшируем пароль если он передан
    if (dto.password) {
      updateData.password = await this.hashPassword(dto.password);
    }

    const master = await this.prisma.master.update({
      where: { id },
      data: updateData,
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


