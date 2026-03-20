import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean, IsOptional, IsString, IsUUID} from 'class-validator';

export class UpdateTemplateDto
{
    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Título legible de la plantilla',
        example: 'Contrato de Arrendamiento para Vivienda',
        required: false,
    })
    title?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Tipo de documento (ej: rental-contract)',
        example: 'rental-contract',
        required: false,
    })
    documentType?: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({
        description: 'ID de la rama jurídica a la que pertenece',
        example: 'uuid-v4',
        required: false,
    })
    branchId?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Subcategoría del documento',
        example: 'Arrendamiento de vivienda urbana',
        required: false,
    })
    subcategory?: string;

    @IsOptional()
    @ApiProperty({
        description: 'Lista de regulaciones aplicables',
        example: ['Ley 820 de 2003', 'Código Civil Colombiano'],
        required: false,
    })
    applicableRegulations?: any;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Si el documento requiere registro notarial',
        example: false,
        required: false,
    })
    requiresRegistration?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Si el documento tiene validez legal',
        example: true,
        required: false,
    })
    legalValidity?: boolean;

    @IsOptional()
    @ApiProperty({
        description: 'Esquema JSON de campos variables del formulario',
        example: '{}',
        required: false,
    })
    variableFields?: any;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Texto base del documento con placeholders',
        example: 'Entre {{arrendador}} y {{arrendatario}}...',
        required: false,
    })
    textTemplate?: string;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Si la plantilla está activa',
        example: true,
        required: false,
    })
    isActive?: boolean;
}
