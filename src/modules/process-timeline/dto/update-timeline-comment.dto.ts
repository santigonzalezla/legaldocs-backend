import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf} from 'class-validator';

export class UpdateTimelineCommentDto
{
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @ApiProperty({description: 'Comentario u observación de la etapa', required: false})
    body?: string;

    // Enviar null para quitar la fecha del evento (deja de ser un evento futuro).
    @IsOptional()
    @ValidateIf((object: UpdateTimelineCommentDto) => object.commentDate !== null)
    @Type(() => Date)
    @IsDate()
    @ApiProperty({description: 'Fecha y hora del evento; null para quitarla', required: false, nullable: true})
    commentDate?: Date | null;

    @IsUUID()
    @IsOptional()
    @ApiProperty({description: 'ID del miembro responsable', required: false})
    responsibleId?: string;
}
