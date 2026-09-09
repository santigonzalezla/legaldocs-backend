import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import {ApiConsumes, ApiHeader, ApiOperation, ApiProperty, ApiTags} from '@nestjs/swagger';
import {Throttle} from '@nestjs/throttler';
import {IsEnum} from 'class-validator';
import {buildUploadInterceptor} from '../../utils/storage/upload.interceptor';
import {ProcessTimelineService} from './process-timeline.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from '../firm/decorators/firm-id.decorator';
import {Permission} from '../permissions/decorators/permission.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {CreateTimelineStageDto} from './dto/create-timeline-stage.dto';
import {UpdateTimelineStageDto} from './dto/update-timeline-stage.dto';
import {CreateTimelineCommentDto} from './dto/create-timeline-comment.dto';
import {UpdateTimelineCommentDto} from './dto/update-timeline-comment.dto';
import {CreateTimelineReminderDto} from './dto/create-timeline-reminder.dto';
import {UpdateTimelineReminderDto} from './dto/update-timeline-reminder.dto';
import {TimelineFiltersDto} from './dto/timeline-filters.dto';
import {ProcessTimelineAttachmentType} from '../../../generated/prisma/client';

class UploadTimelineAttachmentDto
{
    @IsEnum(ProcessTimelineAttachmentType)
    @ApiProperty({description: 'Tipo del documento adjunto al comentario', enum: ProcessTimelineAttachmentType})
    type: ProcessTimelineAttachmentType;
}

@ApiTags('Process Timeline')
@ApiHeader({name: 'X-Firm-Id', required: false, description: 'ID de la firma activa (selector de workspace)'})
@Controller('process/:processId/timeline')
export class ProcessTimelineController
{
    constructor(private readonly timeline: ProcessTimelineService) {}

    // ─── ETAPAS ──────────────────────────────────────────────────────────────

    @Get()
    @Permission('processes:view', 'Ver procesos legales')
    @ApiOperation({summary: 'Listar las etapas (con sus comentarios) de la línea de tiempo del proceso'})
    async listStages(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('processId') processId: string, @Query() filters: TimelineFiltersDto = {})
    {
        return this.timeline.listStages(user.userId, processId, firmId, filters);
    }

    @Post()
    @Permission('processes:edit', 'Editar procesos legales')
    @ApiOperation({summary: 'Registrar la primera etapa o avanzar a una etapa posterior'})
    async createStage(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('processId') processId: string, @Body() dto: CreateTimelineStageDto)
    {
        return this.timeline.createStage(user.userId, processId, dto, firmId);
    }

    @Patch(':stageId')
    @Permission('processes:edit', 'Editar procesos legales')
    @ApiOperation({summary: 'Actualizar la micro etapa de una etapa'})
    async updateStage(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('processId') processId: string, @Param('stageId') stageId: string, @Body() dto: UpdateTimelineStageDto)
    {
        return this.timeline.updateStage(user.userId, processId, stageId, dto, firmId);
    }

    @Delete(':stageId')
    @Permission('processes:edit', 'Editar procesos legales')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar la última etapa del proceso (deshacer avance)'})
    async removeStage(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('processId') processId: string, @Param('stageId') stageId: string)
    {
        return this.timeline.removeStage(user.userId, processId, stageId, firmId);
    }

    // ─── COMENTARIOS ─────────────────────────────────────────────────────────

    @Get(':stageId/comments')
    @Permission('processes:view', 'Ver procesos legales')
    @ApiOperation({summary: 'Listar los comentarios de una etapa'})
    async listComments(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('processId') processId: string, @Param('stageId') stageId: string)
    {
        return this.timeline.listComments(user.userId, processId, stageId, firmId);
    }

    @Post(':stageId/comments')
    @Permission('processes:edit', 'Editar procesos legales')
    @ApiOperation({summary: 'Agregar un comentario / observación a una etapa'})
    async createComment(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('processId') processId: string, @Param('stageId') stageId: string, @Body() dto: CreateTimelineCommentDto)
    {
        return this.timeline.createComment(user.userId, processId, stageId, dto, firmId);
    }

