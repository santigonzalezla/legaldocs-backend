import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean, IsJSON, IsNotEmpty, IsOptional, IsString, IsUUID} from 'class-validator';

export class CreateDocumentDto
{
    @ApiProperty({description: 'Título del documento', example: 'Contrato de Arrendamiento - Apto 301', required: true})
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({description: 'Tipo de documento (ej: rental-contract, right-request)', example: 'rental-contract', required: true})
    @IsString()
    @IsNotEmpty()
    documentType: string;

    @ApiProperty({description: 'ID de la plantilla base usada para generar el documento', example: 'uuid-v4', required: false})
    @IsUUID()
    @IsOptional()
    templateId?: string;

    @ApiProperty({description: 'ID de la rama jurídica (civil, laboral, etc.)', example: 'uuid-v4', required: false})
    @IsUUID()
    @IsOptional()
    branchId?: string;

    @ApiProperty({description: 'Datos del formulario en formato JSON', example: '{}', required: false})
    @IsOptional()
    formData?: any;

    @ApiProperty({description: 'Contenido HTML del documento generado', example: '<h1>Contrato...</h1>', required: false})
    @IsString()
    @IsOptional()
    content?: string;

    @ApiProperty({description: 'Indica si el usuario editó manualmente el contenido', example: false, required: false})
    @IsBoolean()
    @IsOptional()
    hasCustomContent?: boolean;

    @ApiProperty({description: 'ID del proceso legal asociado', example: 'uuid-v4', required: false})
    @IsUUID()
    @IsOptional()
    processId?: string;
}
