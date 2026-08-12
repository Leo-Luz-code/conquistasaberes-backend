import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateNoticiaDto {
  @ApiProperty({ example: 'Prefeitura lança UniVC', description: 'Título principal da matéria' })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiPropertyOptional({ example: 'Linha fina explicativa...', description: 'Subtítulo complementar' })
  @IsString()
  @IsOptional()
  subtitulo?: string;

  @ApiProperty({ example: 'Conteúdo completo da matéria...', description: 'Texto da publicação' })
  @IsString()
  @IsNotEmpty()
  conteudo: string;

  @ApiPropertyOptional({ example: 'Destaque', description: 'Categoria da notícia' })
  @IsString()
  @IsOptional()
  categoria?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...', description: 'URL da imagem de capa' })
  @IsString()
  @IsOptional()
  capaUrl?: string;

  @ApiPropertyOptional({ example: false, description: 'Se a notícia é destaque principal' })
  @IsBoolean()
  @IsOptional()
  destaque?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Status de publicação' })
  @IsBoolean()
  @IsOptional()
  publicada?: boolean;

  @ApiPropertyOptional({ example: 'Assessoria CETI', description: 'Nome do autor/editorial' })
  @IsString()
  @IsOptional()
  autorNome?: string;

  @ApiPropertyOptional({ example: 'uuid-secretaria', description: 'ID da secretaria alvo (opcional)' })
  @IsString()
  @IsOptional()
  secretariaAlvoId?: string;
}
