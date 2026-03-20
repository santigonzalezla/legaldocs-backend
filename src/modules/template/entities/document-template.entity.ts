import {DocumentTemplate, TemplateOrigin} from '../../../../generated/prisma/client';

export class DocumentTemplateEntity implements DocumentTemplate
{
    id: string;
    numId: number;
    documentType: string;
    version: string;
    title: string;
    branchId: string;
    subcategory: string | null;
    applicableRegulations: any;
    requiresRegistration: boolean;
    legalValidity: boolean;
    variableFields: any;
    textTemplate: string | null;
    origin: TemplateOrigin;
    parentTemplateId: string | null;
    firmId: string | null;
    createdBy: string | null;
    isActive: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
