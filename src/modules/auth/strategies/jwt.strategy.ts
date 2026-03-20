import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {environmentVariables} from '../../../config';
import {LoggedUser} from '../../../interfaces/LoggedUser';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt')
{
    constructor()
    {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: environmentVariables.jwtSecret
        });
    }

    async validate(payload: LoggedUser): Promise<LoggedUser>
    {
        return {sub: payload.sub, userId: payload.userId, email: payload.email};
    }
}
