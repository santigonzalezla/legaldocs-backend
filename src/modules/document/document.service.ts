import {ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {FirmService} from '../firm/firm.service';
import {CreateDocumentDto} from './dto/create-document.dto';
import {UpdateDocumentDto} from './dto/update-document.dto';
import {DocumentFiltersDto} from './dto/document-filters.dto';
import {DocumentEntity} from './entities/document.entity';

@Injectable()
export class DocumentService
{
    constructor(
        private readonly prisma: PrismaService,
        private readonly firmService: FirmService,
    ) {}

    async create(userId: string, firmId: string | undefined, dto: CreateDocumentDto): Promise<DocumentEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            return this.prisma.document.create({
                data: {
                    ...dto,
                    firmId: firm.id,
                    createdBy: userId,
                },
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async findAll(userId: string, firmId: string | undefined, filters: DocumentFiltersDto): Promise<{data: (DocumentEntity & {isFavorite: boolean; branchSlug: string | null})[]; total: number; page: number; limit: number}>
    {
        try
        {
            const firm  = await this.firmService.getMyFirm(userId, firmId);
            const page  = filters.page ?? 1;
            const limit = filters.limit ?? 20;
            const skip  = (page - 1) * limit;

            const where = {
                firmId:    firm.id,
                deletedAt: filters.inTrash ? {not: null} : null,
                ...(filters.status   && {status:   filters.status}),
                ...(filters.branchId && {branchId: filters.branchId}),
                ...(filters.search   && {title: {contains: filters.search, mode: 'insensitive' as const}}),
                ...(filters.processId  && {processId: filters.processId}),
                ...(filters.isFavorite && {favorites: {some: {userId}}}),
            };

            const [raw, total] = await this.prisma.$transaction([
                this.prisma.document.findMany({
                    where,
                    include: {favorites: {where: {userId}, select: {userId: true}}, branch: {select: {slug: true}}},
                    orderBy: {createdAt: 'desc'},
                    skip,
                    take: limit,
                }),
                this.prisma.document.count({where}),
            ]);

            const data = raw.map(({favorites, branch, ...doc}) => ({
                ...doc,
                isFavorite: favorites.length > 0,
                branchSlug: branch?.slug ?? null,
            }));

            return {data, total, page, limit};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async findOne(userId: string, firmId: string | undefined, id: string): Promise<DocumentEntity & {branchSlug: string | null}>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const document = await this.prisma.document.findFirst({
                where:   {id, firmId: firm.id, deletedAt: null},
                include: {branch: {select: {slug: true}}},
            });

            if (!document) throw new NotFoundException('Documento no encontrado');

            const {branch, ...doc} = document;
            return {...doc, branchSlug: branch?.slug ?? null};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async update(userId: string, firmId: string | undefined, id: string, dto: UpdateDocumentDto): Promise<DocumentEntity>
    {
        try
        {
            await this.findUserDocument(userId, firmId, id);

            return this.prisma.document.update({
                where: {id},
                data: dto,
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async remove(userId: string, firmId: string | undefined, id: string): Promise<{message: string}>
    {
        try
        {
            const document = await this.findUserDocument(userId, firmId, id);

            if (document.deletedAt)
                throw new ForbiddenException('El documento ya está en la papelera');

            const trashExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            await this.prisma.document.update({
                where: {id},
                data: {deletedAt: new Date(), trashExpiresAt},
            });

            return {message: 'Documento movido a la papelera'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async restore(userId: string, firmId: string | undefined, id: string): Promise<DocumentEntity>
    {
        try
        {
            const document = await this.findUserDocument(userId, firmId, id, true);

            if (!document.deletedAt)
                throw new ForbiddenException('El documento no está en la papelera');

            return this.prisma.document.update({
                where: {id},
                data: {deletedAt: null, trashExpiresAt: null},
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async permanentRemove(userId: string, firmId: string | undefined, id: string): Promise<{message: string}>
    {
        try
        {
            const document = await this.findUserDocument(userId, firmId, id, true);

            if (!document.deletedAt)
                throw new ForbiddenException('Solo se pueden eliminar permanentemente documentos en la papelera');

            await this.prisma.document.delete({where: {id}});

            return {message: 'Documento eliminado permanentemente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async toggleFavorite(userId: string, firmId: string | undefined, id: string): Promise<{isFavorite: boolean}>
    {
        try
        {
            await this.findUserDocument(userId, firmId, id);

            const existing = await this.prisma.documentFavorite.findUnique({
                where: {documentId_userId: {documentId: id, userId}},
            });

            if (existing)
            {
                await this.prisma.documentFavorite.delete({
                    where: {documentId_userId: {documentId: id, userId}},
                });
                return {isFavorite: false};
            }

            await this.prisma.documentFavorite.create({
                data: {documentId: id, userId},
            });

            return {isFavorite: true};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    private async findUserDocument(userId: string, firmId: string | undefined, id: string, includeTrashed = false): Promise<DocumentEntity>
    {
        const firm = await this.firmService.getMyFirm(userId, firmId);

        const document = await this.prisma.document.findFirst({
            where: {
                id,
                firmId: firm.id,
                deletedAt: includeTrashed ? undefined : null,
            },
        });

        if (!document) throw new NotFoundException('Documento no encontrado');

        return document;
    }
}
