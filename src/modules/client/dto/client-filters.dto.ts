import {ApiProperty} from '@nestjs/swagger';
import {Transform, Type} from 'class-transformer';
import {IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min} from 'class-validator';
import {ClientType} from '../../../../generated/prisma/client';

export class ClientFiltersDto
{
    @IsEnum(ClientType)
    @IsOptional()
    @ApiProperty({description: 'Filtrar por tipo de cliente', required: false, enum: ClientType})
    type?: ClientType;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Buscar por nombre, empresa o documento', required: false})
    search?: string;

    @Transform(({value}) => value === 'true')
    @IsBoolean()
    @IsOptional()
    @ApiProperty({description: 'Mostrar clientes eliminados', required: false})
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
