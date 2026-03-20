import 'dotenv/config';
import * as joi from 'joi';

interface EnvironmentVariables
{
    PORT: number;
    NODE_ENV: 'development' | 'production' | 'test';
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_TOKEN_EXPIRATION: string;
    JWT_REFRESH_TOKEN_EXPIRATION: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_CALLBACK_URL: string;
    MICROSOFT_CLIENT_ID: string;
    MICROSOFT_CLIENT_SECRET: string;
    MICROSOFT_CALLBACK_URL: string;
    FRONTEND_URL: string;
    RESEND_API_KEY: string;
    RESEND_FROM: string;
}

const environmentSchema = joi.object({
    PORT: joi.number().required(),
    NODE_ENV: joi.string().required(),
    DATABASE_URL: joi.string().uri().required(),
    JWT_SECRET: joi.string().required(),
    JWT_REFRESH_SECRET: joi.string().required(),
    JWT_ACCESS_TOKEN_EXPIRATION: joi.string().required(),
    JWT_REFRESH_TOKEN_EXPIRATION: joi.string().required(),
    GOOGLE_CLIENT_ID: joi.string().required(),
    GOOGLE_CLIENT_SECRET: joi.string().required(),
    GOOGLE_CALLBACK_URL: joi.string().required(),
    MICROSOFT_CLIENT_ID: joi.string().required(),
    MICROSOFT_CLIENT_SECRET: joi.string().required(),
    MICROSOFT_CALLBACK_URL: joi.string().required(),
    FRONTEND_URL: joi.string().required(),
    RESEND_API_KEY: joi.string().required(),
    RESEND_FROM: joi.string().email().required(),
}).unknown();

const {error, value} = environmentSchema.validate({...process.env});

if (error) throw new Error(`Invalid environment variables: ${error.message}`);

const env: EnvironmentVariables = value;

export const environmentVariables = {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    databaseUrl: env.DATABASE_URL,
    jwtSecret: env.JWT_SECRET,
    jwtRefreshSecret: env.JWT_REFRESH_SECRET,
    jwtAccessTokenExpiration: env.JWT_ACCESS_TOKEN_EXPIRATION,
    jwtRefreshTokenExpiration: env.JWT_REFRESH_TOKEN_EXPIRATION,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    googleCallbackUrl: env.GOOGLE_CALLBACK_URL,
    microsoftClientId: env.MICROSOFT_CLIENT_ID,
    microsoftClientSecret: env.MICROSOFT_CLIENT_SECRET,
    microsoftCallbackUrl: env.MICROSOFT_CALLBACK_URL,
    frontendUrl: env.FRONTEND_URL,
    resendApiKey: env.RESEND_API_KEY,
    resendFrom: env.RESEND_FROM,
};
