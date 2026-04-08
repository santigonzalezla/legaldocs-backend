import {Module} from '@nestjs/common';
import {AiController} from './ai.controller';
import {AiService} from './ai.service';
import {LibraryModule} from '../library/library.module';
import {PrismaModule} from '../prisma/prisma.module';

@Module({
    imports:     [LibraryModule, PrismaModule],
    controllers: [AiController],
    providers:   [AiService],
})
export class AiModule {}
