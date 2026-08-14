import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckinDto {
  @ApiProperty({
    example: '123456',
    description: 'Matrícula ou CPF do servidor para confirmação de presença',
  })
  @IsString({ message: 'A matrícula/identificador deve ser uma string válida.' })
  @IsNotEmpty({ message: 'A matrícula/identificador é obrigatória.' })
  matricula: string;
}
