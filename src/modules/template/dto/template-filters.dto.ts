import {ApiProperty} from '@nestjs/swagger';
import {Transform, Type} from 'class-transformer';
import {IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min} from 'class-validator';
import {TemplateOrigin} from '../../../../generated/prisma/client';

export class TemplateFiltersDto
{
    @IsUUID()
    @IsOptional()
    @ApiProperty({description: 'Filtrar por rama jurídica', required: false})
    branchId?: string;

    @IsEnum(TemplateOrigin)
    @IsOptional()
    @ApiProperty({description: 'Filtrar por origen de la plantilla', required: false, enum: TemplateOrigin})
    origin?: TemplateOrigin;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Filtrar por tipo de documento', required: false})
    documentType?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Buscar por título de la plantilla', required: false})
    search?: string;

    @Transform(({value}) => value === 'true')
    @IsBoolean()
    @IsOptional()
    @ApiProperty({description: 'Filtrar solo plantillas activas', required: false})
    isActive?: boolean;

    @IsInt()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    @ApiProperty({description: 'Número de página', required: false, minimum: 1})
    page?: number;

    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    @Type(() => Number)
    @ApiProperty({description: 'Cantidad de resultados por página', required: false, minimum: 1, maximum: 100})
    limit?: number;
}
