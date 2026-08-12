import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLearningPathDto {
  @ApiProperty({ example: 'Trilha de Inovação', description: 'Título da trilha' })
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  @IsString({ message: 'O título deve ser um texto.' })
  tituloTrilha: string;

  @ApiProperty({ example: 40, description: 'Carga horária total' })
  @IsNotEmpty({ message: 'A carga horária é obrigatória.' })
  @IsNumber({}, { message: 'A carga horária deve ser um número.' })
  cargaHorariaTotal: number;

  @ApiPropertyOptional({ example: 'uuid-do-eixo', description: 'ID do eixo de conhecimento' })
  @IsOptional()
  @IsString({ message: 'O ID do eixo deve ser um texto válido.' })
  eixoId?: string;
}
