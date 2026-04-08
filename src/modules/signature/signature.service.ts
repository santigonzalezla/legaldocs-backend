import {HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {CreateSignatureDto} from './dto/create-signature.dto';
import {UpdateSignatureDto} from './dto/update-signature.dto';
import {DigitalSignatureEntity} from './entities/digital-signature.entity';

@Injectable()
export class SignatureService
{
    private readonly logger = new Logger(SignatureService.name);

    constructor(private readonly prisma: PrismaService) {}

    async findAll(userId: string): Promise<DigitalSignatureEntity[]>
    {
        try
        {
            const result = await this.prisma.digitalSignature.findMany({
                where: {userId, deletedAt: null},
                orderBy: [{isDefault: 'desc'}, {createdAt: 'desc'}],
            });

            this.logger.log(`findAll → success userId=${userId}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`findAll → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async findOne(userId: string, id: string): Promise<DigitalSignatureEntity>
    {
        try
        {
            const result = await this.findUserSignature(userId, id);
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

    async create(userId: string, dto: CreateSignatureDto): Promise<DigitalSignatureEntity>
    {
        try
        {
            if (dto.isDefault)
                await this.clearDefault(userId);

            const result = await this.prisma.digitalSignature.create({
                data: {...dto, userId},
            });

            this.logger.log(`create → success userId=${userId}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`create → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async update(userId: string, id: string, dto: UpdateSignatureDto): Promise<DigitalSignatureEntity>
    {
        try
        {
            await this.findUserSignature(userId, id);

            if (dto.isDefault)
                await this.clearDefault(userId);

            const result = await this.prisma.digitalSignature.update({
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

    async remove(userId: string, id: string): Promise<{message: string}>
    {
        try
        {
            const signature = await this.findUserSignature(userId, id);

            await this.prisma.digitalSignature.update({
                where: {id},
                data: {deletedAt: new Date(), isDefault: false},
            });

            if (signature.isDefault)
                await this.assignNextDefault(userId);

            this.logger.log(`remove → success id=${id}`);
            return {message: 'Firma eliminada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`remove → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async setDefault(userId: string, id: string): Promise<DigitalSignatureEntity>
    {
        try
        {
            await this.findUserSignature(userId, id);
            await this.clearDefault(userId);

            const result = await this.prisma.digitalSignature.update({
                where: {id},
                data: {isDefault: true},
            });

            this.logger.log(`setDefault → success id=${id}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`setDefault → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────────────

    private async findUserSignature(userId: string, id: string): Promise<DigitalSignatureEntity>
    {
        const signature = await this.prisma.digitalSignature.findFirst({
            where: {id, userId, deletedAt: null},
        });

        if (!signature) throw new NotFoundException('Firma no encontrada');

        return signature;
    }

    private async clearDefault(userId: string): Promise<void>
    {
        await this.prisma.digitalSignature.updateMany({
            where: {userId, isDefault: true, deletedAt: null},
            data: {isDefault: false},
        });
    }

    private async assignNextDefault(userId: string): Promise<void>
    {
        const next = await this.prisma.digitalSignature.findFirst({
            where: {userId, deletedAt: null},
            orderBy: {createdAt: 'desc'},
        });

        if (next)
            await this.prisma.digitalSignature.update({
                where: {id: next.id},
                data: {isDefault: true},
            });
    }
}
