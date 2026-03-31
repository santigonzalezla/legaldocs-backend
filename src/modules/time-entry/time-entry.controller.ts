import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiTags} from '@nestjs/swagger';
import {TimeEntryService} from './time-entry.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from '../firm/decorators/firm-id.decorator';
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
    @ApiOperation({summary: 'Iniciar conteo automático de tiempo en un proceso'})
    async startTimer(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Body() dto: StartTimerDto = {} as StartTimerDto)
    {
        return this.timeEntryService.startTimer(user.userId, firmId, dto);
    }

    @Patch(':id/stop')
    @ApiOperation({summary: 'Detener el conteo activo'})
    async stopTimer(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.timeEntryService.stopTimer(user.userId, firmId, id);
    }

    @Post('manual')
    @ApiOperation({summary: 'Registrar tiempo manualmente en un proceso'})
    async addManual(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Body() dto: CreateManualEntryDto = {} as CreateManualEntryDto)
    {
        return this.timeEntryService.addManual(user.userId, firmId, dto);
    }

    @Get('analytics')
    @ApiOperation({summary: 'Analíticas de tiempo para toda la firma (por usuario y por proceso)'})
    async getAnalytics(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string)
    {
        return this.timeEntryService.getAnalytics(user.userId, firmId);
    }

    @Get()
    @ApiOperation({summary: 'Listar todos los registros de tiempo de un proceso'})
    async findByProcess(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Query('processId') processId: string = '')
    {
        return this.timeEntryService.findByProcess(user.userId, firmId, processId);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar un registro de tiempo propio'})
    async remove(@CurrentUser() user: LoggedUser, @FirmId() firmId?: string, @Param('id') id: string = '')
    {
        return this.timeEntryService.remove(user.userId, firmId, id);
    }
}
