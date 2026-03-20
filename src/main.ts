import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {Logger, ValidationPipe} from "@nestjs/common";
import {environmentVariables} from "./config";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";

async function bootstrap()
{
    const logger = new Logger("LegalDocs Backend");
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin:      environmentVariables.nodeEnv === 'production'
                         ? environmentVariables.frontendUrl
                         : true,
        credentials: true,
        methods:     ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
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
        //.addServer('', 'Production')
        .addServer(`http://localhost:${environmentVariables.port}`, 'Development')
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
