import {ApiProperty} from '@nestjs/swagger';
import {IsOptional, IsString} from 'class-validator';

export class TimelineFiltersDto
{
    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Buscar por título, descripción o subtipo', required: false})
    search?: string;
}
