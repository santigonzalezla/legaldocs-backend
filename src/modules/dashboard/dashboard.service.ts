import {HttpException, Injectable, InternalServerErrorException, Logger} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {FirmService} from '../firm/firm.service';
import {DashboardSummary} from '../../interfaces/DashboardSummary';
import {BillableType, ClientType, ProcessStatus} from '../../../generated/prisma/client';

const toHours = (minutes: number | null | undefined): number => Math.round((minutes ?? 0) / 6) / 10;

const deltaPct = (current: number, previous: number): number | null =>
    previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

@Injectable()
export class DashboardService
{
    private readonly logger = new Logger(DashboardService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly firmService: FirmService,
    ) {}

    async getSummary(userId: string, firmId?: string): Promise<DashboardSummary>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);
            const now = new Date();
            const monthStart     = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

            const scope = {firmId: firm.id, deletedAt: null};

            const [
                docsMonth, docsPrevMonth, docsTotal,
                billableMonthAgg, billablePrevAgg, trackedMonthAgg,
                processesActive, processesInReview, processesNew,
                clientsActive, clientsNew, clientsNewCompanies,
            ] = await this.prisma.$transaction([
                this.prisma.document.count({where: {...scope, createdAt: {gte: monthStart}}}),
                this.prisma.document.count({where: {...scope, createdAt: {gte: prevMonthStart, lt: monthStart}}}),
                this.prisma.document.count({where: scope}),

                this.prisma.timeEntry.aggregate({_sum: {durationMinutes: true}, where: {firmId: firm.id, billableType: BillableType.BILLABLE, startedAt: {gte: monthStart}}}),
                this.prisma.timeEntry.aggregate({_sum: {durationMinutes: true}, where: {firmId: firm.id, billableType: BillableType.BILLABLE, startedAt: {gte: prevMonthStart, lt: monthStart}}}),
                this.prisma.timeEntry.aggregate({_sum: {durationMinutes: true}, where: {firmId: firm.id, startedAt: {gte: monthStart}}}),

                this.prisma.legalProcess.count({where: {...scope, status: ProcessStatus.ACTIVE}}),
                this.prisma.legalProcess.count({where: {...scope, status: ProcessStatus.IN_REVIEW}}),
                this.prisma.legalProcess.count({where: {...scope, createdAt: {gte: monthStart}}}),

                this.prisma.client.count({where: scope}),
                this.prisma.client.count({where: {...scope, createdAt: {gte: monthStart}}}),
                this.prisma.client.count({where: {...scope, type: ClientType.COMPANY, createdAt: {gte: monthStart}}}),
            ]);

            const billableMonth = toHours(billableMonthAgg._sum.durationMinutes);
            const billablePrev  = toHours(billablePrevAgg._sum.durationMinutes);

            this.logger.log(`getSummary → success firmId=${firm.id}`);

            return {
                documents: {
                    month:    docsMonth,
                    total:    docsTotal,
                    deltaPct: deltaPct(docsMonth, docsPrevMonth),
                },
                billableHours: {
                    month:        billableMonth,
                    trackedMonth: toHours(trackedMonthAgg._sum.durationMinutes),
                    deltaPct:     deltaPct(billableMonth, billablePrev),
                },
                processes: {
                    active:       processesActive,
                    inReview:     processesInReview,
                    newThisMonth: processesNew,
                },
                clients: {
                    active:         clientsActive,
                    newThisMonth:   clientsNew,
                    newCompanies:   clientsNewCompanies,
                    newIndividuals: clientsNew - clientsNewCompanies,
                },
            };
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`getSummary → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }
}
