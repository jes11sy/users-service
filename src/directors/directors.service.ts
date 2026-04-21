import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDirectorDto, UpdateDirectorDto } from './dto/director.dto';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../config/security.config';
import { attachCityIds, getUserCityIds, getUserCityIdsMap, getUserIdsByCityIds, syncUserCityIds } from '../common/user-cities';

@Injectable()
export class DirectorsService {
  constructor(private prisma: PrismaService) {}

  async getDirectors(query: any = {}) {
    const { search, page = 1, limit = 50 } = query;
    const where: any = {
      deletedAt: null,
    };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { login: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [directors, total] = await Promise.all([
      this.prisma.director.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          login: true,
          createdAt: true,
          status: true,
          tgId: true,
          note: true,
          contract: true,
          passport: true,
        },
      }),
      this.prisma.director.count({ where }),
    ]);

    const cityIdsMap = await getUserCityIdsMap(this.prisma, 'director', directors.map((director) => director.id));

    return {
      success: true,
      data: attachCityIds(directors, cityIdsMap),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDirector(id: number) {
    const director = await this.prisma.director.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        login: true,
        createdAt: true,
        status: true,
        tgId: true,
        note: true,
        contract: true,
        passport: true,
      },
    });

    if (!director) throw new NotFoundException('Director not found');

    const cityIds = await getUserCityIds(this.prisma, 'director', director.id);
    return { success: true, data: { ...director, cityIds } };
  }

  async getDirectorsByCity(city: string) {
    const cityId = Number(city);
    const directorIds = await getUserIdsByCityIds(this.prisma, 'director', [cityId]);
    if (directorIds.length === 0) {
      return { success: true, data: [] };
    }

    const directors = await this.prisma.director.findMany({
      where: {
        deletedAt: null,
        id: { in: directorIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const cityIdsMap = await getUserCityIdsMap(this.prisma, 'director', directors.map((director) => director.id));
    return { success: true, data: attachCityIds(directors, cityIdsMap) };
  }

  async createDirector(dto: CreateDirectorDto) {
    const [existingDirector, existingMaster, existingOperator, existingAdmin] = await Promise.all([
      this.prisma.director.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.master.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.callcentreOperator.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.callcentreAdmin.findFirst({ where: { login: dto.login }, select: { id: true } }),
    ]);

    if (existingDirector) throw new BadRequestException(`Директор с логином "${dto.login}" уже существует`);
    if (existingMaster) throw new BadRequestException(`Пользователь с логином "${dto.login}" уже существует (мастер)`);
    if (existingOperator) throw new BadRequestException(`Пользователь с логином "${dto.login}" уже существует (оператор)`);
    if (existingAdmin) throw new BadRequestException(`Пользователь с логином "${dto.login}" уже существует (админ)`);

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const director = await this.prisma.director.create({
      data: {
        role: 'director',
        name: dto.name,
        login: dto.login,
        password: hashedPassword,
        status: 'active',
        tgId: dto.tgId,
        passport: dto.passport,
        contract: dto.contract,
        note: dto.note,
      },
      select: {
        id: true,
        name: true,
        login: true,
        tgId: true,
        passport: true,
        contract: true,
        createdAt: true,
      },
    });

    await syncUserCityIds(this.prisma, 'director', director.id, dto.cityIds);

    return {
      success: true,
      message: 'Director created successfully',
      data: {
        ...director,
        cityIds: dto.cityIds ?? [],
      },
    };
  }

  async updateDirector(id: number, dto: UpdateDirectorDto) {
    const updateData: any = {
      ...(dto.name && { name: dto.name }),
      ...(dto.login && { login: dto.login }),
      ...(dto.tgId !== undefined && { tgId: dto.tgId }),
      ...(dto.passport !== undefined && { passport: dto.passport }),
      ...(dto.contract !== undefined && { contract: dto.contract }),
      ...(dto.note !== undefined && { note: dto.note }),
    };

    if (dto.password) updateData.password = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const director = await this.prisma.director.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        login: true,
        tgId: true,
        passport: true,
        contract: true,
        note: true,
        status: true,
      },
    });

    await syncUserCityIds(this.prisma, 'director', id, dto.cityIds);

    return {
      success: true,
      message: 'Director updated successfully',
      data: {
        ...director,
        cityIds: dto.cityIds ?? await getUserCityIds(this.prisma, 'director', id),
      },
    };
  }

  async deleteDirector(id: number) {
    await this.prisma.director.delete({ where: { id } });
    return { success: true, message: 'Director deleted successfully' };
  }
}
