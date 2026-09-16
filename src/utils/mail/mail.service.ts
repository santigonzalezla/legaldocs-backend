import {Injectable, InternalServerErrorException, Logger} from '@nestjs/common';
import {Resend} from 'resend';
import {environmentVariables} from '../../config';
import {EmailRenderer} from '../emails/email-renderer.service';

@Injectable()
export class MailService
{
    private readonly resend: Resend;
    private readonly from: string;
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly renderer: EmailRenderer)
    {
        this.resend = new Resend(environmentVariables.resendApiKey);
        this.from   = environmentVariables.resendFrom;
    }

    // ─── VERIFICATION ─────────────────────────────────────────────────────────────

    async sendVerificationEmail(email: string, name: string, token: string): Promise<void>
    {
        const url = `${environmentVariables.frontendUrl}/verify-email?token=${token}`;

        await this.send({
            to:      email,
            subject: 'Verifica tu cuenta — LegalDocs',
            html:    this.renderer.render('verification', {name, url}),
        });
    }

    // ─── PASSWORD RESET ───────────────────────────────────────────────────────────

    async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void>
    {
        const url = `${environmentVariables.frontendUrl}/reset-password?token=${token}`;

        await this.send({
            to:      email,
            subject: 'Restablece tu contraseña — LegalDocs',
            html:    this.renderer.render('password-reset', {name, url}),
        });
    }

    // ─── FIRM INVITATION ──────────────────────────────────────────────────────────

    async sendFirmInvitationEmail(email: string, inviterName: string, firmName: string, token: string): Promise<void>
    {
        const url = `${environmentVariables.frontendUrl}/invite?token=${token}&email=${encodeURIComponent(email)}`;

        await this.send({
            to:      email,
            subject: `${inviterName} te invitó a ${firmName} — LegalDocs`,
            html:    this.renderer.render('firm-invitation', {inviterName, firmName, url}),
        });
    }

    // ─── PROVISIONED ACCESS ───────────────────────────────────────────────────────

    async sendProvisionedInviteEmail(
        email: string,
        inviterName: string,
        firmName: string,
        activationUrl: string,
    ): Promise<void>
    {
        await this.send({
            to:      email,
            subject: `Tu cuenta en LegalDocs está lista`,
            html:    this.renderer.render('provisioned-invite', {inviterName, firmName, activationUrl}),
        });
    }

    async sendFirmAddedEmail(email: string, inviterName: string, firmName: string, loginUrl: string): Promise<void>
    {
        await this.send({
            to:      email,
            subject: `Ahora tienes acceso a ${firmName} — LegalDocs`,
            html:    this.renderer.render('firm-added', {inviterName, firmName, loginUrl}),
        });
    }

    // ─── TIMELINE REMINDER ───────────────────────────────────────────────────────

    async sendTimelineReminderEmail(
        to: string,
        ctx: {stageLabel: string; processLabel: string; dueText: string; commentHtml: string; url: string},
    ): Promise<void>
    {
        await this.send({
            to,
            subject: `Recordatorio — ${ctx.processLabel}`,
            html:    this.renderer.render('timeline-reminder', ctx),
        });
    }

    // ─── PRIVATE ──────────────────────────────────────────────────────────────────

    private async send(payload: {to: string; subject: string; html: string}): Promise<void>
    {
        try
        {
            const {error} = await this.resend.emails.send({
                from:    this.from,
                to:      payload.to,
                subject: payload.subject,
                html:    payload.html,
            });

            if (error)
            {
                this.logger.error(`Resend error: ${error.message}`);
                throw new InternalServerErrorException('Error al enviar el correo electrónico');
            }
        }
        catch (error)
        {
            if (error instanceof InternalServerErrorException) throw error;
            this.logger.error(`Mail send failed: ${error}`);
            throw new InternalServerErrorException('Error al enviar el correo electrónico');
        }
    }
}
