import {ApiProperty} from '@nestjs/swagger';
import {IsOptional, IsString, MaxLength} from 'class-validator';

export class UpdateTimelineStageDto
{
    @IsString()
    @MaxLength(120)
    @IsOptional()
    @ApiProperty({description: 'Etiqueta libre de la micro etapa', required: false})
    microStageLabel?: string;
}
