import {FirmMember, FirmMemberRole, FirmMemberStatus, FirmRole} from '../../../../generated/prisma/client';
import {UserEntity} from '../../user/entities/user.entity';

export class FirmMemberEntity implements FirmMember
{
    id: string;
    firmId: string;
    userId: string | null;
    role: FirmMemberRole;
    firmRoleId: string | null;
    status: FirmMemberStatus;
    isPartner: boolean;
    inviteEmail: string | null;
    inviteToken: string | null;
    inviteExpiresAt: Date | null;
    joinedAt: Date | null;
    lastActiveAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    firmRole?: Partial<FirmRole> | null;
    user?: Partial<UserEntity> | null;
}
