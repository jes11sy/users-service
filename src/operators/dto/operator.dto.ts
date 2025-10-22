import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOperatorDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  login: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty({ enum: ['admin', 'operator'] })
  @IsString()
  @IsIn(['admin', 'operator'])
  type: 'admin' | 'operator';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  statusWork?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateOperatorDto {
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
  statusWork?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;
}







