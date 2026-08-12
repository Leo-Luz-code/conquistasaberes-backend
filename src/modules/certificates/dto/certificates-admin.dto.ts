import { IsEnum, IsOptional, IsString, IsUUID, IsBoolean, IsInt, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { CertificateStatus } from '@prisma/client';

export class ListCertificatesAdminDto {
  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsString()
  courseName?: string;

  @IsOptional()
  @IsString()
  codigoValidacao?: string;

  @IsOptional()
  @IsEnum(CertificateStatus)
  status?: CertificateStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class SearchQueryDto {
  @IsString()
  @MinLength(2, { message: 'Informe ao menos 2 caracteres para pesquisar.' })
  search: string;
}

export class CreateCertificateAdminDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  courseId: string;

  // Emite mesmo sem conclusão registrada de matrícula (emissão administrativa)
  @IsOptional()
  @IsBoolean()
  confirmarSemConclusao?: boolean;
}

export class UpdateCertificateStatusDto {
  @IsEnum(CertificateStatus)
  status: CertificateStatus;
}