import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiTags} from '@nestjs/swagger';
import {ClientService} from './client.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from '../firm/decorators/firm-id.decorator';
import {Roles} from '../firm/decorators/roles.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {FirmMemberRole} from '../../../generated/prisma/client';
import {CreateClientDto} from './dto/create-client.dto';
import {UpdateClientDto} from './dto/update-client.dto';
import {ClientFiltersDto} from './dto/client-filters.dto';

@ApiTags('Client')
@ApiHeader({name: 'X-Firm-Id', required: false, description: 'ID de la firma activa (selector de workspace)'})
@Controller('client')
export class ClientController
{
    constructor(private readonly clientService: ClientService) {}

    @Post()
    @Roles(FirmMemberRole.ASSISTANT)
    @ApiOperation({summary: 'Registrar un nuevo cliente'})
    async create(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Body() dto: CreateClientDto = {} as CreateClientDto)
    {
        return this.clientService.create(user.userId, firmId, dto);
    }

    @Get()
    @ApiOperation({summary: 'Listar clientes del despacho con filtros y paginación'})
    async findAll(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Query() filters: ClientFiltersDto = {})
    {
        return this.clientService.findAll(user.userId, firmId, filters);
    }

    @Get(':id')
    @ApiOperation({summary: 'Obtener un cliente por ID'})
    async findOne(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.clientService.findOne(user.userId, firmId, id);
    }

    @Patch(':id')
    @Roles(FirmMemberRole.ASSISTANT)
    @ApiOperation({summary: 'Actualizar datos de un cliente'})
    async update(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '', @Body() dto: UpdateClientDto = {})
    {
        return this.clientService.update(user.userId, firmId, id, dto);
    }

    @Delete(':id')
    @Roles(FirmMemberRole.LAWYER)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar un cliente (soft delete)'})
    async remove(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.clientService.remove(user.userId, firmId, id);
    }

    @Patch(':id/restore')
    @Roles(FirmMemberRole.LAWYER)
    @ApiOperation({summary: 'Restaurar un cliente eliminado'})
    async restore(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.clientService.restore(user.userId, firmId, id);
    }
}
