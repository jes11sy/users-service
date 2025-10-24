import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
          cities: true,
          statusWork: true,
          dateCreate: true,
          note: true,
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
    };
  }
}
