import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {IsArray, IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID} from 'class-validator';
import {BillableType} from '../../../../generated/prisma/client';

export class CreateManualEntryDto
{
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({description: 'ID del proceso legal', example: 'uuid-v4'})
    processId: string;

    @IsInt()
    @IsPositive()
    @IsNotEmpty()
    @ApiProperty({description: 'Duración total en minutos', example: 90})
    durationMinutes: number;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Descripción de la actividad realizada', example: 'Reunión con el cliente', required: false})
    description?: string;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    @ApiProperty({description: 'Fecha y hora de inicio del registro. Si se omite, se usa la hora actual.', example: '2025-04-15T09:00:00', required: false})
    startedAt?: Date;

    @IsEnum(BillableType)
    @IsOptional()
    @ApiProperty({description: 'Tipo de hora: facturable o no facturable', enum: BillableType, required: false, default: BillableType.BILLABLE})
    billableType?: BillableType;

    @IsArray()
    @IsUUID('4', {each: true})
    @IsOptional()
    @ApiProperty({description: 'IDs de otros abogados que participaron en la actividad (hora compartida)', example: ['uuid-v4'], required: false, type: [String]})
    sharedWithUserIds?: string[];
}
