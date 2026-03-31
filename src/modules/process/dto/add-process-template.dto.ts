import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean, IsInt, IsNotEmpty, IsOptional, IsUUID, Min} from 'class-validator';

export class AddProcessTemplateDto
{
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({description: 'ID de la plantilla a asociar al proceso', example: 'uuid-v4'})
    templateId: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    @ApiProperty({description: 'Orden de generación dentro del proceso', example: 0, required: false})
    sortOrder?: number;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({description: 'Indica si la plantilla es obligatoria para el proceso', example: false, required: false})
    isRequired?: boolean;
}
