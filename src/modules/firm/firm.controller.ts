import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiQuery, ApiTags} from '@nestjs/swagger';
import {FirmService} from './firm.service';
import {SelfSignupGuard} from '../auth/guards/self-signup.guard';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from './decorators/firm-id.decorator';
import {Permission} from '../permissions/decorators/permission.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {CreateFirmDto} from './dto/create-firm.dto';
import {UpdateFirmDto} from './dto/update-firm.dto';
import {InviteMemberDto} from './dto/invite-member.dto';
import {UpdateMemberDto} from './dto/update-member.dto';
import {UpdateMemberProfileDto} from './dto/update-member-profile.dto';
import {AddSpecialtyDto} from './dto/add-specialty.dto';

@ApiTags('Firm')
@ApiHeader({name: 'X-Firm-Id', required: false, description: 'ID de la firma activa (selector de workspace)'})
@Controller('firm')
export class FirmController
{
    constructor(private readonly firmService: FirmService) {}

    @Get('my-firms')
    @ApiOperation({summary: 'Listar todas las firmas a las que pertenece el usuario'})
    async getMyFirms(@CurrentUser() user: LoggedUser)
    {
        return this.firmService.getMyFirms(user.userId);
    }

    @Get('my-invitations')
    @ApiOperation({summary: 'Listar invitaciones pendientes para el usuario autenticado'})
    async getMyInvitations(@CurrentUser() user: LoggedUser)
    {
        return this.firmService.getMyInvitations(user.userId);
    }

    @Get('deleted')
    @ApiOperation({summary: 'Listar despachos eliminados por el usuario, recuperables dentro de los 30 días'})
    async listDeletedFirms(@CurrentUser() user: LoggedUser)
    {
        return this.firmService.listDeletedFirms(user.userId);
    }

    @Post('my-invitations/reject')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Rechazar invitación a un despacho'})
    @ApiQuery({name: 'token', required: true, description: 'Token de invitación'})
    async rejectInvitation(@CurrentUser() user: LoggedUser, @Query('token') token: string)
    {
        return this.firmService.rejectInvitation(user.userId, token);
    }

    @Post()
    @UseGuards(SelfSignupGuard)
    @ApiHeader({name: 'x-provision-key', required: false, description: 'Clave de aprovisionamiento (solo para alta manual cuando SELF_SIGNUP_ENABLED=false)'})
    @ApiOperation({summary: 'Crear despacho para el usuario autenticado'})
    async createFirm(@CurrentUser() user: LoggedUser, @Body() dto: CreateFirmDto)
    {
        return this.firmService.createFirm(user.userId, dto);
    }

    @Get('me')
    @ApiOperation({summary: 'Obtener el despacho activo'})
    async getMyFirm(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined)
    {
        return this.firmService.getMyFirm(user.userId, firmId);
    }

    @Patch('me')
    @Permission('firm_settings:edit', 'Editar datos de la firma')
    @ApiOperation({summary: 'Actualizar datos del despacho (solo ADMIN)'})
    async updateFirm(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Body() dto: UpdateFirmDto)
    {
        return this.firmService.updateFirm(user.userId, firmId, dto);
    }

    @Delete('me')
    @Permission('firm_settings:delete', 'Eliminar el despacho')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar despacho (lógico, recuperable 30 días — solo ADMIN)'})
    async deleteFirm(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined)
    {
        return this.firmService.deleteFirm(user.userId, firmId);
    }

    @Post('restore/:firmId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Restaurar un despacho eliminado dentro del plazo de 30 días (solo propietario)'})
    async restoreFirm(@CurrentUser() user: LoggedUser, @Param('firmId') firmId: string)
    {
        return this.firmService.restoreFirm(user.userId, firmId);
    }

    @Get('me/members')
    @Permission('team:view', 'Ver miembros del equipo')
    @ApiOperation({summary: 'Listar miembros del despacho'})
    @ApiQuery({name: 'isPartner', required: false, description: 'Filtrar solo socios (true) o no socios (false)'})
    async getMembers(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Query('isPartner') isPartner?: string)
    {
        return this.firmService.getMembers(user.userId, firmId, isPartner === undefined ? undefined : isPartner === 'true');
    }

    @Post('me/members')
    @Permission('team:invite-member', 'Invitar miembros al equipo')
    @ApiOperation({summary: 'Invitar un nuevo miembro al despacho (solo ADMIN)'})
    async inviteMember(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Body() dto: InviteMemberDto)
    {
        return this.firmService.inviteMember(user.userId, firmId, dto);
    }

    @Patch('me/members/:memberId')
    @Permission('team:update-member', 'Cambiar rol de miembros del equipo')
    @ApiOperation({summary: 'Actualizar rol o estado de un miembro (solo ADMIN)'})
    async updateMember(
        @CurrentUser() user: LoggedUser,
        @FirmId() firmId: string | undefined,
        @Param('memberId') memberId: string,
        @Body() dto: UpdateMemberDto,
    )
    {
        return this.firmService.updateMember(user.userId, firmId, memberId, dto);
    }

    @Patch('me/members/:memberId/profile')
    @Permission('team:update-member', 'Cambiar rol de miembros del equipo')
    @ApiOperation({summary: 'Actualizar nombre/apellido/teléfono de un miembro (solo ADMIN)'})
    async updateMemberProfile(
        @CurrentUser() user: LoggedUser,
        @FirmId() firmId: string | undefined,
        @Param('memberId') memberId: string,
        @Body() dto: UpdateMemberProfileDto,
    )
    {
        return this.firmService.updateMemberProfile(user.userId, firmId, memberId, dto);
    }

    @Post('me/members/accept')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Aceptar invitación a un despacho'})
    @ApiQuery({name: 'token', required: true, description: 'Token de invitación recibido por correo'})
    async acceptInvitation(@CurrentUser() user: LoggedUser, @Query('token') token: string)
    {
        return this.firmService.acceptInvitation(user.userId, token);
    }

    @Delete('me/members/:memberId')
    @Permission('team:remove-member', 'Eliminar miembros del equipo')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar un miembro del despacho (solo ADMIN)'})
    async removeMember(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('memberId') memberId: string)
    {
        return this.firmService.removeMember(user.userId, firmId, memberId);
    }

    @Get('me/specialties')
    @Permission('firm_settings:view', 'Ver configuración de la firma')
    @ApiOperation({summary: 'Listar especialidades jurídicas del despacho'})
    async getSpecialties(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined)
    {
        return this.firmService.getSpecialties(user.userId, firmId);
    }

    @Post('me/specialties')
    @Permission('firm_settings:add-specialty', 'Agregar especialidades jurídicas')
    @ApiOperation({summary: 'Agregar especialidad jurídica (solo ADMIN)'})
    async addSpecialty(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Body() dto: AddSpecialtyDto)
    {
        return this.firmService.addSpecialty(user.userId, firmId, dto);
    }

    @Delete('me/specialties/:specialtyId')
    @Permission('firm_settings:remove-specialty', 'Eliminar especialidades jurídicas')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar especialidad del despacho (solo ADMIN)'})
    async removeSpecialty(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('specialtyId') specialtyId: string)
    {
        return this.firmService.removeSpecialty(user.userId, firmId, specialtyId);
    }
}
