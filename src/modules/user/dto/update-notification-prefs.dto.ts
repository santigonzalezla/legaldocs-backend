import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean, IsOptional} from 'class-validator';

export class UpdateNotificationPrefsDto
{
    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Notificación por email al crear un nuevo documento',
        example: true,
        required: false
    })
    emailNewDocument?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Notificación por email cuando comparten un documento contigo',
        example: true,
        required: false
    })
    emailDocumentShared?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Notificación por email cuando se actualiza una plantilla',
        example: true,
        required: false
    })
    emailTemplateUpdated?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Notificación por email al recibir invitación al equipo',
        example: true,
        required: false
    })
    emailTeamInvite?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Notificación por email sobre facturación y suscripción',
        example: true,
        required: false
    })
    emailBilling?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Notificación por email sobre actualizaciones normativas',
        example: false,
        required: false
    })
    emailLegalUpdates?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Notificación en app al crear un nuevo documento',
        example: true,
        required: false
    })
    inAppNewDocument?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Notificación en app cuando comparten un documento contigo',
        example: true,
        required: false
    })
    inAppDocumentShared?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Notificación en app sobre actividad del equipo',
        example: true,
        required: false
    })
    inAppTeamActivity?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Notificación en app sobre facturación y suscripción',
        example: true,
        required: false
    })
    inAppBilling?: boolean;
}
