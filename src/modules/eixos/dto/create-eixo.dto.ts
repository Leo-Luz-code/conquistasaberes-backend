import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEixoDto {
  @ApiProperty({ example: 'Gestão Pública', description: 'Nome do eixo de conhecimento' })
  @IsNotEmpty({ message: 'O nome do eixo é obrigatório.' })
  @IsString({ message: 'O nome do eixo deve ser um texto.' })
  nomeEixo: string;

  @ApiProperty({ example: 'Cursos voltados para a área de gestão pública municipal.', description: 'Descrição do eixo' })
  @IsNotEmpty({ message: 'A descrição é obrigatória.' })
  @IsString({ message: 'A descrição deve ser um texto.' })
  descricao: string;
}
