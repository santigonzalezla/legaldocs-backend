import {ApiProperty} from '@nestjs/swagger';
import {Transform} from 'class-transformer';
import {IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min} from 'class-validator';
import {LegalUpdateSource, LegalUpdateType} from '../../../../generated/prisma/client';

export class LegalUpdateFiltersDto
{
    @IsInt()
    @Min(1)
    @IsOptional()
    @Transform(({value}) => value ? parseInt(value, 10) : undefined)
    @ApiProperty({description: 'Página', required: false, default: 1})
    page?: number;

    @IsInt()
    @Min(1)
    @Max(50)
    @IsOptional()
    @Transform(({value}) => value ? parseInt(value, 10) : undefined)
    @ApiProperty({description: 'Resultados por página', required: false, default: 20})
    limit?: number;

    @IsEnum(LegalUpdateSource)
    @IsOptional()
    @ApiProperty({description: 'Filtrar por fuente', required: false, enum: LegalUpdateSource})
    source?: LegalUpdateSource;

    @IsEnum(LegalUpdateType)
    @IsOptional()
    @ApiProperty({description: 'Filtrar por tipo de entrada', required: false, enum: LegalUpdateType})
    type?: LegalUpdateType;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Búsqueda en título y resumen', required: false})
    search?: string;

    @IsDateString()
    @IsOptional()
    @ApiProperty({description: 'Solo actualizaciones publicadas después de esta fecha ISO', required: false})
    since?: string;
}
