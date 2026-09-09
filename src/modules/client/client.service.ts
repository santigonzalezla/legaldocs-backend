import {BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {FirmService} from '../firm/firm.service';
import {StorageService} from '../../utils/storage/storage.service';
import {buildStorageKey} from '../../utils/storage/storage-key.util';
import {assertValidUpload} from '../../utils/storage/file-validation.util';
import {CreateClientDto} from './dto/create-client.dto';
import {UpdateClientDto} from './dto/update-client.dto';
import {ClientFiltersDto} from './dto/client-filters.dto';
import {ClientEntity} from './entities/client.entity';
import {ClientDocumentEntity} from './entities/client-document.entity';
import {ClientPickerOptionEntity} from './entities/client-picker-option.entity';
import {Paginated} from '../../interfaces/Paginated';
import {ClientDocumentType, ClientType, StorageObjectArea} from '../../../generated/prisma/client';

@Injectable()
export class ClientService
{
    private readonly logger = new Logger(ClientService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly firmService: FirmService,
        private readonly storage: StorageService,
    ) {}

    async create(userId: string, firmId?: string, dto: CreateClientDto = {} as CreateClientDto): Promise<ClientEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const result = await this.prisma.client.create({
                data: {
                    ...dto,
                    firmId:    firm.id,
                    createdBy: userId,
                },
                include: {responsiblePartner: {select: {id: true, user: {select: {firstName: true, lastName: true}}}}},
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

    async findAll(userId: string, firmId?: string, filters: ClientFiltersDto = {}): Promise<Paginated<ClientEntity>>
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
                ...(filters.type && {type: filters.type}),
                ...(filters.search && {
                    OR: [
                        {firstName:      {contains: filters.search, mode: 'insensitive' as const}},
                        {lastName:       {contains: filters.search, mode: 'insensitive' as const}},
                        {companyName:    {contains: filters.search, mode: 'insensitive' as const}},
                        {documentNumber: {contains: filters.search, mode: 'insensitive' as const}},
                        {email:          {contains: filters.search, mode: 'insensitive' as const}},
                    ],
                }),
            };

            const [data, total] = await this.prisma.$transaction([
                this.prisma.client.findMany({
                    where, orderBy: {createdAt: 'desc'}, skip, take: limit,
                    include: {responsiblePartner: {select: {id: true, user: {select: {firstName: true, lastName: true}}}}},
                }),
                this.prisma.client.count({where}),
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

    async findOne(userId: string, firmId?: string, id: string = ''): Promise<ClientEntity>
    {
        try
        {
            const result = await this.findFirmClient(userId, firmId, id);
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

    async update(userId: string, firmId?: string, id: string = '', dto: UpdateClientDto = {}): Promise<ClientEntity>
    {
        try
        {
            await this.findFirmClient(userId, firmId, id);

            const result = await this.prisma.client.update({
                where: {id}, data: dto,
                include: {responsiblePartner: {select: {id: true, user: {select: {firstName: true, lastName: true}}}}},
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

    async remove(userId: string, firmId?: string, id: string = ''): Promise<{message: string}>
    {
        try
        {
            const client = await this.findFirmClient(userId, firmId, id);

            if (client.deletedAt)
                throw new HttpException('El cliente ya está eliminado', 400);

            await this.prisma.client.update({where: {id}, data: {deletedAt: new Date()}});

            this.logger.log(`remove → success id=${id}`);
            return {message: 'Cliente eliminado correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`remove → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async restore(userId: string, firmId?: string, id: string = ''): Promise<ClientEntity>
    {
        try
        {
            const client = await this.findFirmClient(userId, firmId, id, true);

            if (!client.deletedAt)
                throw new HttpException('El cliente no está eliminado', 400);

            const result = await this.prisma.client.update({where: {id}, data: {deletedAt: null}});
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

    // Sin ruta propia — pensado para que otros módulos (ej. ProcessService) lo
    // inyecten vía ClientModule.exports cuando solo necesitan un selector
    // id+nombre, sin requerir el permiso completo clients:view.
    async listPickerOptions(userId: string, firmId?: string): Promise<ClientPickerOptionEntity[]>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const clients = await this.prisma.client.findMany({
                where:   {firmId: firm.id, deletedAt: null},
                select:  {id: true, type: true, firstName: true, lastName: true, companyName: true},
                orderBy: {createdAt: 'asc'},
            });

            return clients.map(client => ({
                id:   client.id,
                name: client.type === ClientType.COMPANY
                    ? (client.companyName ?? '—')
                    : [client.firstName, client.lastName].filter(Boolean).join(' ') || '—',
            }));
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`listPickerOptions → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    private async findFirmClient(userId: string, firmId?: string, id: string = '', includeTrashed = false): Promise<ClientEntity>
    {
        const firm = await this.firmService.getMyFirm(userId, firmId);

        const client = await this.prisma.client.findFirst({
            where: {
                id,
                firmId:    firm.id,
                deletedAt: includeTrashed ? undefined : null,
            },
            include: {responsiblePartner: {select: {id: true, user: {select: {firstName: true, lastName: true}}}}},
        });

        if (!client) throw new NotFoundException('Cliente no encontrado');

        return client;
    }

    // ─── DOCUMENTOS ADJUNTOS ──────────────────────────────────────────────────

    async listDocuments(userId: string, firmId: string | undefined, clientId: string): Promise<ClientDocumentEntity[]>
    {
        try
        {
            await this.findFirmClient(userId, firmId, clientId);

            return this.prisma.clientDocument.findMany({
                where:   {clientId, deletedAt: null},
                orderBy: {createdAt: 'desc'},
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`listDocuments → failed clientId=${clientId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async uploadDocument(userId: string, firmId: string | undefined, clientId: string, file: Express.Multer.File, type: ClientDocumentType): Promise<ClientDocumentEntity>
    {
        try
        {
            const client = await this.findFirmClient(userId, firmId, clientId);

            if (!file) throw new BadRequestException('Debes adjuntar un archivo');

            const {mime} = assertValidUpload(file, ['pdf', 'docx', 'jpeg', 'png']);

            const fileKey = buildStorageKey(
                [client.firmId, 'clientes', `cliente-${client.numId}`],
                file.originalname,
            );
            const fileUrl = await this.storage.upload(fileKey, file.buffer, mime, {
                firmId:     client.firmId,
                area:       StorageObjectArea.CLIENT_DOCUMENT,
                ownerType:  'client',
                ownerId:    client.id,
                uploadedBy: userId,
                fileName:   file.originalname,
                sizeBytes:  file.size,
            });

            const result = await this.prisma.clientDocument.create({
                data: {
                    clientId:   client.id,
                    uploadedBy: userId,
                    type,
                    fileKey,
                    fileUrl,
                    fileName: file.originalname,
                    fileSize: file.size,
                    mimeType: mime,
                },
            });

            this.logger.log(`uploadDocument → success clientId=${clientId} id=${result.id}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`uploadDocument → failed clientId=${clientId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async removeDocument(userId: string, firmId: string | undefined, clientId: string, documentId: string): Promise<{message: string}>
    {
        try
        {
            await this.findFirmClient(userId, firmId, clientId);

            const doc = await this.prisma.clientDocument.findFirst({where: {id: documentId, clientId, deletedAt: null}});
            if (!doc) throw new NotFoundException('Documento no encontrado');

            await this.storage.delete(doc.fileKey);
            await this.prisma.clientDocument.update({where: {id: documentId}, data: {deletedAt: new Date()}});

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
