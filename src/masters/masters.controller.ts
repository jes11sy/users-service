import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MastersService } from './masters.service';
import { CreateMasterDto, UpdateMasterDto } from './dto/master.dto';
import { RolesGuard, Roles, UserRole } from '../auth/roles.guard';

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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR, UserRole.CALLCENTRE_ADMIN)
  @ApiOperation({ summary: 'Get all masters' })
  async getMasters(@Query() query: any) {
    return this.mastersService.getMasters(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get master by ID' })
  async getMaster(@Param('id') id: string) {
    return this.mastersService.getMaster(+id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Create new master' })
  async createMaster(@Body() dto: CreateMasterDto) {
    return this.mastersService.createMaster(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Update master' })
  async updateMaster(@Param('id') id: string, @Body() dto: UpdateMasterDto) {
    return this.mastersService.updateMaster(+id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Delete master' })
  async deleteMaster(@Param('id') id: string) {
    return this.mastersService.deleteMaster(+id);
  }

  @Put(':id/documents')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.DIRECTOR, UserRole.MASTER)
  @ApiOperation({ summary: 'Update master documents' })
  async updateDocuments(
    @Param('id') id: string,
    @Body() body: { contractDoc?: string; passportDoc?: string },
  ) {
    return this.mastersService.updateDocuments(+id, body);
  }
}


