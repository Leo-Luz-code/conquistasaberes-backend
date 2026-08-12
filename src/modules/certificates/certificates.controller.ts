import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CertificatesService } from './certificates.service';
import { JwtAtGuard } from '../../common/guards';
import {
  ListCertificatesAdminDto,
  SearchQueryDto,
  CreateCertificateAdminDto,
  UpdateCertificateStatusDto,
} from './dto/certificates-admin.dto';

@ApiTags('Certificados & Autenticidade')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @ApiOperation({ summary: 'Listar certificados do servidor autenticado' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Get('my-certificates')
  async getUserCertificates(@Request() req: any) {
    return this.certificatesService.getUserCertificates(req.user.sub);
  }

  @ApiOperation({ summary: 'Validação pública de certificado via código Hash' })
  @Get('validate/:hash')
  async validateCertificate(@Param('hash') hash: string) {
    return this.certificatesService.validateCertificate(hash);
  }

  @ApiOperation({ summary: 'Download do certificado oficial em formato PDF' })
  @Get('download/:hash')
  async downloadPdf(@Param('hash') hash: string, @Res() res: Response) {
    const pdfBuffer = await this.certificatesService.generatePdfBuffer(hash);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Certificado_${hash}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  // ---------------- ADMIN ----------------

  @ApiOperation({ summary: '[Admin] Listar certificados com filtros e paginação' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard) // @UseGuards(JwtAtGuard, RolesGuard)
  // @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Get('admin/list')
  async findAllAdmin(@Query() query: ListCertificatesAdminDto) {
    return this.certificatesService.findAllAdmin(query);
  }

  @ApiOperation({ summary: '[Admin] Buscar servidores para o select de emissão' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard) // @UseGuards(JwtAtGuard, RolesGuard)
  // @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Get('admin/search-servidores')
  async searchServidores(@Query() query: SearchQueryDto) {
    return this.certificatesService.searchServidores(query.search);
  }

  @ApiOperation({ summary: '[Admin] Buscar cursos para o select de emissão' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard) // @UseGuards(JwtAtGuard, RolesGuard)
  // @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Get('admin/search-cursos')
  async searchCursos(@Query() query: SearchQueryDto) {
    return this.certificatesService.searchCursos(query.search);
  }

  @ApiOperation({ summary: '[Admin] Emitir certificado manualmente' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard) // @UseGuards(JwtAtGuard, RolesGuard)
  // @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Post('admin')
  async createCertificateAdmin(@Body() dto: CreateCertificateAdminDto) {
    return this.certificatesService.createCertificateAdmin(dto);
  }

  @ApiOperation({ summary: '[Admin] Revogar ou reativar certificado' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard) // @UseGuards(JwtAtGuard, RolesGuard)
  // @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Patch('admin/:id')
  async updateStatusAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateCertificateStatusDto,
  ) {
    return this.certificatesService.updateStatusAdmin(id, dto);
  } 
}
