import * as argon2 from 'argon2';
import {BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
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
    private readonly logger = new Logger(UserService.name);

    constructor(private readonly prisma: PrismaService) {}

    async findMe(userId: string): Promise<UserEntity>
    {
        try
        {
            const user = await this.prisma.user.findUnique({
                where: {id: userId, deletedAt: null},
            });

            if (!user) throw new NotFoundException('Usuario no encontrado');

            this.logger.log(`findMe → success userId=${userId}`);
            return user;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`findMe → failed userId=${userId}`, error);
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

            const result = await this.prisma.user.update({
                where: {id: userId},
                data: {
                    ...dto,
                    birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
                },
            });

            this.logger.log(`updateProfile → success userId=${userId}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`updateProfile → failed userId=${userId}`, error);
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

            this.logger.log(`changePassword → success userId=${userId}`);
            return {message: 'Contraseña actualizada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`changePassword → failed userId=${userId}`, error);
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

            this.logger.log(`getNotificationPrefs → success userId=${userId}`);
            return prefs;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`getNotificationPrefs → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async updateNotificationPrefs(userId: string, dto: UpdateNotificationPrefsDto): Promise<NotificationPreferencesEntity>
    {
        try
        {
            const result = await this.prisma.notificationPreferences.update({
                where: {userId},
                data: dto,
            });

            this.logger.log(`updateNotificationPrefs → success userId=${userId}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`updateNotificationPrefs → failed userId=${userId}`, error);
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

            this.logger.log(`getSecuritySettings → success userId=${userId}`);
            return settings;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`getSecuritySettings → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async updateSecuritySettings(userId: string, dto: UpdateSecuritySettingsDto): Promise<SecuritySettingsEntity>
    {
        try
        {
            const result = await this.prisma.securitySettings.update({
                where: {userId},
                data: dto,
            });

            this.logger.log(`updateSecuritySettings → success userId=${userId}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`updateSecuritySettings → failed userId=${userId}`, error);
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

            this.logger.log(`deleteMe → success userId=${userId}`);
            return {message: 'Cuenta eliminada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`deleteMe → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }
}
