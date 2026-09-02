import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiTags} from '@nestjs/swagger';
import {TimeEntryService} from './time-entry.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from '../firm/decorators/firm-id.decorator';
import {Permission} from '../permissions/decorators/permission.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {StartTimerDto} from './dto/start-timer.dto';
import {CreateManualEntryDto} from './dto/create-manual-entry.dto';

@ApiTags('TimeEntry')
@ApiHeader({name: 'X-Firm-Id', required: false, description: 'ID de la firma activa'})
@Controller('time-entry')
export class TimeEntryController
{
    constructor(private readonly timeEntryService: TimeEntryService) {}

    @Post('start')
    @Permission('time_entries:start', 'Iniciar cronómetro de tiempo')
    @ApiOperation({summary: 'Iniciar conteo automático de tiempo en un proceso'})
    async startTimer(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Body() dto: StartTimerDto = {} as StartTimerDto)
    {
        return this.timeEntryService.startTimer(user.userId, firmId, dto);
    }

    @Patch(':id/stop')
    @Permission('time_entries:stop', 'Detener cronómetro de tiempo')
    @ApiOperation({summary: 'Detener el conteo activo'})
    async stopTimer(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.timeEntryService.stopTimer(user.userId, firmId, id);
    }

    @Post('manual')
    @Permission('time_entries:log-manual', 'Registrar tiempo manualmente')
    @ApiOperation({summary: 'Registrar tiempo manualmente en un proceso'})
    async addManual(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Body() dto: CreateManualEntryDto = {} as CreateManualEntryDto)
    {
        return this.timeEntryService.addManual(user.userId, firmId, dto);
    }

    @Get('analytics')
    @Permission('time_entries:analytics', 'Ver analíticas de tiempo')
    @ApiOperation({summary: 'Analíticas de tiempo para toda la firma (por usuario y por proceso). Pasar ?date=YYYY-MM-DD para meta diaria de esa fecha, y opcionalmente ?startDate=&endDate=&processId=&lawyerId= para filtrar el rango analizado.'})
    async getAnalytics(
        @CurrentUser() user: LoggedUser,
        @FirmId() firmId?: string,
        @Query('date') date?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('processId') processId?: string,
        @Query('lawyerId') lawyerId?: string,
    )
    {
        return this.timeEntryService.getAnalytics(user.userId, firmId, date, {startDate, endDate, processId, lawyerId});
    }

    @Get('my-goal-progress')
    @Permission('time_entries:view', 'Ver registros de tiempo')
    @ApiOperation({summary: 'Progreso de metas de facturación del usuario autenticado (sin datos de otros miembros). Pasar ?date=YYYY-MM-DD.'})
    async getMyGoalProgress(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Query('date') date?: string)
    {
        return this.timeEntryService.getMyGoalProgress(user.userId, firmId, date);
    }

    @Get()
    @Permission('time_entries:view', 'Ver registros de tiempo')
    @ApiOperation({summary: 'Listar todos los registros de tiempo de un proceso'})
    async findByProcess(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Query('processId') processId: string = '')
    {
        return this.timeEntryService.findByProcess(user.userId, firmId, processId);
    }

    @Delete(':id')
    @Permission('time_entries:delete', 'Eliminar registros de tiempo')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar un registro de tiempo propio'})
    async remove(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.timeEntryService.remove(user.userId, firmId, id);
    }
}
