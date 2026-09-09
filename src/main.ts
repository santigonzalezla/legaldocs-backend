import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {AppModule} from './app.module';
import {Logger, ValidationPipe} from "@nestjs/common";
import helmet from 'helmet';
import {environmentVariables} from "./config";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";

async function bootstrap()
{
    const logger = new Logger("LegalDocs Backend");
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.set('trust proxy', 1);

    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        hsts: {maxAge: 15_552_000, includeSubDomains: true},
        referrerPolicy: {policy: 'no-referrer'},
    }));

    const allowedOrigins = [
        // Local development
        /^https?:\/\/localhost(:\d+)?$/,
        // Production domain (any subdomain of legaldocs.com.co)
        /^https:\/\/([\w-]+\.)?legaldocs\.com\.co$/,
        // Railway deployments (frontend preview & production)
        /^https:\/\/[\w-]+\.up\.railway\.app$/,
    ];

    app.enableCors({
        origin: (origin, callback) =>
        {
            if (!origin) return callback(null, true);
            const allowed = allowedOrigins.some(pattern => pattern.test(origin));
            callback(allowed ? null : new Error(`CORS blocked: ${origin}`), allowed);
        },
        credentials:    true,
        methods:        ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Firm-Id'],
    });

    app.setGlobalPrefix("api");

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
    }));

    const config = new DocumentBuilder()
        .setTitle('LegalDocs API')
        .setDescription('API documentation for LegalDocs')
        .setVersion('1.0')
        .addTag('Documentation')
        .addServer(`http://localhost:${environmentVariables.port}`, 'Development')
        .addServer(
            `https://${process.env.RAILWAY_PUBLIC_DOMAIN ?? ''}`,
            'Production (Railway)',
        )
        .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            in: 'header',
            name: 'Authorization',
            description: 'Enter your Bearer token in the format'
        })
        .addSecurityRequirements('bearer')
        .build();

    const documentFactory = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api/docs', app, documentFactory, {
        swaggerOptions: {
            docExpansion: 'none',
            filter: true,
            showRequestDuration: true,
            persistAuthorization: true
        }
    });

    await app.listen(environmentVariables.port ?? 5000);
    logger.log(`Server is running on port ${environmentVariables.port ?? 5000}`);
}

bootstrap();
