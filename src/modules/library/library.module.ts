import {Module} from '@nestjs/common';
import {LibraryController} from './library.controller';
import {LibraryService} from './library.service';
import {StorageService} from '../../utils/storage/storage.service';
import {EmbeddingService} from '../../utils/storage/embedding.service';

@Module({
    controllers: [LibraryController],
    providers:   [LibraryService, StorageService, EmbeddingService],
    exports:     [LibraryService],
})
export class LibraryModule {}
