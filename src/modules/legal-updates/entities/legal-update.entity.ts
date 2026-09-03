import {LegalUpdate, LegalUpdateSource, LegalUpdateType} from '../../../../generated/prisma/client';

interface LegalUpdateBranch
{
    id:    string;
    name:  string;
    slug:  string;
    color: string | null;
    icon:  string | null;
}

export class LegalUpdateEntity implements LegalUpdate
{
    id: string;
    numId: number;
    source: LegalUpdateSource;
    sourceLabel: string;
    externalId: string;
    type: LegalUpdateType;
    title: string;
    summary: string | null;
    url: string;
    category: string | null;
    branchId: string | null;
    branch?: LegalUpdateBranch | null;
    publishedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
