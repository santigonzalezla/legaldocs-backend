import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {IsBoolean, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID} from 'class-validator';
import {ProcessBillingType, ProcessStatus} from '../../../../generated/prisma/client';

export class CreateProcessDto
{
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({description: 'ID del cliente asociado al proceso', example: 'uuid-v4'})
    clientId: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({description: 'Título o nombre del proceso', example: 'Proceso arrendamiento Apto 301'})
    title: string;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Descripción detallada del proceso', required: false})
    description?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Número de radicado o referencia externa', example: '11001310300120230012300', required: false})
    reference?: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({description: 'ID de la rama jurídica (civil, laboral, etc.)', example: 'uuid-v4', required: false})
    branchId?: string;

    @IsEnum(ProcessStatus)
    @IsOptional()
    @ApiProperty({description: 'Estado del proceso', enum: ProcessStatus, required: false})
    status?: ProcessStatus;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Juzgado o entidad donde cursa el proceso', example: 'Juzgado 12 Civil del Circuito de Bogotá', required: false})
    court?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Contraparte en el proceso', example: 'Banco XYZ S.A.', required: false})
    counterpart?: string;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    @ApiProperty({description: 'Fecha de inicio del proceso', example: '2024-01-15', required: false})
    startDate?: Date;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    @ApiProperty({description: 'Fecha de cierre o vencimiento del proceso', example: '2025-01-15', required: false})
    endDate?: Date;

    @IsUUID()
    @IsOptional()
    @ApiProperty({description: 'ID del miembro del equipo asignado', example: 'uuid-v4', required: false})
    assignedTo?: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    @ApiProperty({description: 'Valor inicial pactado del proceso en COP', example: 10000000, required: false})
    processValue?: number;

    @IsEnum(ProcessBillingType)
    @IsOptional()
    @ApiProperty({description: 'Modalidad de cobro del proceso', enum: ProcessBillingType, required: false})
    billingType?: ProcessBillingType;

    @IsUUID()
    @IsOptional()
    @ApiProperty({description: 'ID de la categoría/asunto del proceso (reutilizable entre procesos)', required: false})
    categoryId?: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({description: 'ID del socio responsable del proceso', required: false})
    responsiblePartnerId?: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({description: 'ID del miembro que originó el proceso', required: false})
    originatorId?: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({description: 'ID del miembro responsable de la facturación', required: false})
    billingResponsibleId?: string;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({description: 'Si el proceso es pro bono', required: false})
    isProBono?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({description: 'Si ya se realizó un cobro parcial del proceso', required: false})
    hasPartialPayment?: boolean;
}
