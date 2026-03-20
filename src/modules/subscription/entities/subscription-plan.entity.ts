import {Prisma, SubscriptionPlan} from '../../../../generated/prisma/client';

export class SubscriptionPlanEntity implements SubscriptionPlan
{
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    priceMonthly: Prisma.Decimal | null;
    priceAnnually: Prisma.Decimal | null;
    maxDocuments: number | null;
    maxUsers: number | null;
    maxTemplates: number | null;
    features: any;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
