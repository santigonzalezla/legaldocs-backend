import {Document, DocumentStatus} from '../../../../generated/prisma/client';

export class DocumentEntity implements Document
{
    id: string;
    numId: number;
    title: string;
    templateId: string | null;
    documentType: string;
    branchId: string | null;
    formData: any;
    content: string | null;
    hasCustomContent: boolean;
    status: DocumentStatus;
    firmId: string;
    createdBy: string;
    deletedAt: Date | null;
    trashExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
