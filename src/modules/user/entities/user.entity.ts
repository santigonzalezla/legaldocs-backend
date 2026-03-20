import {User} from '../../../../generated/prisma/client';

export class UserEntity implements User
{
    id: string;
    numId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    birthDate: Date | null;
    bio: string | null;
    avatarUrl: string | null;
    cloudPublicId: string | null;
    lastLoginAt: Date | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
