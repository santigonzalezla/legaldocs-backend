import {BillingCycle, Subscription, SubscriptionStatus} from '../../../../generated/prisma/client';

export class SubscriptionEntity implements Subscription
{
    id: string;
    firmId: string;
    planId: string;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    startDate: Date;
    endDate: Date | null;
    trialEndsAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
