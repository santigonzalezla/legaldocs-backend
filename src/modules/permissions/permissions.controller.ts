import {Body, Controller, Delete, Get, Param, Patch, Post} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiTags} from '@nestjs/swagger';
import {PermissionsService} from './permissions.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from '../firm/decorators/firm-id.decorator';
import {Permission} from './decorators/permission.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {CreateFirmRoleDto} from './dto/create-firm-role.dto';
import {UpdateFirmRoleDto} from './dto/update-firm-role.dto';
import {AssignPermissionsDto} from './dto/assign-permissions.dto';

@ApiTags('Permissions')
@ApiHeader({name: 'X-Firm-Id', required: false, description: 'ID de la firma activa (selector de workspace)'})
@Controller('permissions')
export class PermissionsController
{
    constructor(private readonly permissionsService: PermissionsService) {}

    @Get('me')
    @ApiOperation({summary: 'Permisos efectivos del usuario autenticado para la firma activa'})
    async getMyPermissions(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined)
    {
        return this.permissionsService.getEffectivePermissions(user.userId, firmId);
    }

    @Get('catalog')
    @Permission('team:manage-roles', 'Gestionar roles y permisos del despacho')
    @ApiOperation({summary: 'Catálogo completo de módulos y permisos asignables (Admin)'})
    async getCatalog()
    {
        return this.permissionsService.getCatalog();
    }

    @Get('firm-roles')
    @Permission('team:manage-roles', 'Gestionar roles y permisos del despacho')
    @ApiOperation({summary: 'Listar los roles del despacho (Admin)'})
    async listFirmRoles(@FirmId() firmId: string | undefined)
    {
        return this.permissionsService.listFirmRoles(firmId);
    }

    @Post('firm-roles')
    @Permission('team:manage-roles', 'Gestionar roles y permisos del despacho')
    @ApiOperation({summary: 'Crear un rol personalizado del despacho (Admin)'})
    async createFirmRole(@FirmId() firmId: string | undefined, @Body() dto: CreateFirmRoleDto)
    {
        return this.permissionsService.createFirmRole(firmId, dto);
    }

    @Patch('firm-roles/:id')
    @Permission('team:manage-roles', 'Gestionar roles y permisos del despacho')
    @ApiOperation({summary: 'Actualizar nombre/descripción de un rol (Admin)'})
    async updateFirmRole(@FirmId() firmId: string | undefined, @Param('id') id: string, @Body() dto: UpdateFirmRoleDto)
    {
        return this.permissionsService.updateFirmRole(firmId, id, dto);
    }

    @Patch('firm-roles/:id/permissions')
    @Permission('team:manage-roles', 'Gestionar roles y permisos del despacho')
    @ApiOperation({summary: 'Reemplazar el set completo de permisos de un rol (Admin)'})
    async assignPermissions(@FirmId() firmId: string | undefined, @Param('id') id: string, @Body() dto: AssignPermissionsDto)
    {
        return this.permissionsService.assignPermissions(firmId, id, dto);
    }

    @Delete('firm-roles/:id')
    @Permission('team:manage-roles', 'Gestionar roles y permisos del despacho')
    @ApiOperation({summary: 'Eliminar un rol personalizado sin miembros asignados (Admin)'})
    async deleteFirmRole(@FirmId() firmId: string | undefined, @Param('id') id: string)
    {
        return this.permissionsService.deleteFirmRole(firmId, id);
    }
}
