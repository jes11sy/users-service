import { Controller, Get, Post, Put, Body, Query, Param, UseGuards, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CookieJwtAuthGuard } from '../auth/guards/cookie-jwt-auth.guard';
import { EmployeesService } from './employees.service';
import { RolesGuard, Roles, UserRole } from '../auth/roles.guard';
import { CreateMasterDto, UpdateMasterDto } from '../masters/dto/master.dto';

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check endpoint' })
  async health() {
    return {
      success: true,
      message: 'Employees module is healthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR, UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Get all employees (masters, directors)' })
  async getEmployees(@Query() query: any) {
    return this.employeesService.getEmployees(query);
  }

  @Get(':id')
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN, UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiQuery({ name: 'role', required: false, enum: ['master', 'director'], description: 'Роль сотрудника для точного поиска' })
  async getEmployee(
    @Param('id', ParseIntPipe) id: number,
    @Query('role') role?: 'master' | 'director',
  ) {
    return this.employeesService.getEmployee(id, role);
  }

  @Post()
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Create new employee (master)' })
  async createEmployee(@Body() dto: CreateMasterDto) {
    return this.employeesService.createEmployee(dto);
  }

  @Put(':id')
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Update employee' })
  async updateEmployee(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMasterDto,
  ) {
    return this.employeesService.updateEmployee(id, dto);
  }
}
