import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseInterceptors} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {ApiConsumes, ApiHeader, ApiOperation, ApiProperty, ApiTags} from '@nestjs/swagger';
import {IsEnum} from 'class-validator';
import {ProcessService} from './process.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from '../firm/decorators/firm-id.decorator';
import {Permission} from '../permissions/decorators/permission.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {CreateProcessDto} from './dto/create-process.dto';
import {UpdateProcessDto} from './dto/update-process.dto';
import {ProcessFiltersDto} from './dto/process-filters.dto';
import {AddProcessTemplateDto} from './dto/add-process-template.dto';
import {CreateProcessValueEntryDto} from './dto/create-process-value-entry.dto';
import {ProcessDocumentType} from '../../../generated/prisma/client';

class UploadProcessDocumentDto
{
    @IsEnum(ProcessDocumentType)
    @ApiProperty({description: 'Tipo de documento adjunto', enum: ProcessDocumentType})
    type: ProcessDocumentType;
}

@ApiTags('Process')
@ApiHeader({name: 'X-Firm-Id', required: false, description: 'ID de la firma activa (selector de workspace)'})
@Controller('process')
export class ProcessController
{
    constructor(private readonly processService: ProcessService) {}

    @Post()
    @Permission('processes:create', 'Crear procesos legales')
    @ApiOperation({summary: 'Crear un nuevo proceso legal'})
    async create(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Body() dto: CreateProcessDto = {} as CreateProcessDto)
    {
        return this.processService.create(user.userId, firmId, dto);
    }

    @Get()
    @Permission('processes:view', 'Ver procesos legales')
    @ApiOperation({summary: 'Listar procesos del despacho con filtros y paginación'})
    async findAll(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Query() filters: ProcessFiltersDto = {})
    {
        return this.processService.findAll(user.userId, firmId, filters);
    }

    @Get('client-options')
    @Permission('processes:view', 'Ver procesos legales')
    @ApiOperation({summary: 'Lista mínima de clientes (id + nombre) para asignar un proceso'})
    async getClientOptions(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string)
    {
        return this.processService.getClientOptions(user.userId, firmId);
    }

    @Get(':id')
    @Permission('processes:view', 'Ver procesos legales')
    @ApiOperation({summary: 'Obtener un proceso por ID'})
    async findOne(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.processService.findOne(user.userId, firmId, id);
    }

    @Patch(':id')
    @Permission('processes:edit', 'Editar procesos legales')
    @ApiOperation({summary: 'Actualizar un proceso legal'})
    async update(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '', @Body() dto: UpdateProcessDto = {})
    {
        return this.processService.update(user.userId, firmId, id, dto);
    }

    @Delete(':id')
    @Permission('processes:delete', 'Eliminar procesos legales')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar un proceso (soft delete)'})
    async remove(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.processService.remove(user.userId, firmId, id);
    }

    @Patch(':id/restore')
    @Permission('processes:restore', 'Restaurar procesos legales')
    @ApiOperation({summary: 'Restaurar un proceso eliminado'})
    async restore(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.processService.restore(user.userId, firmId, id);
    }

    @Get(':id/templates')
    @Permission('processes:view', 'Ver procesos legales')
    @ApiOperation({summary: 'Listar plantillas asociadas al proceso'})
    async getTemplates(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.processService.getTemplates(user.userId, firmId, id);
    }

    @Post(':id/templates')
    @Permission('processes:manage-templates', 'Asociar/desasociar plantillas a procesos')
    @ApiOperation({summary: 'Asociar una plantilla al proceso'})
    async addTemplate(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '', @Body() dto: AddProcessTemplateDto = {} as AddProcessTemplateDto)
    {
        return this.processService.addTemplate(user.userId, firmId, id, dto);
    }

    @Delete(':id/templates/:templateId')
    @Permission('processes:manage-templates', 'Asociar/desasociar plantillas a procesos')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Desvincular una plantilla del proceso'})
    async removeTemplate(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '', @Param('templateId') templateId: string = '')
    {
        return this.processService.removeTemplate(user.userId, firmId, id, templateId);
    }

    @Post(':id/value-entries')
    @Permission('processes:manage-value-entries', 'Gestionar entradas de valor de procesos')
    @ApiOperation({summary: 'Agregar una entrada de valor adicional al proceso'})
    async addValueEntry(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '', @Body() dto: CreateProcessValueEntryDto = {} as CreateProcessValueEntryDto)
    {
        return this.processService.addValueEntry(user.userId, firmId, id, dto);
    }

    @Delete(':id/value-entries/:entryId')
    @Permission('processes:manage-value-entries', 'Gestionar entradas de valor de procesos')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar una entrada de valor adicional del proceso'})
    async removeValueEntry(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '', @Param('entryId') entryId: string = '')
    {
        return this.processService.removeValueEntry(user.userId, firmId, id, entryId);
    }

    @Get(':id/documents')
    @Permission('processes:view', 'Ver procesos legales')
    @ApiOperation({summary: 'Listar documentos adjuntos de un proceso'})
    async listDocuments(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.processService.listDocuments(user.userId, firmId, id);
    }

    @Post(':id/documents')
    @Permission('processes:edit', 'Editar procesos legales')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({summary: 'Adjuntar un documento a un proceso'})
    async uploadDocument(
        @CurrentUser() user: LoggedUser,
        @FirmId() firmId: string | undefined,
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadProcessDocumentDto,
    )
    {
        return this.processService.uploadDocument(user.userId, firmId, id, file, dto.type);
    }

    @Delete(':id/documents/:documentId')
    @Permission('processes:edit', 'Editar procesos legales')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar un documento adjunto de un proceso'})
    async removeDocument(
        @CurrentUser() user: LoggedUser,
        @FirmId() firmId: string | undefined,
        @Param('id') id: string,
        @Param('documentId') documentId: string,
    )
    {
        return this.processService.removeDocument(user.userId, firmId, id, documentId);
    }
}
