import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class LinkCoursesDto {
  @ApiProperty({ description: 'IDs dos cursos a serem vinculados', type: [String] })
  @IsArray()
  @IsString({ each: true })
  courseIds: string[];
}
