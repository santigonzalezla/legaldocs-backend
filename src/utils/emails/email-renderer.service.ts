import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import {Injectable, InternalServerErrorException, Logger} from '@nestjs/common';

export type EmailTemplateName =
    | 'verification'
    | 'password-reset'
    | 'firm-invitation'
    | 'provisioned-invite'
    | 'firm-added';

// Carga y compila los .hbs de ./templates (copiados a dist/ vía nest-cli assets),
// los cachea y envuelve el contenido en el layout base.hbs. Centraliza todo el
// HTML de correos fuera de MailService.
@Injectable()
export class EmailRenderer
{
    private readonly logger = new Logger(EmailRenderer.name);
    private readonly cache  = new Map<string, Handlebars.TemplateDelegate>();
    private templatesDir?: string;

    render(template: EmailTemplateName, context: Record<string, unknown> = {}): string
    {
        const body = this.compile(template)(context);
        return this.compile('base')({...context, body, year: new Date().getFullYear()});
    }

    // El layout del build puede dejar los .hbs junto al JS compilado (dist/src/…)
    // o en la raíz de src/ en dev — se prueban ambas ubicaciones.
    private resolveTemplatesDir(): string
    {
        if (this.templatesDir) return this.templatesDir;

        const candidates = [
            path.join(__dirname, 'templates'),
            path.join(process.cwd(), 'src', 'utils', 'emails', 'templates'),
            path.join(process.cwd(), 'dist', 'src', 'utils', 'emails', 'templates'),
        ];

        this.templatesDir = candidates.find(dir => fs.existsSync(dir)) ?? candidates[0];
        return this.templatesDir;
    }

    private compile(name: string): Handlebars.TemplateDelegate
    {
        const cached = this.cache.get(name);
        if (cached) return cached;

        try
        {
            const source   = fs.readFileSync(path.join(this.resolveTemplatesDir(), `${name}.hbs`), 'utf8');
            const compiled = Handlebars.compile(source);
            this.cache.set(name, compiled);
            return compiled;
        }
        catch (error)
        {
            this.logger.error(`No se pudo cargar la plantilla de correo "${name}"`, error as Error);
            throw new InternalServerErrorException('Error al preparar el correo electrónico');
        }
    }
}
