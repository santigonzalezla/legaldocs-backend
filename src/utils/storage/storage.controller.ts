import {Controller, Get} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiTags} from '@nestjs/swagger';
import {StorageService} from './storage.service';
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
}
