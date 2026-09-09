import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsEnum, IsInt, IsOptional, Max, Min} from 'class-validator';
import {ReminderStatus} from '../../../../generated/prisma/client';

export class UpdateTimelineReminderDto
{
    @IsInt()
    @Min(0)
    @Max(525600)
    @IsOptional()
    @ApiProperty({description: 'Minutos antes de eventDate', required: false})
    offsetMinutes?: number;

    @IsEmail()
    @IsOptional()
    @ApiProperty({description: 'Correo destinatario', required: false})
    recipientEmail?: string;

    @IsEnum(ReminderStatus)
    @IsOptional()
    @ApiProperty({description: 'Estado del recordatorio (p.ej. CANCELLED para desactivar, PENDING para reintentar)', enum: ReminderStatus, required: false})
    status?: ReminderStatus;
}
