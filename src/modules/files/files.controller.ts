import {Controller, Get, Param, Res} from '@nestjs/common';
import {SkipThrottle} from '@nestjs/throttler';
import {ApiOperation, ApiTags} from '@nestjs/swagger';
import {Response} from 'express';
import {PrismaService} from '../prisma/prisma.service';
import {StorageService} from '../../utils/storage/storage.service';
import {Public} from '../auth/decorators/public.decorator';

// Rutas públicas y sin token para servir avatar/logo dentro de un <img src>.
// El bucket sigue privado: se responde 302 a una URL prefirmada de corta vida.
// Se marca Cross-Origin-Resource-Policy: cross-origin para que el navegador
// permita embeber la imagen desde el front (otro origen) — helmet pone
// same-origin por defecto y bloquearía el <img>.
@ApiTags('Files')
@Public()
@SkipThrottle()
@Controller('files')
export class FilesController
{
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    @Get('user-avatar/:userId')
    @ApiOperation({summary: 'Foto de perfil de un usuario (redirige a URL firmada)'})
    async userAvatar(@Param('userId') userId: string, @Res() res: Response): Promise<void>
    {
        const user = await this.prisma.user.findUnique({
            where:  {id: userId},
            select: {avatarKey: true, avatarUrl: true},
        });

        await this.redirectToImage(res, user?.avatarKey ?? null, user?.avatarUrl ?? null);
    }

    @Get('firm-logo/:firmId')
    @ApiOperation({summary: 'Logo de un despacho (redirige a URL firmada)'})
    async firmLogo(@Param('firmId') firmId: string, @Res() res: Response): Promise<void>
    {
        const firm = await this.prisma.firm.findUnique({
            where:  {id: firmId},
            select: {logoKey: true, logoUrl: true},
        });

        this.redirectToImage(res, firm?.logoKey ?? null, firm?.logoUrl ?? null);
    }

    private async redirectToImage(res: Response, key: string | null, externalUrl: string | null): Promise<void>
    {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        const target = key
            ? await this.storage.getSignedFileUrl(key, {expiresInSeconds: 3600})
            : externalUrl;

        if (!target)
        {
            res.status(404).end();
            return;
        }

        res.setHeader('Cache-Control', 'private, max-age=300');
        res.redirect(302, target);
    }
}
