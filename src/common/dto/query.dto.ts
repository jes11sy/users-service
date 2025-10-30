import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetMastersQueryDto {
  @ApiProperty({ required: false, description: 'Фильтр по городу' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({ required: false, description: 'Фильтр по статусу работы' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  statusWork?: string;

  @ApiProperty({ required: false, description: 'Поисковый запрос', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Search query must not exceed 100 characters' })
  search?: string;
}

export class GetEmployeesQueryDto {
  @ApiProperty({ required: false, description: 'Поисковый запрос', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Search query must not exceed 100 characters' })
  search?: string;

  @ApiProperty({ required: false, enum: ['master', 'director'], description: 'Фильтр по роли' })
  @IsOptional()
  @IsEnum(['master', 'director'])
  role?: 'master' | 'director';
}

export class GetOperatorsQueryDto {
  @ApiProperty({ required: false, enum: ['admin', 'operator'], description: 'Тип оператора' })
  @IsOptional()
  @IsEnum(['admin', 'operator'])
  type?: 'admin' | 'operator';
}

