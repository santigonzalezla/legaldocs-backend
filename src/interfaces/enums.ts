export enum FirmMemberRole {
    ADMIN     = 'ADMIN',
    LAWYER    = 'LAWYER',
    ASSISTANT = 'ASSISTANT',
    INTERN    = 'INTERN',
}

export enum FirmMemberStatus {
    ACTIVE   = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    PENDING  = 'PENDING',
}

export enum DocumentStatus {
    DRAFT     = 'DRAFT',
    COMPLETED = 'COMPLETED',
    REVISION  = 'REVISION',
    ARCHIVED  = 'ARCHIVED',
}

export enum TemplateOrigin {
    SYSTEM      = 'SYSTEM',
    FIRM_CUSTOM = 'FIRM_CUSTOM',
    FIRM_COPY   = 'FIRM_COPY',
}

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO  = 'INFO',
    WARN  = 'WARN',
    ERROR = 'ERROR',
    FATAL = 'FATAL',
}

export enum LogContext {
    AUTH            = 'AUTH',
    USER_MANAGEMENT = 'USER_MANAGEMENT',
    DOCUMENTS       = 'DOCUMENTS',
    TEMPLATES       = 'TEMPLATES',
    FIRM            = 'FIRM',
    SUBSCRIPTIONS   = 'SUBSCRIPTIONS',
    SYSTEM          = 'SYSTEM',
    SECURITY        = 'SECURITY',
}

export enum ActionType {
    CREATE  = 'CREATE',
    READ    = 'READ',
    UPDATE  = 'UPDATE',
    DELETE  = 'DELETE',
    LOGIN   = 'LOGIN',
    LOGOUT  = 'LOGOUT',
    EXPORT  = 'EXPORT',
    IMPORT  = 'IMPORT',
    RESTORE = 'RESTORE',
}
