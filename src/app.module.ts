import {Logger, Module} from '@nestjs/common';
import {APP_FILTER, APP_GUARD} from '@nestjs/core';
import {ScheduleModule} from '@nestjs/schedule';
import {ThrottlerModule} from '@nestjs/throttler';
import {PrismaModule} from './modules/prisma/prisma.module';
import {AuthModule} from './modules/auth/auth.module';
import {JwtAuthGuard} from './modules/auth/guards/jwt-auth.guard';
import {RolesGuard} from './modules/firm/guards/roles.guard';
import {PermissionsGuard} from './modules/permissions/guards/permissions.guard';
import {ThrottlerBehindProxyGuard} from './utils/security/throttler-behind-proxy.guard';
import {GlobalExceptionFilter} from './filters/global_exception.filter';
import {HttpExceptionFilter} from './filters/http_exception.filter';
import {ValidationExceptionFilter} from './filters/validation_exception.filter';
import {PrismaClientExceptionFilter} from './filters/prisma_client_exception.filter';
import {MulterExceptionFilter} from './filters/multer_exception.filter';
import {UserModule} from './modules/user/user.module';
import {FirmModule} from './modules/firm/firm.module';
import {FilesModule} from './modules/files/files.module';
import {DocumentModule} from './modules/document/document.module';
import {TemplateModule} from './modules/template/template.module';
import {SignatureModule} from './modules/signature/signature.module';
import {SubscriptionModule} from './modules/subscription/subscription.module';
import {BranchModule} from './modules/branch/branch.module';
import {ClientModule} from './modules/client/client.module';
import {ProcessModule} from './modules/process/process.module';
import {ProcessCategoryModule} from './modules/process-category/process-category.module';
import {ProcessTimelineModule} from './modules/process-timeline/process-timeline.module';
import {TimeEntryModule} from './modules/time-entry/time-entry.module';
import {LibraryModule} from './modules/library/library.module';
import {LegalUpdatesModule} from './modules/legal-updates/legal-updates.module';
import {DashboardModule} from './modules/dashboard/dashboard.module';
import {AiModule} from './modules/ai/ai.module';
import {MailModule} from './utils/mail/mail.module';
import {StorageModule} from './utils/storage/storage.module';
import {PermissionsModule} from './modules/permissions/permissions.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        ThrottlerModule.forRoot([{name: 'default', ttl: 60_000, limit: 120}]),
        PrismaModule,
        AuthModule,
        UserModule,
        FirmModule,
        FilesModule,
        DocumentModule,
        TemplateModule,
        SignatureModule,
        SubscriptionModule,
        BranchModule,
        ClientModule,
        ProcessModule,
        ProcessCategoryModule,
        ProcessTimelineModule,
        TimeEntryModule,
        LibraryModule,
        LegalUpdatesModule,
        DashboardModule,
        AiModule,
        MailModule,
        StorageModule,
        PermissionsModule
    ],
    providers: [
        Logger,
        {provide: APP_GUARD, useClass: JwtAuthGuard},
        {provide: APP_GUARD, useClass: ThrottlerBehindProxyGuard},
        {provide: APP_GUARD, useClass: RolesGuard},
        {provide: APP_GUARD, useClass: PermissionsGuard},
        {provide: APP_FILTER, useClass: GlobalExceptionFilter},
        {provide: APP_FILTER, useClass: ValidationExceptionFilter},
        {provide: APP_FILTER, useClass: HttpExceptionFilter},
        {provide: APP_FILTER, useClass: PrismaClientExceptionFilter},
        {provide: APP_FILTER, useClass: MulterExceptionFilter}
    ]
})
export class AppModule {}
