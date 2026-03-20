import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {PrismaService} from '../../prisma/prisma.service';
import {LoggedUser} from '../../../interfaces/LoggedUser';
import {FirmMemberRole, FirmMemberStatus} from '../../../../generated/prisma/client';
import {ROLES_KEY} from '../decorators/roles.decorator';

const ROLE_HIERARCHY = [
    FirmMemberRole.ADMIN,
    FirmMemberRole.LAWYER,
    FirmMemberRole.ASSISTANT,
    FirmMemberRole.INTERN,
];

@Injectable()
export class RolesGuard implements CanActivate
{
    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean>
    {
        const requiredRoles = this.reflector.getAllAndOverride<FirmMemberRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) return true;

        const request  = context.switchToHttp().getRequest();
        const user     = request.user as LoggedUser;
        const firmId   = request.headers['x-firm-id'] as string | undefined;
        const userRole = await this.getUserRole(user.userId, firmId);

        if (!userRole)
            throw new ForbiddenException('No tienes acceso a esta firma');

        const hasRole = requiredRoles.some(required => this.satisfiesRole(userRole, required));

        if (!hasRole)
            throw new ForbiddenException('No tienes permisos suficientes para esta acción');

        return true;
    }

    private async getUserRole(userId: string, firmId?: string): Promise<FirmMemberRole | null>
    {
        if (firmId)
        {
            const firm = await this.prisma.firm.findFirst({
                where: {id: firmId, deletedAt: null},
            });

            if (!firm) return null;

            if (firm.createdBy === userId) return FirmMemberRole.ADMIN;

            const membership = await this.prisma.firmMember.findFirst({
                where: {firmId, userId, status: FirmMemberStatus.ACTIVE},
            });

            return membership?.role ?? null;
        }

        const ownedFirm = await this.prisma.firm.findFirst({
            where: {createdBy: userId, deletedAt: null},
        });

        if (ownedFirm) return FirmMemberRole.ADMIN;

        const membership = await this.prisma.firmMember.findFirst({
            where: {userId, status: FirmMemberStatus.ACTIVE},
            orderBy: {joinedAt: 'asc'},
        });

        return membership?.role ?? null;
    }

    private satisfiesRole(userRole: FirmMemberRole, required: FirmMemberRole): boolean
    {
        return ROLE_HIERARCHY.indexOf(userRole) <= ROLE_HIERARCHY.indexOf(required);
    }
}
