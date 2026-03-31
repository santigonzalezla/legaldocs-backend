import {Module} from '@nestjs/common';
import {ProcessService} from './process.service';
import {ProcessController} from './process.controller';
import {FirmModule} from '../firm/firm.module';

@Module({
    imports:     [FirmModule],
    controllers: [ProcessController],
    providers:   [ProcessService],
    exports:     [ProcessService],
})
export class ProcessModule {}
