import {Injectable, Logger, OnApplicationBootstrap, RequestMethod} from '@nestjs/common';
import {METHOD_METADATA, PATH_METADATA} from '@nestjs/common/constants';
import {DiscoveryService, MetadataScanner, Reflector} from '@nestjs/core';
import {PrismaService} from '../../prisma/prisma.service';
import {PERMISSION_KEY, PermissionMetadata} from '../decorators/permission.decorator';
import {MODULE_CATALOG} from '../constants/module-catalog';
import {humanizePermissionKey} from '../utils/humanize-key';

interface DiscoveredPermission
{
    key:       string;
    label:     string;
    method:    string;
    path:      string;
    moduleKey: string;
}

const REQUEST_METHOD_NAMES: Record<number, string> = {
    [RequestMethod.GET]:     'GET',
    [RequestMethod.POST]:    'POST',
    [RequestMethod.PUT]:     'PUT',
    [RequestMethod.DELETE]:  'DELETE',
    [RequestMethod.PATCH]:   'PATCH',
    [RequestMethod.OPTIONS]: 'OPTIONS',
    [RequestMethod.HEAD]:    'HEAD',
    [RequestMethod.ALL]:     'ALL',
};

// Recorre todos los controllers en boot buscando @Permission() y sincroniza el
// catálogo (Module/Permission) en la base de datos. Así el set de permisos
// asignables en la UI de roles se auto-alimenta del código: nadie mantiene esta
// tabla a mano, solo se decora el endpoint una vez.
@Injectable()
export class PermissionRegistryService implements OnApplicationBootstrap
{
    private readonly logger = new Logger(PermissionRegistryService.name);

    constructor(
        private readonly discoveryService: DiscoveryService,
        private readonly metadataScanner:  MetadataScanner,
        private readonly reflector:        Reflector,
        private readonly prisma:           PrismaService,
    ) {}

    async onApplicationBootstrap(): Promise<void>
    {
        const discovered = this.scanControllers();
        await this.syncPermissions(discovered);
    }

    private scanControllers(): DiscoveredPermission[]
    {
        const entries: DiscoveredPermission[] = [];

        for (const wrapper of this.discoveryService.getControllers())
        {
            const {instance, metatype} = wrapper;
            if (!instance || !metatype) continue;

            const controllerPath = Reflect.getMetadata(PATH_METADATA, metatype) ?? '';
            const prototype       = Object.getPrototypeOf(instance);

            this.metadataScanner.getAllMethodNames(prototype).forEach(methodName =>
            {
                const handler = prototype[methodName];
                const permissionMeta = this.reflector.get<PermissionMetadata>(PERMISSION_KEY, handler);
                if (!permissionMeta) return;

                const methodCode  = Reflect.getMetadata(METHOD_METADATA, handler) as number | undefined;
                const handlerPath = Reflect.getMetadata(PATH_METADATA, handler) ?? '';
                const moduleKey   = permissionMeta.key.split(':')[0];

                entries.push({
                    key:    permissionMeta.key,
                    label:  permissionMeta.label ?? humanizePermissionKey(permissionMeta.key),
                    method: REQUEST_METHOD_NAMES[methodCode ?? RequestMethod.GET] ?? 'GET',
                    path:   this.buildPath(controllerPath, handlerPath),
                    moduleKey,
                });
            });
        }

        return entries;
    }

    private buildPath(controllerPath: string, handlerPath: string): string
    {
        const segments = ['api', controllerPath, handlerPath]
            .join('/')
            .split('/')
            .filter(Boolean);

        return `/${segments.join('/')}`;
    }

    private async syncPermissions(entries: DiscoveredPermission[]): Promise<void>
    {
        const moduleIdByKey = new Map<string, string>();

        for (const entry of entries)
        {
            let moduleId = moduleIdByKey.get(entry.moduleKey);

            if (!moduleId)
            {
                const catalogEntry = MODULE_CATALOG[entry.moduleKey];
                const module = await this.prisma.module.upsert({
                    where:  {key: entry.moduleKey},
                    update: {},
                    create: {
                        key:       entry.moduleKey,
                        label:     catalogEntry?.label ?? entry.moduleKey,
                        sortOrder: catalogEntry?.sortOrder ?? 0,
                    },
                });

                moduleId = module.id;
                moduleIdByKey.set(entry.moduleKey, moduleId);
            }

            await this.prisma.permission.upsert({
                where:  {key: entry.key},
                update: {method: entry.method, path: entry.path, moduleId, label: entry.label, deprecated: false},
                create: {
                    key:        entry.key,
                    method:     entry.method,
                    path:       entry.path,
                    moduleId,
                    label:      entry.label,
                    deprecated: false,
                },
            });
        }

        const activeKeys = entries.map(entry => entry.key);

        await this.prisma.permission.updateMany({
            where: activeKeys.length > 0 ? {key: {notIn: activeKeys}} : {},
            data:  {deprecated: true},
        });

        this.logger.log(`Sincronizados ${entries.length} permisos desde el código (${moduleIdByKey.size} módulos).`);
    }
}
