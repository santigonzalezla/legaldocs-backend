import {HttpException, Injectable, InternalServerErrorException, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {FirmService} from '../firm/firm.service';
import {CreateBranchDto} from './dto/create-branch.dto';
import {UpdateBranchDto} from './dto/update-branch.dto';
import {LegalBranchEntity} from './entities/legal-branch.entity';

@Injectable()
export class BranchService
{
    constructor(
        private readonly prisma: PrismaService,
        private readonly firmService: FirmService,
    ) {}

    async findAll(userId: string, firmId?: string): Promise<LegalBranchEntity[]>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            return this.prisma.legalBranch.findMany({
                where: {
                    deletedAt: null,
                    OR: [
                        {isSystem: true},
                        {firmId: firm.id},
                    ],
                },
                orderBy: [{sortOrder: 'asc'}, {name: 'asc'}],
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async create(userId: string, firmId: string | undefined, dto: CreateBranchDto): Promise<LegalBranchEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            return this.prisma.legalBranch.create({
                data: {
                    ...dto,
                    firmId:   firm.id,
                    isSystem: false,
                },
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async update(userId: string, firmId: string | undefined, id: string, dto: UpdateBranchDto): Promise<LegalBranchEntity>
    {
        try
        {
            await this.findFirmBranch(userId, firmId, id);

            return this.prisma.legalBranch.update({
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
            await this.findFirmBranch(userId, firmId, id);

            await this.prisma.legalBranch.update({
                where: {id},
                data: {deletedAt: new Date()},
            });

            return {message: 'Rama jurídica eliminada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────────────

    private async findFirmBranch(userId: string, firmId: string | undefined, id: string): Promise<LegalBranchEntity>
    {
        const firm   = await this.firmService.getMyFirm(userId, firmId);
        const branch = await this.prisma.legalBranch.findFirst({
            where: {id, firmId: firm.id, isSystem: false, deletedAt: null},
        });

        if (!branch) throw new NotFoundException('Rama jurídica no encontrada');

        return branch;
    }
}
