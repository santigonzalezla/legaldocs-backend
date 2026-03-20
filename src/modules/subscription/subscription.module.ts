import {Module} from '@nestjs/common';
import {SubscriptionService} from './subscription.service';
import {SubscriptionController} from './subscription.controller';
import {FirmModule} from '../firm/firm.module';

@Module({
    imports: [FirmModule],
    controllers: [SubscriptionController],
    providers: [SubscriptionService],
    exports: [SubscriptionService],
})
export class SubscriptionModule {}
