import { IsOptional, IsString, MaxLength, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiProperty({ required: false, description: 'Номер страницы (начиная с 1)', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, description: 'Количество записей на странице', default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class GetMastersQueryDto extends PaginationDto {
  @ApiProperty({ required: false, description: 'Фильтр по ID города' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cityId?: number;

  @ApiProperty({ required: false, description: 'Фильтр по статусу' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @ApiProperty({ required: false, description: 'Поисковый запрос', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Search query must not exceed 100 characters' })
  search?: string;
}

export class GetEmployeesQueryDto extends PaginationDto {
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

export class GetOperatorsQueryDto extends PaginationDto {
  @ApiProperty({ required: false, enum: ['admin', 'operator'], description: 'Тип оператора' })
  @IsOptional()
  @IsEnum(['admin', 'operator'])
  type?: 'admin' | 'operator';
}

export class GetDirectorsQueryDto extends PaginationDto {
  @ApiProperty({ required: false, description: 'Поисковый запрос', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Search query must not exceed 100 characters' })
  search?: string;
}

