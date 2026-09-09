import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateNested} from 'class-validator';
import {TimelineStage} from '../../../../generated/prisma/client';

// Primer comentario que se registra junto con la etapa al AVANZAR (no al crear la primera).
export class TimelineStageFirstCommentDto
{
    @IsString()
    @IsNotEmpty()
    @ApiProperty({description: 'Comentario u observación del avance de etapa'})
    body: string;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    @ApiProperty({description: 'Fecha y hora del evento (solo si es un evento futuro)', required: false})
    commentDate?: Date;

    @IsUUID()
    @IsOptional()
    @ApiProperty({description: 'ID del miembro (FirmMember) responsable', required: false})
    responsibleId?: string;
}

export class CreateTimelineStageDto
{
    @IsEnum(TimelineStage)
    @IsNotEmpty()
    @ApiProperty({description: 'Etapa jurídica del proceso', enum: TimelineStage})
    stage: TimelineStage;

    @IsString()
    @MaxLength(120)
    @IsOptional()
    @ApiProperty({description: 'Etiqueta libre de la micro etapa', example: 'Notificación por estado', required: false})
    microStageLabel?: string;

    @ValidateNested()
    @Type(() => TimelineStageFirstCommentDto)
    @IsOptional()
    @ApiProperty({description: 'Primer comentario del avance de etapa. Obligatorio al avanzar (no al crear la primera etapa).', type: TimelineStageFirstCommentDto, required: false})
    firstComment?: TimelineStageFirstCommentDto;
}
