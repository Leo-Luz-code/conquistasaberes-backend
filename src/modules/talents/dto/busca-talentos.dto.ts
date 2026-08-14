import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class BuscaTalentosDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  area?: string; // Filtro de Área

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minLevel?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  possuiCertificado?: boolean; // Filtro se possui certificado emitido
}