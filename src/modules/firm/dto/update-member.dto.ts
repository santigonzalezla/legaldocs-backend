import {ApiProperty} from '@nestjs/swagger';
import {IsEnum, IsOptional, IsUUID} from 'class-validator';
import {FirmMemberStatus} from '../../../../generated/prisma/client';

export class UpdateMemberDto
{
    @IsUUID()
    @IsOptional()
    @ApiProperty({
        description: 'ID del nuevo FirmRole del miembro en el despacho',
        required: false,
    })
    firmRoleId?: string;

    @IsEnum(FirmMemberStatus)
    @IsOptional()
    @ApiProperty({
        description: 'Nuevo estado del miembro',
        example: FirmMemberStatus.ACTIVE,
        enum: FirmMemberStatus,
        required: false,
    })
    status?: FirmMemberStatus;
}
