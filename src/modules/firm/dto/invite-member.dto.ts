import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsEnum, IsNotEmpty} from 'class-validator';
import {FirmMemberRole} from '../../../../generated/prisma/client';

export class InviteMemberDto
{
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Correo electrónico del miembro a invitar',
        example: 'abogado@ejemplo.co',
        required: true,
    })
    email: string;

    @IsEnum(FirmMemberRole)
    @ApiProperty({
        description: 'Rol que tendrá el miembro invitado en el despacho',
        example: FirmMemberRole.LAWYER,
        enum: FirmMemberRole,
        required: true,
    })
    role: FirmMemberRole;
}
