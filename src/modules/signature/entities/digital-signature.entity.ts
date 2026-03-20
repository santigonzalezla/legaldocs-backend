import {DigitalSignature, SignatureType} from '../../../../generated/prisma/client';

export class DigitalSignatureEntity implements DigitalSignature
{
    id: string;
    userId: string;
    name: string;
    type: SignatureType;
    content: string;
    font: string | null;
    cloudPublicId: string | null;
    isDefault: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
