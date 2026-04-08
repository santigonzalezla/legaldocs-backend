import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiTags} from '@nestjs/swagger';
import {SubscriptionService} from './subscription.service';
import {Public} from '../auth/decorators/public.decorator';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from '../firm/decorators/firm-id.decorator';
import {Roles} from '../firm/decorators/roles.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {FirmMemberRole} from '../../../generated/prisma/client';
import {SubscribeDto} from './dto/subscribe.dto';
import {ChangePlanDto} from './dto/change-plan.dto';
import {CreatePaymentMethodDto} from './dto/create-payment-method.dto';

@ApiTags('Subscription')
@ApiHeader({name: 'X-Firm-Id', required: false, description: 'ID de la firma activa (selector de workspace)'})
@Controller('subscription')
export class SubscriptionController
{
    constructor(private readonly subscriptionService: SubscriptionService) {}

    // ─── PLANS ────────────────────────────────────────────────────────────────────

    @Get('plans')
    @Public()
    @ApiOperation({summary: 'Listar planes de suscripción disponibles'})
    async getPlans()
    {
        return this.subscriptionService.getPlans();
    }

    // ─── SUBSCRIPTION ─────────────────────────────────────────────────────────────

    @Get('me')
    @ApiOperation({summary: 'Obtener suscripción activa del despacho'})
    async getMySubscription(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined)
    {
        return this.subscriptionService.getMySubscription(user.userId, firmId);
    }

    @Post('me')
    @Roles(FirmMemberRole.ADMIN)
    @ApiOperation({summary: 'Suscribirse a un plan (solo ADMIN)'})
    async subscribe(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Body() dto: SubscribeDto)
    {
        return this.subscriptionService.subscribe(user.userId, firmId, dto);
    }

    @Patch('me')
    @Roles(FirmMemberRole.ADMIN)
    @ApiOperation({summary: 'Cambiar plan o ciclo de facturación (solo ADMIN)'})
    async changePlan(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Body() dto: ChangePlanDto)
    {
        return this.subscriptionService.changePlan(user.userId, firmId, dto);
    }

    @Delete('me')
    @Roles(FirmMemberRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Cancelar suscripción activa (solo ADMIN)'})
    async cancel(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined)
    {
        return this.subscriptionService.cancel(user.userId, firmId);
    }

    // ─── USAGE ────────────────────────────────────────────────────────────────────

    @Get('me/usage')
    @ApiOperation({summary: 'Uso actual del despacho (documentos, usuarios, plantillas)'})
    async getUsage(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined)
    {
        return this.subscriptionService.getUsage(user.userId, firmId);
    }

    // ─── INVOICES ─────────────────────────────────────────────────────────────────

    @Get('me/invoices')
    @ApiOperation({summary: 'Historial de facturas del despacho'})
    async getInvoices(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined)
    {
        return this.subscriptionService.getInvoices(user.userId, firmId);
    }

    // ─── PAYMENT METHODS ──────────────────────────────────────────────────────────

    @Get('me/payment-methods')
    @ApiOperation({summary: 'Listar métodos de pago del despacho'})
    async getPaymentMethods(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined)
    {
        return this.subscriptionService.getPaymentMethods(user.userId, firmId);
    }

    @Post('me/payment-methods')
    @Roles(FirmMemberRole.ADMIN)
    @ApiOperation({summary: 'Agregar método de pago (solo ADMIN)'})
    async addPaymentMethod(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Body() dto: CreatePaymentMethodDto)
    {
        return this.subscriptionService.addPaymentMethod(user.userId, firmId, dto);
    }

    @Patch('me/payment-methods/:id/default')
    @Roles(FirmMemberRole.ADMIN)
    @ApiOperation({summary: 'Establecer método de pago predeterminado (solo ADMIN)'})
    async setDefaultPaymentMethod(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string)
    {
        return this.subscriptionService.setDefaultPaymentMethod(user.userId, firmId, id);
    }

    @Delete('me/payment-methods/:id')
    @Roles(FirmMemberRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar método de pago (solo ADMIN)'})
    async removePaymentMethod(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string)
    {
        return this.subscriptionService.removePaymentMethod(user.userId, firmId, id);
    }
}
