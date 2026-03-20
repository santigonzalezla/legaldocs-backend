import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID} from 'class-validator';
import {DocumentStatus} from '../../../../generated/prisma/client';

export class UpdateDocumentDto
{
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @ApiProperty({
        description: 'Título del documento',
        example: 'Contrato de Arrendamiento - Apto 301',
        required: false,
    })
    title?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @ApiProperty({
        description: 'Tipo de documento (ej: rental-contract, right-request)',
        example: 'rental-contract',
        required: false,
    })
    documentType?: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({
        description: 'ID de la plantilla base usada para generar el documento',
        example: 'uuid-v4',
        required: false,
    })
    templateId?: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({
        description: 'ID de la rama jurídica (civil, laboral, etc.)',
        example: 'uuid-v4',
        required: false,
    })
    branchId?: string;

    @IsOptional()
    @ApiProperty({
        description: 'Datos del formulario en formato JSON',
        example: '{}',
        required: false,
    })
    formData?: any;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Contenido HTML del documento generado',
        example: '<h1>Contrato...</h1>',
        required: false,
    })
    content?: string;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Indica si el usuario editó manualmente el contenido',
        example: false,
        required: false,
    })
    hasCustomContent?: boolean;

    @IsEnum(DocumentStatus)
    @IsOptional()
    @ApiProperty({
        description: 'Estado del documento',
        example: DocumentStatus.COMPLETED,
        required: false,
        enum: DocumentStatus,
    })
    status?: DocumentStatus;
}
