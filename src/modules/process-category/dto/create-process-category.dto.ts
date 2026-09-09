import {ApiProperty} from '@nestjs/swagger';
import {IsOptional, IsString, MaxLength} from 'class-validator';

export class CreateProcessCategoryDto
{
    @IsString()
    @MaxLength(100)
    @ApiProperty({
        description: 'Nombre de la categoría/asunto del proceso',
        example: 'Planificación patrimonial',
        required: true,
    })
    name: string;

    @IsString()
    @MaxLength(100)
    @IsOptional()
    @ApiProperty({
        description: 'Slug único de la categoría (se genera del nombre si se omite)',
        example: 'planificacion-patrimonial',
        required: false,
    })
    slug?: string;
}
