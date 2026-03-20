import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsNotEmpty, IsOptional, IsString, MinLength} from 'class-validator';

export class RegisterDto
{
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Nombre del usuario',
        example: 'Juan',
        required: true
    })
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Apellido del usuario',
        example: 'Pérez',
        required: true
    })
    lastName: string;

    @IsEmail()
    @ApiProperty({
        description: 'Correo electrónico del usuario',
        example: 'juan@legaldocs.co',
        required: true
    })
    email: string;

    @IsString()
    @MinLength(8)
    @ApiProperty({
        description: 'Contraseña (mínimo 8 caracteres)',
        example: 'Password123!',
        required: true
    })
    password: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Número de teléfono del usuario',
        example: '+573001234567',
        required: false
    })
    phone?: string;
}
