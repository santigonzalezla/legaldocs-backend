import {BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException} from '@nestjs/common';
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
    constructor(
        private readonly prisma: PrismaService,
        private readonly firmService: FirmService,
    ) {}

    // ─── PLANS ────────────────────────────────────────────────────────────────────

    async getPlans(): Promise<SubscriptionPlanEntity[]>
    {
        try
        {
            return this.prisma.subscriptionPlan.findMany({
                where: {isActive: true},
                orderBy: {sortOrder: 'asc'},
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── SUBSCRIPTION ─────────────────────────────────────────────────────────────

    async getMySubscription(userId: string, firmId?: string): Promise<SubscriptionEntity & {plan: SubscriptionPlanEntity}>
    {
        try
        {
            const firm         = await this.firmService.getMyFirm(userId, firmId);
            const subscription = await this.prisma.subscription.findUnique({
                where: {firmId: firm.id},
                include: {plan: true},
            });

            if (!subscription) throw new NotFoundException('No tienes una suscripción activa');

            return subscription as SubscriptionEntity & {plan: SubscriptionPlanEntity};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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

            return this.prisma.subscription.create({
                data: {
                    firmId: firm.id,
                    planId: dto.planId,
                    billingCycle: dto.billingCycle,
                    status: SubscriptionStatus.TRIAL,
                    startDate: new Date(),
                    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                },
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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

            return this.prisma.subscription.update({
                where: {firmId: firm.id},
                data: {
                    planId: dto.planId,
                    ...(dto.billingCycle && {billingCycle: dto.billingCycle}),
                    status: SubscriptionStatus.ACTIVE,
                },
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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

            return {message: 'Suscripción cancelada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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

            return {data, total};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── PAYMENT METHODS ──────────────────────────────────────────────────────────

    async getPaymentMethods(userId: string, firmId?: string): Promise<PaymentMethodEntity[]>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            return this.prisma.paymentMethod.findMany({
                where: {firmId: firm.id},
                orderBy: [{isDefault: 'desc'}, {createdAt: 'desc'}],
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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

            return this.prisma.paymentMethod.create({
                data: {...dto, firmId: firm.id, isDefault: hasExisting === 0},
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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

            return this.prisma.paymentMethod.update({
                where: {id: method.id},
                data: {isDefault: true},
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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

            return {message: 'Método de pago eliminado correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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
