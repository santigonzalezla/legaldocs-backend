import {Injectable} from '@nestjs/common';
import {PrismaService} from '../../prisma/prisma.service';
import {FirmRole} from '../../../../generated/prisma/client';

const ABOGADO_MODULES = ['documents', 'processes', 'templates', 'library'];
// Subconjunto de time_entries (no el módulo completo): puede ver/registrar
// sus propias horas, pero no time_entries:analytics (eso sigue siendo
// exclusivo de Gerente/Admin — ver TimeEntryService.canViewAllEntries).
const ABOGADO_EXTRA_PERMISSION_KEYS = [
    'time_entries:view',
    'time_entries:start',
    'time_entries:stop',
    'time_entries:log-manual',
    'time_entries:delete',
];
const EXCLUDED_FROM_GERENTE = ['team', 'firm_settings'];

export interface SeededSystemRoles
{
    admin:   FirmRole;
    abogado: FirmRole;
    gerente: FirmRole;
}

// Siembra los 3 roles base de toda firma nueva. Admin no recibe filas de
// RolePermission — PermissionsGuard lo bypassea directo por slug==='admin',
// así que queda inclusivo por diseño ante cualquier permiso futuro sin
// necesidad de mantenerlo sincronizado.
@Injectable()
export class FirmRoleSeederService
{
    constructor(private readonly prisma: PrismaService) {}

    async seedSystemRoles(firmId: string): Promise<SeededSystemRoles>
    {
        const admin   = await this.upsertSystemRole(firmId, 'admin', 'Admin', 'Acceso total al despacho.');
        const abogado = await this.upsertSystemRole(firmId, 'abogado', 'Abogado', 'Documentos, casos, plantillas y biblioteca.');
        const gerente = await this.upsertSystemRole(firmId, 'gerente', 'Gerente', 'Todo el despacho, excepto usuarios y configuración de la firma.');

        const allModuleKeys = (await this.prisma.module.findMany({select: {key: true}})).map(module => module.key);
        const gerenteModuleKeys = allModuleKeys.filter(key => !EXCLUDED_FROM_GERENTE.includes(key));

        await this.assignModulePermissions(abogado.id, ABOGADO_MODULES);
        await this.assignPermissionKeys(abogado.id, ABOGADO_EXTRA_PERMISSION_KEYS);
        await this.assignModulePermissions(gerente.id, gerenteModuleKeys);

        return {admin, abogado, gerente};
    }

    private async upsertSystemRole(firmId: string, slug: string, name: string, description: string): Promise<FirmRole>
    {
        const existing = await this.prisma.firmRole.findFirst({where: {firmId, slug}});
        if (existing) return existing;

        return this.prisma.firmRole.create({
            data: {firmId, slug, name, description, isSystem: true},
        });
    }

    private async assignModulePermissions(firmRoleId: string, moduleKeys: string[]): Promise<void>
    {
        if (moduleKeys.length === 0) return;

        const permissions = await this.prisma.permission.findMany({
            where:  {deprecated: false, module: {key: {in: moduleKeys}}},
            select: {id: true},
        });

        if (permissions.length === 0) return;

        await this.prisma.rolePermission.createMany({
            data:           permissions.map(permission => ({firmRoleId, permissionId: permission.id})),
            skipDuplicates: true,
        });
    }

    // Para asignar permisos sueltos de un módulo del que el rol no tiene
    // acceso completo (ej. Abogado con solo parte de time_entries).
    private async assignPermissionKeys(firmRoleId: string, keys: string[]): Promise<void>
    {
        if (keys.length === 0) return;

        const permissions = await this.prisma.permission.findMany({
            where:  {deprecated: false, key: {in: keys}},
            select: {id: true},
        });

        if (permissions.length === 0) return;

        await this.prisma.rolePermission.createMany({
            data:           permissions.map(permission => ({firmRoleId, permissionId: permission.id})),
            skipDuplicates: true,
        });
    }
}
