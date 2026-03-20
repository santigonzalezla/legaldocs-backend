import {createParamDecorator, ExecutionContext} from '@nestjs/common';
import {LoggedUser} from '../../../interfaces/LoggedUser';

export const CurrentUser = createParamDecorator(
    (data: keyof LoggedUser | undefined, ctx: ExecutionContext): LoggedUser | any =>
    {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as LoggedUser;
        return data ? user?.[data] : user;
    }
);
