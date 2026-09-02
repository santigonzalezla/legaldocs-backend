import 'dotenv/config';
import {PrismaPg} from '@prisma/adapter-pg';
import {FirmMemberRole, PrismaClient} from '../generated/prisma/client';

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL!});
const prismaClient = new PrismaClient({adapter});

const DRY_RUN = process.argv.includes('--dry-run');
const RESYNC_PERMISSIONS = process.argv.includes('--resync-permissions');

const ABOGADO_MODULES = ['documents', 'processes', 'templates', 'library'];
const ABOGADO_EXTRA_PERMISSION_KEYS = [
    'time_entries:view',
    'time_entries:start',
    'time_entries:stop',
    'time_entries:log-manual',
    'time_entries:delete',
];
const EXCLUDED_FROM_GERENTE = ['team', 'firm_settings'];

interface SeededRole
{
    id: string;
    name: string;
}

async function seedSystemRoles(firmId: string): Promise<{ admin: SeededRole; abogado: SeededRole; gerente: SeededRole }>
{
    const admin = await upsertSystemRole(firmId, 'admin', 'Admin', 'Acceso total al despacho.');
    const abogado = await upsertSystemRole(firmId, 'abogado', 'Abogado', 'Documentos, casos, plantillas y biblioteca.');
    const gerente = await upsertSystemRole(firmId, 'gerente', 'Gerente', 'Todo el despacho, excepto usuarios y configuración de la firma.');

    const allModuleKeys = (await prismaClient.module.findMany({select: {key: true}})).map(module => module.key);
    const gerenteModuleKeys = allModuleKeys.filter(key => !EXCLUDED_FROM_GERENTE.includes(key));

    await assignModulePermissions(abogado.id, ABOGADO_MODULES);
    await assignPermissionKeys(abogado.id, ABOGADO_EXTRA_PERMISSION_KEYS);
    await assignModulePermissions(gerente.id, gerenteModuleKeys);

    return {admin, abogado, gerente};
}

async function upsertSystemRole(firmId: string, slug: string, name: string, description: string): Promise<SeededRole>
{
    const existing = await prismaClient.firmRole.findFirst({where: {firmId, slug}});
    if (existing) return existing;
    if (DRY_RUN) return {id: `dry-run-${slug}`, name};

    return prismaClient.firmRole.create({data: {firmId, slug, name, description, isSystem: true}});
}

async function assignModulePermissions(firmRoleId: string, moduleKeys: string[]): Promise<void>
{
    if (moduleKeys.length === 0 || DRY_RUN) return;

    const permissions = await prismaClient.permission.findMany({
        where: {deprecated: false, module: {key: {in: moduleKeys}}},
        select: {id: true}
    });

    if (permissions.length === 0) return;

    await prismaClient.rolePermission.createMany({
        data: permissions.map(permission => ({firmRoleId, permissionId: permission.id})),
        skipDuplicates: true
    });
}

async function assignPermissionKeys(firmRoleId: string, keys: string[]): Promise<void>
{
    if (keys.length === 0 || DRY_RUN) return;

    const permissions = await prismaClient.permission.findMany({
        where: {deprecated: false, key: {in: keys}},
        select: {id: true}
    });

    if (permissions.length === 0) return;

    await prismaClient.rolePermission.createMany({
        data: permissions.map(permission => ({firmRoleId, permissionId: permission.id})),
        skipDuplicates: true
    });
}

async function resyncSystemRolePermissions(): Promise<void>
{
    console.log(DRY_RUN
        ? 'MODO DRY-RUN — resync de permisos, no se escribe nada.\n'
        : 'Resincronizando permisos de Abogado/Gerente en todas las firmas.\n');

    const firms = await prismaClient.firm.findMany({where: {deletedAt: null}});

    for (const firm of firms) {
        await seedSystemRoles(firm.id);
        console.log(`  Firma "${firm.name}" — roles de sistema resincronizados.`);
    }

    console.log(DRY_RUN ? '\nCorré sin --dry-run para aplicar los cambios.' : '\nResync aplicado.');
}

async function main()
{
    if (RESYNC_PERMISSIONS) return resyncSystemRolePermissions();

    console.log(DRY_RUN
        ? 'MODO DRY-RUN — no se escribe nada en la base de datos.\n'
        : 'Aplicando backfill de roles en la base de datos.\n');

    const firms = await prismaClient.firm.findMany({where: {deletedAt: null}});
    const summary = {admin: 0, abogado: 0};

    for (const firm of firms) {
        const pendingMembers = await prismaClient.firmMember.findMany({
            where: {firmId: firm.id, firmRoleId: null}
        });

        if (pendingMembers.length === 0) continue;

        const roles = await seedSystemRoles(firm.id);

        for (const member of pendingMembers) {
            const isAdmin = member.role === FirmMemberRole.ADMIN;
            const target = isAdmin ? roles.admin : roles.abogado;

            summary[isAdmin ? 'admin' : 'abogado']++;
            console.log(`  Firma "${firm.name}" — miembro ${member.id} (${member.role}) → ${target.name}`);

            if (!DRY_RUN) {
                await prismaClient.firmMember.update({
                    where: {id: member.id},
                    data: {firmRoleId: target.id}
                });
            }
        }
    }

    console.log('\nResumen:');
    console.log(`  → Admin:   ${summary.admin}`);
    console.log(`  → Abogado: ${summary.abogado} (incluye ex-LAWYER/ASSISTANT/INTERN)`);
    console.log(DRY_RUN ? '\nCorré sin --dry-run para aplicar los cambios.' : '\nBackfill aplicado.');
}

main()
    .catch(console.error)
    .finally(() => prismaClient.$disconnect());
