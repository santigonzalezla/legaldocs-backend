import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import {Request} from 'express';
import {JwtService} from '@nestjs/jwt';
import {BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, UnauthorizedException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {MailService} from '../../utils/mail/mail.service';
import {environmentVariables} from '../../config';
import {RegisterDto} from './dto/register.dto';
import {LoginDto} from './dto/login.dto';
import {RequestPasswordResetDto} from './dto/request-password-reset.dto';
import {ResetPasswordDto} from './dto/reset-password.dto';
import {OAuthProfile} from './strategies/google.strategy';
import {LoggedUser} from '../../interfaces/LoggedUser';

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class AuthService
{
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
    ) {}

    // ─── REGISTER ────────────────────────────────────────────────────────────────

    async register(dto: RegisterDto, req: Request): Promise<AuthTokens>
    {
        try
        {
            const existing = await this.prisma.credentials.findUnique({
                where: {email: dto.email},
            });

            if (existing) throw new ConflictException('El correo ya está registrado');

            const hashedPassword = await argon2.hash(dto.password);

            const user = await this.prisma.user.create({
                data: {
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    email: dto.email,
                    phone: dto.phone,
                    credentials: {
                        create: {
                            email: dto.email,
                            password: hashedPassword,
                        },
                    },
                    notificationPrefs: {create: {}},
                    securitySettings: {create: {}},
                },
                include: {credentials: true},
            });

            const emailVerifyToken = crypto.randomBytes(32).toString('hex');

            await this.prisma.credentials.update({
                where: {id: user.credentials!.id},
                data: {emailVerifyToken},
            });

            this.mailService.sendVerificationEmail(user.email, user.firstName, emailVerifyToken).catch(() => {});

            return this.generateTokens(user.credentials!.id, user.id, user.email, req);
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────

    async verifyEmail(token: string): Promise<{message: string}>
    {
        try
        {
            const credentials = await this.prisma.credentials.findFirst({
                where: {emailVerifyToken: token},
            });

            if (!credentials) throw new BadRequestException('Token de verificación inválido');

            await this.prisma.credentials.update({
                where: {id: credentials.id},
                data: {isEmailVerified: true, emailVerifyToken: null},
            });

            return {message: 'Correo verificado correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── LOGIN ────────────────────────────────────────────────────────────────────

    async login(dto: LoginDto, req: Request): Promise<AuthTokens>
    {
        try
        {
            const credentials = await this.prisma.credentials.findUnique({
                where: {email: dto.email},
                include: {user: true},
            });

            if (!credentials || !credentials.password)
                throw new UnauthorizedException('Credenciales inválidas');

            const passwordValid = await argon2.verify(credentials.password, dto.password);

            if (!passwordValid) throw new UnauthorizedException('Credenciales inválidas');

            if (credentials.user.deletedAt)
                throw new UnauthorizedException('La cuenta ha sido desactivada');

            await this.prisma.user.update({
                where: {id: credentials.userId},
                data: {lastLoginAt: new Date()},
            });

            return this.generateTokens(credentials.id, credentials.userId, credentials.email, req);
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── REFRESH ──────────────────────────────────────────────────────────────────

    async refreshTokens(user: LoggedUser & {refreshToken: string}, req: Request): Promise<AuthTokens>
    {
        try
        {
            const storedTokens = await this.prisma.refreshToken.findMany({
                where: {
                    credentialsId: user.sub,
                    revokedAt: null,
                    expiresAt: {gt: new Date()},
                },
            });

            for (const token of storedTokens)
            {
                if (await argon2.verify(token.tokenHash, user.refreshToken))
                {
                    await this.prisma.refreshToken.update({
                        where: {id: token.id},
                        data: {revokedAt: new Date()},
                    });
                    break;
                }
            }

            return this.generateTokens(user.sub, user.userId, user.email, req);
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── LOGOUT ───────────────────────────────────────────────────────────────────

    async logout(user: LoggedUser & {refreshToken: string}): Promise<{message: string}>
    {
        try
        {
            const storedTokens = await this.prisma.refreshToken.findMany({
                where: {credentialsId: user.sub, revokedAt: null},
            });

            for (const token of storedTokens)
            {
                if (await argon2.verify(token.tokenHash, user.refreshToken))
                {
                    await this.prisma.refreshToken.update({
                        where: {id: token.id},
                        data: {revokedAt: new Date()},
                    });
                    break;
                }
            }

            return {message: 'Sesión cerrada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

    async requestPasswordReset(dto: RequestPasswordResetDto): Promise<{message: string}>
    {
        try
        {
            const credentials = await this.prisma.credentials.findUnique({
                where: {email: dto.email},
                include: {user: true},
            });

            if (!credentials)
                return {message: 'Si el correo existe, recibirás un enlace de recuperación'};

            const resetToken  = crypto.randomBytes(32).toString('hex');
            const tokenExpiry = new Date(Date.now() + 3_600_000); // 1 hora

            await this.prisma.credentials.update({
                where: {id: credentials.id},
                data: {resetToken, resetTokenExpiry: tokenExpiry},
            });

            this.mailService.sendPasswordResetEmail(credentials.email, credentials.user.firstName, resetToken).catch(() => {});

            return {message: 'Si el correo existe, recibirás un enlace de recuperación'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── RESET PASSWORD ───────────────────────────────────────────────────────────

    async resetPassword(dto: ResetPasswordDto): Promise<{message: string}>
    {
        try
        {
            const credentials = await this.prisma.credentials.findFirst({
                where: {
                    resetToken: dto.token,
                    resetTokenExpiry: {gte: new Date()},
                },
            });

            if (!credentials) throw new BadRequestException('Token inválido o expirado');

            const hashedPassword = await argon2.hash(dto.newPassword);

            await this.prisma.credentials.update({
                where: {id: credentials.id},
                data: {password: hashedPassword, resetToken: null, resetTokenExpiry: null},
            });

            return {message: 'Contraseña restablecida correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── OAUTH ────────────────────────────────────────────────────────────────────

    async handleOAuthLogin(profile: OAuthProfile, req: Request): Promise<AuthTokens>
    {
        try
        {
            const providerField = profile.provider === 'google' ? 'googleId' : 'microsoftId';

            let credentials = await this.prisma.credentials.findFirst({
                where: {
                    OR: [
                        {[providerField]: profile.oauthId},
                        {email: profile.email},
                    ],
                },
                include: {user: true},
            });

            if (!credentials)
            {
                const user = await this.prisma.user.create({
                    data: {
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        email: profile.email,
                        avatarUrl: profile.avatarUrl,
                        credentials: {
                            create: {
                                email: profile.email,
                                isEmailVerified: true,
                                [providerField]: profile.oauthId,
                            },
                        },
                        notificationPrefs: {create: {}},
                        securitySettings: {create: {}},
                    },
                    include: {credentials: true},
                });

                credentials = await this.prisma.credentials.findUnique({
                    where: {id: user.credentials!.id},
                    include: {user: true},
                });
            }
            else if (!credentials[providerField])
            {
                credentials = await this.prisma.credentials.update({
                    where: {id: credentials.id},
                    data: {[providerField]: profile.oauthId, isEmailVerified: true},
                    include: {user: true},
                });
            }

            if (credentials!.user.deletedAt)
                throw new UnauthorizedException('La cuenta ha sido desactivada');

            await this.prisma.user.update({
                where: {id: credentials!.userId},
                data: {lastLoginAt: new Date()},
            });

            return this.generateTokens(credentials!.id, credentials!.userId, credentials!.email, req);
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────────────

    private async generateTokens(
        credentialsId: string,
        userId: string,
        email: string,
        req: Request,
    ): Promise<AuthTokens>
    {
        const payload: LoggedUser = {sub: credentialsId, userId, email};

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: environmentVariables.jwtSecret,
                expiresIn: environmentVariables.jwtAccessTokenExpiration as any,
            }),
            this.jwtService.signAsync(payload, {
                secret: environmentVariables.jwtRefreshSecret,
                expiresIn: environmentVariables.jwtRefreshTokenExpiration as any,
            }),
        ]);

        const tokenHash = await argon2.hash(refreshToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await this.prisma.refreshToken.create({
            data: {
                credentialsId,
                tokenHash,
                expiresAt,
                userAgent: req.headers['user-agent'] || null,
                ipAddress: req.ip || null,
            },
        });

        return {accessToken, refreshToken};
    }
}
