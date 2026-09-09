import {LegalProcess, ProcessBillingType, ProcessStatus} from '../../../../generated/prisma/client';

interface ProcessMemberRef
{
    id: string;
    user: {firstName: string; lastName: string} | null;
}

export class LegalProcessEntity implements LegalProcess
{
    id:           string;
    numId:        number;
    firmId:       string;
    clientId:     string;
    title:        string;
    description:  string | null;
    reference:    string | null;
    branchId:     string | null;
    status:       ProcessStatus;
    court:        string | null;
    counterpart:  string | null;
    startDate:    Date | null;
    endDate:      Date | null;
    assignedTo:   string | null;
    createdBy:    string;
    processValue: number | null;
    billingType:           ProcessBillingType | null;
    categoryId:             string | null;
    responsiblePartnerId:   string | null;
    originatorId:           string | null;
    billingResponsibleId:   string | null;
    isProBono:              boolean;
    hasPartialPayment:      boolean;
    category?:              {id: string; name: string; slug: string} | null;
    responsiblePartner?:    ProcessMemberRef | null;
    originator?:            ProcessMemberRef | null;
    billingResponsible?:    ProcessMemberRef | null;
    assignee?:              {id: string; firstName: string; lastName: string} | null;
    deletedAt:    Date | null;
    createdAt:    Date;
    updatedAt:    Date;

    // Subconjunto de Client (sin email/teléfono/dirección) embebido para que la
    // lista y la vista de un proceso muestren a qué cliente pertenece sin
    // requerir el permiso clients:view — el "need to know" acá es el cliente
    // DE ESTE proceso, no la lista completa de clientes de la firma.
    client?: {
        id:             string;
        type:           string;
        firstName:      string | null;
        lastName:       string | null;
        companyName:    string | null;
        documentType:   string | null;
        documentNumber: string | null;
    } | null;
}

export class LegalProcessWithEntriesEntity extends LegalProcessEntity
{
    valueEntries: {
        id: string;
        amount: number;
        description: string;
        createdBy: string;
        createdAt: Date;
    }[];
}
