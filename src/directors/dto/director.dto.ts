import { IsString, IsOptional, IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDirectorDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  login: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty({ required: false, type: [Number] })
  @IsArray()
  @IsOptional()
  @Type(() => Number)
  @IsInt({ each: true })
  cityIds?: number[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tgId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  passport?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contract?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateDirectorDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  login?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ required: false, type: [Number] })
  @IsArray()
  @IsOptional()
  @Type(() => Number)
  @IsInt({ each: true })
  cityIds?: number[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tgId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  passport?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contract?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;
}
