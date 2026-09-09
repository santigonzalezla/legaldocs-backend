import {ApiProperty} from '@nestjs/swagger';
import {IsNumber, IsOptional, IsString, MaxLength, Min} from 'class-validator';

export class UpdateMemberProfileDto
{
    @IsString()
    @IsOptional()
    @MaxLength(80)
    @ApiProperty({
        description: 'Nombre del miembro',
        example: 'Juan',
        required: false,
    })
    firstName?: string;

    @IsString()
    @IsOptional()
    @MaxLength(80)
    @ApiProperty({
        description: 'Apellido del miembro',
        example: 'Pérez',
        required: false,
    })
    lastName?: string;

    @IsString()
    @IsOptional()
    @MaxLength(30)
    @ApiProperty({
        description: 'Número de teléfono',
        example: '+573001234567',
        required: false,
    })
    phone?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    @ApiProperty({
        description: 'Tarifa por hora en pesos colombianos',
        example: 150000,
        required: false,
    })
    hourlyRate?: number | null;
}
