import {Module} from '@nestjs/common';
import {DiscoveryModule} from '@nestjs/core';
import {PermissionRegistryService} from './services/permission-registry.service';
import {RolePermissionCacheService} from './services/role-permission-cache.service';
import {FirmRoleSeederService} from './services/firm-role-seeder.service';
import {FirmRoleResolverService} from './services/firm-role-resolver.service';
import {PermissionsGuard} from './guards/permissions.guard';
import {PermissionsController} from './permissions.controller';
import {PermissionsService} from './permissions.service';

@Module({
    imports:     [DiscoveryModule],
    controllers: [PermissionsController],
    providers: [
        PermissionRegistryService,
        RolePermissionCacheService,
        FirmRoleSeederService,
        FirmRoleResolverService,
        PermissionsGuard,
        PermissionsService,
    ],
    exports: [RolePermissionCacheService, FirmRoleSeederService, FirmRoleResolverService, PermissionsGuard, PermissionsService],
})
export class PermissionsModule {}
