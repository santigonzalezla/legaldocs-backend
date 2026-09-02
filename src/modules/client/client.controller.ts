import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiTags} from '@nestjs/swagger';
import {ClientService} from './client.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from '../firm/decorators/firm-id.decorator';
import {Permission} from '../permissions/decorators/permission.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
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
}
