import {
    BadRequestException,
    ConflictException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {RolePermissionCacheService} from './services/role-permission-cache.service';
import {FirmRoleResolverService} from './services/firm-role-resolver.service';
import {CreateFirmRoleDto} from './dto/create-firm-role.dto';
import {UpdateFirmRoleDto} from './dto/update-firm-role.dto';
import {AssignPermissionsDto} from './dto/assign-permissions.dto';
import {FirmRole} from '../../../generated/prisma/client';

@Injectable()
export class PermissionsService
{
    constructor(
        private readonly prisma:       PrismaService,
        private readonly roleCache:    RolePermissionCacheService,
        private readonly roleResolver: FirmRoleResolverService,
    ) {}

    async getCatalog()
    {
        try {
            return await this.prisma.module.findMany({
                orderBy: {sortOrder: 'asc'},
                include: {
                    permissions: {
                        where:   {deprecated: false},
                        orderBy: {key: 'asc'},
                    },
                },
            });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async getEffectivePermissions(userId: string, firmId?: string): Promise<{isAdmin: boolean; permissionKeys: string[]}>
    {
        try {
            const firmRole = await this.roleResolver.resolve(userId, firmId);

            if (!firmRole) return {isAdmin: false, permissionKeys: []};
            if (firmRole.slug === 'admin') return {isAdmin: true, permissionKeys: []};

            const keys = await this.roleCache.getPermissionKeys(firmRole.id);
            return {isAdmin: false, permissionKeys: Array.from(keys)};
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async listFirmRoles(firmId?: string)
    {
        try {
            const validFirmId = this.requireFirmId(firmId);

            const roles = await this.prisma.firmRole.findMany({
                where:   {firmId: validFirmId},
                orderBy: [{isSystem: 'desc'}, {name: 'asc'}],
                include: {
                    _count:          {select: {members: true}},
                    rolePermissions: {select: {permission: {select: {key: true}}}},
                },
            });

            return roles.map(role => ({
                id:             role.id,
                name:           role.name,
                description:    role.description,
                slug:           role.slug,
                isSystem:       role.isSystem,
                memberCount:    role._count.members,
                permissionKeys: role.rolePermissions.map(rolePermission => rolePermission.permission.key),
            }));
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async createFirmRole(firmId: string | undefined, dto: CreateFirmRoleDto): Promise<FirmRole>
    {
        try {
            const validFirmId = this.requireFirmId(firmId);

            const role = await this.prisma.firmRole.create({
                data: {firmId: validFirmId, name: dto.name, description: dto.description, isSystem: false},
            });

            if (dto.permissionKeys?.length) await this.replacePermissions(role.id, dto.permissionKeys);

            return role;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async updateFirmRole(firmId: string | undefined, roleId: string, dto: UpdateFirmRoleDto): Promise<FirmRole>
    {
        try {
            const validFirmId = this.requireFirmId(firmId);
            await this.assertRoleBelongsToFirm(validFirmId, roleId);

            return await this.prisma.firmRole.update({
                where: {id: roleId},
                data:  {name: dto.name, description: dto.description},
            });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async assignPermissions(firmId: string | undefined, roleId: string, dto: AssignPermissionsDto): Promise<FirmRole>
    {
        try {
            const validFirmId = this.requireFirmId(firmId);
            const role = await this.assertRoleBelongsToFirm(validFirmId, roleId);

            if (role.slug === 'admin')
                throw new BadRequestException('El rol Admin tiene acceso total y no se puede editar.');

            await this.replacePermissions(roleId, dto.permissionKeys);

            return await this.prisma.firmRole.findUniqueOrThrow({where: {id: roleId}});
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async deleteFirmRole(firmId: string | undefined, roleId: string): Promise<{message: string}>
    {
        try {
            const validFirmId = this.requireFirmId(firmId);
            const role = await this.assertRoleBelongsToFirm(validFirmId, roleId);

            if (role.isSystem)
                throw new ConflictException('Los roles del sistema no se pueden eliminar.');

            const memberCount = await this.prisma.firmMember.count({where: {firmRoleId: roleId}});

            if (memberCount > 0)
                throw new ConflictException(`Este rol tiene ${memberCount} miembro(s) asignado(s) — reasignalos antes de eliminarlo.`);

            await this.prisma.firmRole.delete({where: {id: roleId}});
            this.roleCache.invalidate(roleId);

            return {message: 'Rol eliminado correctamente'};
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    private async replacePermissions(firmRoleId: string, permissionKeys: string[]): Promise<void>
    {
        const permissions = await this.prisma.permission.findMany({
            where:  {key: {in: permissionKeys}, deprecated: false},
            select: {id: true},
        });

        await this.prisma.$transaction([
            this.prisma.rolePermission.deleteMany({where: {firmRoleId}}),
            this.prisma.rolePermission.createMany({
                data: permissions.map(permission => ({firmRoleId, permissionId: permission.id})),
            }),
        ]);

        this.roleCache.invalidate(firmRoleId);
    }

    private async assertRoleBelongsToFirm(firmId: string, roleId: string): Promise<FirmRole>
    {
        const role = await this.prisma.firmRole.findFirst({where: {id: roleId, firmId}});
        if (!role) throw new NotFoundException('Rol no encontrado');
        return role;
    }

    private requireFirmId(firmId?: string): string
    {
        if (!firmId) throw new BadRequestException('Falta el header X-Firm-Id');
        return firmId;
    }
}
