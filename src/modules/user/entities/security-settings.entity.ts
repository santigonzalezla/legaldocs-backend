import {SecuritySettings} from '../../../../generated/prisma/client';

export class SecuritySettingsEntity implements SecuritySettings
{
    id: string;
    userId: string;
    twoFactorEnabled: boolean;
    twoFactorMethod: string;
    twoFactorSecret: string | null;
    sessionTimeoutMins: number;
    loginNotifications: boolean;
    createdAt: Date;
    updatedAt: Date;
}
