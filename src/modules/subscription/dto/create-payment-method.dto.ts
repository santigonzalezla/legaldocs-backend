import {ApiProperty} from '@nestjs/swagger';
import {IsEnum, IsInt, IsOptional, IsString, Max, Min} from 'class-validator';
import {PaymentMethodType} from '../../../../generated/prisma/client';

export class CreatePaymentMethodDto
{
    @IsEnum(PaymentMethodType)
    @ApiProperty({
        description: 'Tipo de método de pago',
        example: PaymentMethodType.CARD,
        required: true,
        enum: PaymentMethodType,
    })
    type: PaymentMethodType;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Últimos cuatro dígitos de la tarjeta',
        example: '4242',
        required: false,
    })
    lastFour?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Marca de la tarjeta',
        example: 'Visa',
        required: false,
    })
    brand?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Nombre del titular',
        example: 'Juan Pérez',
        required: false,
    })
    holderName?: string;

    @IsInt()
    @Min(1)
    @Max(12)
    @IsOptional()
    @ApiProperty({
        description: 'Mes de vencimiento',
        example: 12,
        required: false,
        minimum: 1,
        maximum: 12,
    })
    expiryMonth?: number;

    @IsInt()
    @Min(2024)
    @IsOptional()
    @ApiProperty({
        description: 'Año de vencimiento',
        example: 2028,
        required: false,
        minimum: 2024,
    })
    expiryYear?: number;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'ID externo del método de pago en la pasarela',
        example: 'pm_1234567890',
        required: false,
    })
    externalId?: string;
}
