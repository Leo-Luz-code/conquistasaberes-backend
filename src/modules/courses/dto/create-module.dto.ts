import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({ example: 'Módulo 1: Introdução aos Conceitos', description: 'Título do módulo' })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiPropertyOptional({ example: 1, description: 'Ordem de exibição do módulo' })
  @IsNumber()
  @IsOptional()
  ordem?: number;
}
