import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiQuery, ApiTags} from '@nestjs/swagger';
import {FirmService} from './firm.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from './decorators/firm-id.decorator';
import {Roles} from './decorators/roles.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {FirmMemberRole} from '../../../generated/prisma/client';
import {CreateFirmDto} from './dto/create-firm.dto';
import {UpdateFirmDto} from './dto/update-firm.dto';
import {InviteMemberDto} from './dto/invite-member.dto';
import {UpdateMemberDto} from './dto/update-member.dto';
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

    @Post()
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
    @Roles(FirmMemberRole.ADMIN)
    @ApiOperation({summary: 'Actualizar datos del despacho (solo ADMIN)'})
    async updateFirm(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Body() dto: UpdateFirmDto)
    {
        return this.firmService.updateFirm(user.userId, firmId, dto);
    }

    @Delete('me')
    @Roles(FirmMemberRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar despacho (solo propietario)'})
    async deleteFirm(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined)
    {
        return this.firmService.deleteFirm(user.userId, firmId);
    }

    @Get('me/members')
    @ApiOperation({summary: 'Listar miembros del despacho'})
    async getMembers(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined)
    {
        return this.firmService.getMembers(user.userId, firmId);
    }

    @Post('me/members')
    @Roles(FirmMemberRole.ADMIN)
    @ApiOperation({summary: 'Invitar un nuevo miembro al despacho (solo ADMIN)'})
    async inviteMember(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Body() dto: InviteMemberDto)
    {
        return this.firmService.inviteMember(user.userId, firmId, dto);
    }

    @Patch('me/members/:memberId')
    @Roles(FirmMemberRole.ADMIN)
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

    @Post('me/members/accept')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Aceptar invitación a un despacho'})
    @ApiQuery({name: 'token', required: true, description: 'Token de invitación recibido por correo'})
    async acceptInvitation(@CurrentUser() user: LoggedUser, @Query('token') token: string)
    {
        return this.firmService.acceptInvitation(user.userId, token);
    }

    @Delete('me/members/:memberId')
    @Roles(FirmMemberRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar un miembro del despacho (solo ADMIN)'})
    async removeMember(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('memberId') memberId: string)
    {
        return this.firmService.removeMember(user.userId, firmId, memberId);
    }

    @Get('me/specialties')
    @ApiOperation({summary: 'Listar especialidades jurídicas del despacho'})
    async getSpecialties(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined)
    {
        return this.firmService.getSpecialties(user.userId, firmId);
    }

    @Post('me/specialties')
    @Roles(FirmMemberRole.ADMIN)
    @ApiOperation({summary: 'Agregar especialidad jurídica (solo ADMIN)'})
    async addSpecialty(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Body() dto: AddSpecialtyDto)
    {
        return this.firmService.addSpecialty(user.userId, firmId, dto);
    }

    @Delete('me/specialties/:specialtyId')
    @Roles(FirmMemberRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar especialidad del despacho (solo ADMIN)'})
    async removeSpecialty(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('specialtyId') specialtyId: string)
    {
        return this.firmService.removeSpecialty(user.userId, firmId, specialtyId);
    }
}
