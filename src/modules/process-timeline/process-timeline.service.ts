import {
    BadRequestException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {FirmService} from '../firm/firm.service';
import {ProcessTimelineReminderDispatcherService} from './process-timeline-reminder-dispatcher.service';
import {StorageService} from '../../utils/storage/storage.service';
import {buildStorageKey} from '../../utils/storage/storage-key.util';
import {ProcessTimelineAttachmentType, StorageObjectArea, TimelineStage} from '../../../generated/prisma/client';
import {CreateTimelineStageDto} from './dto/create-timeline-stage.dto';
import {UpdateTimelineStageDto} from './dto/update-timeline-stage.dto';
import {CreateTimelineCommentDto} from './dto/create-timeline-comment.dto';
import {UpdateTimelineCommentDto} from './dto/update-timeline-comment.dto';
import {CreateTimelineReminderDto} from './dto/create-timeline-reminder.dto';
import {UpdateTimelineReminderDto} from './dto/update-timeline-reminder.dto';
import {TimelineFiltersDto} from './dto/timeline-filters.dto';
import {ProcessTimelineStageEntity} from './entities/process-timeline-stage.entity';
import {ProcessTimelineStageWithRelationsEntity} from './entities/process-timeline-stage-with-relations.entity';
import {ProcessTimelineCommentEntity} from './entities/process-timeline-comment.entity';
import {ProcessTimelineAttachmentEntity} from './entities/process-timeline-attachment.entity';
import {ProcessTimelineReminderEntity} from './entities/process-timeline-reminder.entity';

// Flujo secuencial de etapas: se puede empezar en cualquiera y saltar hacia adelante,
// nunca retroceder ni repetir.
export const STAGE_ORDER: Record<TimelineStage, number> = {
    DEMANDA:      1,
    NOTIFICACION: 2,
    CONTESTACION: 3,
    AUDIENCIA:    4,
    SENTENCIA:    5,
    RECURSO:      6,
};

const ALLOWED_MIME = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// remindAt del recordatorio: offset 0 = "ahora"; con anticipo requiere fecha de evento.
const computeRemindAt = (commentDate: Date | null, offsetMinutes: number): Date =>
{
    if (offsetMinutes === 0) return new Date();
    if (!commentDate)
        throw new BadRequestException('Para un anticipo el comentario debe tener fecha de evento futura. Si no, elegí "Ahora".');
    return new Date(commentDate.getTime() - offsetMinutes * 60_000);
};

@Injectable()
export class ProcessTimelineService
{
    private readonly logger = new Logger(ProcessTimelineService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly firmService: FirmService,
        private readonly storage: StorageService,
        private readonly dispatcher: ProcessTimelineReminderDispatcherService,
    ) {}

    // ─── ETAPAS ──────────────────────────────────────────────────────────────

    async listStages(userId: string, processId: string, firmId?: string, filters: TimelineFiltersDto = {}): Promise<ProcessTimelineStageWithRelationsEntity[]>
    {
        try
        {
            await this.findFirmProcess(userId, processId, firmId);

            const search = filters.search?.trim();

            return this.prisma.processTimelineStage.findMany({
                where: {processId, deletedAt: null},
                include: {
                    comments: {
                        where: {
                            deletedAt: null,
                            ...(search && {body: {contains: search, mode: 'insensitive' as const}}),
                        },
                        orderBy: {createdAt: 'asc'},
                        include: {
                            creator:     {select: {id: true, firstName: true, lastName: true, email: true}},
                            responsible: {select: {id: true, user: {select: {firstName: true, lastName: true, email: true}}}},
                            attachments: {where: {deletedAt: null}, orderBy: {createdAt: 'asc'}},
                            reminders:   {where: {deletedAt: null}, orderBy: {remindAt: 'asc'}},
                        },
                    },
                },
                orderBy: {createdAt: 'asc'},
            }) as unknown as Promise<ProcessTimelineStageWithRelationsEntity[]>;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`listStages → failed processId=${processId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async createStage(userId: string, processId: string, dto: CreateTimelineStageDto, firmId?: string): Promise<ProcessTimelineStageEntity & {firstCommentId: string | null}>
    {
        try
        {
            const process = await this.findFirmProcess(userId, processId, firmId);

            const stages = await this.prisma.processTimelineStage.findMany({
                where:   {processId, deletedAt: null},
                orderBy: {createdAt: 'asc'},
                include: {_count: {select: {comments: {where: {deletedAt: null}}}}},
            });

            const isAdvance = stages.length > 0;

            if (isAdvance)
            {
                const current    = stages[stages.length - 1];
                const currentMax  = Math.max(...stages.map(stage => STAGE_ORDER[stage.stage]));

                if (STAGE_ORDER[dto.stage] <= currentMax)
                    throw new BadRequestException('No se puede retroceder ni repetir la etapa. Elegí una etapa posterior a la actual.');

                if (current._count.comments === 0)
                    throw new BadRequestException('Agregá al menos un comentario en la etapa actual antes de avanzar.');

                if (!dto.firstComment?.body?.trim())
                    throw new BadRequestException('Al avanzar de etapa registrá un comentario o un adjunto.');
            }

            const stageData = {
                stage:           dto.stage,
                microStageLabel: dto.microStageLabel ?? null,
                processId:       process.id,
                firmId:          process.firmId,
                createdBy:       userId,
            };

            // Al avanzar, la etapa y su primer comentario se crean juntos.
            if (isAdvance && dto.firstComment)
            {
                const [stage, comment] = await this.prisma.$transaction(async tx =>
                {
                    const createdStage = await tx.processTimelineStage.create({data: stageData});
                    const createdComment = await tx.processTimelineComment.create({
                        data: {
                            stageId:       createdStage.id,
                            processId:     process.id,
                            body:          dto.firstComment!.body,
                            commentDate:   dto.firstComment!.commentDate ?? null,
                            responsibleId: dto.firstComment!.responsibleId ?? null,
                            createdBy:     userId,
                        },
                    });
                    return [createdStage, createdComment] as const;
                });

                this.logger.log(`createStage → success (avance) processId=${processId} stage=${dto.stage} id=${stage.id} comment=${comment.id}`);
                return {...stage, firstCommentId: comment.id};
            }

            const result = await this.prisma.processTimelineStage.create({data: stageData});
            this.logger.log(`createStage → success processId=${processId} stage=${dto.stage} id=${result.id}`);
            return {...result, firstCommentId: null};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`createStage → failed processId=${processId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async updateStage(userId: string, processId: string, stageId: string, dto: UpdateTimelineStageDto, firmId?: string): Promise<ProcessTimelineStageEntity>
    {
        try
        {
            await this.findFirmStage(userId, processId, stageId, firmId);

            const result = await this.prisma.processTimelineStage.update({
                where: {id: stageId},
                data:  {microStageLabel: dto.microStageLabel ?? null},
            });

            this.logger.log(`updateStage → success id=${stageId}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`updateStage → failed id=${stageId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async removeStage(userId: string, processId: string, stageId: string, firmId?: string): Promise<{message: string}>
    {
        try
        {
            await this.findFirmStage(userId, processId, stageId, firmId);

            const stages = await this.prisma.processTimelineStage.findMany({
                where:   {processId, deletedAt: null},
                orderBy: {createdAt: 'asc'},
            });
            const last = stages[stages.length - 1];
            if (!last || last.id !== stageId)
                throw new BadRequestException('Solo se puede eliminar la última etapa del proceso.');

            const commentIds = (await this.prisma.processTimelineComment.findMany({
                where:  {stageId, deletedAt: null},
                select: {id: true},
            })).map(comment => comment.id);

            if (commentIds.length > 0)
            {
                const attachments = await this.prisma.processTimelineAttachment.findMany({
                    where:  {commentId: {in: commentIds}, deletedAt: null},
                    select: {fileKey: true},
                });
                await Promise.all(attachments.map(attachment =>
                    this.storage.delete(attachment.fileKey).catch(deleteError =>
                        this.logger.warn(`removeStage → no se pudo borrar de R2 ${attachment.fileKey}: ${deleteError}`),
                    ),
                ));
            }

            const now = new Date();
            await this.prisma.$transaction([
                this.prisma.processTimelineStage.update({where: {id: stageId}, data: {deletedAt: now}}),
                this.prisma.processTimelineComment.updateMany({where: {stageId, deletedAt: null}, data: {deletedAt: now}}),
                this.prisma.processTimelineAttachment.updateMany({where: {commentId: {in: commentIds}, deletedAt: null}, data: {deletedAt: now}}),
                this.prisma.processTimelineReminder.updateMany({where: {commentId: {in: commentIds}, deletedAt: null}, data: {deletedAt: now}}),
            ]);

            this.logger.log(`removeStage → success id=${stageId} (comentarios: ${commentIds.length})`);
            return {message: 'Etapa eliminada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`removeStage → failed id=${stageId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── COMENTARIOS ─────────────────────────────────────────────────────────

    async listComments(userId: string, processId: string, stageId: string, firmId?: string): Promise<ProcessTimelineCommentEntity[]>
    {
        try
        {
            await this.findFirmStage(userId, processId, stageId, firmId);

            return this.prisma.processTimelineComment.findMany({
                where:   {stageId, deletedAt: null},
                orderBy: {createdAt: 'asc'},
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`listComments → failed stageId=${stageId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async createComment(userId: string, processId: string, stageId: string, dto: CreateTimelineCommentDto, firmId?: string): Promise<ProcessTimelineCommentEntity>
    {
        try
        {
            const {stage} = await this.findFirmStage(userId, processId, stageId, firmId);

            const result = await this.prisma.processTimelineComment.create({
                data: {
                    stageId,
                    processId:     stage.processId,
                    body:          dto.body,
                    commentDate:   dto.commentDate ?? null,
                    responsibleId: dto.responsibleId ?? null,
                    createdBy:     userId,
                },
            });

            this.logger.log(`createComment → success stageId=${stageId} id=${result.id}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`createComment → failed stageId=${stageId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async updateComment(userId: string, processId: string, stageId: string, commentId: string, dto: UpdateTimelineCommentDto, firmId?: string): Promise<ProcessTimelineCommentEntity>
    {
        try
        {
            await this.findFirmComment(userId, processId, stageId, commentId, firmId);

            const result = await this.prisma.processTimelineComment.update({
                where: {id: commentId},
                data: {
                    ...(dto.body !== undefined && {body: dto.body}),
                    ...(dto.commentDate !== undefined && {commentDate: dto.commentDate}),
                    ...(dto.responsibleId !== undefined && {responsibleId: dto.responsibleId ?? null}),
                },
            });

            // Si cambió la fecha del evento, recalcular (o cancelar) los recordatorios con anticipo pendientes.
            if (dto.commentDate !== undefined)
            {
                const pending = await this.prisma.processTimelineReminder.findMany({
                    where:  {commentId, status: 'PENDING', deletedAt: null, offsetMinutes: {gt: 0}},
                    select: {id: true, offsetMinutes: true},
                });
                await Promise.all(pending.map(reminder =>
                    this.prisma.processTimelineReminder.update({
                        where: {id: reminder.id},
                        data:  result.commentDate
                            ? {remindAt: new Date(result.commentDate.getTime() - reminder.offsetMinutes * 60_000)}
                            : {status: 'CANCELLED', lastError: 'Se quitó la fecha del evento del comentario'},
                    }),
                ));
            }

            this.logger.log(`updateComment → success id=${commentId}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`updateComment → failed id=${commentId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async removeComment(userId: string, processId: string, stageId: string, commentId: string, firmId?: string): Promise<{message: string}>
    {
        try
        {
            await this.findFirmComment(userId, processId, stageId, commentId, firmId);

            const attachments = await this.prisma.processTimelineAttachment.findMany({
                where:  {commentId, deletedAt: null},
                select: {fileKey: true},
            });
            await Promise.all(attachments.map(attachment =>
                this.storage.delete(attachment.fileKey).catch(deleteError =>
                    this.logger.warn(`removeComment → no se pudo borrar de R2 ${attachment.fileKey}: ${deleteError}`),
                ),
            ));

            const now = new Date();
            await this.prisma.$transaction([
                this.prisma.processTimelineComment.update({where: {id: commentId}, data: {deletedAt: now}}),
                this.prisma.processTimelineAttachment.updateMany({where: {commentId, deletedAt: null}, data: {deletedAt: now}}),
                this.prisma.processTimelineReminder.updateMany({where: {commentId, deletedAt: null}, data: {deletedAt: now}}),
            ]);

            this.logger.log(`removeComment → success id=${commentId}`);
            return {message: 'Comentario eliminado correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`removeComment → failed id=${commentId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── ADJUNTOS DEL COMENTARIO ─────────────────────────────────────────────

    async listAttachments(userId: string, processId: string, stageId: string, commentId: string, firmId?: string): Promise<ProcessTimelineAttachmentEntity[]>
    {
        try
        {
            await this.findFirmComment(userId, processId, stageId, commentId, firmId);

            return this.prisma.processTimelineAttachment.findMany({
                where:   {commentId, deletedAt: null},
                orderBy: {createdAt: 'asc'},
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`listAttachments → failed commentId=${commentId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async uploadAttachment(userId: string, processId: string, stageId: string, commentId: string, type: ProcessTimelineAttachmentType = 'OTHER' as ProcessTimelineAttachmentType, file?: Express.Multer.File, firmId?: string): Promise<ProcessTimelineAttachmentEntity>
    {
        try
        {
            const {process, stage, comment} = await this.findFirmComment(userId, processId, stageId, commentId, firmId);

            if (!file) throw new BadRequestException('Debes adjuntar un archivo');
            if (!ALLOWED_MIME.includes(file.mimetype))
                throw new BadRequestException('Formato no permitido. Use PDF, DOCX, JPG o PNG.');
            if (file.size > MAX_FILE_SIZE)
                throw new BadRequestException('El archivo no puede superar los 10MB.');

            const processRef = process.reference?.trim() || `proceso-${process.numId}`;
            const fileKey = buildStorageKey(
                [process.firmId, 'procesos', processRef, 'linea-tiempo', `etapa-${stage.numId}-${stage.stage}`, `comentario-${comment.numId}`],
                file.originalname,
            );
            const fileUrl = await this.storage.upload(fileKey, file.buffer, file.mimetype, {
                firmId:     process.firmId,
                area:       StorageObjectArea.TIMELINE_ATTACHMENT,
                ownerType:  'process_timeline_comment',
                ownerId:    commentId,
                uploadedBy: userId,
                fileName:   file.originalname,
                sizeBytes:  file.size,
            });

            const result = await this.prisma.processTimelineAttachment.create({
                data: {
                    commentId,
                    uploadedBy: userId,
                    type,
                    fileKey,
                    fileUrl,
                    fileName: file.originalname,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                },
            });

            this.logger.log(`uploadAttachment → success commentId=${commentId} id=${result.id}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`uploadAttachment → failed commentId=${commentId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async removeAttachment(userId: string, processId: string, stageId: string, commentId: string, attachmentId: string, firmId?: string): Promise<{message: string}>
    {
        try
        {
            await this.findFirmComment(userId, processId, stageId, commentId, firmId);

            const attachment = await this.prisma.processTimelineAttachment.findFirst({where: {id: attachmentId, commentId, deletedAt: null}});
            if (!attachment) throw new NotFoundException('Adjunto no encontrado');

            await this.storage.delete(attachment.fileKey);
            await this.prisma.processTimelineAttachment.update({where: {id: attachmentId}, data: {deletedAt: new Date()}});

            this.logger.log(`removeAttachment → success id=${attachmentId}`);
            return {message: 'Adjunto eliminado correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`removeAttachment → failed id=${attachmentId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── RECORDATORIOS DEL COMENTARIO ────────────────────────────────────────

    async createReminder(userId: string, processId: string, stageId: string, commentId: string, dto: CreateTimelineReminderDto, firmId?: string): Promise<ProcessTimelineReminderEntity>
    {
        try
        {
            const {process, comment} = await this.findFirmComment(userId, processId, stageId, commentId, firmId);

            await this.assertRecipientIsFirmMember(process.firmId, dto.recipientEmail);

            const remindAt = computeRemindAt(comment.commentDate, dto.offsetMinutes);
            if (dto.offsetMinutes > 0 && remindAt.getTime() <= Date.now())
                throw new BadRequestException('El recordatorio quedaría en el pasado. Usá un anticipo menor o una fecha de evento futura.');

            const result = await this.prisma.processTimelineReminder.create({
                data: {
                    commentId,
                    processId:      comment.processId,
                    channel:        dto.channel ?? 'EMAIL',
                    offsetMinutes:  dto.offsetMinutes,
                    remindAt,
                    recipientEmail: dto.recipientEmail,
                    createdBy:      userId,
                },
            });

            // offset 0 = "Ahora": se envía de inmediato, sin esperar al cron.
            if (dto.offsetMinutes === 0)
                this.dispatcher.dispatchOne(result.id).catch(sendError =>
                    this.logger.warn(`createReminder → envío inmediato falló ${result.id}: ${sendError}`),
                );

            this.logger.log(`createReminder → success commentId=${commentId} id=${result.id} offset=${dto.offsetMinutes}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`createReminder → failed commentId=${commentId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async updateReminder(userId: string, processId: string, stageId: string, commentId: string, reminderId: string, dto: UpdateTimelineReminderDto, firmId?: string): Promise<ProcessTimelineReminderEntity>
    {
        try
        {
            const {process, comment} = await this.findFirmComment(userId, processId, stageId, commentId, firmId);

            const reminder = await this.prisma.processTimelineReminder.findFirst({where: {id: reminderId, commentId, deletedAt: null}});
            if (!reminder) throw new NotFoundException('Recordatorio no encontrado');

            if (dto.recipientEmail !== undefined)
                await this.assertRecipientIsFirmMember(process.firmId, dto.recipientEmail);

            const offsetMinutes = dto.offsetMinutes ?? reminder.offsetMinutes;

            const result = await this.prisma.processTimelineReminder.update({
                where: {id: reminderId},
                data: {
                    ...(dto.offsetMinutes !== undefined && {offsetMinutes, remindAt: computeRemindAt(comment.commentDate, offsetMinutes)}),
                    ...(dto.recipientEmail !== undefined && {recipientEmail: dto.recipientEmail}),
                    ...(dto.status !== undefined && {status: dto.status, ...(dto.status === 'PENDING' && {sentAt: null, lastError: null})}),
                },
            });

            if (dto.offsetMinutes === 0)
                this.dispatcher.dispatchOne(result.id).catch(sendError =>
                    this.logger.warn(`updateReminder → envío inmediato falló ${result.id}: ${sendError}`),
                );

            this.logger.log(`updateReminder → success id=${reminderId}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`updateReminder → failed id=${reminderId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async removeReminder(userId: string, processId: string, stageId: string, commentId: string, reminderId: string, firmId?: string): Promise<{message: string}>
    {
        try
        {
            await this.findFirmComment(userId, processId, stageId, commentId, firmId);

            const reminder = await this.prisma.processTimelineReminder.findFirst({where: {id: reminderId, commentId, deletedAt: null}});
            if (!reminder) throw new NotFoundException('Recordatorio no encontrado');

            await this.prisma.processTimelineReminder.update({where: {id: reminderId}, data: {deletedAt: new Date()}});

            this.logger.log(`removeReminder → success id=${reminderId}`);
            return {message: 'Recordatorio eliminado correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`removeReminder → failed id=${reminderId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────

    // Ownership + firm-scope del proceso. Mismo patrón que ProcessService.findFirmProcess.
    private async findFirmProcess(userId: string, processId: string, firmId?: string)
    {
        const firm = await this.firmService.getMyFirm(userId, firmId);
        const process = await this.prisma.legalProcess.findFirst({
            where: {id: processId, firmId: firm.id, deletedAt: null},
        });
        if (!process) throw new NotFoundException('Proceso no encontrado');
        return process;
    }

    private async findFirmStage(userId: string, processId: string, stageId: string, firmId?: string)
    {
        const process = await this.findFirmProcess(userId, processId, firmId);
        const stage = await this.prisma.processTimelineStage.findFirst({
            where: {id: stageId, processId: process.id, deletedAt: null},
        });
        if (!stage) throw new NotFoundException('Etapa de la línea de tiempo no encontrada');
        return {process, stage};
    }

    private async findFirmComment(userId: string, processId: string, stageId: string, commentId: string, firmId?: string)
    {
        const {process, stage} = await this.findFirmStage(userId, processId, stageId, firmId);
        const comment = await this.prisma.processTimelineComment.findFirst({
            where: {id: commentId, stageId: stage.id, deletedAt: null},
        });
        if (!comment) throw new NotFoundException('Comentario de la línea de tiempo no encontrado');
        return {process, stage, comment};
    }

    // El destinatario del recordatorio debe ser un miembro activo del despacho con cuenta.
    private async assertRecipientIsFirmMember(firmId: string, email: string): Promise<void>
    {
        const member = await this.prisma.firmMember.findFirst({
            where:  {firmId, status: 'ACTIVE', user: {email, deletedAt: null}},
            select: {id: true},
        });
        if (!member)
            throw new BadRequestException('El correo debe ser de un miembro activo del despacho.');
    }
}
