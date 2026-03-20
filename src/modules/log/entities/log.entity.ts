import {ActionType, Log, LogContext, LogLevel} from '../../../../generated/prisma/client';

export class LogEntity implements Log
{
    id: string;
    numId: number;
    userId: string | null;
    level: LogLevel;
    context: LogContext;
    action: ActionType;
    message: string;
    description: string | null;
    method: string | null;
    url: string | null;
    statusCode: number | null;
    responseTimeMs: number | null;
    ipAddress: string | null;
    userAgent: string | null;
    requestId: string | null;
    sessionId: string | null;
    additionalData: any;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}
