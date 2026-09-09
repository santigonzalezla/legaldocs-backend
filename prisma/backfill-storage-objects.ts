import 'dotenv/config';
import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient, StorageObjectArea} from '../generated/prisma/client';

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL!});
const prismaClient = new PrismaClient({adapter});

const DRY_RUN = process.argv.includes('--dry-run');

interface Row
{
    firmId: string;
    area: StorageObjectArea;
    ownerType: string;
    ownerId: string;
    fileKey: string;
    fileName: string;
    sizeBytes: number;
    mimeType: string;
    uploadedBy: string;
}

async function collectProcessDocuments(): Promise<Row[]>
{
    const docs = await prismaClient.processDocument.findMany({
        where:   {deletedAt: null},
        include: {process: {select: {id: true, firmId: true}}},
    });

    return docs.map(doc => ({
        firmId:     doc.process.firmId,
        area:       StorageObjectArea.PROCESS_DOCUMENT,
        ownerType:  'legal_process',
        ownerId:    doc.process.id,
        fileKey:    doc.fileKey,
        fileName:   doc.fileName,
        sizeBytes:  doc.fileSize,
        mimeType:   doc.mimeType,
        uploadedBy: doc.uploadedBy,
    }));
}

async function collectClientDocuments(): Promise<Row[]>
{
    const docs = await prismaClient.clientDocument.findMany({
        where:   {deletedAt: null},
        include: {client: {select: {id: true, firmId: true}}},
    });

    return docs.map(doc => ({
        firmId:     doc.client.firmId,
        area:       StorageObjectArea.CLIENT_DOCUMENT,
        ownerType:  'client',
        ownerId:    doc.client.id,
        fileKey:    doc.fileKey,
        fileName:   doc.fileName,
        sizeBytes:  doc.fileSize,
        mimeType:   doc.mimeType,
        uploadedBy: doc.uploadedBy,
    }));
}

async function collectLibraryDocuments(): Promise<Row[]>
{
    const docs = await prismaClient.libraryDocument.findMany({where: {deletedAt: null}});

    return docs.map(doc => ({
        firmId:     doc.firmId,
        area:       StorageObjectArea.LIBRARY_DOCUMENT,
        ownerType:  'firm',
        ownerId:    doc.firmId,
        fileKey:    doc.fileKey,
        fileName:   doc.fileName,
        sizeBytes:  doc.fileSize,
        mimeType:   doc.mimeType,
        uploadedBy: doc.uploadedBy,
    }));
}

async function collectTimelineAttachments(): Promise<Row[]>
{
    const attachments = await prismaClient.processTimelineAttachment.findMany({
        where:   {deletedAt: null},
        include: {comment: {select: {id: true, stage: {select: {firmId: true}}}}},
    });

    return attachments.map(attachment => ({
        firmId:     attachment.comment.stage.firmId,
        area:       StorageObjectArea.TIMELINE_ATTACHMENT,
        ownerType:  'process_timeline_comment',
        ownerId:    attachment.comment.id,
        fileKey:    attachment.fileKey,
        fileName:   attachment.fileName,
        sizeBytes:  attachment.fileSize,
        mimeType:   attachment.mimeType,
        uploadedBy: attachment.uploadedBy,
    }));
}

async function main()
{
    console.log(DRY_RUN
        ? 'MODO DRY-RUN — no se escribe nada en la base de datos.\n'
        : 'Backfill de StorageObject desde las 4 tablas de documentos.\n');

    const groups: Array<[string, Row[]]> = [
        ['PROCESS_DOCUMENT',    await collectProcessDocuments()],
        ['CLIENT_DOCUMENT',     await collectClientDocuments()],
        ['LIBRARY_DOCUMENT',    await collectLibraryDocuments()],
        ['TIMELINE_ATTACHMENT', await collectTimelineAttachments()],
    ];

    let totalInserted = 0;

    for (const [label, rows] of groups)
    {
        if (rows.length === 0)
        {
            console.log(`  ${label}: 0 filas`);
            continue;
        }

        if (DRY_RUN)
        {
            console.log(`  ${label}: ${rows.length} filas (dry-run)`);
            continue;
        }

        const {count} = await prismaClient.storageObject.createMany({data: rows, skipDuplicates: true});
        totalInserted += count;
        console.log(`  ${label}: ${rows.length} candidatas → ${count} insertadas (resto ya existían)`);
    }

    console.log(`\n${DRY_RUN ? 'Dry-run terminado.' : `Backfill terminado. ${totalInserted} filas nuevas.`}`);
}

main()
    .catch(console.error)
    .finally(() => prismaClient.$disconnect());
