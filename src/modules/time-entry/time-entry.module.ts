import {Module} from '@nestjs/common';
import {TimeEntryService} from './time-entry.service';
import {TimeEntryController} from './time-entry.controller';
import {FirmModule} from '../firm/firm.module';
import {PermissionsModule} from '../permissions/permissions.module';

@Module({
    imports:     [FirmModule, PermissionsModule],
    controllers: [TimeEntryController],
    providers:   [TimeEntryService],
})
export class TimeEntryModule {}
