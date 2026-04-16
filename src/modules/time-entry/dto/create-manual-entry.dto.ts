import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {IsDate, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID} from 'class-validator';

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
}
