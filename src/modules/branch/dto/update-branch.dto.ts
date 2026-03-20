import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min} from 'class-validator';

export class UpdateBranchDto
{
    @IsString()
    @MaxLength(100)
    @IsOptional()
    @ApiProperty({
        description: 'Nombre de la rama jurídica',
        example: 'Derecho Civil',
        required: false,
    })
    name?: string;

    @IsString()
    @MaxLength(100)
    @IsOptional()
    @ApiProperty({
        description: 'Slug único de la rama',
        example: 'derecho-civil',
        required: false,
    })
    slug?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Descripción de la rama jurídica',
        example: 'Contratos, testamentos, poderes y actos patrimoniales',
        required: false,
    })
    description?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Nombre del icono SVG asociado',
        example: 'scale',
        required: false,
    })
    icon?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Color representativo en hex',
        example: '#3b82f6',
        required: false,
    })
    color?: string;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Si la rama está activa',
        example: true,
        required: false,
    })
    isActive?: boolean;

    @IsInt()
    @Min(0)
    @IsOptional()
    @ApiProperty({
        description: 'Orden de aparición en la lista',
        example: 0,
        required: false,
        minimum: 0,
    })
    sortOrder?: number;
}
