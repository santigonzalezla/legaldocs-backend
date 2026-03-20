import {LegalBranch} from '../../../../generated/prisma/client';

export class LegalBranchEntity implements LegalBranch
{
    id: string;
    numId: number;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    isSystem: boolean;
    firmId: string | null;
    isActive: boolean;
    sortOrder: number;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
