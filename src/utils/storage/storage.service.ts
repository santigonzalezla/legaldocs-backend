import {Injectable} from '@nestjs/common';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {environmentVariables} from '../../config';
import {PrismaService} from '../../modules/prisma/prisma.service';
import {StorageObjectArea} from '../../../generated/prisma/client';

export interface StorageObjectInput
{
    firmId: string;
    area: StorageObjectArea;
    ownerType: string;
    ownerId: string;
    uploadedBy: string;
    fileName: string;
    sizeBytes: number;
}

export interface FirmStorageUsage
{
    usedBytes: number;
    fileCount: number;
    quotaBytes: number | null;
    percentUsed: number | null;
    byArea: Array<{area: StorageObjectArea; bytes: number; count: number}>;
}

@Injectable()
export class StorageService
{
    private readonly client: S3Client;
    private readonly bucket = environmentVariables.r2Bucket;

    constructor(private readonly prisma: PrismaService)
    {
        this.client = new S3Client({
            region:   'auto',
            endpoint: `https://${environmentVariables.r2AccountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId:     environmentVariables.r2AccessKeyId,
                secretAccessKey: environmentVariables.r2SecretAccessKey,
            },
        });
    }

    async upload(key: string, buffer: Buffer, mimeType: string, meta: StorageObjectInput): Promise<string>
    {
        const downloadName = key.split('/').pop() ?? 'archivo';
        await this.client.send(new PutObjectCommand({
            Bucket:             this.bucket,
            Key:                key,
            Body:               buffer,
            ContentType:        mimeType,
            ContentDisposition: `attachment; filename="${downloadName}"`,
        }));

        await this.prisma.storageObject.create({
            data: {
                firmId:     meta.firmId,
                area:       meta.area,
                ownerType:  meta.ownerType,
                ownerId:    meta.ownerId,
                fileKey:    key,
                fileName:   meta.fileName,
                sizeBytes:  meta.sizeBytes,
                mimeType,
                uploadedBy: meta.uploadedBy,
            },
        });

        const encodedKey = key.split('/').map(encodeURIComponent).join('/');
        return `${environmentVariables.r2PublicUrl}/${encodedKey}`;
    }

    // Imágenes de identidad (avatar de usuario, logo de firma): no entran al libro
    // mayor StorageObject porque no son documentos con cuota por firma.
    async putImage(key: string, buffer: Buffer, mimeType: string): Promise<void>
    {
        await this.client.send(new PutObjectCommand({
            Bucket:            this.bucket,
            Key:               key,
            Body:              buffer,
            ContentType:       mimeType,
            ContentDisposition: 'inline',
            CacheControl:      'public, max-age=3600',
        }));
    }

    getSignedFileUrl(
        key: string,
        opts: {fileName?: string; mimeType?: string; expiresInSeconds?: number} = {},
    ): Promise<string>
    {
        const downloadName = opts.fileName ?? key.split('/').pop() ?? 'archivo';

        return getSignedUrl(
            this.client,
            new GetObjectCommand({
                Bucket:                     this.bucket,
                Key:                        key,
                ResponseContentDisposition: `inline; filename="${downloadName}"`,
                ...(opts.mimeType && {ResponseContentType: opts.mimeType}),
            }),
            {expiresIn: opts.expiresInSeconds ?? 600},
        );
    }

    async delete(key: string): Promise<void>
    {
        await this.client.send(new DeleteObjectCommand({
            Bucket: this.bucket,
            Key:    key,
        }));

        // Idempotente: no-op si no hay fila (objetos previos al backfill).
        await this.prisma.storageObject.updateMany({
            where: {fileKey: key, deletedAt: null},
            data:  {deletedAt: new Date()},
        });
    }

    // ─── Consumo por firma ───────────────────────────────────────────────────

    async getFirmUsage(firmId: string): Promise<FirmStorageUsage>
    {
        const [total, perArea, subscription] = await Promise.all([
            this.prisma.storageObject.aggregate({
                where: {firmId, deletedAt: null},
                _sum:  {sizeBytes: true},
                _count: true,
            }),
            this.prisma.storageObject.groupBy({
                by:      ['area'],
                where:   {firmId, deletedAt: null},
                orderBy: {area: 'asc'},
                _sum:    {sizeBytes: true},
                _count:  true,
            }),
            this.prisma.subscription.findUnique({
                where:  {firmId},
                select: {plan: {select: {maxStorageBytes: true}}},
            }),
        ]);

        const usedBytes  = total._sum.sizeBytes ?? 0;
        const quotaBytes = subscription?.plan.maxStorageBytes ?? null;

        return {
            usedBytes,
            fileCount:   total._count,
            quotaBytes,
            percentUsed: quotaBytes ? Math.round((usedBytes / quotaBytes) * 100) : null,
            byArea: perArea.map(row => ({
                area:  row.area,
                bytes: row._sum.sizeBytes ?? 0,
                count: row._count,
            })),
        };
    }

    // ─── Utilidades sobre el prefijo de la firma en R2 ───────────────────────

    async listFirmObjects(firmId: string): Promise<Array<{key: string; size: number}>>
    {
        const objects: Array<{key: string; size: number}> = [];
        let continuationToken: string | undefined;

        do
        {
            const page = await this.client.send(new ListObjectsV2Command({
                Bucket:            this.bucket,
                Prefix:            `${firmId}/`,
                ContinuationToken: continuationToken,
            }));

            for (const object of page.Contents ?? [])
                if (object.Key) objects.push({key: object.Key, size: object.Size ?? 0});

            continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
        }
        while (continuationToken);

        return objects;
    }

    async deleteFirmPrefix(firmId: string): Promise<void>
    {
        const objects = await this.listFirmObjects(firmId);

        for (let index = 0; index < objects.length; index += 1000)
        {
            const batch = objects.slice(index, index + 1000);
            await this.client.send(new DeleteObjectsCommand({
                Bucket: this.bucket,
                Delete: {Objects: batch.map(object => ({Key: object.key}))},
            }));
        }
    }
}
