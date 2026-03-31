import {Client, ClientType} from '../../../../generated/prisma/client';

export class ClientEntity implements Client
{
    id: string;
    numId: number;
    firmId: string;
    type: ClientType;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    documentType: string | null;
    documentNumber: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    createdBy: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
