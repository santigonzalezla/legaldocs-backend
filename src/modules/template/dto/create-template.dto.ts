import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean, IsOptional, IsString, IsUUID} from 'class-validator';

export class CreateTemplateDto
{
    @IsString()
    @ApiProperty({
        description: 'Tipo de documento (ej: rental-contract, right-request)',
        example: 'rental-contract',
        required: true,
    })
    documentType: string;

    @IsString()
    @ApiProperty({
        description: 'Título legible de la plantilla',
        example: 'Contrato de Arrendamiento para Vivienda',
        required: true,
    })
    title: string;

    @IsUUID()
    @ApiProperty({
        description: 'ID de la rama jurídica a la que pertenece',
        example: 'uuid-v4',
        required: true,
    })
    branchId: string;

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
}
