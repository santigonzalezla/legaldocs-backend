import {Injectable} from '@nestjs/common';
import {PrismaService} from '../../prisma/prisma.service';
import {FirmMemberStatus, FirmRole} from '../../../../generated/prisma/client';

// Resuelve el FirmRole efectivo de un usuario para una firma (o, si no se
// especifica firmId, para la firma que posee o su primera membresía activa).
// Compartido entre PermissionsGuard y PermissionsService para no duplicar
// el criterio de resolución en dos lugares.
@Injectable()
export class FirmRoleResolverService
{
    constructor(private readonly prisma: PrismaService) {}

    async resolve(userId: string, firmId?: string): Promise<FirmRole | null>
    {
        if (firmId)
        {
            const firm = await this.prisma.firm.findFirst({where: {id: firmId, deletedAt: null}});
            if (!firm) return null;

            if (firm.createdBy === userId)
                return this.prisma.firmRole.findFirst({where: {firmId, slug: 'admin'}});

            const membership = await this.prisma.firmMember.findFirst({
                where:   {firmId, userId, status: FirmMemberStatus.ACTIVE},
                include: {firmRole: true},
            });

            return membership?.firmRole ?? null;
        }

        const ownedFirm = await this.prisma.firm.findFirst({where: {createdBy: userId, deletedAt: null}});

        if (ownedFirm)
            return this.prisma.firmRole.findFirst({where: {firmId: ownedFirm.id, slug: 'admin'}});

        const membership = await this.prisma.firmMember.findFirst({
            where:   {userId, status: FirmMemberStatus.ACTIVE},
            orderBy: {joinedAt: 'asc'},
            include: {firmRole: true},
        });

        return membership?.firmRole ?? null;
    }
}
