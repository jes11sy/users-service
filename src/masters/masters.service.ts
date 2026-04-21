import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMasterDto, UpdateMasterDto } from './dto/master.dto';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../config/security.config';
import { attachCityIds, getUserCityIds, getUserCityIdsMap, getUserIdsByCityIds, syncUserCityIds } from '../common/user-cities';

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

  private async enrichMasters<T extends { id: number }>(masters: T[]): Promise<Array<T & { cityIds: number[] }>> {
    const cityIdsMap = await getUserCityIdsMap(this.prisma, 'master', masters.map((master) => master.id));
    return attachCityIds(masters, cityIdsMap);
  }

  private async enrichDirectors<T extends { id: number }>(directors: T[]): Promise<Array<T & { cityIds: number[] }>> {
    const cityIdsMap = await getUserCityIdsMap(this.prisma, 'director', directors.map((director) => director.id));
    return attachCityIds(directors, cityIdsMap);
  }

  async getMasters(query: any, user?: any) {
    const { cityId, status, search, page = 1, limit = 50 } = query;
    this.validateSearchQuery(search);

    const where: any = {
      deletedAt: null,
    };

    // Фильтрация по городам директора
    const userCityIds = this.getUserCityIds(user);
    let requestedCityIds: number[] = [];
    if (user?.role === 'director' && userCityIds.length > 0) {
      requestedCityIds = userCityIds;

      // Если директор дополнительно фильтрует по конкретному городу из своего списка
      if (cityId && userCityIds.includes(Number(cityId))) {
        requestedCityIds = [Number(cityId)];
      }
    } else if (cityId) {
      // Для админа можно фильтровать по любому городу
      requestedCityIds = [Number(cityId)];
    }

    if (requestedCityIds.length > 0) {
      const masterIds = await getUserIdsByCityIds(this.prisma, 'master', requestedCityIds);
      where.id = { in: masterIds };
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
          id: true,
          name: true,
          login: true,
          status: true,
          createdAt: true,
          note: true,
          contract: true,
          passport: true,
          chatId: true,
        },
      }),
      this.prisma.master.count({ where }),
    ]);

    return {
      success: true,
      data: await this.enrichMasters(masters),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEmployees(query: any, user?: any) {
    const { search, role, page = 1, limit = 50 } = query;
    this.validateSearchQuery(search);

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

    const directorsWhere: any = {
      deletedAt: null,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { login: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    // Для директора показываем только сотрудников его городов
    const userCityIds = this.getUserCityIds(user);
    if (user?.role === 'director' && userCityIds.length > 0) {
      const [masterIds, directorIds] = await Promise.all([
        getUserIdsByCityIds(this.prisma, 'master', userCityIds),
        getUserIdsByCityIds(this.prisma, 'director', userCityIds),
      ]);
      mastersWhere.id = { in: masterIds };
      directorsWhere.id = { in: directorIds };
    }

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
            status: true,
            createdAt: true,
            note: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.master.count({ where: mastersWhere }),
      ]);

      const mastersWithCities = await this.enrichMasters(masters);
      return {
        success: true,
        data: mastersWithCities.map(m => ({ ...m, role: 'master' })),
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
          select: {
            id: true,
            name: true,
            login: true,
            createdAt: true,
            note: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.director.count({ where: directorsWhere }),
      ]);

      const directorsWithCities = await this.enrichDirectors(directors);
      return {
        success: true,
        data: directorsWithCities.map(d => ({ ...d, role: 'director' })),
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
        select: {
          id: true,
          name: true,
          login: true,
          status: true,
          createdAt: true,
          note: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.director.findMany({
        where: directorsWhere,
        skip,
        take: halfLimit,
        select: {
          id: true,
          name: true,
          login: true,
          createdAt: true,
          note: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.master.count({ where: mastersWhere }),
      this.prisma.director.count({ where: directorsWhere }),
    ]);

    const [mastersWithCities, directorsWithCities] = await Promise.all([
      this.enrichMasters(masters),
      this.enrichDirectors(directors),
    ]);

    return {
      success: true,
      data: [
        ...mastersWithCities.map(m => ({ ...m, role: 'master' })),
        ...directorsWithCities.map(d => ({ ...d, role: 'director' })),
      ],
      total: mastersCount + directorsCount,
      page, limit,
      totalPages: Math.ceil((mastersCount + directorsCount) / limit),
    };
  }

  /**
   * ✅ FIX IDOR: Проверяет, что директор имеет доступ к мастеру (мастер в городах директора)
   */
  async validateDirectorAccessToMaster(masterId: number, directorCityIds: number[]): Promise<void> {
    if (!directorCityIds || directorCityIds.length === 0) {
      throw new ForbiddenException('Director has no assigned cities');
    }

    const master = await this.prisma.master.findUnique({
      where: { id: masterId },
      select: { id: true },
    });

    if (!master) throw new NotFoundException('Master not found');

    const masterCityIds = await getUserCityIds(this.prisma, 'master', master.id);

    // Проверяем, что хотя бы один город мастера входит в города директора
    const hasCommonCity = masterCityIds.some((cityId) => directorCityIds.includes(cityId));
    if (!hasCommonCity) {
      throw new ForbiddenException('You do not have access to this master');
    }
  }
  validateDirectorCitiesForMaster(masterCityIds: number[] | undefined, directorCityIds: number[]): void {
    if (!directorCityIds || directorCityIds.length === 0) {
      throw new ForbiddenException('Director has no assigned cities');
    }
    if (!masterCityIds || masterCityIds.length === 0) return;

    const invalidCities = masterCityIds.filter((cityId) => !directorCityIds.includes(cityId));
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
        status: true,
        createdAt: true,
        chatId: true,
        note: true,
        contract: true,
        passport: true,
      },
    });

    if (!master) throw new NotFoundException('Master not found');
    return { success: true, data: { ...master, cityIds: await getUserCityIds(this.prisma, 'master', master.id) } };
  }

  async createMaster(dto: CreateMasterDto) {
    const [existingMaster, existingDirector, existingOperator, existingAdmin] = await Promise.all([
      this.prisma.master.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.director.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.callcentreOperator.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.callcentreAdmin.findFirst({ where: { login: dto.login }, select: { id: true } }),
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
        status: dto.status || 'active',
        note: dto.note,
        chatId: dto.chatId,
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

    await syncUserCityIds(this.prisma, 'master', master.id, dto.cityIds);

    return {
      success: true,
      message: 'Master created successfully',
      data: { ...master, cityIds: dto.cityIds ?? [] },
    };
  }

  async updateMaster(id: number, dto: UpdateMasterDto) {
    const updateData: any = {
      ...(dto.name && { name: dto.name }),
      ...(dto.login && { login: dto.login }),
      ...(dto.status && { status: dto.status }),
      ...(dto.note !== undefined && { note: dto.note }),
      ...(dto.chatId !== undefined && { chatId: dto.chatId }),
      ...(dto.passport !== undefined && { passport: dto.passport }),
      ...(dto.contract !== undefined && { contract: dto.contract }),
    };

    if (dto.password) updateData.password = await this.hashPassword(dto.password);

    const master = await this.prisma.master.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        login: true,
        status: true,
        note: true,
        chatId: true,
        passport: true,
        contract: true,
      },
    });

    await syncUserCityIds(this.prisma, 'master', id, dto.cityIds);

    return {
      success: true,
      message: 'Master updated successfully',
      data: {
        ...master,
        cityIds: dto.cityIds ?? await getUserCityIds(this.prisma, 'master', id),
      },
    };
  }

  async deleteMaster(id: number) {
    await this.prisma.master.delete({ where: { id } });
    return { success: true, message: 'Master deleted successfully' };
  }

  async updateDocuments(id: number, body: { contract?: string; passport?: string }) {
    const master = await this.prisma.master.update({
      where: { id },
      data: {
        ...(body.contract && { contract: body.contract }),
        ...(body.passport && { passport: body.passport }),
      },
      select: {
        id: true,
        name: true,
        contract: true,
        passport: true,
      },
    });

    return { success: true, message: 'Documents updated successfully', data: master };
  }
}
