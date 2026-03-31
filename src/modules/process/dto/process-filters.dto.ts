import {ApiProperty} from '@nestjs/swagger';
import {Transform, Type} from 'class-transformer';
import {IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min} from 'class-validator';
import {ProcessStatus} from '../../../../generated/prisma/client';

export class ProcessFiltersDto
{
    @IsEnum(ProcessStatus)
    @IsOptional()
    @ApiProperty({description: 'Filtrar por estado del proceso', required: false, enum: ProcessStatus})
    status?: ProcessStatus;

    @IsUUID()
    @IsOptional()
    @ApiProperty({description: 'Filtrar por cliente', required: false})
    clientId?: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({description: 'Filtrar por rama jurídica', required: false})
    branchId?: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({description: 'Filtrar por miembro asignado', required: false})
    assignedTo?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Buscar por título o radicado', required: false})
    search?: string;

    @Transform(({value}) => value === 'true')
    @IsBoolean()
    @IsOptional()
    @ApiProperty({description: 'Mostrar procesos eliminados', required: false})
    inTrash?: boolean;

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
