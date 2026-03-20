import {Firm} from '../../../../generated/prisma/client';

export class FirmEntity implements Firm
{
    id: string;
    numId: number;
    name: string;
    legalName: string | null;
    nit: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    description: string | null;
    logoUrl: string | null;
    cloudPublicId: string | null;
    createdBy: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
