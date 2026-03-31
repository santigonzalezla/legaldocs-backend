import {Module} from '@nestjs/common';
import {TimeEntryService} from './time-entry.service';
import {TimeEntryController} from './time-entry.controller';
import {FirmModule} from '../firm/firm.module';

@Module({
    imports:     [FirmModule],
    controllers: [TimeEntryController],
    providers:   [TimeEntryService],
})
export class TimeEntryModule {}
