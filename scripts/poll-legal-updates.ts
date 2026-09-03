import 'dotenv/config';
import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {AppModule} from '../src/app.module';
import {LegalUpdatesPollingService} from '../src/modules/legal-updates/legal-updates-polling.service';

const run = async (): Promise<void> =>
{
    const logger = new Logger('poll:legal-updates');
    const app = await NestFactory.createApplicationContext(AppModule, {logger: ['error', 'warn', 'log']});

    try
    {
        const summaries = await app.get(LegalUpdatesPollingService).pollAll();

        for (const summary of summaries)
        {
            const detail = summary.error ? `error=${summary.error}` : `items=${summary.inserted}`;
            logger.log(`${summary.source} → ${detail}`);
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
