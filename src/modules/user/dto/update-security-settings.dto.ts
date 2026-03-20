import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min} from 'class-validator';

export class UpdateSecuritySettingsDto
{
    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Activar autenticación de dos factores',
        example: false,
        required: false
    })
    twoFactorEnabled?: boolean;

    @IsString()
    @IsIn(['email', 'app'])
    @IsOptional()
    @ApiProperty({
        description: 'Método de autenticación de dos factores',
        example: 'email',
        enum: ['email', 'app'],
        required: false
    })
    twoFactorMethod?: string;

    @IsInt()
    @Min(15)
    @Max(1440)
    @IsOptional()
    @ApiProperty({
        description: 'Tiempo de inactividad antes de cerrar sesión automáticamente (en minutos)',
        example: 480,
        minimum: 15,
        maximum: 1440,
        required: false
    })
    sessionTimeoutMins?: number;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Recibir notificación al detectar un nuevo inicio de sesión',
        example: true,
        required: false
    })
    loginNotifications?: boolean;
}
