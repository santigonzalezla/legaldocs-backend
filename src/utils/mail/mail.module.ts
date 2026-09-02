import {Global, Module} from '@nestjs/common';
import {MailService} from './mail.service';
import {EmailRenderer} from '../emails/email-renderer.service';

@Global()
@Module({
    providers: [MailService, EmailRenderer],
    exports: [MailService],
})
export class MailModule {}
