import {Module} from '@nestjs/common';
import {LegalUpdatesController} from './legal-updates.controller';
import {LegalUpdatesService} from './legal-updates.service';
import {LegalUpdatesPollingService} from './legal-updates-polling.service';

@Module({
    controllers: [LegalUpdatesController],
    providers: [LegalUpdatesService, LegalUpdatesPollingService],
    exports: [LegalUpdatesService],
})
export class LegalUpdatesModule {}
