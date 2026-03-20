import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch} from '@nestjs/common';
import {ApiOperation, ApiTags} from '@nestjs/swagger';
import {UserService} from './user.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {UpdateProfileDto} from './dto/update-profile.dto';
import {ChangePasswordDto} from './dto/change-password.dto';
import {UpdateNotificationPrefsDto} from './dto/update-notification-prefs.dto';
import {UpdateSecuritySettingsDto} from './dto/update-security-settings.dto';

@ApiTags('User')
@Controller('user')
export class UserController
{
    constructor(private readonly userService: UserService) {}

    @Get('me')
    @ApiOperation({summary: 'Obtener perfil del usuario autenticado'})
    async findMe(@CurrentUser() user: LoggedUser)
    {
        return this.userService.findMe(user.userId);
    }

    @Patch('me')
    @ApiOperation({summary: 'Actualizar datos del perfil'})
    async updateProfile(@CurrentUser() user: LoggedUser, @Body() dto: UpdateProfileDto)
    {
        return this.userService.updateProfile(user.userId, dto);
    }

    @Patch('me/password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Cambiar contraseña'})
    async changePassword(@CurrentUser() user: LoggedUser, @Body() dto: ChangePasswordDto)
    {
        return this.userService.changePassword(user.userId, dto);
    }

    @Get('me/notification-preferences')
    @ApiOperation({summary: 'Obtener preferencias de notificación'})
    async getNotificationPrefs(@CurrentUser() user: LoggedUser)
    {
        return this.userService.getNotificationPrefs(user.userId);
    }

    @Patch('me/notification-preferences')
    @ApiOperation({summary: 'Actualizar preferencias de notificación'})
    async updateNotificationPrefs(@CurrentUser() user: LoggedUser, @Body() dto: UpdateNotificationPrefsDto)
    {
        return this.userService.updateNotificationPrefs(user.userId, dto);
    }

    @Get('me/security-settings')
    @ApiOperation({summary: 'Obtener configuración de seguridad'})
    async getSecuritySettings(@CurrentUser() user: LoggedUser)
    {
        return this.userService.getSecuritySettings(user.userId);
    }

    @Patch('me/security-settings')
    @ApiOperation({summary: 'Actualizar configuración de seguridad'})
    async updateSecuritySettings(@CurrentUser() user: LoggedUser, @Body() dto: UpdateSecuritySettingsDto)
    {
        return this.userService.updateSecuritySettings(user.userId, dto);
    }

    @Delete('me')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar cuenta (soft delete)'})
    async deleteMe(@CurrentUser() user: LoggedUser)
    {
        return this.userService.deleteMe(user.userId);
    }
}
