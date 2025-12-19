import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CookieJwtAuthGuard } from '../auth/guards/cookie-jwt-auth.guard';
import { MastersService } from './masters.service';
import { CreateMasterDto, UpdateMasterDto } from './dto/master.dto';
import { RolesGuard, Roles, UserRole } from '../auth/roles.guard';
import { GetMastersQueryDto, GetEmployeesQueryDto } from '../common/dto/query.dto';

@ApiTags('masters')
@Controller('masters')
export class MastersController {
  constructor(private mastersService: MastersService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check endpoint' })
  async health() {
    return {
      success: true,
      message: 'Masters module is healthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN, UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Get all masters' })
  async getMasters(@Query() query: GetMastersQueryDto, @Request() req) {
    return this.mastersService.getMasters(query, req.user);
  }

  @Get('employees')
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN, UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Get all employees (masters, directors, operators)' })
  async getEmployees(@Query() query: GetEmployeesQueryDto, @Request() req) {
    return this.mastersService.getEmployees(query, req.user);
  }

  @Get(':id')
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN, UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Get master by ID' })
  async getMaster(@Param('id') id: string) {
    return this.mastersService.getMaster(+id);
  }

  @Post()
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Create new master' })
  async createMaster(@Body() dto: CreateMasterDto) {
    return this.mastersService.createMaster(dto);
  }

  @Put(':id')
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update master' })
  async updateMaster(@Param('id') id: string, @Body() dto: UpdateMasterDto) {
    return this.mastersService.updateMaster(+id, dto);
  }

  @Delete(':id')
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Delete master' })
  async deleteMaster(@Param('id') id: string) {
    return this.mastersService.deleteMaster(+id);
  }

  @Put(':id/documents')
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR, UserRole.MASTER)
  @ApiOperation({ summary: 'Update master documents' })
  async updateDocuments(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { contractDoc?: string; passportDoc?: string },
  ) {
    // Проверяем права доступа: мастер может редактировать только свои документы
    if (req.user.role === UserRole.MASTER && +id !== req.user.userId) {
      throw new ForbiddenException('You can only update your own documents');
    }
    return this.mastersService.updateDocuments(+id, body);
  }
}


