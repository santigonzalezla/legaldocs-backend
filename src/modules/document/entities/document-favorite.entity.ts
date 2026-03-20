import {DocumentFavorite} from '../../../../generated/prisma/client';

export class DocumentFavoriteEntity implements DocumentFavorite
{
    id: string;
    documentId: string;
    userId: string;
    createdAt: Date;
}
