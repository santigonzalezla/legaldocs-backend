import {Global, Module} from '@nestjs/common';
import {StorageService} from './storage.service';
import {StorageController} from './storage.controller';
import {StorageReconcileService} from './storage-reconcile.service';
import {FirmModule} from '../../modules/firm/firm.module';

@Global()
@Module({
    imports:     [FirmModule],
    controllers: [StorageController],
    providers:   [StorageService, StorageReconcileService],
    exports:     [StorageService],
})
export class StorageModule {}
