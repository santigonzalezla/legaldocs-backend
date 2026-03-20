import {ApiProperty} from '@nestjs/swagger';
import {Transform, Type} from 'class-transformer';
import {IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min} from 'class-validator';
import {DocumentStatus} from '../../../../generated/prisma/client';

export class DocumentFiltersDto
{
    @IsEnum(DocumentStatus)
    @IsOptional()
    @ApiProperty({description: 'Filtrar por estado del documento', required: false, enum: DocumentStatus})
    status?: DocumentStatus;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Buscar por título del documento', required: false})
    search?: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({description: 'Filtrar por rama jurídica', required: false})
    branchId?: string;

    @Transform(({value}) => value === 'true')
    @IsBoolean()
    @IsOptional()
    @ApiProperty({description: 'Mostrar documentos en la papelera', required: false})
    inTrash?: boolean;

    @Transform(({value}) => value === 'true')
    @IsBoolean()
    @IsOptional()
    @ApiProperty({description: 'Filtrar solo documentos marcados como favoritos', required: false})
    isFavorite?: boolean;

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
