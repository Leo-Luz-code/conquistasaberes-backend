import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ example: 'Aula 1: O que é a LGPD?', description: 'Título da aula' })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({ example: 'VIDEO', description: 'Tipo da aula: VIDEO, TEXTO, PDF, QUIZ' })
  @IsString()
  @IsIn(['VIDEO', 'TEXTO', 'PDF', 'QUIZ'])
  tipo: string;

  @ApiPropertyOptional({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'URL do vídeo ou PDF' })
  @IsString()
  @IsOptional()
  conteudoUrl?: string;

  @ApiPropertyOptional({ example: 'Conteúdo em formato texto formatado.', description: 'Texto da aula' })
  @IsString()
  @IsOptional()
  texto?: string;

  @ApiPropertyOptional({ example: '{"pergunta": "...", "opcoes": [...], "respostaCorreta": 0}', description: 'JSON string com quiz' })
  @IsString()
  @IsOptional()
  quizData?: string;

  @ApiPropertyOptional({ example: 15, description: 'Duração estimada em minutos' })
  @IsNumber()
  @IsOptional()
  duracaoMin?: number;

  @ApiPropertyOptional({ example: 1, description: 'Ordem da aula no módulo' })
  @IsNumber()
  @IsOptional()
  ordem?: number;
}
