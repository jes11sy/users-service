import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMasterDto {
  @ApiProperty()
  @IsString()
  name: string;

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
  @IsNumber({}, { each: true })
  @IsOptional()
  cityIds?: number[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  chatId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  passport?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contract?: string;
}

export class UpdateMasterDto {
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
  @IsNumber({}, { each: true })
  @IsOptional()
  cityIds?: number[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  chatId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  passport?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contract?: string;
}
