import {ProcessTimelineStageEntity} from './process-timeline-stage.entity';
import {ProcessTimelineCommentEntity} from './process-timeline-comment.entity';
import {ProcessTimelineAttachmentEntity} from './process-timeline-attachment.entity';
import {ProcessTimelineReminderEntity} from './process-timeline-reminder.entity';
import {TimelineResponsibleRefEntity} from './timeline-responsible-ref.entity';

// Comentario enriquecido: quien lo registró + responsable + adjuntos + recordatorios.
export class ProcessTimelineCommentWithRelationsEntity extends ProcessTimelineCommentEntity
{
    creator:     {id: string; firstName: string; lastName: string; email: string};
    responsible: TimelineResponsibleRefEntity | null;
    attachments: ProcessTimelineAttachmentEntity[];
    reminders:   ProcessTimelineReminderEntity[];
}

// Forma que devuelve el GET /timeline: etapa + sus comentarios enriquecidos.
export class ProcessTimelineStageWithRelationsEntity extends ProcessTimelineStageEntity
{
    comments: ProcessTimelineCommentWithRelationsEntity[];
}
