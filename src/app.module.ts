import {Logger, Module} from '@nestjs/common';
import {APP_FILTER, APP_GUARD} from '@nestjs/core';
import {PrismaModule} from './modules/prisma/prisma.module';
import {AuthModule} from './modules/auth/auth.module';
import {JwtAuthGuard} from './modules/auth/guards/jwt-auth.guard';
import {RolesGuard} from './modules/firm/guards/roles.guard';
import {GlobalExceptionFilter} from './filters/global_exception.filter';
import {HttpExceptionFilter} from './filters/http_exception.filter';
import {ValidationExceptionFilter} from './filters/validation_exception.filter';
import {PrismaClientExceptionFilter} from './filters/prisma_client_exception.filter';
import {UserModule} from './modules/user/user.module';
import {FirmModule} from './modules/firm/firm.module';
import {DocumentModule} from './modules/document/document.module';
import {TemplateModule} from './modules/template/template.module';
import {SignatureModule} from './modules/signature/signature.module';
import {SubscriptionModule} from './modules/subscription/subscription.module';
import {BranchModule} from './modules/branch/branch.module';
import {ClientModule} from './modules/client/client.module';
import {ProcessModule} from './modules/process/process.module';
import {TimeEntryModule} from './modules/time-entry/time-entry.module';
import {MailModule} from './utils/mail/mail.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        UserModule,
        FirmModule,
        DocumentModule,
        TemplateModule,
        SignatureModule,
        SubscriptionModule,
        BranchModule,
        ClientModule,
        ProcessModule,
        TimeEntryModule,
        MailModule,
    ],
    providers: [
        Logger,
        {provide: APP_GUARD, useClass: JwtAuthGuard},
        {provide: APP_GUARD, useClass: RolesGuard},
        {provide: APP_FILTER, useClass: GlobalExceptionFilter},
        {provide: APP_FILTER, useClass: ValidationExceptionFilter},
        {provide: APP_FILTER, useClass: HttpExceptionFilter},
        {provide: APP_FILTER, useClass: PrismaClientExceptionFilter},
    ],
})
export class AppModule {}
