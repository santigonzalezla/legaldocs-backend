import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString, MinLength} from 'class-validator';

export class ResetPasswordDto
{
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Token de recuperación recibido por correo',
        example: 'a3f8c2d1e4b5...',
        required: true
    })
    token: string;

    @IsString()
    @MinLength(8)
    @ApiProperty({
        description: 'Nueva contraseña (mínimo 8 caracteres)',
        example: 'NewPassword123!',
        required: true
    })
    newPassword: string;
}
