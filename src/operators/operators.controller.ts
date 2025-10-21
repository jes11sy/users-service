import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto, UpdateOperatorDto } from './dto/operator.dto';
import { RolesGuard, Roles, UserRole } from '../auth/roles.guard';

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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CALLCENTRE_ADMIN, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get all operators and admins' })
  async getOperators(@Query('type') type?: string) {
    return this.operatorsService.getOperators(type);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CALLCENTRE_ADMIN, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get operator/admin by ID' })
  async getOperator(@Param('id') id: string, @Query('type') type: string) {
    return this.operatorsService.getOperator(+id, type);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Create new operator/admin' })
  async createOperator(@Body() dto: CreateOperatorDto) {
    return this.operatorsService.createOperator(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Update operator/admin' })
  async updateOperator(
    @Param('id') id: string,
    @Query('type') type: string,
    @Body() dto: UpdateOperatorDto,
  ) {
    return this.operatorsService.updateOperator(+id, type, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Delete operator/admin' })
  async deleteOperator(@Param('id') id: string, @Query('type') type: string) {
    return this.operatorsService.deleteOperator(+id, type);
  }
}

