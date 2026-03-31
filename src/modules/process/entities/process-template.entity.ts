import {ProcessTemplate} from '../../../../generated/prisma/client';

export class ProcessTemplateEntity implements ProcessTemplate
{
    id:         string;
    processId:  string;
    templateId: string;
    sortOrder:  number;
    isRequired: boolean;
    createdAt:  Date;
}
