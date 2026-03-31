import {ApiProperty} from '@nestjs/swagger';
import {Transform} from 'class-transformer';
import {IsBoolean, IsInt, IsOptional, IsString, Max, Min} from 'class-validator';

export class BranchFiltersDto
{
    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Filtrar por slug exacto', required: false})
    slug?: string;

    @IsBoolean()
    @IsOptional()
    @Transform(({value}) => value === 'true' ? true : value === 'false' ? false : undefined)
    @ApiProperty({description: 'Filtrar por estado activo', required: false})
    isActive?: boolean;

    @IsInt()
    @Min(1)
    @Max(200)
    @IsOptional()
    @Transform(({value}) => value ? parseInt(value, 10) : undefined)
    @ApiProperty({description: 'Límite de resultados', required: false, default: 50})
    limit?: number;
}
