import { IsString, IsOptional, IsArray } from 'class-validator';
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

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsOptional()
  cities?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  statusWork?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;
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

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsOptional()
  cities?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  statusWork?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;
}


