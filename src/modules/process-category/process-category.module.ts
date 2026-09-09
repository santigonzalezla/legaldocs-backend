import {Module} from '@nestjs/common';
import {ProcessCategoryService} from './process-category.service';
import {ProcessCategoryController} from './process-category.controller';
import {FirmModule} from '../firm/firm.module';

@Module({
    imports:     [FirmModule],
    controllers: [ProcessCategoryController],
    providers:   [ProcessCategoryService],
    exports:     [ProcessCategoryService],
})
export class ProcessCategoryModule {}
