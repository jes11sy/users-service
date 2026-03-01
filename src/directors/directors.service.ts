import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDirectorDto, UpdateDirectorDto } from './dto/director.dto';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../config/security.config';

@Injectable()
export class DirectorsService {
  constructor(private prisma: PrismaService) {}

  async getDirectors(query: any = {}) {
    const { search, page = 1, limit = 50 } = query;

    const where: any = {};
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
          id: true, name: true, login: true, cityIds: true,
          tgId: true, note: true, contract: true, passport: true, createdAt: true,
        },
      }),
      this.prisma.director.count({ where }),
    ]);

    return { success: true, data: directors, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDirector(id: number) {
    const director = await this.prisma.director.findUnique({
      where: { id },
      select: {
        id: true, name: true, login: true, cityIds: true,
        tgId: true, note: true, contract: true, passport: true, createdAt: true,
      },
    });

    if (!director) throw new NotFoundException('Director not found');
    return { success: true, data: director };
  }

  async getDirectorsByCityId(cityId: number) {
    const directors = await this.prisma.director.findMany({
      where: { cityIds: { has: cityId } },
      select: { id: true, name: true, cityIds: true, tgId: true },
    });

    return { success: true, data: directors };
  }

  async createDirector(dto: CreateDirectorDto) {
    const [existingDirector, existingMaster, existingOperator, existingAdmin] = await Promise.all([
      this.prisma.director.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.master.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.operator.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.admin.findFirst({ where: { login: dto.login }, select: { id: true } }),
    ]);

    if (existingDirector) throw new BadRequestException(`Директор с логином "${dto.login}" уже существует`);
    if (existingMaster) throw new BadRequestException(`Пользователь с логином "${dto.login}" уже существует (мастер)`);
    if (existingOperator) throw new BadRequestException(`Пользователь с логином "${dto.login}" уже существует (оператор)`);
    if (existingAdmin) throw new BadRequestException(`Пользователь с логином "${dto.login}" уже существует (админ)`);

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const director = await this.prisma.director.create({
      data: {
        name: dto.name,
        login: dto.login,
        password: hashedPassword,
        role: 'director',
        cityIds: dto.cityIds || [],
        tgId: dto.tgId,
        passport: dto.passport,
        contract: dto.contract,
        note: dto.note,
        status: 'active',
      },
      select: {
        id: true, name: true, login: true, cityIds: true,
        tgId: true, passport: true, contract: true, createdAt: true,
      },
    });

    return { success: true, message: 'Director created successfully', data: director };
  }

  async updateDirector(id: number, dto: UpdateDirectorDto) {
    const updateData: any = {
      ...(dto.name && { name: dto.name }),
      ...(dto.login && { login: dto.login }),
      ...(dto.cityIds && { cityIds: dto.cityIds }),
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
        id: true, name: true, login: true, cityIds: true,
        tgId: true, passport: true, contract: true, note: true,
      },
    });

    return { success: true, message: 'Director updated successfully', data: director };
  }

  async deleteDirector(id: number) {
    await this.prisma.director.delete({ where: { id } });
    return { success: true, message: 'Director deleted successfully' };
  }
}
