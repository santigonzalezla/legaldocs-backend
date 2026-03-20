import {createParamDecorator, ExecutionContext} from '@nestjs/common';

export const FirmId = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): string | undefined =>
    {
        const request = ctx.switchToHttp().getRequest();
        return request.headers['x-firm-id'] as string | undefined;
    },
);
