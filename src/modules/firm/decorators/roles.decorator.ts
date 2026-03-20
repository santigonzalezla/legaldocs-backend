import {SetMetadata} from '@nestjs/common';
import {FirmMemberRole} from '../../../../generated/prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: FirmMemberRole[]) => SetMetadata(ROLES_KEY, roles);
