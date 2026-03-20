import {ApiProperty} from '@nestjs/swagger';
import {IsEnum, IsUUID} from 'class-validator';
import {BillingCycle} from '../../../../generated/prisma/client';

export class SubscribeDto
{
    @IsUUID()
    @ApiProperty({
        description: 'ID del plan de suscripción',
        example: 'uuid-v4',
        required: true,
    })
    planId: string;

    @IsEnum(BillingCycle)
    @ApiProperty({
        description: 'Ciclo de facturación',
        example: BillingCycle.MONTHLY,
        required: true,
        enum: BillingCycle,
    })
    billingCycle: BillingCycle;
}
