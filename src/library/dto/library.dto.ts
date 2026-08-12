import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class ListLibraryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 8;
}

export class CreateBibliotecaDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  categoria: string;

  // Opcional quando um arquivo é enviado no multipart/form-data.
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  documentoUrl?: string;
}

export class UpdateBibliotecaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titulo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoria?: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  documentoUrl?: string;
}