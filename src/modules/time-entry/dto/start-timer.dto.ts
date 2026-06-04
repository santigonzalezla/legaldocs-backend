import {ApiProperty} from '@nestjs/swagger';
import {IsEnum, IsNotEmpty, IsOptional, IsUUID} from 'class-validator';
import {BillableType} from '../../../../generated/prisma/client';

export class StartTimerDto
{
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({description: 'ID del proceso legal al que se asocia el conteo', example: 'uuid-v4'})
    processId: string;

    @IsEnum(BillableType)
    @IsOptional()
    @ApiProperty({description: 'Tipo de hora: facturable o no facturable', enum: BillableType, required: false, default: BillableType.BILLABLE})
    billableType?: BillableType;
}
