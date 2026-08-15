import { PartialType } from '@nestjs/swagger';
import { CreateSecretariaDto } from './create-secretaria.dto';

export class UpdateSecretariaDto extends PartialType(CreateSecretariaDto) {}
