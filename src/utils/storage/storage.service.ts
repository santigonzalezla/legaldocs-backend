import {Injectable} from '@nestjs/common';
import {S3Client, PutObjectCommand, DeleteObjectCommand} from '@aws-sdk/client-s3';
import {environmentVariables} from '../../config';

@Injectable()
export class StorageService
{
    private readonly client: S3Client;
    private readonly bucket = environmentVariables.r2Bucket;

    constructor()
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

    async upload(key: string, buffer: Buffer, mimeType: string): Promise<string>
    {
        await this.client.send(new PutObjectCommand({
            Bucket:      this.bucket,
            Key:         key,
            Body:        buffer,
            ContentType: mimeType,
        }));

        return `${environmentVariables.r2PublicUrl}/${key}`;
    }

    async delete(key: string): Promise<void>
    {
        await this.client.send(new DeleteObjectCommand({
            Bucket: this.bucket,
            Key:    key,
        }));
    }
}
