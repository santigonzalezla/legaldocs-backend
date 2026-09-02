import {Module} from '@nestjs/common';
import {FirmService} from './firm.service';
import {FirmPurgeService} from './firm-purge.service';
import {FirmController} from './firm.controller';
import {PermissionsModule} from '../permissions/permissions.module';

@Module({
    imports: [PermissionsModule],
    controllers: [FirmController],
    providers: [FirmService, FirmPurgeService],
    exports: [FirmService],
})
export class FirmModule {}
