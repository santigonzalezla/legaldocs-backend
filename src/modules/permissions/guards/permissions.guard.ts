import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {LoggedUser} from '../../../interfaces/LoggedUser';
import {IS_PUBLIC_KEY} from '../../auth/decorators/public.decorator';
import {PERMISSION_KEY, PermissionMetadata} from '../decorators/permission.decorator';
import {RolePermissionCacheService} from '../services/role-permission-cache.service';
import {FirmRoleResolverService} from '../services/firm-role-resolver.service';

// Convive con RolesGuard durante la migración: si el handler no tiene @Permission(),
// no bloquea nada (deja actuar al guard viejo). Una vez migrado un endpoint, @Roles()
// se retira en el mismo cambio — dejar ambos decorators activos bloquearía en AND.
@Injectable()
export class PermissionsGuard implements CanActivate
{
    constructor(
        private readonly reflector:    Reflector,
        private readonly roleCache:    RolePermissionCacheService,
        private readonly roleResolver: FirmRoleResolverService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean>
    {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) return true;

        const permissionMeta = this.reflector.getAllAndOverride<PermissionMetadata>(PERMISSION_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!permissionMeta) return true;

        const requiredPermission = permissionMeta.key;

        const request = context.switchToHttp().getRequest();
        const user    = request.user as LoggedUser;
        const firmId  = request.headers['x-firm-id'] as string | undefined;

        const firmRole = await this.roleResolver.resolve(user.userId, firmId);

        if (!firmRole)
            throw new ForbiddenException('No tienes acceso a esta firma');

        if (firmRole.slug === 'admin') return true;

        const permissionKeys = await this.roleCache.getPermissionKeys(firmRole.id);

        if (!permissionKeys.has(requiredPermission))
            throw new ForbiddenException(`No tienes permiso para: ${permissionMeta.label ?? requiredPermission}`);

        return true;
    }
}
