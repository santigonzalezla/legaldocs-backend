import * as mammoth from 'mammoth';
import {BadRequestException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {FirmService} from '../firm/firm.service';
import {CreateTemplateDto} from './dto/create-template.dto';
import {UpdateTemplateDto} from './dto/update-template.dto';
import {TemplateFiltersDto} from './dto/template-filters.dto';
import {DocumentTemplateEntity} from './entities/document-template.entity';
import {TemplateOrigin} from '../../../generated/prisma/client';

@Injectable()
export class TemplateService
{
    private readonly logger = new Logger(TemplateService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly firmService: FirmService,
    ) {}

    // ─── TEMPLATES ────────────────────────────────────────────────────────────────

    async findAll(userId: string, firmId: string | undefined, filters: TemplateFiltersDto): Promise<{data: DocumentTemplateEntity[]; total: number; page: number; limit: number}>
    {
        try
        {
            const firm  = await this.firmService.getMyFirm(userId, firmId);
            const page  = filters.page ?? 1;
            const limit = filters.limit ?? 20;
            const skip  = (page - 1) * limit;

            const where = {
                deletedAt: null,
                OR: [
                    {origin: TemplateOrigin.SYSTEM},
                    {firmId: firm.id},
                ],
                ...(filters.branchId    && {branchId:     filters.branchId}),
                ...(filters.documentType && {documentType: filters.documentType}),
                ...(filters.origin      && {origin:       filters.origin}),
                ...(filters.isActive !== undefined && {isActive: filters.isActive}),
                ...(filters.search && {
                    title: {contains: filters.search, mode: 'insensitive' as const},
                }),
            };

            const [data, total] = await this.prisma.$transaction([
                this.prisma.documentTemplate.findMany({
                    where,
                    orderBy: {title: 'asc'},
                    skip,
                    take: limit,
                }),
                this.prisma.documentTemplate.count({where}),
            ]);

            this.logger.log(`findAll → success firmId=${firm.id} total=${total}`);
            return {data, total, page, limit};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`findAll → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async findOne(userId: string, firmId: string | undefined, id: string): Promise<DocumentTemplateEntity>
    {
        try
        {
            const result = await this.findAccessibleTemplate(userId, firmId, id);
            this.logger.log(`findOne → success id=${id}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`findOne → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async create(userId: string, firmId: string | undefined, dto: CreateTemplateDto): Promise<DocumentTemplateEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const result = await this.prisma.documentTemplate.create({
                data: {
                    ...dto,
                    firmId: firm.id,
                    createdBy: userId,
                    origin: TemplateOrigin.FIRM_CUSTOM,
                },
            });

            this.logger.log(`create → success firmId=${firm.id} id=${result.id}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`create → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async update(userId: string, firmId: string | undefined, id: string, dto: UpdateTemplateDto): Promise<DocumentTemplateEntity>
    {
        try
        {
            await this.findFirmTemplate(userId, firmId, id);

            const result = await this.prisma.documentTemplate.update({
                where: {id},
                data: dto,
            });

            this.logger.log(`update → success id=${id}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`update → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async remove(userId: string, firmId: string | undefined, id: string): Promise<{message: string}>
    {
        try
        {
            await this.findFirmTemplate(userId, firmId, id);

            await this.prisma.documentTemplate.update({
                where: {id},
                data: {deletedAt: new Date()},
            });

            this.logger.log(`remove → success id=${id}`);
            return {message: 'Plantilla eliminada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`remove → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async copyTemplate(userId: string, firmId: string | undefined, id: string): Promise<DocumentTemplateEntity>
    {
        try
        {
            const firm     = await this.firmService.getMyFirm(userId, firmId);
            const original = await this.findAccessibleTemplate(userId, firmId, id);

            const {id: _, numId: __, createdAt: ___, updatedAt: ____, deletedAt: _____, ...data} = original;

            const result = await this.prisma.documentTemplate.create({
                data: {
                    ...data,
                    firmId: firm.id,
                    createdBy: userId,
                    origin: TemplateOrigin.FIRM_COPY,
                    parentTemplateId: id,
                    version: '1.0',
                },
            });

            this.logger.log(`copyTemplate → success sourceId=${id} newId=${result.id}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`copyTemplate → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async toggleFavorite(userId: string, firmId: string | undefined, id: string): Promise<{isFavorite: boolean}>
    {
        try
        {
            await this.findAccessibleTemplate(userId, firmId, id);

            const existing = await this.prisma.templateFavorite.findUnique({
                where: {templateId_userId: {templateId: id, userId}},
            });

            if (existing)
            {
                await this.prisma.templateFavorite.delete({
                    where: {templateId_userId: {templateId: id, userId}},
                });
                this.logger.log(`toggleFavorite → removed id=${id} userId=${userId}`);
                return {isFavorite: false};
            }

            await this.prisma.templateFavorite.create({
                data: {templateId: id, userId},
            });

            this.logger.log(`toggleFavorite → added id=${id} userId=${userId}`);
            return {isFavorite: true};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`toggleFavorite → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── PARSE UPLOAD ─────────────────────────────────────────────────────────────

    async parseUpload(
        userId: string,
        firmId: string | undefined,
        file: Express.Multer.File,
    ): Promise<{textTemplate: string; variableFields: Record<string, Record<string, unknown>>; detectedVariables: string[]}>
    {
        try
        {
            await this.firmService.getMyFirm(userId, firmId);

            if (!file) throw new BadRequestException('No se proporcionó ningún archivo');

            if (!file.originalname.toLowerCase().endsWith('.docx'))
                throw new BadRequestException('Solo se permiten archivos .docx');

            const result       = await mammoth.convertToHtml({buffer: file.buffer});
            const textTemplate = result.value;

            // Soporta {{campo}}, {{cat:campo}} y {{cat:campo:tipo}} / {{cat:campo:seleccion[op1,op2]}}
            const matches  = [...textTemplate.matchAll(/\{\{(\w+)(?::(\w+))?(?::(\w+(?:\[[^\]]*\])?))?}\}/g)];
            const seen     = new Set<string>();
            const detected: string[] = [];

            const variableFields: Record<string, Record<string, unknown>> = {};

            const validTypes = new Set(['texto', 'fecha', 'numero', 'email', 'booleano', 'seleccion']);

            for (const [, seg1, seg2, seg3] of matches)
            {
                let category: string, field: string, typeRaw: string;

                if (!seg2)      { category = 'general'; field = seg1; typeRaw = 'texto'; }
                else if (!seg3) { category = seg1;      field = seg2; typeRaw = 'texto'; }
                else            { category = seg1;      field = seg2; typeRaw = seg3;    }

                const key = `${category}:${field}`;

                if (!seen.has(key)) { seen.add(key); detected.push(key); }

                if (!variableFields[category]) variableFields[category] = {};

                if (!variableFields[category][field])
                {
                    const selMatch = typeRaw.match(/^(\w+)(?:\[([^\]]*)\])?$/);
                    const type     = (selMatch?.[1] && validTypes.has(selMatch[1])) ? selMatch[1] : 'texto';
                    const options  = selMatch?.[2]?.split(',').map(o => o.trim()).filter(Boolean);

                    variableFields[category][field] = {
                        type,
                        required:      true,
                        placeholder:   field.replace(/_/g, ' '),
                        default_value: '',
                        ...(options?.length ? {options} : {}),
                    };
                }
            }

            this.logger.log(`parseUpload → success userId=${userId} vars=${detected.length}`);
            return {textTemplate, variableFields, detectedVariables: detected};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`parseUpload → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error al procesar el archivo');
        }
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────────────

    private async findAccessibleTemplate(userId: string, firmId: string | undefined, id: string): Promise<DocumentTemplateEntity>
    {
        const firm     = await this.firmService.getMyFirm(userId, firmId);
        const template = await this.prisma.documentTemplate.findFirst({
            where: {
                id,
                deletedAt: null,
                OR: [
                    {origin: TemplateOrigin.SYSTEM},
                    {firmId: firm.id},
                ],
            },
        });

        if (!template) throw new NotFoundException('Plantilla no encontrada');

        return template;
    }

    private async findFirmTemplate(userId: string, firmId: string | undefined, id: string): Promise<DocumentTemplateEntity>
    {
        const firm     = await this.firmService.getMyFirm(userId, firmId);
        const template = await this.prisma.documentTemplate.findFirst({
            where: {id, firmId: firm.id, deletedAt: null},
        });

        if (!template) throw new NotFoundException('Plantilla no encontrada');

        if (template.origin === TemplateOrigin.SYSTEM)
            throw new ForbiddenException('No puedes modificar plantillas del sistema');

        return template;
    }
}
