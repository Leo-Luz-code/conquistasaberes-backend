import { IsNotEmpty, IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CriaUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly cpf: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly matricula: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly nome: string;

  @IsEmail()
  @ApiProperty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly cargo: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly secretariaId: string;

  @ApiProperty({ enum: Role })
  readonly role: Role;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly senha: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  readonly statusAtivo?: boolean;
}
