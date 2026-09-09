import {Module} from '@nestjs/common';
import {ProcessTimelineController} from './process-timeline.controller';
import {ProcessTimelineService} from './process-timeline.service';
import {ProcessTimelineReminderDispatcherService} from './process-timeline-reminder-dispatcher.service';
import {FirmModule} from '../firm/firm.module';

@Module({
    imports:     [FirmModule],
    controllers: [ProcessTimelineController],
    providers:   [ProcessTimelineService, ProcessTimelineReminderDispatcherService],
    exports:     [ProcessTimelineService],
})
export class ProcessTimelineModule {}
