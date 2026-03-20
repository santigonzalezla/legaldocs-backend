import {Module} from '@nestjs/common';
import {FirmService} from './firm.service';
import {FirmController} from './firm.controller';

@Module({
    controllers: [FirmController],
    providers: [FirmService],
    exports: [FirmService],
})
export class FirmModule {}
