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

    // ✅ FIX: Добавлена пагинация
    const skip = (page - 1) * limit;

    const [directors, total] = await Promise.all([
      this.prisma.director.findMany({
        where,
        orderBy: { dateCreate: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          login: true,
          cities: true,
          dateCreate: true,
          tgId: true,
          note: true,
          contractDoc: true,
          passportDoc: true,
        },
      }),
      this.prisma.director.count({ where }),
    ]);

    return {
      success: true,
      data: directors,
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
        cities: true,
        dateCreate: true,
        tgId: true,
        note: true,
        contractDoc: true,
        passportDoc: true,
      },
    });

    if (!director) {
      throw new NotFoundException('Director not found');
    }

    return {
      success: true,
      data: director,
    };
  }

  async createDirector(dto: CreateDirectorDto) {
    // ✅ FIX #85: Полная проверка уникальности login по всем таблицам
    const [existingDirector, existingMaster, existingOperator, existingAdmin] = await Promise.all([
      this.prisma.director.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.master.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.callcentreOperator.findFirst({ where: { login: dto.login }, select: { id: true } }),
      this.prisma.callcentreAdmin.findFirst({ where: { login: dto.login }, select: { id: true } }),
    ]);

    if (existingDirector) {
      throw new BadRequestException(`Директор с логином "${dto.login}" уже существует`);
    }
    if (existingMaster) {
      throw new BadRequestException(`Пользователь с логином "${dto.login}" уже существует (мастер)`);
    }
    if (existingOperator) {
      throw new BadRequestException(`Пользователь с логином "${dto.login}" уже существует (оператор)`);
    }
    if (existingAdmin) {
      throw new BadRequestException(`Пользователь с логином "${dto.login}" уже существует (админ)`);
    }

    // Хешируем пароль с унифицированным количеством раундов
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const director = await this.prisma.director.create({
      data: {
        name: dto.name,
        login: dto.login,
        password: hashedPassword,
        cities: dto.cities || [],
        tgId: dto.tgId,
        passportDoc: dto.passportDoc,
        contractDoc: dto.contractDoc,
        note: dto.note,
      },
      select: {
        id: true,
        name: true,
        login: true,
        cities: true,
        tgId: true,
        passportDoc: true,
        contractDoc: true,
        dateCreate: true,
      },
    });

    return {
      success: true,
      message: 'Director created successfully',
      data: director,
    };
  }

  async updateDirector(id: number, dto: UpdateDirectorDto) {
    // Хешируем пароль если он передан
    const updateData: any = {
      ...(dto.name && { name: dto.name }),
      ...(dto.login && { login: dto.login }),
      ...(dto.cities && { cities: dto.cities }),
      ...(dto.tgId !== undefined && { tgId: dto.tgId }),
      ...(dto.passportDoc !== undefined && { passportDoc: dto.passportDoc }),
      ...(dto.contractDoc !== undefined && { contractDoc: dto.contractDoc }),
      ...(dto.note !== undefined && { note: dto.note }),
    };

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    }

    const director = await this.prisma.director.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        login: true,
        cities: true,
        tgId: true,
        passportDoc: true,
        contractDoc: true,
        note: true,
      },
    });

    return {
      success: true,
      message: 'Director updated successfully',
      data: director,
    };
  }

  async deleteDirector(id: number) {
    await this.prisma.director.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Director deleted successfully',
    };
  }
}
