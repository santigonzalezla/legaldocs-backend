import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiTags} from '@nestjs/swagger';
import {ProcessService} from './process.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from '../firm/decorators/firm-id.decorator';
import {Roles} from '../firm/decorators/roles.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {FirmMemberRole} from '../../../generated/prisma/client';
import {CreateProcessDto} from './dto/create-process.dto';
import {UpdateProcessDto} from './dto/update-process.dto';
import {ProcessFiltersDto} from './dto/process-filters.dto';
import {AddProcessTemplateDto} from './dto/add-process-template.dto';

@ApiTags('Process')
@ApiHeader({name: 'X-Firm-Id', required: false, description: 'ID de la firma activa (selector de workspace)'})
@Controller('process')
export class ProcessController
{
    constructor(private readonly processService: ProcessService) {}

    @Post()
    @Roles(FirmMemberRole.ASSISTANT)
    @ApiOperation({summary: 'Crear un nuevo proceso legal'})
    async create(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Body() dto: CreateProcessDto = {} as CreateProcessDto)
    {
        return this.processService.create(user.userId, firmId, dto);
    }

    @Get()
    @ApiOperation({summary: 'Listar procesos del despacho con filtros y paginación'})
    async findAll(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Query() filters: ProcessFiltersDto = {})
    {
        return this.processService.findAll(user.userId, firmId, filters);
    }

    @Get(':id')
    @ApiOperation({summary: 'Obtener un proceso por ID'})
    async findOne(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.processService.findOne(user.userId, firmId, id);
    }

    @Patch(':id')
    @Roles(FirmMemberRole.ASSISTANT)
    @ApiOperation({summary: 'Actualizar un proceso legal'})
    async update(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '', @Body() dto: UpdateProcessDto = {})
    {
        return this.processService.update(user.userId, firmId, id, dto);
    }

    @Delete(':id')
    @Roles(FirmMemberRole.LAWYER)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar un proceso (soft delete)'})
    async remove(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.processService.remove(user.userId, firmId, id);
    }

    @Patch(':id/restore')
    @Roles(FirmMemberRole.LAWYER)
    @ApiOperation({summary: 'Restaurar un proceso eliminado'})
    async restore(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.processService.restore(user.userId, firmId, id);
    }

    @Get(':id/templates')
    @ApiOperation({summary: 'Listar plantillas asociadas al proceso'})
    async getTemplates(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.processService.getTemplates(user.userId, firmId, id);
    }

    @Post(':id/templates')
    @Roles(FirmMemberRole.ASSISTANT)
    @ApiOperation({summary: 'Asociar una plantilla al proceso'})
    async addTemplate(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '', @Body() dto: AddProcessTemplateDto = {} as AddProcessTemplateDto)
    {
        return this.processService.addTemplate(user.userId, firmId, id, dto);
    }

    @Delete(':id/templates/:templateId')
    @Roles(FirmMemberRole.ASSISTANT)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Desvincular una plantilla del proceso'})
    async removeTemplate(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '', @Param('templateId') templateId: string = '')
    {
        return this.processService.removeTemplate(user.userId, firmId, id, templateId);
    }
}
