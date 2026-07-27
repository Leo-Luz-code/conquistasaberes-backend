import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Capacitação em LGPD e Governo Digital', description: 'Título do curso' })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({ example: 'Curso sobre LGPD aplicado à gestão municipal.', description: 'Descrição detalhada' })
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty({ example: 20, description: 'Carga horária total em horas' })
  @IsNumber()
  @Min(1)
  cargaHoraria: number;

  @ApiPropertyOptional({ example: 'Tecnologia', description: 'Categoria do curso' })
  @IsString()
  @IsOptional()
  categoria?: string;

  @ApiPropertyOptional({ example: 'https://exemplo.com/capa.jpg', description: 'URL da imagem de capa' })
  @IsString()
  @IsOptional()
  capaUrl?: string;

  @ApiPropertyOptional({ example: 'uuid-secretaria', description: 'ID da secretaria proprietária (null se for geral)' })
  @IsString()
  @IsOptional()
  secretariaId?: string;

  @ApiPropertyOptional({ example: true, description: 'Status de publicação' })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
