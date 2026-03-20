import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiTags} from '@nestjs/swagger';
import {DocumentService} from './document.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from '../firm/decorators/firm-id.decorator';
import {Roles} from '../firm/decorators/roles.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {FirmMemberRole} from '../../../generated/prisma/client';
import {CreateDocumentDto} from './dto/create-document.dto';
import {UpdateDocumentDto} from './dto/update-document.dto';
import {DocumentFiltersDto} from './dto/document-filters.dto';

@ApiTags('Document')
@ApiHeader({name: 'X-Firm-Id', required: false, description: 'ID de la firma activa (selector de workspace)'})
@Controller('document')
export class DocumentController
{
    constructor(private readonly documentService: DocumentService) {}

    @Post()
    @Roles(FirmMemberRole.ASSISTANT)
    @ApiOperation({summary: 'Crear un nuevo documento legal'})
    async create(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Body() dto: CreateDocumentDto)
    {
        return this.documentService.create(user.userId, firmId, dto);
    }

    @Get()
    @ApiOperation({summary: 'Listar documentos del despacho con filtros y paginación'})
    async findAll(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Query() filters: DocumentFiltersDto)
    {
        return this.documentService.findAll(user.userId, firmId, filters);
    }

    @Get(':id')
    @ApiOperation({summary: 'Obtener un documento por ID'})
    async findOne(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string)
    {
        return this.documentService.findOne(user.userId, firmId, id);
    }

    @Patch(':id')
    @Roles(FirmMemberRole.ASSISTANT)
    @ApiOperation({summary: 'Actualizar un documento'})
    async update(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string, @Body() dto: UpdateDocumentDto)
    {
        return this.documentService.update(user.userId, firmId, id, dto);
    }

    @Delete(':id')
    @Roles(FirmMemberRole.ASSISTANT)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Mover documento a la papelera'})
    async remove(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string)
    {
        return this.documentService.remove(user.userId, firmId, id);
    }

    @Patch(':id/restore')
    @Roles(FirmMemberRole.ASSISTANT)
    @ApiOperation({summary: 'Restaurar documento desde la papelera'})
    async restore(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string)
    {
        return this.documentService.restore(user.userId, firmId, id);
    }

    @Delete(':id/permanent')
    @Roles(FirmMemberRole.LAWYER)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar documento permanentemente (LAWYER+)'})
    async permanentRemove(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string)
    {
        return this.documentService.permanentRemove(user.userId, firmId, id);
    }

    @Patch(':id/favorite')
    @ApiOperation({summary: 'Marcar o desmarcar documento como favorito'})
    async toggleFavorite(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string)
    {
        return this.documentService.toggleFavorite(user.userId, firmId, id);
    }
}
