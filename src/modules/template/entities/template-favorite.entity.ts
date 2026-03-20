import {TemplateFavorite} from '../../../../generated/prisma/client';

export class TemplateFavoriteEntity implements TemplateFavorite
{
    id: string;
    templateId: string;
    userId: string;
    createdAt: Date;
}
