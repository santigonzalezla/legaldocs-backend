import {Injectable, InternalServerErrorException, Logger} from '@nestjs/common';
import {Resend} from 'resend';
import {environmentVariables} from '../../config';

@Injectable()
export class MailService
{
    private readonly resend: Resend;
    private readonly from: string;
    private readonly logger = new Logger(MailService.name);

    constructor()
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
            html:    this.verificationTemplate(name, url),
        });
    }

    // ─── PASSWORD RESET ───────────────────────────────────────────────────────────

    async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void>
    {
        const url = `${environmentVariables.frontendUrl}/reset-password?token=${token}`;

        await this.send({
            to:      email,
            subject: 'Restablece tu contraseña — LegalDocs',
            html:    this.passwordResetTemplate(name, url),
        });
    }

    // ─── FIRM INVITATION ──────────────────────────────────────────────────────────

    async sendFirmInvitationEmail(email: string, inviterName: string, firmName: string, token: string): Promise<void>
    {
        const url = `${environmentVariables.frontendUrl}/invite?token=${token}`;

        await this.send({
            to:      email,
            subject: `${inviterName} te invitó a ${firmName} — LegalDocs`,
            html:    this.firmInvitationTemplate(inviterName, firmName, url),
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

    // ─── TEMPLATES ────────────────────────────────────────────────────────────────

    private baseTemplate(content: string): string
    {
        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:48px 0;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 0 10px rgba(0,0,0,0.08);border:1px solid #e5e7eb;">

                <!-- Header -->
                <tr>
                  <td style="padding:28px 40px;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:20px;font-weight:700;color:#1f2937;letter-spacing:-0.3px;">LegalDocs</span>
                  </td>
                </tr>

                <!-- Content -->
                <tr><td style="padding:40px;">${content}</td></tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                    <p style="margin:0;color:#6b7280;font-size:12px;">
                      © ${new Date().getFullYear()} LegalDocs · Plataforma de gestión de documentos legales
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>`;
    }

    private verificationTemplate(name: string, url: string): string
    {
        return this.baseTemplate(`
          <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px;font-weight:700;">Verifica tu cuenta</h2>
          <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
            Hola <strong style="color:#1f2937;">${name}</strong>, gracias por registrarte. Para empezar a usar LegalDocs, confirma tu dirección de correo haciendo clic en el botón.
          </p>
          <a href="${url}" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">
            Verificar cuenta
          </a>
          <p style="margin:28px 0 0;color:#6b7280;font-size:13px;line-height:1.6;padding-top:24px;border-top:1px solid #f3f4f6;">
            Este enlace es válido por <strong>24 horas</strong>. Si no creaste una cuenta en LegalDocs, puedes ignorar este correo.
          </p>
        `);
    }

    private passwordResetTemplate(name: string, url: string): string
    {
        return this.baseTemplate(`
          <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px;font-weight:700;">Restablece tu contraseña</h2>
          <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
            Hola <strong style="color:#1f2937;">${name}</strong>, recibimos una solicitud para cambiar la contraseña de tu cuenta. Haz clic en el botón para continuar.
          </p>
          <a href="${url}" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">
            Restablecer contraseña
          </a>
          <p style="margin:28px 0 0;color:#6b7280;font-size:13px;line-height:1.6;padding-top:24px;border-top:1px solid #f3f4f6;">
            Este enlace es válido por <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este correo — tu contraseña no será modificada.
          </p>
        `);
    }

    private firmInvitationTemplate(inviterName: string, firmName: string, url: string): string
    {
        return this.baseTemplate(`
          <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px;font-weight:700;">Te invitaron a un despacho</h2>
          <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
            <strong style="color:#1f2937;">${inviterName}</strong> te invitó a unirte al despacho
            <strong style="color:#1f2937;">${firmName}</strong> en LegalDocs. Acepta la invitación para empezar a colaborar.
          </p>
          <a href="${url}" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">
            Aceptar invitación
          </a>
          <p style="margin:28px 0 0;color:#6b7280;font-size:13px;line-height:1.6;padding-top:24px;border-top:1px solid #f3f4f6;">
            Esta invitación es válida por <strong>7 días</strong>. Si no esperabas esto, puedes ignorar este correo.
          </p>
        `);
    }
}
