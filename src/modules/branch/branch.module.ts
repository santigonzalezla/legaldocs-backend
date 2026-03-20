import {Module} from '@nestjs/common';
import {BranchService} from './branch.service';
import {BranchController} from './branch.controller';
import {FirmModule} from '../firm/firm.module';

@Module({
    imports: [FirmModule],
    controllers: [BranchController],
    providers: [BranchService],
    exports: [BranchService],
})
export class BranchModule {}
