import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Request, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CookieJwtAuthGuard } from '../auth/guards/cookie-jwt-auth.guard';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto, UpdateOperatorDto } from './dto/operator.dto';
import { RolesGuard, Roles, UserRole } from '../auth/roles.guard';
import { GetOperatorsQueryDto } from '../common/dto/query.dto';

@ApiTags('operators')
@Controller('operators')
export class OperatorsController {
  constructor(private operatorsService: OperatorsService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check endpoint' })
  async health() {
    return {
      success: true,
      message: 'Operators module is healthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.CALLCENTRE_ADMIN, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get all operators and admins' })
  async getOperators(@Query() query: GetOperatorsQueryDto) {
    return this.operatorsService.getOperators(query);
  }

  @Get(':id')
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.CALLCENTRE_ADMIN, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get operator/admin by ID' })
  async getOperator(@Param('id', ParseIntPipe) id: number, @Query('type') type: string) {
    return this.operatorsService.getOperator(id, type);
  }

  @Post()
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Create new operator/admin' })
  async createOperator(@Body() dto: CreateOperatorDto) {
    return this.operatorsService.createOperator(dto);
  }

  @Put(':id')
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Update operator/admin' })
  async updateOperator(
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type: string,
    @Body() dto: UpdateOperatorDto,
  ) {
    return this.operatorsService.updateOperator(id, type, dto);
  }

  @Patch('work-status')
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CALLCENTRE_OPERATOR)
  @ApiOperation({ summary: 'Update operator work status (self)' })
  async updateWorkStatus(@Request() req, @Body() body: { statusWork: string }) {
    // ✅ FIX: Добавлена проверка роли - только операторы могут менять свой статус
    return this.operatorsService.updateWorkStatus(req.user.userId, body.statusWork);
  }

  @Delete(':id')
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Delete operator/admin' })
  async deleteOperator(
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type: string,
    @Request() req,
  ) {
    // ✅ FIX: Защита от самоудаления
    if (id === req.user.userId) {
      throw new ForbiddenException('You cannot delete yourself');
    }
    return this.operatorsService.deleteOperator(id, type);
  }
}







