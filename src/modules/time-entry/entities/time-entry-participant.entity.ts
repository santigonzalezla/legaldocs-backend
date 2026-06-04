import {TimeEntryParticipant} from '../../../../generated/prisma/client';

export class TimeEntryParticipantEntity implements TimeEntryParticipant
{
    id:          string;
    timeEntryId: string;
    userId:      string;
    firmId:      string;
    createdAt:   Date;
}
