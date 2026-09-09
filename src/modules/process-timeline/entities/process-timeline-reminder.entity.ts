import {ProcessTimelineReminder, ReminderChannel, ReminderStatus} from '../../../../generated/prisma/client';

export class ProcessTimelineReminderEntity implements ProcessTimelineReminder
{
    id:             string;
    numId:          number;
    commentId:      string;
    processId:      string;
    channel:        ReminderChannel;
    offsetMinutes:  number;
    remindAt:       Date;
    recipientEmail: string;
    status:         ReminderStatus;
    sentAt:         Date | null;
    lastError:      string | null;
    createdBy:      string;
    deletedAt:      Date | null;
    createdAt:      Date;
    updatedAt:      Date;
}
