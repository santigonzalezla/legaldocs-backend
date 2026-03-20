import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsOptional, IsString, IsUrl, MaxLength} from 'class-validator';

export class UpdateFirmDto
{
    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Nombre comercial del despacho',
        example: 'Pérez & Asociados',
        required: false,
    })
    name?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Razón social (nombre legal completo)',
        example: 'Pérez & Asociados S.A.S.',
        required: false,
    })
    legalName?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'NIT del despacho',
        example: '900123456-7',
        required: false,
    })
    nit?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Dirección física del despacho',
        example: 'Cra 7 # 32-16, Oficina 501',
        required: false,
    })
    address?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Ciudad donde se ubica el despacho',
        example: 'Bogotá',
        required: false,
    })
    city?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'País del despacho',
        example: 'Colombia',
        required: false,
    })
    country?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Teléfono de contacto del despacho',
        example: '+573001234567',
        required: false,
    })
    phone?: string;

    @IsEmail()
    @IsOptional()
    @ApiProperty({
        description: 'Correo electrónico institucional del despacho',
        example: 'contacto@perezasociados.co',
        required: false,
    })
    email?: string;

    @IsUrl()
    @IsOptional()
    @ApiProperty({
        description: 'Sitio web del despacho',
        example: 'https://www.perezasociados.co',
        required: false,
    })
    website?: string;

    @IsString()
    @MaxLength(500)
    @IsOptional()
    @ApiProperty({
        description: 'Descripción o presentación breve del despacho',
        example: 'Firma de abogados especializada en derecho civil y comercial con más de 15 años de experiencia.',
        required: false,
    })
    description?: string;
}
