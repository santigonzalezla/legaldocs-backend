import {Controller, Get, Query} from '@nestjs/common';
import {ApiOperation, ApiTags} from '@nestjs/swagger';
import {LegalUpdatesService} from './legal-updates.service';
import {LegalUpdateFiltersDto} from './dto/legal-update-filters.dto';

@ApiTags('Legal Updates')
@Controller('legal-updates')
export class LegalUpdatesController
{
    constructor(private readonly legalUpdatesService: LegalUpdatesService) {}

    @Get()
    @ApiOperation({summary: 'Feed de actualizaciones legales (requiere sesión)'})
    async findAll(@Query() filters: LegalUpdateFiltersDto = {})
    {
        return this.legalUpdatesService.findAll(filters);
    }

    @Get('sources')
    @ApiOperation({summary: 'Estado de frescura por fuente'})
    async listSources()
    {
        return this.legalUpdatesService.listSources();
    }
}
