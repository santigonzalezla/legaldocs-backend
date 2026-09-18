import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {IsDate, IsOptional, IsString, IsUUID} from 'class-validator';

export class UpdateProcessCaseDetailsDto
{
    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Número de radicado o referencia externa', example: '11001310300120230012300', required: false})
    reference?: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({description: 'ID de la rama jurídica', example: 'uuid-v4', required: false})
    branchId?: string;

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
}
