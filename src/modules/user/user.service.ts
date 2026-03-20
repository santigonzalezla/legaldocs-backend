import * as argon2 from 'argon2';
import {BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {UpdateProfileDto} from './dto/update-profile.dto';
import {ChangePasswordDto} from './dto/change-password.dto';
import {UpdateNotificationPrefsDto} from './dto/update-notification-prefs.dto';
import {UpdateSecuritySettingsDto} from './dto/update-security-settings.dto';
import {UserEntity} from './entities/user.entity';
import {NotificationPreferencesEntity} from './entities/notification-preferences.entity';
import {SecuritySettingsEntity} from './entities/security-settings.entity';

@Injectable()
export class UserService
{
    constructor(private readonly prisma: PrismaService) {}

    async findMe(userId: string): Promise<UserEntity>
    {
        try
        {
            const user = await this.prisma.user.findUnique({
                where: {id: userId, deletedAt: null},
            });

            if (!user) throw new NotFoundException('Usuario no encontrado');

            return user;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserEntity>
    {
        try
        {
            const user = await this.prisma.user.findUnique({
                where: {id: userId, deletedAt: null},
            });

            if (!user) throw new NotFoundException('Usuario no encontrado');

            return this.prisma.user.update({
                where: {id: userId},
                data: {
                    ...dto,
                    birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
                },
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async changePassword(userId: string, dto: ChangePasswordDto): Promise<{message: string}>
    {
        try
        {
            const credentials = await this.prisma.credentials.findUnique({
                where: {userId},
            });

            if (!credentials || !credentials.password)
                throw new BadRequestException('Esta cuenta no tiene contraseña configurada');

            const valid = await argon2.verify(credentials.password, dto.currentPassword);

            if (!valid) throw new BadRequestException('La contraseña actual es incorrecta');

            const hashed = await argon2.hash(dto.newPassword);

            await this.prisma.credentials.update({
                where: {id: credentials.id},
                data: {password: hashed},
            });

            return {message: 'Contraseña actualizada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async getNotificationPrefs(userId: string): Promise<NotificationPreferencesEntity>
    {
        try
        {
            const prefs = await this.prisma.notificationPreferences.findUnique({
                where: {userId},
            });

            if (!prefs) throw new NotFoundException('Preferencias de notificación no encontradas');

            return prefs;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async updateNotificationPrefs(userId: string, dto: UpdateNotificationPrefsDto): Promise<NotificationPreferencesEntity>
    {
        try
        {
            return this.prisma.notificationPreferences.update({
                where: {userId},
                data: dto,
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async getSecuritySettings(userId: string): Promise<SecuritySettingsEntity>
    {
        try
        {
            const settings = await this.prisma.securitySettings.findUnique({
                where: {userId},
            });

            if (!settings) throw new NotFoundException('Configuración de seguridad no encontrada');

            return settings;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async updateSecuritySettings(userId: string, dto: UpdateSecuritySettingsDto): Promise<SecuritySettingsEntity>
    {
        try
        {
            return this.prisma.securitySettings.update({
                where: {userId},
                data: dto,
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async deleteMe(userId: string): Promise<{message: string}>
    {
        try
        {
            const user = await this.prisma.user.findUnique({
                where: {id: userId, deletedAt: null},
            });

            if (!user) throw new NotFoundException('Usuario no encontrado');

            await this.prisma.user.update({
                where: {id: userId},
                data: {deletedAt: new Date()},
            });

            return {message: 'Cuenta eliminada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }
}
