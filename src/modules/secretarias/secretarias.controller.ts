import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SecretariasService } from './secretarias.service';
import { CreateSecretariaDto } from './dto/create-secretaria.dto';
import { UpdateSecretariaDto } from './dto/update-secretaria.dto';
import { JwtAtGuard } from 'src/common/guards/jwt-at.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Secretarias Municipais')
@ApiBearerAuth()
@UseGuards(JwtAtGuard, RolesGuard)
@Controller('secretarias')
export class SecretariasController {
  constructor(private readonly secretariasService: SecretariasService) {}

  @ApiOperation({ summary: 'Listar todas as secretarias municipais' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  @Get()
  findAll() {
    return this.secretariasService.findAll();
  }

  @ApiOperation({ summary: 'Obter detalhes de uma secretaria específica por ID' })
  @ApiResponse({ status: 200, description: 'Detalhes da secretaria' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.secretariasService.findOne(id);
  }

  @ApiOperation({ summary: 'Cadastrar nova secretaria municipal' })
  @ApiResponse({ status: 201, description: 'Secretaria cadastrada com sucesso' })
  @Roles(Role.ADMIN_RH_CETI)
  @Post()
  create(@Body() dto: CreateSecretariaDto) {
    return this.secretariasService.create(dto);
  }

  @ApiOperation({ summary: 'Atualizar dados de uma secretaria' })
  @ApiResponse({ status: 200, description: 'Secretaria atualizada com sucesso' })
  @Roles(Role.ADMIN_RH_CETI)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSecretariaDto) {
    return this.secretariasService.update(id, dto);
  }

  @ApiOperation({ summary: 'Alternar status de ativação da secretaria' })
  @ApiResponse({ status: 200, description: 'Status alternado com sucesso' })
  @Roles(Role.ADMIN_RH_CETI)
  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.secretariasService.toggleStatus(id);
  }

  @ApiOperation({ summary: 'Remover secretaria (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'Secretaria removida com sucesso' })
  @Roles(Role.ADMIN_RH_CETI)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.secretariasService.remove(id);
  }
}
