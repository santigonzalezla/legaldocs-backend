import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {IsDate, IsNotEmpty, IsOptional, IsString, IsUUID} from 'class-validator';

export class CreateTimelineCommentDto
{
    @IsString()
    @IsNotEmpty()
    @ApiProperty({description: 'Comentario u observación de la etapa', example: 'Recibí notificación de la demanda por estado.'})
    body: string;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    @ApiProperty({description: 'Fecha y hora del evento (solo si es un evento futuro; si no, se omite)', example: '2026-03-18T09:00:00.000Z', required: false})
    commentDate?: Date;

    @IsUUID()
    @IsOptional()
    @ApiProperty({description: 'ID del miembro (FirmMember) responsable del comentario', required: false})
    responsibleId?: string;
}
