import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBadgeDto {
  @ApiProperty({ example: 'Servidor Inovador', description: 'Nome da conquista / medalha' })
  @IsNotEmpty({ message: 'O nome do badge é obrigatório.' })
  @IsString({ message: 'O nome do badge deve ser um texto.' })
  nome: string;

  @ApiProperty({ example: 'Concluiu cursos de inovação e transformação digital', description: 'Descrição da conquista' })
  @IsNotEmpty({ message: 'A descrição é obrigatória.' })
  @IsString({ message: 'A descrição deve ser um texto.' })
  descricao: string;

  @ApiProperty({ example: 'workspace_premium', description: 'Nome do ícone Quasar ou URL de imagem' })
  @IsNotEmpty({ message: 'O ícone ou imagem do badge é obrigatório.' })
  @IsString({ message: 'O ícone deve ser um texto.' })
  icone: string;

  @ApiPropertyOptional({ example: 50, description: 'Bônus de XP concedido ao conquistar o badge' })
  @IsOptional()
  @IsNumber({}, { message: 'O bônus de XP deve ser um número.' })
  xpBonus?: number;
}
