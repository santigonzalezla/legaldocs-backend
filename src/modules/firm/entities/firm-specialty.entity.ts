import {FirmSpecialty} from '../../../../generated/prisma/client';

export class FirmSpecialtyEntity implements FirmSpecialty
{
    id: string;
    firmId: string;
    specialty: string;
}
