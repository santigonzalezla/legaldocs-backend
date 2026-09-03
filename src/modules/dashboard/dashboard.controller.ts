import {Controller, Get} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiTags} from '@nestjs/swagger';
import {DashboardService} from './dashboard.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from '../firm/decorators/firm-id.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';

@ApiTags('Dashboard')
@ApiHeader({name: 'X-Firm-Id', required: false, description: 'ID de la firma activa'})
@Controller('dashboard')
export class DashboardController
{
    constructor(private readonly dashboardService: DashboardService) {}

    @Get('summary')
    @ApiOperation({summary: 'Métricas resumidas del despacho para el dashboard'})
    async getSummary(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined)
    {
        return this.dashboardService.getSummary(user.userId, firmId);
    }
}
