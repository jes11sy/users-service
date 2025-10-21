import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDirectorDto, UpdateDirectorDto } from './dto/director.dto';

@Injectable()
export class DirectorsService {
  constructor(private prisma: PrismaService) {}

  async getDirectors() {
    const directors = await this.prisma.director.findMany({
      orderBy: { dateCreate: 'desc' },
      select: {
        id: true,
        name: true,
        login: true,
        city: true,
        statusWork: true,
        dateCreate: true,
        note: true,
        contractDoc: true,
        passportDoc: true,
      },
    });

    return {
      success: true,
      data: directors,
    };
  }

  async getDirector(id: number) {
    const director = await this.prisma.director.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        login: true,
        city: true,
        statusWork: true,
        dateCreate: true,
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
    const director = await this.prisma.director.create({
      data: {
        name: dto.name,
        login: dto.login,
        password: dto.password,
        city: dto.city,
        statusWork: dto.statusWork || 'active',
        note: dto.note,
      },
      select: {
        id: true,
        name: true,
        login: true,
        city: true,
        statusWork: true,
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
    const director = await this.prisma.director.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.login && { login: dto.login }),
        ...(dto.password && { password: dto.password }),
        ...(dto.city && { city: dto.city }),
        ...(dto.statusWork && { statusWork: dto.statusWork }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
      select: {
        id: true,
        name: true,
        login: true,
        city: true,
        statusWork: true,
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

