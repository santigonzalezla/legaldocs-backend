import {Module} from '@nestjs/common';
import {ClientService} from './client.service';
import {ClientController} from './client.controller';
import {FirmModule} from '../firm/firm.module';

@Module({
    imports:     [FirmModule],
    controllers: [ClientController],
    providers:   [ClientService],
    exports:     [ClientService],
})
export class ClientModule {}
