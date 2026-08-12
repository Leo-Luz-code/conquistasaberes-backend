import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';
import { Role } from '@prisma/client';
import { JwtAtGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { CreateBibliotecaDto, ListLibraryDto, UpdateBibliotecaDto } from './dto/library.dto';
import { LibraryService } from './library.service';

const UPLOAD_PATH = './uploads/library';
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-excel',
];

const libraryUpload = FileInterceptor('file', {
  storage: diskStorage({
    destination: (_request, _file, callback) => {
      if (!existsSync(UPLOAD_PATH)) mkdirSync(UPLOAD_PATH, { recursive: true });
      callback(null, UPLOAD_PATH);
    },
    filename: (_request, file, callback) => {
      callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  fileFilter: (_request, file, callback) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return callback(new BadRequestException('Formato inválido. Envie PDF, DOC, DOCX, XLS ou XLSX.'), false);
    }
    callback(null, true);
  },
  limits: { fileSize: 15 * 1024 * 1024 },
});

@ApiTags('Biblioteca')
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @ApiOperation({ summary: 'Listar materiais da biblioteca' })
  @Get()
  findAll(@Query() query: ListLibraryDto) {
    return this.libraryService.findAll(query);
  }

  @ApiOperation({ summary: 'Listar categorias e total de materiais' })
  @Get('categories')
  getCategories() {
    return this.libraryService.getCategories();
  }

  @ApiOperation({ summary: 'Obter material da biblioteca' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.libraryService.findOne(id);
  }

  @ApiOperation({ summary: '[Admin] Cadastrar material' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @UseInterceptors(libraryUpload)
  @Post('admin')
  create(@Body() dto: CreateBibliotecaDto, @UploadedFile() file?: any) {
    return this.libraryService.create(dto, file ? `/uploads/library/${file.filename}` : undefined);
  }

  @ApiOperation({ summary: '[Admin] Editar material' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @UseInterceptors(libraryUpload)
  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() dto: UpdateBibliotecaDto, @UploadedFile() file?: any) {
    return this.libraryService.update(id, dto, file ? `/uploads/library/${file.filename}` : undefined);
  }

  @ApiOperation({ summary: '[Admin] Remover material' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Delete('admin/:id')
  remove(@Param('id') id: string) {
    return this.libraryService.remove(id);
  }
}
