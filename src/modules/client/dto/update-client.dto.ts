import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString} from 'class-validator';
import {ClientType} from '../../../../generated/prisma/client';

export class UpdateClientDto
{
    @IsEnum(ClientType)
    @IsOptional()
    @ApiProperty({description: 'Tipo de cliente', enum: ClientType, required: false})
    type?: ClientType;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @ApiProperty({description: 'Nombre (persona natural)', example: 'Juan', required: false})
    firstName?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @ApiProperty({description: 'Apellido (persona natural)', example: 'Pérez', required: false})
    lastName?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @ApiProperty({description: 'Razón social (persona jurídica)', example: 'Inversiones XYZ S.A.S.', required: false})
    companyName?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Tipo de documento (CC, NIT, CE, PP)', example: 'CC', required: false})
    documentType?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Número de documento', example: '1234567890', required: false})
    documentNumber?: string;

    @IsEmail()
    @IsOptional()
    @ApiProperty({description: 'Correo electrónico', example: 'cliente@email.com', required: false})
    email?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Teléfono de contacto', example: '+57 300 123 4567', required: false})
    phone?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Dirección', example: 'Cra 10 # 20-30', required: false})
    address?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({description: 'Ciudad', example: 'Bogotá', required: false})
    city?: string;
}
