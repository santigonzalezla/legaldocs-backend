import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID} from 'class-validator';
import {ProcessStatus} from '../../../../generated/prisma/client';

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
}
