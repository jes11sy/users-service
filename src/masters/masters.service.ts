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

  private getUserCityIds(user?: any): number[] {
    return Array.isArray(user?.cityIds) ? user.cityIds : [];
  }

  async getMasters(query: any, user?: any) {
    const { cityId, status, search, page = 1, limit = 50 } = query;
<<<<<<< Updated upstream
=======

    // Валидация поискового запроса
>>>>>>> Stashed changes
    this.validateSearchQuery(search);

    const where: any = {
      deletedAt: null,
    };

<<<<<<< Updated upstream
    if (user?.role === 'director' && user?.cityIds && user.cityIds.length > 0) {
      where.cityIds = { hasSome: user.cityIds };
      if (cityId && user.cityIds.includes(Number(cityId))) {
        where.cityIds = { has: Number(cityId) };
      }
    } else if (cityId) {
=======
    // Фильтрация по городам директора
    const userCityIds = this.getUserCityIds(user);
    if (user?.role === 'director' && userCityIds.length > 0) {
      where.cityIds = { hasSome: userCityIds };
      
      // Если директор дополнительно фильтрует по конкретному городу из своего списка
      if (cityId && userCityIds.includes(Number(cityId))) {
        where.cityIds = { has: Number(cityId) };
      }
    } else if (cityId) {
      // Для админа можно фильтровать по любому городу
>>>>>>> Stashed changes
      where.cityIds = { has: Number(cityId) };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { login: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [masters, total] = await Promise.all([
      this.prisma.master.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
<<<<<<< Updated upstream
          id: true, name: true, login: true, cityIds: true,
          status: true, note: true, contract: true, passport: true, createdAt: true,
=======
          id: true,
          name: true,
          login: true,
          cityIds: true,
          status: true,
          createdAt: true,
          note: true,
          contract: true,
          passport: true,
          chatId: true,
>>>>>>> Stashed changes
        },
      }),
      this.prisma.master.count({ where }),
    ]);

    return { success: true, data: masters, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getEmployees(query: any, user?: any) {
    const { search, role, page = 1, limit = 50 } = query;
    this.validateSearchQuery(search);

<<<<<<< Updated upstream
    const mastersWhere: any = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { login: { contains: search, mode: 'insensitive' } },
      ],
    } : {};
=======
    // Формируем условие для фильтрации по городам директора
    const mastersWhere: any = {
      deletedAt: null,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { login: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };
>>>>>>> Stashed changes

    const directorsWhere: any = {
      deletedAt: null,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { login: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

<<<<<<< Updated upstream
    if (user?.role === 'director' && user?.cityIds && user.cityIds.length > 0) {
      mastersWhere.cityIds = { hasSome: user.cityIds };
      directorsWhere.cityIds = { hasSome: user.cityIds };
=======
    // Для директора показываем только сотрудников его городов
    const userCityIds = this.getUserCityIds(user);
    if (user?.role === 'director' && userCityIds.length > 0) {
      mastersWhere.cityIds = { hasSome: userCityIds };
      directorsWhere.cityIds = { hasSome: userCityIds };
>>>>>>> Stashed changes
    }

    if (role === 'master') {
      const skip = (page - 1) * limit;
      const [masters, total] = await Promise.all([
        this.prisma.master.findMany({
          where: mastersWhere,
          skip,
          take: limit,
<<<<<<< Updated upstream
          select: { id: true, name: true, login: true, cityIds: true, status: true, note: true, createdAt: true },
=======
          select: {
            id: true,
            name: true,
            login: true,
            cityIds: true,
            status: true,
            createdAt: true,
            note: true,
          },
>>>>>>> Stashed changes
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.master.count({ where: mastersWhere }),
      ]);

      return {
        success: true,
        data: masters.map(m => ({ ...m, role: 'master' })),
        total, page, limit, totalPages: Math.ceil(total / limit),
      };
    }

    if (role === 'director') {
      const skip = (page - 1) * limit;
      const [directors, total] = await Promise.all([
        this.prisma.director.findMany({
          where: directorsWhere,
          skip,
          take: limit,
<<<<<<< Updated upstream
          select: { id: true, name: true, login: true, cityIds: true, note: true, createdAt: true },
=======
          select: {
            id: true,
            name: true,
            login: true,
            cityIds: true,
            createdAt: true,
            note: true,
          },
>>>>>>> Stashed changes
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.director.count({ where: directorsWhere }),
      ]);

      return {
        success: true,
        data: directors.map(d => ({ ...d, role: 'director' })),
        total, page, limit, totalPages: Math.ceil(total / limit),
      };
    }

    const halfLimit = Math.ceil(limit / 2);
    const skip = (page - 1) * halfLimit;

    const [masters, directors, mastersCount, directorsCount] = await Promise.all([
      this.prisma.master.findMany({
        where: mastersWhere,
        skip,
        take: halfLimit,
<<<<<<< Updated upstream
        select: { id: true, name: true, login: true, cityIds: true, status: true, note: true, createdAt: true },
=======
        select: {
          id: true,
          name: true,
          login: true,
          cityIds: true,
          status: true,
          createdAt: true,
          note: true,
        },
>>>>>>> Stashed changes
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.director.findMany({
        where: directorsWhere,
        skip,
        take: halfLimit,
<<<<<<< Updated upstream
        select: { id: true, name: true, login: true, cityIds: true, note: true, createdAt: true },
=======
        select: {
          id: true,
          name: true,
          login: true,
          cityIds: true,
          createdAt: true,
          note: true,
        },
>>>>>>> Stashed changes
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.master.count({ where: mastersWhere }),
      this.prisma.director.count({ where: directorsWhere }),
    ]);

    return {
      success: true,
      data: [
        ...masters.map(m => ({ ...m, role: 'master' })),
        ...directors.map(d => ({ ...d, role: 'director' })),
      ],
      total: mastersCount + directorsCount,
      page, limit,
      totalPages: Math.ceil((mastersCount + directorsCount) / limit),
    };
  }

<<<<<<< Updated upstream
=======
  /**
   * ✅ FIX IDOR: Проверяет, что директор имеет доступ к мастеру (мастер в городах директора)
   */
>>>>>>> Stashed changes
  async validateDirectorAccessToMaster(masterId: number, directorCityIds: number[]): Promise<void> {
    if (!directorCityIds || directorCityIds.length === 0) {
      throw new ForbiddenException('Director has no assigned cities');
    }

    const master = await this.prisma.master.findUnique({
      where: { id: masterId },
      select: { id: true, cityIds: true },
    });

    if (!master) throw new NotFoundException('Master not found');

<<<<<<< Updated upstream
    const hasCommonCity = master.cityIds.some(id => directorCityIds.includes(id));
    if (!hasCommonCity) throw new ForbiddenException('You do not have access to this master');
  }

=======
    // Проверяем, что хотя бы один город мастера входит в города директора
    const hasCommonCity = master.cityIds.some((cityId) => directorCityIds.includes(cityId));
    if (!hasCommonCity) {
      throw new ForbiddenException('You do not have access to this master');
    }
  }

  /**
   * ✅ FIX IDOR: Проверяет, что все указанные города мастера входят в города директора
   */
>>>>>>> Stashed changes
  validateDirectorCitiesForMaster(masterCityIds: number[] | undefined, directorCityIds: number[]): void {
    if (!directorCityIds || directorCityIds.length === 0) {
      throw new ForbiddenException('Director has no assigned cities');
    }
    if (!masterCityIds || masterCityIds.length === 0) return;

<<<<<<< Updated upstream
    const invalidIds = masterCityIds.filter(id => !directorCityIds.includes(id));
    if (invalidIds.length > 0) {
      throw new ForbiddenException(`You cannot assign master to city IDs: ${invalidIds.join(', ')}`);
=======
    if (!masterCityIds || masterCityIds.length === 0) {
      return; // Пустые города допустимы
    }

    const invalidCities = masterCityIds.filter((cityId) => !directorCityIds.includes(cityId));
    if (invalidCities.length > 0) {
      throw new ForbiddenException(`You cannot assign master to cities: ${invalidCities.join(', ')}`);
>>>>>>> Stashed changes
    }
  }

  async getMaster(id: number) {
    const master = await this.prisma.master.findUnique({
      where: { id },
      select: {
<<<<<<< Updated upstream
        id: true, name: true, login: true, cityIds: true,
        status: true, chatId: true, note: true, contract: true, passport: true, createdAt: true,
=======
        id: true,
        name: true,
        login: true,
        cityIds: true,
        status: true,
        createdAt: true,
        chatId: true,
        note: true,
        contract: true,
        passport: true,
>>>>>>> Stashed changes
      },
    });

    if (!master) throw new NotFoundException('Master not found');
    return { success: true, data: master };
  }

  async createMaster(dto: CreateMasterDto) {
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
        cityIds: dto.cityIds || [],
        status: dto.status || 'active',
=======
        status: dto.status || 'active',
        cityIds: dto.cityIds || [],
>>>>>>> Stashed changes
        note: dto.note,
        chatId: dto.chatId,
        passport: dto.passport,
        contract: dto.contract,
      },
<<<<<<< Updated upstream
      select: { id: true, name: true, login: true, cityIds: true, status: true, createdAt: true },
=======
      select: {
        id: true,
        name: true,
        login: true,
        cityIds: true,
        status: true,
        createdAt: true,
      },
>>>>>>> Stashed changes
    });

    return { success: true, message: 'Master created successfully', data: master };
  }

  async updateMaster(id: number, dto: UpdateMasterDto) {
    const updateData: any = {
      ...(dto.name && { name: dto.name }),
      ...(dto.login && { login: dto.login }),
      ...(dto.cityIds && { cityIds: dto.cityIds }),
      ...(dto.status && { status: dto.status }),
      ...(dto.note !== undefined && { note: dto.note }),
      ...(dto.chatId !== undefined && { chatId: dto.chatId }),
<<<<<<< Updated upstream
=======
      ...(dto.passport !== undefined && { passport: dto.passport }),
      ...(dto.contract !== undefined && { contract: dto.contract }),
>>>>>>> Stashed changes
    };

    if (dto.password) updateData.password = await this.hashPassword(dto.password);

    const master = await this.prisma.master.update({
      where: { id },
      data: updateData,
<<<<<<< Updated upstream
      select: { id: true, name: true, login: true, cityIds: true, status: true, note: true },
=======
      select: {
        id: true,
        name: true,
        login: true,
        cityIds: true,
        status: true,
        note: true,
        chatId: true,
        passport: true,
        contract: true,
      },
>>>>>>> Stashed changes
    });

    return { success: true, message: 'Master updated successfully', data: master };
  }

  async deleteMaster(id: number) {
    await this.prisma.master.delete({ where: { id } });
    return { success: true, message: 'Master deleted successfully' };
  }

  async updateDocuments(id: number, body: { contract?: string; passport?: string }) {
    const master = await this.prisma.master.update({
      where: { id },
      data: {
<<<<<<< Updated upstream
        ...(body.contract !== undefined && { contract: body.contract }),
        ...(body.passport !== undefined && { passport: body.passport }),
=======
        ...(body.contract && { contract: body.contract }),
        ...(body.passport && { passport: body.passport }),
      },
      select: {
        id: true,
        name: true,
        contract: true,
        passport: true,
>>>>>>> Stashed changes
      },
      select: { id: true, name: true, contract: true, passport: true },
    });

    return { success: true, message: 'Documents updated successfully', data: master };
  }
}
