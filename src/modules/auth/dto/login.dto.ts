import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsNotEmpty, IsString} from 'class-validator';

export class LoginDto
{
    @IsEmail()
    @ApiProperty({
        description: 'Correo electrónico registrado',
        example: 'juan@legaldocs.co',
        required: true
    })
    email: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Contraseña del usuario',
        example: 'Password123!',
        required: true
    })
    password: string;
}
