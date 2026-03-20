import {HttpException, Injectable, InternalServerErrorException, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {CreateSignatureDto} from './dto/create-signature.dto';
import {UpdateSignatureDto} from './dto/update-signature.dto';
import {DigitalSignatureEntity} from './entities/digital-signature.entity';

@Injectable()
export class SignatureService
{
    constructor(private readonly prisma: PrismaService) {}

    async findAll(userId: string): Promise<DigitalSignatureEntity[]>
    {
        try
        {
            return this.prisma.digitalSignature.findMany({
                where: {userId, deletedAt: null},
                orderBy: [{isDefault: 'desc'}, {createdAt: 'desc'}],
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async findOne(userId: string, id: string): Promise<DigitalSignatureEntity>
    {
        try
        {
            return this.findUserSignature(userId, id);
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async create(userId: string, dto: CreateSignatureDto): Promise<DigitalSignatureEntity>
    {
        try
        {
            if (dto.isDefault)
                await this.clearDefault(userId);

            return this.prisma.digitalSignature.create({
                data: {...dto, userId},
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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

            return this.prisma.digitalSignature.update({
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

            return {message: 'Firma eliminada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async setDefault(userId: string, id: string): Promise<DigitalSignatureEntity>
    {
        try
        {
            await this.findUserSignature(userId, id);
            await this.clearDefault(userId);

            return this.prisma.digitalSignature.update({
                where: {id},
                data: {isDefault: true},
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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
