import {FirmMember, FirmMemberRole, FirmMemberStatus} from '../../../../generated/prisma/client';

export class FirmMemberEntity implements FirmMember
{
    id: string;
    firmId: string;
    userId: string | null;
    role: FirmMemberRole;
    status: FirmMemberStatus;
    inviteEmail: string | null;
    inviteToken: string | null;
    inviteExpiresAt: Date | null;
    joinedAt: Date | null;
    lastActiveAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
