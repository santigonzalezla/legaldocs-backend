import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseInterceptors
} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {ApiConsumes, ApiHeader, ApiOperation, ApiProperty, ApiTags} from '@nestjs/swagger';
import {IsEnum} from 'class-validator';
import {ClientService} from './client.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from '../firm/decorators/firm-id.decorator';
import {Permission} from '../permissions/decorators/permission.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {CreateClientDto} from './dto/create-client.dto';
import {UpdateClientDto} from './dto/update-client.dto';
import {ClientFiltersDto} from './dto/client-filters.dto';
import {ClientDocumentType} from '../../../generated/prisma/client';

class UploadClientDocumentDto
{
    @IsEnum(ClientDocumentType)
    @ApiProperty({description: 'Tipo de documento adjunto', enum: ClientDocumentType})
    type: ClientDocumentType;
}

@ApiTags('Client')
@ApiHeader({name: 'X-Firm-Id', required: false, description: 'ID de la firma activa (selector de workspace)'})
@Controller('client')
export class ClientController
{
    constructor(private readonly clientService: ClientService) {}

    @Post()
    @Permission('clients:create', 'Crear clientes')
    @ApiOperation({summary: 'Registrar un nuevo cliente'})
    async create(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Body() dto: CreateClientDto = {} as CreateClientDto)
    {
        return this.clientService.create(user.userId, firmId, dto);
    }

    @Get()
    @Permission('clients:view', 'Ver clientes')
    @ApiOperation({summary: 'Listar clientes del despacho con filtros y paginación'})
    async findAll(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Query() filters: ClientFiltersDto = {})
    {
        return this.clientService.findAll(user.userId, firmId, filters);
    }

    @Get(':id')
    @Permission('clients:view', 'Ver clientes')
    @ApiOperation({summary: 'Obtener un cliente por ID'})
    async findOne(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.clientService.findOne(user.userId, firmId, id);
    }

    @Patch(':id')
    @Permission('clients:edit', 'Editar clientes')
    @ApiOperation({summary: 'Actualizar datos de un cliente'})
    async update(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '', @Body() dto: UpdateClientDto = {})
    {
        return this.clientService.update(user.userId, firmId, id, dto);
    }

    @Delete(':id')
    @Permission('clients:delete', 'Eliminar clientes')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar un cliente (soft delete)'})
    async remove(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.clientService.remove(user.userId, firmId, id);
    }

    @Patch(':id/restore')
    @Permission('clients:restore', 'Restaurar clientes')
    @ApiOperation({summary: 'Restaurar un cliente eliminado'})
    async restore(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.clientService.restore(user.userId, firmId, id);
    }

    @Get(':id/documents')
    @Permission('clients:view', 'Ver clientes')
    @ApiOperation({summary: 'Listar documentos adjuntos de un cliente'})
    async listDocuments(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.clientService.listDocuments(user.userId, firmId, id);
    }

    @Post(':id/documents')
    @Permission('clients:edit', 'Editar clientes')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({summary: 'Adjuntar un documento a un cliente'})
    async uploadDocument(
        @CurrentUser() user: LoggedUser,
        @FirmId() firmId: string | undefined,
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadClientDocumentDto
    )
    {
        return this.clientService.uploadDocument(user.userId, firmId, id, file, dto.type);
    }

    @Delete(':id/documents/:documentId')
    @Permission('clients:edit', 'Editar clientes')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar un documento adjunto de un cliente'})
    async removeDocument(
        @CurrentUser() user: LoggedUser,
        @FirmId() firmId: string | undefined,
        @Param('id') id: string,
        @Param('documentId') documentId: string
    )
    {
        return this.clientService.removeDocument(user.userId, firmId, id, documentId);
    }
}
