import {ApiProperty} from '@nestjs/swagger';
import {IsEnum, IsOptional, IsUUID} from 'class-validator';
import {BillingCycle} from '../../../../generated/prisma/client';

export class ChangePlanDto
{
    @IsUUID()
    @ApiProperty({
        description: 'ID del nuevo plan de suscripción',
        example: 'uuid-v4',
        required: true,
    })
    planId: string;

    @IsEnum(BillingCycle)
    @IsOptional()
    @ApiProperty({
        description: 'Nuevo ciclo de facturación',
        example: BillingCycle.ANNUALLY,
        required: false,
        enum: BillingCycle,
    })
    billingCycle?: BillingCycle;
}
