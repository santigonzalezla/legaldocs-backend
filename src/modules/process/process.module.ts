import {Module} from '@nestjs/common';
import {ProcessService} from './process.service';
import {ProcessController} from './process.controller';
import {FirmModule} from '../firm/firm.module';
import {ClientModule} from '../client/client.module';

@Module({
    imports:     [FirmModule, ClientModule],
    controllers: [ProcessController],
    providers:   [ProcessService],
    exports:     [ProcessService],
})
export class ProcessModule {}
