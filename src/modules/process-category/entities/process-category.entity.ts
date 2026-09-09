import {ProcessCategory} from '../../../../generated/prisma/client';

export class ProcessCategoryEntity implements ProcessCategory
{
    id: string;
    numId: number;
    firmId: string | null;
    name: string;
    slug: string;
    isSystem: boolean;
    isActive: boolean;
    sortOrder: number;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
