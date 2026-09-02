import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common';
import {Request} from 'express';
import {environmentVariables} from '../../../config';

// Bloquea el alta autogestionada (POST /auth/register, POST /firm) cuando
// SELF_SIGNUP_ENABLED=false. El aprovisionamiento manual vía Swagger pasa la
// cabecera x-provision-key con el valor de PROVISION_KEY. Si PROVISION_KEY está
// vacía, el bypass queda inhabilitado (una cabecera vacía nunca coincide).
@Injectable()
export class SelfSignupGuard implements CanActivate
{
    canActivate(context: ExecutionContext): boolean
    {
        if (environmentVariables.selfSignupEnabled) return true;

        const request  = context.switchToHttp().getRequest<Request>();
        const provided = request.headers['x-provision-key'] as string | undefined;
        const expected = environmentVariables.provisionKey;

        if (expected && provided && provided === expected) return true;

        throw new ForbiddenException('El registro autogestionado está deshabilitado');
    }
}
