import {Module} from '@nestjs/common';
import {TemplateService} from './template.service';
import {TemplateController} from './template.controller';
import {FirmModule} from '../firm/firm.module';

@Module({
    imports: [FirmModule],
    controllers: [TemplateController],
    providers: [TemplateService],
    exports: [TemplateService],
})
export class TemplateModule {}
