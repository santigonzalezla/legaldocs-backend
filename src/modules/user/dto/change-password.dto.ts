import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString, MinLength} from 'class-validator';

export class ChangePasswordDto
{
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Contraseña actual del usuario',
        example: 'Password123!',
        required: true
    })
    currentPassword: string;

    @IsString()
    @MinLength(8)
    @ApiProperty({
        description: 'Nueva contraseña (mínimo 8 caracteres)',
        example: 'NewPassword456!',
        required: true
    })
    newPassword: string;
}
