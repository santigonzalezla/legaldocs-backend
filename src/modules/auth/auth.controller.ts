import { Request } from 'express';
import { Controller, Post, Body, Req, UseGuards, Get, Res, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { MicrosoftOAuthGuard } from './guards/microsoft-oauth.guard';
import { LoggedUser } from '../../interfaces/LoggedUser';
import { OAuthProfile } from './strategies/google.strategy';
import { environmentVariables } from '../../config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController
{
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Registrar nuevo usuario' })
    async register(@Body() dto: RegisterDto, @Req() req: Request)
    {
        return this.authService.register(dto, req);
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Iniciar sesión' })
    async login(@Body() dto: LoginDto, @Req() req: Request)
    {
        return this.authService.login(dto, req);
    }

    @Public()
    @UseGuards(JwtRefreshGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Renovar tokens con refresh token' })
    async refresh(@CurrentUser() user: LoggedUser & { refreshToken: string }, @Req() req: Request)
    {
        return this.authService.refreshTokens(user, req);
    }

    @UseGuards(JwtRefreshGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cerrar sesión' })
    async logout(@CurrentUser() user: LoggedUser & { refreshToken: string })
    {
        return this.authService.logout(user);
    }

    @Public()
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
    async forgotPassword(@Body() dto: RequestPasswordResetDto)
    {
        return this.authService.requestPasswordReset(dto);
    }

    @Public()
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Restablecer contraseña con token' })
    async resetPassword(@Body() dto: ResetPasswordDto)
    {
        return this.authService.resetPassword(dto);
    }

    @Public()
    @Get('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verificar correo electrónico con token' })
    async verifyEmail(@Query('token') token: string)
    {
        return this.authService.verifyEmail(token);
    }

    // ─── GOOGLE OAUTH ─────────────────────────────────────────────────────────────

    @Public()
    @UseGuards(GoogleOAuthGuard)
    @Get('google')
    @ApiOperation({ summary: 'Iniciar autenticación con Google' })
    googleAuth() {}

    @Public()
    @UseGuards(GoogleOAuthGuard)
    @Get('google/callback')
    @ApiOperation({ summary: 'Callback de Google OAuth' })
    async googleCallback(@Req() req: Request, @Res() res: Response)
    {
        const tokens = await this.authService.handleOAuthLogin(req.user as OAuthProfile, req);
        const redirectUrl = `${environmentVariables.frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
        return res.redirect(redirectUrl);
    }

    // ─── MICROSOFT OAUTH ──────────────────────────────────────────────────────────

    @Public()
    @UseGuards(MicrosoftOAuthGuard)
    @Get('microsoft')
    @ApiOperation({ summary: 'Iniciar autenticación con Microsoft' })
    microsoftAuth() {}

    @Public()
    @UseGuards(MicrosoftOAuthGuard)
    @Get('microsoft/callback')
    @ApiOperation({ summary: 'Callback de Microsoft OAuth' })
    async microsoftCallback(@Req() req: Request, @Res() res: Response)
    {
        const tokens = await this.authService.handleOAuthLogin(req.user as OAuthProfile, req);
        const redirectUrl = `${environmentVariables.frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
        return res.redirect(redirectUrl);
    }
}
