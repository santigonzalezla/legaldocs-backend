import {LegalProcess, ProcessStatus} from '../../../../generated/prisma/client';

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
    deletedAt:    Date | null;
    createdAt:    Date;
    updatedAt:    Date;
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

    // Subconjunto de Client (sin email/teléfono/dirección) embebido para que la
    // vista de un proceso muestre a qué cliente pertenece sin requerir el
    // permiso clients:view — el "need to know" acá es el cliente DE ESTE
    // proceso, no la lista completa de clientes de la firma.
    client: {
        id:             string;
        type:           string;
        firstName:      string | null;
        lastName:       string | null;
        companyName:    string | null;
        documentType:   string | null;
        documentNumber: string | null;
    } | null;
}
