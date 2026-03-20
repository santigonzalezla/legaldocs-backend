import {ApiProperty} from '@nestjs/swagger';
import {IsEnum, IsOptional} from 'class-validator';
import {FirmMemberRole, FirmMemberStatus} from '../../../../generated/prisma/client';

export class UpdateMemberDto
{
    @IsEnum(FirmMemberRole)
    @IsOptional()
    @ApiProperty({
        description: 'Nuevo rol del miembro en el despacho',
        example: FirmMemberRole.ADMIN,
        enum: FirmMemberRole,
        required: false,
    })
    role?: FirmMemberRole;

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
