import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {IsBoolean, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID} from 'class-validator';
import {ProcessBillingType, ProcessStatus} from '../../../../generated/prisma/client';

export class UpdateProcessDto
{
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @ApiProperty({description: 'Título o nombre del proceso', example: 'Proceso arrendamiento Apto 301', required: false})
    title?: string;

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
    @ApiProperty({description: 'ID de la rama jurídica', example: 'uuid-v4', required: false})
    branchId?: string;

    @IsEnum(ProcessStatus)
    @IsOptional()
    @ApiProperty({description: 'Estado del proceso', enum: ProcessStatus, required: false})
    status?: ProcessStatus;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Juzgado o entidad donde cursa el proceso', required: false})
    court?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Contraparte en el proceso', required: false})
    counterpart?: string;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    @ApiProperty({description: 'Fecha de inicio del proceso', required: false})
    startDate?: Date;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    @ApiProperty({description: 'Fecha de cierre o vencimiento del proceso', required: false})
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
    @ApiProperty({description: 'ID de la categoría/asunto del proceso', required: false})
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