    @Patch(':stageId/comments/:commentId')
    @Permission('processes:edit', 'Editar procesos legales')
    @ApiOperation({summary: 'Actualizar un comentario de una etapa'})
    async updateComment(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('processId') processId: string, @Param('stageId') stageId: string, @Param('commentId') commentId: string, @Body() dto: UpdateTimelineCommentDto)
    {
        return this.timeline.updateComment(user.userId, processId, stageId, commentId, dto, firmId);
    }

    @Delete(':stageId/comments/:commentId')
    @Permission('processes:edit', 'Editar procesos legales')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar un comentario de una etapa'})
    async removeComment(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('processId') processId: string, @Param('stageId') stageId: string, @Param('commentId') commentId: string)
    {
        return this.timeline.removeComment(user.userId, processId, stageId, commentId, firmId);
    }

    // ─── ADJUNTOS DEL COMENTARIO ─────────────────────────────────────────────

    @Get(':stageId/comments/:commentId/attachments')
    @Permission('processes:view', 'Ver procesos legales')
    @ApiOperation({summary: 'Listar los adjuntos de un comentario'})
    async listAttachments(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('processId') processId: string, @Param('stageId') stageId: string, @Param('commentId') commentId: string)
    {
        return this.timeline.listAttachments(user.userId, processId, stageId, commentId, firmId);
    }

    @Post(':stageId/comments/:commentId/attachments')
    @Permission('processes:edit', 'Editar procesos legales')
    @Throttle({default: {limit: 30, ttl: 60_000}})
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(buildUploadInterceptor(10 * 1024 * 1024))
    @ApiOperation({summary: 'Adjuntar un documento a un comentario'})
    async uploadAttachment(
        @CurrentUser() user: LoggedUser,
        @FirmId() firmId: string | undefined,
        @Param('processId') processId: string,
        @Param('stageId') stageId: string,
        @Param('commentId') commentId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadTimelineAttachmentDto,
    )
    {
        return this.timeline.uploadAttachment(user.userId, processId, stageId, commentId, dto.type, file, firmId);
    }

    @Delete(':stageId/comments/:commentId/attachments/:attachmentId')
    @Permission('processes:edit', 'Editar procesos legales')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar un adjunto de un comentario'})
    async removeAttachment(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('processId') processId: string, @Param('stageId') stageId: string, @Param('commentId') commentId: string, @Param('attachmentId') attachmentId: string)
    {
        return this.timeline.removeAttachment(user.userId, processId, stageId, commentId, attachmentId, firmId);
    }

    // ─── RECORDATORIOS DEL COMENTARIO ────────────────────────────────────────

    @Post(':stageId/comments/:commentId/reminders')
    @Permission('processes:edit', 'Editar procesos legales')
    @ApiOperation({summary: 'Crear un recordatorio para un comentario'})
    async createReminder(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('processId') processId: string, @Param('stageId') stageId: string, @Param('commentId') commentId: string, @Body() dto: CreateTimelineReminderDto)
    {
        return this.timeline.createReminder(user.userId, processId, stageId, commentId, dto, firmId);
    }

    @Patch(':stageId/comments/:commentId/reminders/:reminderId')
    @Permission('processes:edit', 'Editar procesos legales')
    @ApiOperation({summary: 'Actualizar un recordatorio de un comentario'})
    async updateReminder(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('processId') processId: string, @Param('stageId') stageId: string, @Param('commentId') commentId: string, @Param('reminderId') reminderId: string, @Body() dto: UpdateTimelineReminderDto)
    {
        return this.timeline.updateReminder(user.userId, processId, stageId, commentId, reminderId, dto, firmId);
    }

    @Delete(':stageId/comments/:commentId/reminders/:reminderId')
    @Permission('processes:edit', 'Editar procesos legales')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar un recordatorio de un comentario'})
    async removeReminder(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('processId') processId: string, @Param('stageId') stageId: string, @Param('commentId') commentId: string, @Param('reminderId') reminderId: string)
    {
        return this.timeline.removeReminder(user.userId, processId, stageId, commentId, reminderId, firmId);
    }
}
