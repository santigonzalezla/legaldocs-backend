import {Injectable} from '@nestjs/common';
import {PrismaService} from '../../prisma/prisma.service';

// Cache en memoria (Map por firmRoleId) — suficiente para una sola instancia de backend.
// Si el backend llega a escalar horizontalmente, revisar antes de agregar réplicas
// (TTL corto o invalidación vía pub/sub en vez de este Map local).
@Injectable()
export class RolePermissionCacheService
{
    private readonly cache = new Map<string, Set<string>>();

    constructor(private readonly prisma: PrismaService) {}

    async getPermissionKeys(firmRoleId: string): Promise<Set<string>>
    {
        const cached = this.cache.get(firmRoleId);
        if (cached) return cached;

        const rolePermissions = await this.prisma.rolePermission.findMany({
            where:   {firmRoleId},
            include: {permission: {select: {key: true}}},
        });

        const keys = new Set(rolePermissions.map(rolePermission => rolePermission.permission.key));
        this.cache.set(firmRoleId, keys);

        return keys;
    }

    invalidate(firmRoleId: string): void
    {
        this.cache.delete(firmRoleId);
    }

    invalidateAll(): void
    {
        this.cache.clear();
    }
}
