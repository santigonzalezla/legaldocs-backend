import {ProcessValueEntry} from '../../../../generated/prisma/client';

export class ProcessValueEntryEntity implements ProcessValueEntry
{
    id:          string;
    processId:   string;
    firmId:      string;
    amount:      number;
    description: string;
    createdBy:   string;
    deletedAt:   Date | null;
    createdAt:   Date;
    updatedAt:   Date;
}
