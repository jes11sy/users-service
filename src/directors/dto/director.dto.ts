import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  cities?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tgId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  passportDoc?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contractDoc?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  statusWork?: string;

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

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  cities?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tgId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  passportDoc?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contractDoc?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  statusWork?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;
}




