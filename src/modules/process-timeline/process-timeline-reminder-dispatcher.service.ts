import {Injectable, Logger} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {PrismaService} from '../prisma/prisma.service';
import {MailService} from '../../utils/mail/mail.service';
import {environmentVariables} from '../../config';
import {Prisma, TimelineStage} from '../../../generated/prisma/client';

const STAGE_LABELS: Record<TimelineStage, string> = {
    DEMANDA:      'Demanda',
    NOTIFICACION: 'Notificación',
    CONTESTACION: 'Contestación',
    AUDIENCIA:    'Audiencia',
    SENTENCIA:    'Sentencia',
    RECURSO:      'Recurso',
};

const REMINDER_INCLUDE = {
    comment: {
        include: {
            stage:   {select: {stage: true, microStageLabel: true, firmId: true}},
            process: {select: {id: true, title: true, reference: true}},
        },
    },
} satisfies Prisma.ProcessTimelineReminderInclude;

type ReminderWithContext = Prisma.ProcessTimelineReminderGetPayload<{include: typeof REMINDER_INCLUDE}>;

@Injectable()
export class ProcessTimelineReminderDispatcherService
{
    private readonly logger = new Logger(ProcessTimelineReminderDispatcherService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mail: MailService,
    ) {}

    @Cron(CronExpression.EVERY_30_MINUTES)
    async dispatchDueReminders(): Promise<void>
    {
        const due = await this.prisma.processTimelineReminder.findMany({
            where: {
                status:    'PENDING',
                deletedAt: null,
                remindAt:  {lte: new Date()},
                comment:   {deletedAt: null, stage: {deletedAt: null}},
            },
            include: REMINDER_INCLUDE,
        });

        if (due.length === 0) return;

        this.logger.log(`dispatchDueReminders → ${due.length} recordatorio(s) por enviar`);

        for (const reminder of due)
        {
            try { await this.sendReminder(reminder); }
            catch (error)
            {
                await this.markFailed(reminder.id, error);
                this.logger.error(`dispatchDueReminders → falló el recordatorio ${reminder.id}`, error as Error);
            }
        }
    }

    // Envío inmediato de un recordatorio puntual (opción "Ahora" al crearlo).
    async dispatchOne(reminderId: string): Promise<void>
    {
        const reminder = await this.prisma.processTimelineReminder.findFirst({
            where:   {id: reminderId, status: 'PENDING', deletedAt: null},
            include: REMINDER_INCLUDE,
        });
        if (!reminder) return;

        try { await this.sendReminder(reminder); }
        catch (error)
        {
            await this.markFailed(reminder.id, error);
            this.logger.error(`dispatchOne → falló el recordatorio ${reminder.id}`, error as Error);
        }
    }

    private async sendReminder(reminder: ReminderWithContext): Promise<void>
    {
        const optedOut = await this.prisma.user.findFirst({
            where: {
                email:             reminder.recipientEmail,
                deletedAt:         null,
                notificationPrefs: {emailProcessReminders: false},
                firmMemberships:   {some: {firmId: reminder.comment.stage.firmId, status: 'ACTIVE'}},
            },
            select: {id: true},
        });

        if (optedOut)
        {
            await this.prisma.processTimelineReminder.update({
                where: {id: reminder.id},
                data:  {status: 'CANCELLED', lastError: 'Destinatario desactivó los recordatorios de proceso'},
            });
            return;
        }

        const process = reminder.comment.process;

        await this.mail.sendTimelineReminderEmail(reminder.recipientEmail, {
            stageLabel:   STAGE_LABELS[reminder.comment.stage.stage],
            processLabel: process.reference ?? process.title,
            dueText:      this.buildDueText(reminder.comment.commentDate),
            commentHtml:  this.escapeHtml(reminder.comment.body),
            url:          `${environmentVariables.frontendUrl}/dashboard/processes/${process.id}`,
        });

        await this.prisma.processTimelineReminder.update({
            where: {id: reminder.id},
            data:  {status: 'SENT', sentAt: new Date()},
        });
    }

    private markFailed(reminderId: string, error: unknown): Promise<unknown>
    {
        return this.prisma.processTimelineReminder.update({
            where: {id: reminderId},
            data:  {status: 'FAILED', lastError: String(error).slice(0, 500)},
        }).catch(() => undefined);
    }

    private buildDueText(commentDate: Date | null): string
    {
        if (!commentDate) return 'el evento quedó registrado ahora';

        const diffDays = Math.round((commentDate.getTime() - Date.now()) / 86_400_000);

        if (diffDays < 0)   return `el evento fue hace ${Math.abs(diffDays)} día(s)`;
        if (diffDays === 0) return 'el evento es hoy';
        if (diffDays === 1) return 'el evento es mañana';
        return `el evento es en ${diffDays} días`;
    }

    private escapeHtml(value: string): string
    {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
    }
}
