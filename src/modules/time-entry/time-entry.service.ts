import {HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {FirmService} from '../firm/firm.service';
import {PermissionsService} from '../permissions/permissions.service';
import {StartTimerDto} from './dto/start-timer.dto';
import {CreateManualEntryDto} from './dto/create-manual-entry.dto';
import {TimeEntryEntity, TimeEntryWithUserEntity} from './entities/time-entry.entity';

@Injectable()
export class TimeEntryService
{
    private readonly logger = new Logger(TimeEntryService.name);

    constructor(
        private readonly prisma:            PrismaService,
        private readonly firmService:       FirmService,
        private readonly permissionsService: PermissionsService,
    ) {}

    // "Ver todo el despacho" se resuelve reusando time_entries:analytics — quien
    // puede ver estadísticas de la firma también puede ver el calendario de
    // todos; quien no, solo ve (y gestiona) sus propias entradas.
    private async canViewAllEntries(userId: string, firmId?: string): Promise<boolean>
    {
        const {isAdmin, permissionKeys} = await this.permissionsService.getEffectivePermissions(userId, firmId);
        return isAdmin || permissionKeys.includes('time_entries:analytics');
    }

    private async canViewTeam(userId: string, firmId?: string): Promise<boolean>
    {
        const {isAdmin, permissionKeys} = await this.permissionsService.getEffectivePermissions(userId, firmId);
        return isAdmin || permissionKeys.includes('team:view');
    }

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
                    processId:   dto.processId,
                    userId,
                    firmId:      firm.id,
                    type:        'AUTO',
                    billableType: dto.billableType ?? 'BILLABLE',
                    startedAt:   new Date(),
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

    async addManual(userId: string, firmId?: string, dto: CreateManualEntryDto = {} as CreateManualEntryDto): Promise<TimeEntryWithUserEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            // sharedWithUserIds requiere team:view — sin eso, se ignora aunque
            // venga en el body (no confiar en que el frontend ya lo oculte).
            const canShare   = await this.canViewTeam(userId, firmId);
            const sharedIds  = canShare ? (dto.sharedWithUserIds?.filter(id => id !== userId) ?? []) : [];
            const isShared   = sharedIds.length > 0;
            const startedAt  = dto.startedAt ?? new Date();
            const endedAt    = new Date(startedAt.getTime() + dto.durationMinutes * 60_000);

            const result = await this.prisma.timeEntry.create({
                data: {
                    processId:       dto.processId,
                    userId,
                    firmId:          firm.id,
                    type:            'MANUAL',
                    billableType:    dto.billableType ?? 'BILLABLE',
                    isShared,
                    description:     dto.description,
                    startedAt,
                    endedAt,
                    durationMinutes: dto.durationMinutes,
                    ...(isShared && {
                        participants: {
                            create: sharedIds.map(uid => ({userId: uid, firmId: firm.id})),
                        },
                    }),
                },
                include: {
                    user:         {select: {firstName: true, lastName: true, hourlyRate: true}},
                    participants: {select: {id: true, userId: true, user: {select: {firstName: true, lastName: true}}}},
                },
            }) as unknown as TimeEntryWithUserEntity;

            this.logger.log(`addManual → success userId=${userId} processId=${dto.processId} shared=${isShared}`);
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
            const firm    = await this.firmService.getMyFirm(userId, firmId);
            const seesAll = await this.canViewAllEntries(userId, firmId);

            const where = {
                ...(processId ? {processId} : {}),
                firmId: firm.id,
                ...(seesAll ? {} : {userId}),
            };

            const result = await this.prisma.timeEntry.findMany({
                where,
                include: {
                    user:         {select: {firstName: true, lastName: true, hourlyRate: true}},
                    participants: {select: {id: true, userId: true, user: {select: {firstName: true, lastName: true}}}},
                },
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

    // Versión reducida de getAnalytics para cualquiera con time_entries:view
    // (no time_entries:analytics): mismo shape que espera el calendario para
    // la barra de metas del día/mes, pero sin el desglose de otros usuarios —
    // se filtra acá, antes de que la respuesta salga del servidor.
    async getMyGoalProgress(userId: string, firmId?: string, date?: string): Promise<Record<string, any>>
    {
        const analytics = await this.getAnalytics(userId, firmId, date, {});

        return {
            currentUserId: analytics.currentUserId,
            firm:          analytics.firm,
            byUser:        (analytics.byUser ?? []).filter((entry: {userId: string}) => entry.userId === userId),
        };
    }

    // ── Analytics (firma completa) ─────────────────────────────────────────────

    async getAnalytics(
        userId: string,
        firmId?: string,
        date?: string,
        filters: {startDate?: string; endDate?: string; processId?: string; lawyerId?: string} = {},
    ): Promise<Record<string, any>>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const startedAtFilter = filters.startDate || filters.endDate
                ? {
                    ...(filters.startDate && {gte: new Date(`${filters.startDate}T00:00:00`)}),
                    ...(filters.endDate   && {lte: new Date(`${filters.endDate}T23:59:59`)}),
                }
                : undefined;

            const entries = await this.prisma.timeEntry.findMany({
                where: {
                    firmId:          firm.id,
                    durationMinutes: {not: null},
                    ...(startedAtFilter    && {startedAt: startedAtFilter}),
                    ...(filters.processId  && {processId: filters.processId}),
                    ...(filters.lawyerId   && {userId: filters.lawyerId}),
                },
                include: {
                    user:         {select: {firstName: true, lastName: true}},
                    process:      {select: {title: true}},
                    participants: {select: {userId: true}},
                },
            });

            type UserAgg = {
                firstName: string; lastName: string;
                billableMinutes: number; nonBillableMinutes: number;
                entryCount: number; processIds: Set<string>;
                dailyBillableMinutes: number; dailyNonBillableMinutes: number;
            };
            type ProcessAgg = {title: string; totalMinutes: number; billableMinutes: number; entryCount: number; userIds: Set<string>};

            const byUserMap:    Record<string, UserAgg>    = {};
            const byProcessMap: Record<string, ProcessAgg> = {};

            const targetDate = date ? new Date(date) : new Date();
            const dayStart   = new Date(targetDate); dayStart.setHours(0,  0,  0,   0);
            const dayEnd     = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999);

            const ensureUser = (uid: string, firstName: string, lastName: string) => {
                if (!byUserMap[uid])
                    byUserMap[uid] = {firstName, lastName, billableMinutes: 0, nonBillableMinutes: 0, entryCount: 0, processIds: new Set(), dailyBillableMinutes: 0, dailyNonBillableMinutes: 0};
            };

            for (const entry of entries)
            {
                if (!entry.durationMinutes) continue;

                const isBillable = entry.billableType === 'BILLABLE';
                const isToday    = entry.startedAt >= dayStart && entry.startedAt <= dayEnd;

                // Accrue minutes for the entry creator
                ensureUser(entry.userId, entry.user.firstName, entry.user.lastName);
                if (isBillable) byUserMap[entry.userId].billableMinutes    += entry.durationMinutes;
                else            byUserMap[entry.userId].nonBillableMinutes += entry.durationMinutes;
                byUserMap[entry.userId].entryCount++;
                byUserMap[entry.userId].processIds.add(entry.processId);
                if (isToday) {
                    if (isBillable) byUserMap[entry.userId].dailyBillableMinutes    += entry.durationMinutes;
                    else            byUserMap[entry.userId].dailyNonBillableMinutes += entry.durationMinutes;
                }

                // Shared: participants also accrue the same hours toward their goal
                for (const p of entry.participants)
                {
                    if (p.userId === entry.userId) continue;
                    ensureUser(p.userId, '', '');
                    if (isBillable) byUserMap[p.userId].billableMinutes    += entry.durationMinutes;
                    else            byUserMap[p.userId].nonBillableMinutes += entry.durationMinutes;
                    byUserMap[p.userId].processIds.add(entry.processId);
                    if (isToday) {
                        if (isBillable) byUserMap[p.userId].dailyBillableMinutes    += entry.durationMinutes;
                        else            byUserMap[p.userId].dailyNonBillableMinutes += entry.durationMinutes;
                    }
                }

                // Per-process: shared entries count once (not per participant)
                if (!byProcessMap[entry.processId])
                    byProcessMap[entry.processId] = {title: entry.process.title, totalMinutes: 0, billableMinutes: 0, entryCount: 0, userIds: new Set()};
                byProcessMap[entry.processId].totalMinutes    += entry.durationMinutes;
                if (isBillable)
                    byProcessMap[entry.processId].billableMinutes += entry.durationMinutes;
                byProcessMap[entry.processId].entryCount++;
                byProcessMap[entry.processId].userIds.add(entry.userId);
            }

            const dailyBillableGoalMinutes    = (firm.dailyBillableGoalHours    ?? 0) * 60;
            const dailyNonBillableGoalMinutes = (firm.dailyNonBillableGoalHours ?? 0) * 60;

            const byUser = Object.entries(byUserMap)
                .map(([uid, d]) => ({
                    userId:                   uid,
                    firstName:                d.firstName,
                    lastName:                 d.lastName,
                    billableMinutes:          d.billableMinutes,
                    nonBillableMinutes:       d.nonBillableMinutes,
                    totalMinutes:             d.billableMinutes + d.nonBillableMinutes,
                    entryCount:               d.entryCount,
                    processCount:             d.processIds.size,
                    daily: {
                        date:                         targetDate.toISOString().split('T')[0],
                        billableMinutes:              d.dailyBillableMinutes,
                        nonBillableMinutes:           d.dailyNonBillableMinutes,
                        billableGoalMinutes:          dailyBillableGoalMinutes,
                        nonBillableGoalMinutes:       dailyNonBillableGoalMinutes,
                        billableProgress:             dailyBillableGoalMinutes    > 0 ? +(d.dailyBillableMinutes    / dailyBillableGoalMinutes    * 100).toFixed(1) : null,
                        nonBillableProgress:          dailyNonBillableGoalMinutes > 0 ? +(d.dailyNonBillableMinutes / dailyNonBillableGoalMinutes * 100).toFixed(1) : null,
                    },
                }))
                .sort((a, b) => b.totalMinutes - a.totalMinutes);

            const byProcess = Object.entries(byProcessMap)
                .map(([pid, d]) => ({processId: pid, title: d.title, totalMinutes: d.totalMinutes, billableMinutes: d.billableMinutes, entryCount: d.entryCount, userCount: d.userIds.size}))
                .sort((a, b) => b.totalMinutes - a.totalMinutes);

            const totalBillableMinutes    = byUser.reduce((acc, u) => acc + u.billableMinutes,    0);
            const totalNonBillableMinutes = byUser.reduce((acc, u) => acc + u.nonBillableMinutes, 0);
            const totalMinutes            = entries.reduce((acc, e) => acc + (e.durationMinutes ?? 0), 0);

            const isAdmin = firm.createdBy === userId;

            const analytics = {
                byUser,
                byProcess,
                totalMinutes,
                totalBillableMinutes,
                totalNonBillableMinutes,
                totalEntries: entries.length,
                firm: {
                    firmHourlyRate:            firm.firmHourlyRate,
                    dailyBillableGoalHours:    firm.dailyBillableGoalHours,
                    dailyNonBillableGoalHours: firm.dailyNonBillableGoalHours,
                },
                currentUserId: userId,
                isAdmin,
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
