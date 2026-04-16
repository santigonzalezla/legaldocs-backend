import {HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {FirmService} from '../firm/firm.service';
import {StartTimerDto} from './dto/start-timer.dto';
import {CreateManualEntryDto} from './dto/create-manual-entry.dto';
import {TimeEntryEntity, TimeEntryWithUserEntity} from './entities/time-entry.entity';

@Injectable()
export class TimeEntryService
{
    private readonly logger = new Logger(TimeEntryService.name);

    constructor(
        private readonly prisma:       PrismaService,
        private readonly firmService:  FirmService,
    ) {}

    async startTimer(userId: string, firmId?: string, dto: StartTimerDto = {} as StartTimerDto): Promise<TimeEntryEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const existing = await this.prisma.timeEntry.findFirst({
                where: {userId, processId: dto.processId, firmId: firm.id, endedAt: null},
            });

            if (existing)
                throw new HttpException('Ya tienes un conteo activo en este proceso', 400);

            const result = await this.prisma.timeEntry.create({
                data: {
                    processId: dto.processId,
                    userId,
                    firmId:    firm.id,
                    type:      'AUTO',
                    startedAt: new Date(),
                },
            });

            this.logger.log(`startTimer → success userId=${userId} processId=${dto.processId}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`startTimer → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async stopTimer(userId: string, firmId?: string, id: string = ''): Promise<TimeEntryEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const entry = await this.prisma.timeEntry.findFirst({
                where: {id, userId, firmId: firm.id, endedAt: null},
            });

            if (!entry) throw new NotFoundException('Conteo activo no encontrado');

            const endedAt       = new Date();
            const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - entry.startedAt.getTime()) / 60_000));

            const result = await this.prisma.timeEntry.update({
                where: {id},
                data:  {endedAt, durationMinutes},
            });

            this.logger.log(`stopTimer → success id=${id} duration=${durationMinutes}min`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`stopTimer → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async addManual(userId: string, firmId?: string, dto: CreateManualEntryDto = {} as CreateManualEntryDto): Promise<TimeEntryEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const startedAt = dto.startedAt ?? new Date();
            const endedAt   = new Date(startedAt.getTime() + dto.durationMinutes * 60_000);
            const result = await this.prisma.timeEntry.create({
                data: {
                    processId:       dto.processId,
                    userId,
                    firmId:          firm.id,
                    type:            'MANUAL',
                    description:     dto.description,
                    startedAt,
                    endedAt,
                    durationMinutes: dto.durationMinutes,
                },
            });

            this.logger.log(`addManual → success userId=${userId} processId=${dto.processId}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`addManual → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async findByProcess(userId: string, firmId?: string, processId: string = ''): Promise<TimeEntryWithUserEntity[]>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const where = processId ? {processId, firmId: firm.id} : {firmId: firm.id};

            const result = await this.prisma.timeEntry.findMany({
                where,
                include: {user: {select: {firstName: true, lastName: true, hourlyRate: true}}},
                orderBy: {startedAt: 'desc'},
            }) as unknown as TimeEntryWithUserEntity[];

            this.logger.log(`findByProcess → success processId=${processId || 'ALL'} count=${result.length}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`findByProcess → failed processId=${processId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async remove(userId: string, firmId?: string, id: string = ''): Promise<{message: string}>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const entry = await this.prisma.timeEntry.findFirst({
                where: {id, userId, firmId: firm.id},
            });

            if (!entry) throw new NotFoundException('Registro de tiempo no encontrado');

            await this.prisma.timeEntry.delete({where: {id}});

            this.logger.log(`remove → success id=${id}`);
            return {message: 'Registro eliminado correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`remove → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ── Analytics (firma completa) ─────────────────────────────────────────────

    async getAnalytics(userId: string, firmId?: string): Promise<Record<string, any>>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const entries = await this.prisma.timeEntry.findMany({
                where:   {firmId: firm.id, durationMinutes: {not: null}},
                include: {
                    user:    {select: {firstName: true, lastName: true}},
                    process: {select: {title: true}},
                },
            });

            const byUserMap:    Record<string, {firstName: string; lastName: string; totalMinutes: number; entryCount: number; processIds: Set<string>}> = {};
            const byProcessMap: Record<string, {title: string; totalMinutes: number; entryCount: number; userIds: Set<string>}> = {};

            for (const entry of entries)
            {
                if (!entry.durationMinutes) continue;

                if (!byUserMap[entry.userId])
                    byUserMap[entry.userId] = {firstName: entry.user.firstName, lastName: entry.user.lastName, totalMinutes: 0, entryCount: 0, processIds: new Set()};

                byUserMap[entry.userId].totalMinutes += entry.durationMinutes;
                byUserMap[entry.userId].entryCount++;
                byUserMap[entry.userId].processIds.add(entry.processId);

                if (!byProcessMap[entry.processId])
                    byProcessMap[entry.processId] = {title: entry.process.title, totalMinutes: 0, entryCount: 0, userIds: new Set()};

                byProcessMap[entry.processId].totalMinutes += entry.durationMinutes;
                byProcessMap[entry.processId].entryCount++;
                byProcessMap[entry.processId].userIds.add(entry.userId);
            }

            const byUser = Object.entries(byUserMap)
                .map(([uid, d]) => ({userId: uid, firstName: d.firstName, lastName: d.lastName, totalMinutes: d.totalMinutes, entryCount: d.entryCount, processCount: d.processIds.size}))
                .sort((a, b) => b.totalMinutes - a.totalMinutes);

            const byProcess = Object.entries(byProcessMap)
                .map(([pid, d]) => ({processId: pid, title: d.title, totalMinutes: d.totalMinutes, entryCount: d.entryCount, userCount: d.userIds.size}))
                .sort((a, b) => b.totalMinutes - a.totalMinutes);

            const analytics = {
                byUser,
                byProcess,
                totalMinutes: byUser.reduce((acc, u) => acc + u.totalMinutes, 0),
                totalEntries: entries.length,
            };

            this.logger.log(`getAnalytics → success firmId=${firm.id} entries=${entries.length}`);
            return analytics;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`getAnalytics → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }
}
