import {Module} from '@nestjs/common';
import {DocumentService} from './document.service';
import {DocumentController} from './document.controller';
import {FirmModule} from '../firm/firm.module';

@Module({
    imports: [FirmModule],
    controllers: [DocumentController],
    providers: [DocumentService],
    exports: [DocumentService],
})
export class DocumentModule {}
