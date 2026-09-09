import {ProcessDocument, ProcessDocumentType} from '../../../../generated/prisma/client';

export class ProcessDocumentEntity implements ProcessDocument
{
    id: string;
    numId: number;
    processId: string;
    uploadedBy: string;
    type: ProcessDocumentType;
    fileKey: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
