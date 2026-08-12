import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateSecretariaDto {
  @ApiProperty({ example: 'Secretaria Municipal de Saúde', description: 'Nome completo do órgão' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ example: 'SMS', description: 'Sigla única da secretaria' })
  @IsString()
  @IsNotEmpty()
  sigla: string;

  @ApiPropertyOptional({ example: 'Gestão da rede pública de saúde...', description: 'Atribuições do órgão' })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiPropertyOptional({ example: 'Dra. Ana Paula Oliveira', description: 'Nome do gestor responsável' })
  @IsString()
  @IsOptional()
  responsavelNome?: string;

  @ApiPropertyOptional({ example: 'ana.oliveira@pmvc.ba.gov.br', description: 'E-mail oficial do órgão' })
  @IsString()
  @IsOptional()
  responsavelEmail?: string;

  @ApiPropertyOptional({ example: '(77) 3429-7000', description: 'Telefone de contato' })
  @IsString()
  @IsOptional()
  telefone?: string;

  @ApiPropertyOptional({ example: 'Av. Maceió, 98 - Brasil, Vitória da Conquista - BA', description: 'Endereço físico' })
  @IsString()
  @IsOptional()
  endereco?: string;

  @ApiPropertyOptional({ example: '#10B981', description: 'Cor temática em hex para a UI' })
  @IsString()
  @IsOptional()
  corIdentificacao?: string;

  @ApiPropertyOptional({ example: true, description: 'Status de ativação no AVA' })
  @IsBoolean()
  @IsOptional()
  ativa?: boolean;
}
