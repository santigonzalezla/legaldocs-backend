import {BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {FirmService} from '../firm/firm.service';
import {ClientService} from '../client/client.service';
import {StorageService} from '../../utils/storage/storage.service';
import {buildStorageKey} from '../../utils/storage/storage-key.util';
import {assertValidUpload} from '../../utils/storage/file-validation.util';
import {ClientPickerOptionEntity} from '../client/entities/client-picker-option.entity';
import {CreateProcessDto} from './dto/create-process.dto';
import {UpdateProcessDto} from './dto/update-process.dto';
import {ProcessFiltersDto} from './dto/process-filters.dto';
import {AddProcessTemplateDto} from './dto/add-process-template.dto';
import {LegalProcessEntity, LegalProcessWithEntriesEntity} from './entities/legal-process.entity';
import {ProcessTemplateEntity} from './entities/process-template.entity';
import {ProcessValueEntryEntity} from './entities/process-value-entry.entity';
import {ProcessDocumentEntity} from './entities/process-document.entity';
import {CreateProcessValueEntryDto} from './dto/create-process-value-entry.dto';
import {Paginated} from '../../interfaces/Paginated';
import {ProcessDocumentType, StorageObjectArea} from '../../../generated/prisma/client';

@Injectable()
export class ProcessService
{
    private readonly logger = new Logger(ProcessService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly firmService: FirmService,
        private readonly clientService: ClientService,
        private readonly storage: StorageService,
    ) {}

    // Composición entre módulos: la ruta vive en ProcessController (gateada por
    // processes:view, que Abogado ya tiene), pero delega en ClientService para
    // no duplicar la lógica de armado del nombre. Así el permiso de la ruta
    // siempre corresponde al módulo dueño del controller, sin excepciones.
    async getClientOptions(userId: string, firmId?: string): Promise<ClientPickerOptionEntity[]>
    {
        return this.clientService.listPickerOptions(userId, firmId);
    }

    async create(userId: string, firmId?: string, dto: CreateProcessDto = {} as CreateProcessDto): Promise<LegalProcessEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const result = await this.prisma.legalProcess.create({
                data: {
                    ...dto,
                    firmId:    firm.id,
                    createdBy: userId,
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

    async findAll(userId: string, firmId?: string, filters: ProcessFiltersDto = {}): Promise<Paginated<LegalProcessEntity>>
    {
        try
        {
            const firm  = await this.firmService.getMyFirm(userId, firmId);
            const page  = filters.page  ?? 1;
            const limit = filters.limit ?? 20;
            const skip  = (page - 1) * limit;

            const where = {
                firmId:    firm.id,
                deletedAt: filters.inTrash ? {not: null} : null,
                ...(filters.status     && {status:     filters.status}),
                ...(filters.clientId   && {clientId:   filters.clientId}),
                ...(filters.branchId   && {branchId:   filters.branchId}),
                ...(filters.assignedTo && {assignedTo: filters.assignedTo}),
                ...(filters.categoryId           && {categoryId:           filters.categoryId}),
                ...(filters.billingType          && {billingType:          filters.billingType}),
                ...(filters.responsiblePartnerId && {responsiblePartnerId: filters.responsiblePartnerId}),
                ...(filters.isProBono !== undefined && {isProBono: filters.isProBono}),
                ...(filters.search && {
                    OR: [
                        {title:     {contains: filters.search, mode: 'insensitive' as const}},
                        {reference: {contains: filters.search, mode: 'insensitive' as const}},
                    ],
                }),
            };

            const [data, total] = await this.prisma.$transaction([
                this.prisma.legalProcess.findMany({
                    where,
                    orderBy: {createdAt: 'desc'},
                    skip,
                    take: limit,
                    include: {
                        client: {
                            select: {
                                id:             true,
                                type:           true,
                                firstName:      true,
                                lastName:       true,
                                companyName:    true,
                                documentType:   true,
                                documentNumber: true,
                            },
                        },
                        assignee: {select: {id: true, firstName: true, lastName: true}},
                    },
                }),
                this.prisma.legalProcess.count({where}),
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

    async findOne(userId: string, firmId?: string, id: string = ''): Promise<LegalProcessWithEntriesEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const result = await this.prisma.legalProcess.findFirst({
                where:   {id, firmId: firm.id, deletedAt: null},
                include: {
                    valueEntries: {
                        where:   {deletedAt: null},
                        select:  {id: true, amount: true, description: true, createdBy: true, createdAt: true},
                        orderBy: {createdAt: 'asc'},
                    },
                    client: {
                        select: {
                            id:             true,
                            type:           true,
                            firstName:      true,
                            lastName:       true,
                            companyName:    true,
                            documentType:   true,
                            documentNumber: true,
                        },
                    },
                    category:           {select: {id: true, name: true, slug: true}},
                    responsiblePartner: {select: {id: true, user: {select: {firstName: true, lastName: true}}}},
                    originator:         {select: {id: true, user: {select: {firstName: true, lastName: true}}}},
                    billingResponsible: {select: {id: true, user: {select: {firstName: true, lastName: true}}}},
                },
            }) as LegalProcessWithEntriesEntity | null;

            if (!result) throw new NotFoundException('Proceso no encontrado');

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

    async update(userId: string, firmId?: string, id: string = '', dto: UpdateProcessDto = {}): Promise<LegalProcessEntity>
    {
        try
        {
            await this.findFirmProcess(userId, firmId, id);

            const result = await this.prisma.legalProcess.update({where: {id}, data: dto});
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

    async remove(userId: string, firmId?: string, id: string = ''): Promise<{message: string}>
    {
        try
        {
            const process = await this.findFirmProcess(userId, firmId, id);

            if (process.deletedAt)
                throw new HttpException('El proceso ya está eliminado', 400);

            await this.prisma.legalProcess.update({where: {id}, data: {deletedAt: new Date()}});

            this.logger.log(`remove → success id=${id}`);
            return {message: 'Proceso eliminado correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`remove → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async restore(userId: string, firmId?: string, id: string = ''): Promise<LegalProcessEntity>
    {
        try
        {
            const process = await this.findFirmProcess(userId, firmId, id, true);

            if (!process.deletedAt)
                throw new HttpException('El proceso no está eliminado', 400);

            const result = await this.prisma.legalProcess.update({where: {id}, data: {deletedAt: null}});
            this.logger.log(`restore → success id=${id}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`restore → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async getTemplates(userId: string, firmId?: string, id: string = ''): Promise<ProcessTemplateEntity[]>
    {
        try
        {
            await this.findFirmProcess(userId, firmId, id);

            const result = await this.prisma.processTemplate.findMany({
                where:   {processId: id},
                orderBy: {sortOrder: 'asc'},
            });

            this.logger.log(`getTemplates → success processId=${id} count=${result.length}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`getTemplates → failed processId=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async addTemplate(userId: string, firmId?: string, id: string = '', dto: AddProcessTemplateDto = {} as AddProcessTemplateDto): Promise<ProcessTemplateEntity>
    {
        try
        {
            await this.findFirmProcess(userId, firmId, id);

            const existing = await this.prisma.processTemplate.findUnique({
                where: {processId_templateId: {processId: id, templateId: dto.templateId}},
            });

            if (existing)
                throw new HttpException('La plantilla ya está asociada a este proceso', 400);

            const result = await this.prisma.processTemplate.create({
                data: {
                    processId:  id,
                    templateId: dto.templateId,
                    sortOrder:  dto.sortOrder  ?? 0,
                    isRequired: dto.isRequired ?? false,
                },
            });

            this.logger.log(`addTemplate → success processId=${id} templateId=${dto.templateId}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`addTemplate → failed processId=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async removeTemplate(userId: string, firmId?: string, id: string = '', templateId: string = ''): Promise<{message: string}>
    {
        try
        {
            await this.findFirmProcess(userId, firmId, id);

            const existing = await this.prisma.processTemplate.findUnique({
                where: {processId_templateId: {processId: id, templateId}},
            });

            if (!existing)
                throw new NotFoundException('La plantilla no está asociada a este proceso');

            await this.prisma.processTemplate.delete({
                where: {processId_templateId: {processId: id, templateId}},
            });

            this.logger.log(`removeTemplate → success processId=${id} templateId=${templateId}`);
            return {message: 'Plantilla desvinculada del proceso'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`removeTemplate → failed processId=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async addValueEntry(userId: string, firmId?: string, processId: string = '', dto: CreateProcessValueEntryDto = {} as CreateProcessValueEntryDto): Promise<ProcessValueEntryEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);
            await this.findFirmProcess(userId, firmId, processId);

            const result = await this.prisma.processValueEntry.create({
                data: {
                    processId,
                    firmId:      firm.id,
                    amount:      dto.amount,
                    description: dto.description,
                    createdBy:   userId,
                },
            });

            this.logger.log(`addValueEntry → success processId=${processId} entryId=${result.id}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`addValueEntry → failed processId=${processId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async removeValueEntry(userId: string, firmId?: string, processId: string = '', entryId: string = ''): Promise<{message: string}>
    {
        try
        {
            await this.findFirmProcess(userId, firmId, processId);

            const entry = await this.prisma.processValueEntry.findFirst({
                where: {id: entryId, processId, deletedAt: null},
            });

            if (!entry) throw new NotFoundException('Entrada de valor no encontrada');

            await this.prisma.processValueEntry.update({
                where: {id: entryId},
                data:  {deletedAt: new Date()},
            });

            this.logger.log(`removeValueEntry → success processId=${processId} entryId=${entryId}`);
            return {message: 'Entrada de valor eliminada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`removeValueEntry → failed processId=${processId} entryId=${entryId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    private async findFirmProcess(userId: string, firmId?: string, id: string = '', includeTrashed = false): Promise<LegalProcessEntity>
    {
        const firm = await this.firmService.getMyFirm(userId, firmId);

        const process = await this.prisma.legalProcess.findFirst({
            where: {
                id,
                firmId:    firm.id,
                deletedAt: includeTrashed ? undefined : null,
            },
        });

        if (!process) throw new NotFoundException('Proceso no encontrado');

        return process;
    }

    // ─── DOCUMENTOS ADJUNTOS ──────────────────────────────────────────────────

    async listDocuments(userId: string, firmId: string | undefined, processId: string): Promise<ProcessDocumentEntity[]>
    {
        try
        {
            await this.findFirmProcess(userId, firmId, processId);

            return this.prisma.processDocument.findMany({
                where:   {processId, deletedAt: null},
                orderBy: {createdAt: 'desc'},
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`listDocuments → failed processId=${processId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async uploadDocument(userId: string, firmId: string | undefined, processId: string, file: Express.Multer.File, type: ProcessDocumentType): Promise<ProcessDocumentEntity>
    {
        try
        {
            const process = await this.findFirmProcess(userId, firmId, processId);

            if (!file) throw new BadRequestException('Debes adjuntar un archivo');

            const {mime} = assertValidUpload(file, ['pdf', 'docx', 'jpeg', 'png']);

            const processRef = process.reference?.trim() || `proceso-${process.numId}`;
            const fileKey = buildStorageKey(
                [process.firmId, 'procesos', processRef, 'adjuntos'],
                file.originalname,
            );
            const fileUrl = await this.storage.upload(fileKey, file.buffer, mime, {
                firmId:     process.firmId,
                area:       StorageObjectArea.PROCESS_DOCUMENT,
                ownerType:  'legal_process',
                ownerId:    process.id,
                uploadedBy: userId,
                fileName:   file.originalname,
                sizeBytes:  file.size,
            });

            const result = await this.prisma.processDocument.create({
                data: {
                    processId:  process.id,
                    uploadedBy: userId,
                    type,
                    fileKey,
                    fileUrl,
                    fileName: file.originalname,
                    fileSize: file.size,
                    mimeType: mime,
                },
            });

            this.logger.log(`uploadDocument → success processId=${processId} id=${result.id}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`uploadDocument → failed processId=${processId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async removeDocument(userId: string, firmId: string | undefined, processId: string, documentId: string): Promise<{message: string}>
    {
        try
        {
            await this.findFirmProcess(userId, firmId, processId);

            const doc = await this.prisma.processDocument.findFirst({where: {id: documentId, processId, deletedAt: null}});
            if (!doc) throw new NotFoundException('Documento no encontrado');

            await this.storage.delete(doc.fileKey);
            await this.prisma.processDocument.update({where: {id: documentId}, data: {deletedAt: new Date()}});

            this.logger.log(`removeDocument → success id=${documentId}`);
            return {message: 'Documento eliminado correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`removeDocument → failed id=${documentId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }
}
