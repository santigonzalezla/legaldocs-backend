import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsEnum, IsInt, IsOptional, Max, Min} from 'class-validator';
import {ReminderChannel} from '../../../../generated/prisma/client';

export class CreateTimelineReminderDto
{
    @IsInt()
    @Min(0)
    @Max(525600) // 1 año en minutos
    @ApiProperty({description: 'Minutos antes de eventDate en que se dispara el recordatorio', example: 1440})
    offsetMinutes: number;

    @IsEmail()
    @ApiProperty({description: 'Correo destinatario del recordatorio', example: 'abogado@despacho.com'})
    recipientEmail: string;

    @IsEnum(ReminderChannel)
    @IsOptional()
    @ApiProperty({description: 'Canal de envío', enum: ReminderChannel, required: false, default: 'EMAIL'})
    channel?: ReminderChannel;
}
