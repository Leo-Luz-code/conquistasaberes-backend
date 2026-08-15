import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsDateString()
  dataInicio: string;

  @IsDateString()
  dataFim: string;

  @IsOptional()
  @IsString()
  local?: string;

  @IsOptional()
  @IsString()
  modalidade?: string;

  @IsOptional()
  @IsInt()
  vagas?: number;

  @IsOptional()
  @IsString()
  capaUrl?: string;

  @IsOptional()
  @IsUUID()
  secretariaId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}