import {Module} from '@nestjs/common';
import {DashboardController} from './dashboard.controller';
import {DashboardService} from './dashboard.service';
import {FirmModule} from '../firm/firm.module';

@Module({
    imports: [FirmModule],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule {}
