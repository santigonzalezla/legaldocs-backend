import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {Request} from 'express';
import * as argon2 from 'argon2';
import {environmentVariables} from '../../../config';
import {LoggedUser} from '../../../interfaces/LoggedUser';
import {PrismaService} from '../../prisma/prisma.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh')
{
    constructor(private readonly prisma: PrismaService)
    {
        super({
            jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
            ignoreExpiration: false,
            secretOrKey: environmentVariables.jwtRefreshSecret,
            passReqToCallback: true
        });
    }

    async validate(request: Request, payload: LoggedUser): Promise<LoggedUser & { refreshToken: string }>
    {
        const refreshToken = request.body?.refreshToken;

        if (!refreshToken) throw new UnauthorizedException('Refresh token not provided');

        const storedTokens = await this.prisma.refreshToken.findMany({
            where: {
                credentialsId: payload.sub,
                revokedAt: null,
                expiresAt: {gt: new Date()}
            }
        });

        let validToken = false;

        for (const token of storedTokens)
        {
            if (await argon2.verify(token.tokenHash, refreshToken)) {
                validToken = true;
                break;
            }
        }

        if (!validToken) throw new UnauthorizedException('Invalid or expired refresh token');

        return {...payload, refreshToken};
    }
}
