import {NotificationPreferences} from '../../../../generated/prisma/client';

export class NotificationPreferencesEntity implements NotificationPreferences
{
    id: string;
    userId: string;
    emailNewDocument: boolean;
    emailDocumentShared: boolean;
    emailTemplateUpdated: boolean;
    emailTeamInvite: boolean;
    emailBilling: boolean;
    emailLegalUpdates: boolean;
    inAppNewDocument: boolean;
    inAppDocumentShared: boolean;
    inAppTeamActivity: boolean;
    inAppBilling: boolean;
    createdAt: Date;
    updatedAt: Date;
}
