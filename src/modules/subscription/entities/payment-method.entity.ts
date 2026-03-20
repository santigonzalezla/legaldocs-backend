import {PaymentMethod, PaymentMethodType} from '../../../../generated/prisma/client';

export class PaymentMethodEntity implements PaymentMethod
{
    id: string;
    firmId: string;
    type: PaymentMethodType;
    lastFour: string | null;
    brand: string | null;
    holderName: string | null;
    expiryMonth: number | null;
    expiryYear: number | null;
    isDefault: boolean;
    externalId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
