import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-microsoft';
import {environmentVariables} from '../../../config';
import {OAuthProfile} from './google.strategy';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft')
{
    constructor()
    {
        super({
            clientID: environmentVariables.microsoftClientId,
            clientSecret: environmentVariables.microsoftClientSecret,
            callbackURL: environmentVariables.microsoftCallbackUrl,
            scope: ['user.read']
        });
    }

    async validate(_accessToken: string, _refreshToken: string, profile: any, done: Function): Promise<void>
    {
        const user: OAuthProfile = {
            oauthId: profile.id,
            email: profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName,
            firstName: profile.name?.givenName || profile._json?.givenName || '',
            lastName: profile.name?.familyName || profile._json?.surname || '',
            avatarUrl: undefined,
            provider: 'microsoft'
        };

        done(null, user);
    }
}
