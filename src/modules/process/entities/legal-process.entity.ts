import {LegalProcess, ProcessStatus} from '../../../../generated/prisma/client';

export class LegalProcessEntity implements LegalProcess
{
    id:          string;
    numId:       number;
    firmId:      string;
    clientId:    string;
    title:       string;
    description: string | null;
    reference:   string | null;
    branchId:    string | null;
    status:      ProcessStatus;
    court:       string | null;
    counterpart: string | null;
    startDate:   Date | null;
    endDate:     Date | null;
    assignedTo:  string | null;
    createdBy:   string;
    deletedAt:   Date | null;
    createdAt:   Date;
    updatedAt:   Date;
}
