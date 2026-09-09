import {FileInterceptor} from '@nestjs/platform-express';
import {memoryStorage} from 'multer';

// Límites en la capa de multer: cortan el stream antes de bufferizar el archivo
// entero (evita OOM) y acotan el "multipart field bomb".
export const buildUploadInterceptor = (maxBytes: number) =>
    FileInterceptor('file', {
        storage: memoryStorage(),
        limits: {
            fileSize:   maxBytes,
            files:      1,
            fields:     20,
            parts:      25,
            fieldNameSize: 100,
        },
    });
