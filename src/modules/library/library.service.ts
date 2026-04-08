import {Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {StorageService} from '../../utils/storage/storage.service';
import {EmbeddingService} from '../../utils/storage/embedding.service';
import {UploadLibraryDocumentDto} from './dto/upload-library-document.dto';
import {LibraryFiltersDto} from './dto/library-filters.dto';
import {LoggedUser} from '../../interfaces/LoggedUser';
import * as mammoth from 'mammoth';
import {randomUUID} from 'crypto';
import * as pdfParse from 'pdf-parse';

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

@Injectable()
export class LibraryService
{
    private readonly logger = new Logger(LibraryService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly embeddings: EmbeddingService
    )
    {}

    // ─── UPLOAD + INDEX ───────────────────────────────────────────────────────────

    async upload(file: Express.Multer.File, dto: UploadLibraryDocumentDto, user: LoggedUser, firmId: string)
    {
        this.logger.log(`upload → firmId=${firmId} user=${user.userId} file=${file.originalname} (${file.size}B)`);
        try {
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype))
                throw new BadRequestException('Formato no permitido. Use PDF, DOCX o TXT.');

            if (file.size > MAX_FILE_SIZE)
                throw new BadRequestException('El archivo no puede superar los 20MB.');

            const fileKey = `library/${firmId}/${randomUUID()}-${file.originalname}`;
            const fileUrl = await this.storage.upload(fileKey, file.buffer, file.mimetype);
            this.logger.log(`upload → archivo subido a R2: ${fileKey}`);

            const doc = await this.prisma.libraryDocument.create({
                data: {
                    firmId,
                    uploadedBy:  user.userId,
                    title:       dto.title,
                    description: dto.description,
                    type:        dto.type,
                    branchId:    dto.branchId ?? null,
                    fileKey,
                    fileUrl,
                    fileName:    file.originalname,
                    fileSize:    file.size,
                    mimeType:    file.mimetype,
                },
                include: {branch: {select: {id: true, name: true, color: true, icon: true, slug: true}}},
            });

            this.logger.log(`upload → documento creado id=${doc.id}, iniciando indexado async`);
            this.indexDocument(doc.id, file.buffer, file.mimetype).catch(() => {});

            return doc;
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            this.logger.error('upload → error inesperado', error);
            throw new InternalServerErrorException('Error al subir el documento');
        }
    }

    // ─── INDEXING PIPELINE ────────────────────────────────────────────────────────

    private async indexDocument(docId: string, buffer: Buffer, mimeType: string): Promise<void>
    {
        this.logger.log(`indexDocument → iniciando docId=${docId}`);
        try {
            const text   = await this.extractText(buffer, mimeType);
            const chunks = this.embeddings.chunkText(text);
            this.logger.log(`indexDocument → texto extraído, ${chunks.length} chunks generados`);

            if (chunks.length === 0)
            {
                this.logger.warn(`indexDocument → docId=${docId} sin chunks, se omite indexado`);
                return;
            }

            const vectors = await this.embeddings.embedBatch(chunks);
            this.logger.log(`indexDocument → ${vectors.length} embeddings obtenidos de OpenAI`);

            // Se usa $executeRawUnsafe para el vector literal porque Prisma no puede
            // inferir el tipo del parámetro al hacer $N::vector con pgvector
            for (let i = 0; i < chunks.length; i++) {
                const vecLiteral = `[${vectors[i].join(',')}]`;
                await this.prisma.$executeRawUnsafe(
                    `INSERT INTO "LIBRARY_CHUNK"
                     ("UID_LIBRARY_CHUNK", "UID_LIBRARY_DOCUMENT", "NUM_CHUNK_INDEX_LIBRARY_CHUNK",
                      "STR_CONTENT_LIBRARY_CHUNK", "embedding", "DTM_CREATED_AT")
                     VALUES ($1, $2, $3, $4, '${vecLiteral}'::vector, NOW())`,
                    randomUUID(), docId, i, chunks[i]
                );
            }

            await this.prisma.libraryDocument.update({
                where: {id: docId},
                data:  {isIndexed: true}
            });

            this.logger.log(`indexDocument → docId=${docId} indexado correctamente (${chunks.length} chunks)`);
        } catch (err) {
            this.logger.error(`indexDocument → docId=${docId} falló`, err);
        }
    }

    private async extractText(buffer: Buffer, mimeType: string): Promise<string>
    {
        this.logger.debug(`extractText → mimeType=${mimeType}`);
        if (mimeType === 'application/pdf') {
            const result = await pdfParse(buffer);
            return result.text;
        }

        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({buffer});
            return result.value;
        }

        return buffer.toString('utf-8');
    }

    // ─── LIST ─────────────────────────────────────────────────────────────────────

    async findAll(firmId: string, filters: LibraryFiltersDto)
    {
        this.logger.log(`findAll → firmId=${firmId} filters=${JSON.stringify(filters)}`);
        try {
            const page  = Math.max(1, parseInt(filters.page  ?? '1'));
            const limit = Math.min(50, parseInt(filters.limit ?? '20'));
            const skip  = (page - 1) * limit;

            const where: any = {firmId, deletedAt: null};
            if (filters.type)     where.type     = filters.type;
            if (filters.branchId) where.branchId = filters.branchId;

            const include = {branch: {select: {id: true, name: true, color: true, icon: true, slug: true}}};

            const [data, total] = await this.prisma.$transaction([
                this.prisma.libraryDocument.findMany({where, skip, take: limit, orderBy: {createdAt: 'desc'}, include}),
                this.prisma.libraryDocument.count({where})
            ]);

            this.logger.log(`findAll → ${data.length}/${total} documentos retornados`);
            return {data, total, page, limit, pages: Math.ceil(total / limit)};
        } catch (err) {
            this.logger.error('findAll → error', err);
            throw new InternalServerErrorException('Error al obtener la biblioteca');
        }
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────────

    async remove(id: string, firmId: string): Promise<{message: string}>
    {
        this.logger.log(`remove → id=${id} firmId=${firmId}`);
        try {
            const doc = await this.prisma.libraryDocument.findFirst({
                where: {id, firmId, deletedAt: null}
            });

            if (!doc) throw new NotFoundException('Documento no encontrado');

            await this.storage.delete(doc.fileKey);

            await this.prisma.libraryDocument.update({
                where: {id},
                data:  {deletedAt: new Date()}
            });

            this.logger.log(`remove → id=${id} eliminado de DB y R2`);
            return {message: 'Documento eliminado correctamente'};
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(`remove → error id=${id}`, error);
            throw new InternalServerErrorException('Error al eliminar el documento');
        }
    }

    // ─── ASSIGN BRANCH ───────────────────────────────────────────────────────────

    async assignBranch(id: string, branchId: string | null, firmId: string)
    {
        this.logger.log(`assignBranch → id=${id} branchId=${branchId} firmId=${firmId}`);
        try {
            const doc = await this.prisma.libraryDocument.findFirst({where: {id, firmId, deletedAt: null}});
            if (!doc) throw new NotFoundException('Documento no encontrado');

            if (branchId !== null) {
                const branch = await this.prisma.legalBranch.findFirst({
                    where: {id: branchId, deletedAt: null, OR: [{firmId}, {isSystem: true}]},
                });
                if (!branch) throw new ForbiddenException('Rama no válida');
            }

            const updated = await this.prisma.libraryDocument.update({
                where: {id},
                data:  {branchId},
                include: {branch: {select: {id: true, name: true, color: true, icon: true, slug: true}}},
            });

            this.logger.log(`assignBranch → id=${id} actualizado`);
            return updated;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
            this.logger.error(`assignBranch → error id=${id}`, error);
            throw new InternalServerErrorException('Error al asignar la rama');
        }
    }

    // ─── SEMANTIC SEARCH (usado por AI module) ────────────────────────────────────

    async searchChunks(query: string, firmId: string, topK = 5): Promise<{ content: string; similarity: number }[]>
    {
        this.logger.log(`searchChunks → firmId=${firmId} topK=${topK} query="${query.slice(0, 60)}..."`);
        try {
            const queryVector = await this.embeddings.embedText(query);
            const vecLiteral  = `[${queryVector.join(',')}]`;

            const results = await this.prisma.$queryRawUnsafe<{ content: string; similarity: number }[]>(
                `SELECT c."STR_CONTENT_LIBRARY_CHUNK"                   AS content,
                        1 - (c.embedding <=> '${vecLiteral}'::vector)   AS similarity
                 FROM "LIBRARY_CHUNK" c
                     JOIN "LIBRARY_DOCUMENT" d ON d."UID_LIBRARY_DOCUMENT" = c."UID_LIBRARY_DOCUMENT"
                 WHERE d."UID_FIRM" = $1
                   AND d."DTM_DELETED_AT_LIBRARY_DOCUMENT" IS NULL
                   AND d."BOOL_IS_INDEXED_LIBRARY_DOCUMENT" = true
                 ORDER BY c.embedding <=> '${vecLiteral}'::vector
                 LIMIT $2`,
                firmId, topK
            );

            this.logger.log(`searchChunks → ${results.length} chunks encontrados`);
            return results;
        } catch (err) {
            this.logger.error('searchChunks → error', err);
            return [];
        }
    }
}
