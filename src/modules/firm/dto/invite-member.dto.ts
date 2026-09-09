import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength} from 'class-validator';
import {Transform} from 'class-transformer';

export class InviteMemberDto
{
    @Transform(({value}) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Correo electrónico del miembro a invitar',
        example: 'abogado@ejemplo.co',
        required: true,
    })
    email: string;

    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({
        description: 'ID del FirmRole que tendrá el miembro invitado en el despacho',
        required: true,
    })
    firmRoleId: string;

    @Transform(({value}) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsOptional()
    @MaxLength(80)
    @ApiProperty({
        description: 'Nombre del miembro (opcional; si se omite se usa la parte local del correo)',
        example: 'Juan',
        required: false,
    })
    firstName?: string;

    @Transform(({value}) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsOptional()
    @MaxLength(80)
    @ApiProperty({
        description: 'Apellido del miembro (opcional)',
        example: 'Pérez',
        required: false,
    })
    lastName?: string;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Si el miembro invitado es socio/accionista de la firma',
        example: false,
        required: false,
    })
    isPartner?: boolean;
}
