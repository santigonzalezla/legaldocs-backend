import {BadRequestException, Controller, Get, NotFoundException, Query} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiQuery, ApiTags} from '@nestjs/swagger';
import {StorageService} from './storage.service';
import {PrismaService} from '../../modules/prisma/prisma.service';
import {FirmService} from '../../modules/firm/firm.service';
import {CurrentUser} from '../../modules/auth/decorators/current-user.decorator';
import {FirmId} from '../../modules/firm/decorators/firm-id.decorator';
import {Permission} from '../../modules/permissions/decorators/permission.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';

@ApiTags('Storage')
@ApiHeader({name: 'X-Firm-Id', required: false, description: 'ID de la firma activa (selector de workspace)'})
@Controller('firm/me/storage')
export class StorageController
{
    constructor(
        private readonly storage: StorageService,
        private readonly prisma: PrismaService,
        private readonly firm: FirmService,
    ) {}

    @Get()
    @Permission('firm_settings:view', 'Ver configuración de la firma')
    @ApiOperation({summary: 'Consumo de almacenamiento (R2) del despacho activo'})
    async getUsage(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined)
    {
        const firm = await this.firm.getMyFirm(user.userId, firmId);
        return this.storage.getFirmUsage(firm.id);
    }

    @Get('file-url')
    @ApiQuery({name: 'key', description: 'fileKey del objeto (tal como lo devuelve el listado)'})
    @ApiOperation({summary: 'URL firmada y temporal para abrir un archivo del despacho en el navegador'})
    async getFileUrl(
        @CurrentUser() user: LoggedUser,
        @FirmId() firmId: string | undefined,
        @Query('key') key: string,
    )
    {
        if (!key) throw new BadRequestException('Falta el parámetro key.');

        const firm = await this.firm.getMyFirm(user.userId, firmId);
        const object = await this.prisma.storageObject.findUnique({where: {fileKey: key}});

        if (!object || object.firmId !== firm.id || object.deletedAt)
            throw new NotFoundException('Archivo no encontrado.');

        return {url: await this.storage.getSignedFileUrl(key, {fileName: object.fileName, mimeType: object.mimeType})};
    }
}
