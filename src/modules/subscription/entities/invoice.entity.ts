import {Invoice, InvoiceStatus, Prisma} from '../../../../generated/prisma/client';

export class InvoiceEntity implements Invoice
{
    id: string;
    numId: number;
    firmId: string;
    subscriptionId: string | null;
    invoiceNumber: string;
    amount: Prisma.Decimal;
    currency: string;
    status: InvoiceStatus;
    billingPeriodStart: Date | null;
    billingPeriodEnd: Date | null;
    dueDate: Date | null;
    paidAt: Date | null;
    pdfUrl: string | null;
    externalId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
