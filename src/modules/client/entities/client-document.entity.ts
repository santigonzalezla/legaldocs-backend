import {ClientDocument, ClientDocumentType} from '../../../../generated/prisma/client';

export class ClientDocumentEntity implements ClientDocument
{
    id: string;
    numId: number;
    clientId: string;
    uploadedBy: string;
    type: ClientDocumentType;
    fileKey: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
