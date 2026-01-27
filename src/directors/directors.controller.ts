import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, ParseIntPipe, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CookieJwtAuthGuard } from '../auth/guards/cookie-jwt-auth.guard';
import { DirectorsService } from './directors.service';
import { CreateDirectorDto, UpdateDirectorDto } from './dto/director.dto';
import { RolesGuard, Roles, UserRole } from '../auth/roles.guard';
import { GetDirectorsQueryDto } from '../common/dto/query.dto';

@ApiTags('directors')
@Controller('directors')
export class DirectorsController {
  constructor(private directorsService: DirectorsService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check endpoint' })
  async health() {
    return {
      success: true,
      message: 'Directors module is healthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN, UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Get all directors' })
  async getDirectors(@Query() query: GetDirectorsQueryDto) {
    return this.directorsService.getDirectors(query);
  }

  @Get(':id')
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN, UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Get director by ID' })
  async getDirector(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // ✅ FIX IDOR: Директор может просматривать только себя
    if (req.user.role === 'director' && id !== req.user.userId) {
      throw new ForbiddenException('You can only view your own profile');
    }
    return this.directorsService.getDirector(id);
  }

  @Post()
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Create new director' })
  async createDirector(@Body() dto: CreateDirectorDto) {
    return this.directorsService.createDirector(dto);
  }

  @Put(':id')
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update director' })
  async updateDirector(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDirectorDto, @Request() req) {
    // ✅ FIX IDOR: Директор может редактировать только себя
    if (req.user.role === 'director' && id !== req.user.userId) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.directorsService.updateDirector(id, dto);
  }

  @Delete(':id')
  @UseGuards(CookieJwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Delete director' })
  async deleteDirector(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // ✅ FIX: Защита от самоудаления - директор не может удалить сам себя
    if (req.user.role === 'director' && id === req.user.userId) {
      throw new ForbiddenException('You cannot delete yourself');
    }
    return this.directorsService.deleteDirector(id);
  }
}








