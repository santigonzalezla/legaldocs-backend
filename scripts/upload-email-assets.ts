import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {AppModule} from '../src/app.module';
import {StorageService} from '../src/utils/storage/storage.service';
import {environmentVariables} from '../src/config';

const FRONTEND_PUBLIC = path.join(__dirname, '../../frontend/public');

const ASSETS: Array<{file: string; key: string; mimeType: string}> = [
    {file: path.join(FRONTEND_PUBLIC, 'email/logo-email.png'),        key: 'email-assets/logo-email.png',        mimeType: 'image/png'},
    {file: path.join(FRONTEND_PUBLIC, 'fonts/Satoshi-Regular.woff'),  key: 'email-assets/fonts/Satoshi-Regular.woff', mimeType: 'font/woff'},
    {file: path.join(FRONTEND_PUBLIC, 'fonts/Satoshi-Bold.woff'),     key: 'email-assets/fonts/Satoshi-Bold.woff',    mimeType: 'font/woff'},
];

const run = async (): Promise<void> =>
{
    const logger = new Logger('upload:email-assets');
    const app = await NestFactory.createApplicationContext(AppModule, {logger: ['error', 'warn', 'log']});

    try
    {
        const storage = app.get(StorageService);

        for (const asset of ASSETS)
        {
            const buffer = fs.readFileSync(asset.file);
            await storage.putImage(asset.key, buffer, asset.mimeType);

            const publicUrl = `${environmentVariables.r2PublicUrl}/${asset.key}`;
            logger.log(`${asset.key} → ${publicUrl}`);
        }
    }
    finally
    {
        await app.close();
    }
};

run()
    .then(() => process.exit(0))
    .catch(error =>
    {
        console.error(error);
        process.exit(1);
    });
