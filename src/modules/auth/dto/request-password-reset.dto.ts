import {ApiProperty} from '@nestjs/swagger';
import {IsEmail} from 'class-validator';

export class RequestPasswordResetDto
{
    @IsEmail()
    @ApiProperty({
        description: 'Correo electrónico asociado a la cuenta',
        example: 'juan@legaldocs.co',
        required: true
    })
    email: string;
}
