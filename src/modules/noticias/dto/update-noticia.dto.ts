import { PartialType } from '@nestjs/swagger';
import { CreateNoticiaDto } from './create-noticia.dto';

export class UpdateNoticiaDto extends PartialType(CreateNoticiaDto) {}
