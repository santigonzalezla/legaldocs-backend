import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min} from 'class-validator';

export class UpdateProcessCategoryDto
{
    @IsString()
    @MaxLength(100)
    @IsOptional()
    @ApiProperty({description: 'Nombre de la categoría/asunto del proceso', required: false})
    name?: string;

    @IsString()
    @MaxLength(100)
    @IsOptional()
    @ApiProperty({description: 'Slug único de la categoría', required: false})
    slug?: string;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({description: 'Si la categoría está activa', required: false})
    isActive?: boolean;

    @IsInt()
    @Min(0)
    @IsOptional()
    @ApiProperty({description: 'Orden de aparición en la lista', required: false, minimum: 0})
    sortOrder?: number;
}
