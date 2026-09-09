import {Client, ClientRegimeType, ClientType} from '../../../../generated/prisma/client';

interface ClientResponsiblePartner
{
    id: string;
    user: {firstName: string; lastName: string} | null;
}

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
    regimeType: ClientRegimeType | null;
    sector: string | null;
    isBusinessGroup: boolean;
    responsiblePartnerId: string | null;
    responsiblePartner?: ClientResponsiblePartner | null;
    createdBy: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
