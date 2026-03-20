import {ApiProperty} from '@nestjs/swagger';
import {IsDateString, IsOptional, IsString, MaxLength} from 'class-validator';

export class UpdateProfileDto
{
    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Nombre del usuario',
        example: 'Juan',
        required: false
    })
    firstName?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Apellido del usuario',
        example: 'Pérez',
        required: false
    })
    lastName?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Número de teléfono',
        example: '+573001234567',
        required: false
    })
    phone?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Dirección de residencia',
        example: 'Cra 7 # 32-16',
        required: false
    })
    address?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Ciudad de residencia',
        example: 'Bogotá',
        required: false
    })
    city?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'País de residencia',
        example: 'Colombia',
        required: false
    })
    country?: string;

    @IsDateString()
    @IsOptional()
    @ApiProperty({
        description: 'Fecha de nacimiento (ISO 8601)',
        example: '1990-05-15',
        required: false
    })
    birthDate?: string;

    @IsString()
    @MaxLength(500)
    @IsOptional()
    @ApiProperty({
        description: 'Biografía o descripción breve del usuario',
        example: 'Abogado especialista en derecho civil con 10 años de experiencia.',
        required: false
    })
    bio?: string;
}
