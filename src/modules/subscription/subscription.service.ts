import {BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {FirmService} from '../firm/firm.service';
import {SubscribeDto} from './dto/subscribe.dto';
import {ChangePlanDto} from './dto/change-plan.dto';
import {CreatePaymentMethodDto} from './dto/create-payment-method.dto';
import {SubscriptionPlanEntity} from './entities/subscription-plan.entity';
import {SubscriptionEntity} from './entities/subscription.entity';
import {InvoiceEntity} from './entities/invoice.entity';
import {PaymentMethodEntity} from './entities/payment-method.entity';
import {SubscriptionStatus} from '../../../generated/prisma/client';

@Injectable()
export class SubscriptionService
{
    private readonly logger = new Logger(SubscriptionService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly firmService: FirmService,
    ) {}

    // ─── PLANS ────────────────────────────────────────────────────────────────────

    async getPlans(): Promise<SubscriptionPlanEntity[]>
    {
        try
        {
            const result = await this.prisma.subscriptionPlan.findMany({
                where: {isActive: true},
                orderBy: {sortOrder: 'asc'},
            });

            this.logger.log(`getPlans → success count=${result.length}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`getPlans → failed`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── SUBSCRIPTION ─────────────────────────────────────────────────────────────

    async getMySubscription(userId: string, firmId?: string): Promise<(SubscriptionEntity & {plan: SubscriptionPlanEntity}) | null>
    {
        try
        {
            const firm         = await this.firmService.getMyFirm(userId, firmId);
            const subscription = await this.prisma.subscription.findUnique({
                where: {firmId: firm.id},
                include: {plan: true},
            });

            this.logger.log(`getMySubscription → firmId=${firm.id} found=${!!subscription}`);
            return subscription as (SubscriptionEntity & {plan: SubscriptionPlanEntity}) | null;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`getMySubscription → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async subscribe(userId: string, firmId: string | undefined, dto: SubscribeDto): Promise<SubscriptionEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const existing = await this.prisma.subscription.findUnique({
                where: {firmId: firm.id},
            });

            if (existing) throw new BadRequestException('El despacho ya tiene una suscripción activa');

            const plan = await this.prisma.subscriptionPlan.findUnique({
                where: {id: dto.planId},
            });

            if (!plan || !plan.isActive) throw new NotFoundException('Plan no encontrado');

            const result = await this.prisma.subscription.create({
                data: {
                    firmId: firm.id,
                    planId: dto.planId,
                    billingCycle: dto.billingCycle,
                    status: SubscriptionStatus.TRIAL,
                    startDate: new Date(),
                    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                },
            });

            this.logger.log(`subscribe → success firmId=${firm.id} planId=${dto.planId}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`subscribe → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async changePlan(userId: string, firmId: string | undefined, dto: ChangePlanDto): Promise<SubscriptionEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);
            await this.findFirmSubscription(firm.id);

            const plan = await this.prisma.subscriptionPlan.findUnique({
                where: {id: dto.planId},
            });

            if (!plan || !plan.isActive) throw new NotFoundException('Plan no encontrado');

            const result = await this.prisma.subscription.update({
                where: {firmId: firm.id},
                data: {
                    planId: dto.planId,
                    ...(dto.billingCycle && {billingCycle: dto.billingCycle}),
                    status: SubscriptionStatus.ACTIVE,
                },
            });

            this.logger.log(`changePlan → success firmId=${firm.id} planId=${dto.planId}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`changePlan → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async cancel(userId: string, firmId?: string): Promise<{message: string}>
    {
        try
        {
            const firm         = await this.firmService.getMyFirm(userId, firmId);
            const subscription = await this.findFirmSubscription(firm.id);

            if (subscription.status === SubscriptionStatus.CANCELLED)
                throw new BadRequestException('La suscripción ya está cancelada');

            await this.prisma.subscription.update({
                where: {firmId: firm.id},
                data: {status: SubscriptionStatus.CANCELLED, cancelledAt: new Date()},
            });

            this.logger.log(`cancel → success firmId=${firm.id}`);
            return {message: 'Suscripción cancelada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`cancel → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── USAGE ────────────────────────────────────────────────────────────────────

    async getUsage(userId: string, firmId?: string): Promise<{
        documents: {used: number; max: number | null};
        users:     {used: number; max: number | null};
        templates: {used: number; max: number | null};
        aiTokens:  {
            usedDaily: number; maxDaily: number | null;
            usedWeekly: number; maxWeekly: number | null;
            usedMonthly: number; maxMonthly: number | null;
        };
    }>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const [documents, users, templates, subscription] = await this.prisma.$transaction([
                this.prisma.document.count({
                    where: {firmId: firm.id, deletedAt: null, createdAt: {gte: startOfMonth}},
                }),
                this.prisma.firmMember.count({
                    where: {firmId: firm.id, status: 'ACTIVE'},
                }),
                this.prisma.documentTemplate.count({
                    where: {firmId: firm.id, deletedAt: null, isActive: true},
                }),
                this.prisma.subscription.findUnique({
                    where: {firmId: firm.id},
                    include: {plan: true},
                }),
            ]);

            const plan = subscription?.plan;

            this.logger.log(`getUsage → success firmId=${firm.id}`);
            return {
                documents: {used: documents, max: plan?.maxDocuments      ?? null},
                users:     {used: users,     max: plan?.maxUsers          ?? null},
                templates: {used: templates, max: plan?.maxTemplates      ?? null},
                aiTokens:  {
                    usedDaily:   subscription?.aiTokensUsedDaily   ?? 0,
                    maxDaily:    plan?.maxAiTokensDaily             ?? null,
                    usedWeekly:  subscription?.aiTokensUsedWeekly  ?? 0,
                    maxWeekly:   plan?.maxAiTokensWeekly            ?? null,
                    usedMonthly: subscription?.aiTokensUsedMonthly ?? 0,
                    maxMonthly:  plan?.maxAiTokensMonthly           ?? null,
                },
            };
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`getUsage → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── INVOICES ─────────────────────────────────────────────────────────────────

    async getInvoices(userId: string, firmId?: string): Promise<{data: InvoiceEntity[]; total: number}>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const [data, total] = await this.prisma.$transaction([
                this.prisma.invoice.findMany({
                    where: {firmId: firm.id},
                    orderBy: {createdAt: 'desc'},
                }),
                this.prisma.invoice.count({where: {firmId: firm.id}}),
            ]);

            this.logger.log(`getInvoices → success firmId=${firm.id} total=${total}`);
            return {data, total};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`getInvoices → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── PAYMENT METHODS ──────────────────────────────────────────────────────────

    async getPaymentMethods(userId: string, firmId?: string): Promise<PaymentMethodEntity[]>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const result = await this.prisma.paymentMethod.findMany({
                where: {firmId: firm.id},
                orderBy: [{isDefault: 'desc'}, {createdAt: 'desc'}],
            });

            this.logger.log(`getPaymentMethods → success firmId=${firm.id}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`getPaymentMethods → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async addPaymentMethod(userId: string, firmId: string | undefined, dto: CreatePaymentMethodDto): Promise<PaymentMethodEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const hasExisting = await this.prisma.paymentMethod.count({
                where: {firmId: firm.id},
            });

            const result = await this.prisma.paymentMethod.create({
                data: {...dto, firmId: firm.id, isDefault: hasExisting === 0},
            });

            this.logger.log(`addPaymentMethod → success firmId=${firm.id}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`addPaymentMethod → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async setDefaultPaymentMethod(userId: string, firmId: string | undefined, id: string): Promise<PaymentMethodEntity>
    {
        try
        {
            const firm   = await this.firmService.getMyFirm(userId, firmId);
            const method = await this.findFirmPaymentMethod(firm.id, id);

            await this.prisma.paymentMethod.updateMany({
                where: {firmId: firm.id, isDefault: true},
                data: {isDefault: false},
            });

            const result = await this.prisma.paymentMethod.update({
                where: {id: method.id},
                data: {isDefault: true},
            });

            this.logger.log(`setDefaultPaymentMethod → success id=${id}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`setDefaultPaymentMethod → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async removePaymentMethod(userId: string, firmId: string | undefined, id: string): Promise<{message: string}>
    {
        try
        {
            const firm   = await this.firmService.getMyFirm(userId, firmId);
            const method = await this.findFirmPaymentMethod(firm.id, id);

            await this.prisma.paymentMethod.delete({where: {id: method.id}});

            if (method.isDefault)
            {
                const next = await this.prisma.paymentMethod.findFirst({
                    where: {firmId: firm.id},
                    orderBy: {createdAt: 'desc'},
                });

                if (next)
                    await this.prisma.paymentMethod.update({
                        where: {id: next.id},
                        data: {isDefault: true},
                    });
            }

            this.logger.log(`removePaymentMethod → success id=${id}`);
            return {message: 'Método de pago eliminado correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`removePaymentMethod → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────────────

    private async findFirmSubscription(firmId: string): Promise<SubscriptionEntity>
    {
        const subscription = await this.prisma.subscription.findUnique({where: {firmId}});

        if (!subscription) throw new NotFoundException('No tienes una suscripción activa');

        return subscription;
    }

    private async findFirmPaymentMethod(firmId: string, id: string): Promise<PaymentMethodEntity>
    {
        const method = await this.prisma.paymentMethod.findFirst({where: {id, firmId}});

        if (!method) throw new NotFoundException('Método de pago no encontrado');

        return method;
    }
}
