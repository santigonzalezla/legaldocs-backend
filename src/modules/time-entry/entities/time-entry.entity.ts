import {TimeEntry, TimeEntryType} from '../../../../generated/prisma/client';

export class TimeEntryEntity implements TimeEntry
{
    id:              string;
    numId:           number;
    processId:       string;
    userId:          string;
    firmId:          string;
    type:            TimeEntryType;
    description:     string | null;
    startedAt:       Date;
    endedAt:         Date | null;
    durationMinutes: number | null;
    createdAt:       Date;
    updatedAt:       Date;
}

export class TimeEntryWithUserEntity extends TimeEntryEntity
{
    user: {firstName: string; lastName: string; hourlyRate: number | null};
}
