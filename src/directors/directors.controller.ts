import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DirectorsService } from './directors.service';
import { CreateDirectorDto, UpdateDirectorDto } from './dto/director.dto';
import { RolesGuard, Roles, UserRole } from '../auth/roles.guard';

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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN, UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Get all directors' })
  async getDirectors() {
    return this.directorsService.getDirectors();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN, UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Get director by ID' })
  async getDirector(@Param('id') id: string) {
    return this.directorsService.getDirector(+id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Create new director' })
  async createDirector(@Body() dto: CreateDirectorDto) {
    return this.directorsService.createDirector(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Update director' })
  async updateDirector(@Param('id') id: string, @Body() dto: UpdateDirectorDto) {
    return this.directorsService.updateDirector(+id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Delete director' })
  async deleteDirector(@Param('id') id: string) {
    return this.directorsService.deleteDirector(+id);
  }
}








