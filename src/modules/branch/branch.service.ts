import {HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {FirmService} from '../firm/firm.service';
import {CreateBranchDto} from './dto/create-branch.dto';
import {UpdateBranchDto} from './dto/update-branch.dto';
import {BranchFiltersDto} from './dto/branch-filters.dto';
import {LegalBranchEntity} from './entities/legal-branch.entity';

@Injectable()
export class BranchService
{
    private readonly logger = new Logger(BranchService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly firmService: FirmService,
    ) {}

    async findAll(userId: string, firmId?: string, filters: BranchFiltersDto = {}): Promise<LegalBranchEntity[]>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const result = await this.prisma.legalBranch.findMany({
                where: {
                    deletedAt: null,
                    ...(filters.slug     !== undefined && {slug:     filters.slug}),
                    ...(filters.isActive !== undefined && {isActive: filters.isActive}),
                    OR: [
                        {isSystem: true},
                        {firmId: firm.id},
                    ],
                },
                orderBy: [{sortOrder: 'asc'}, {name: 'asc'}],
                take: filters.limit ?? 50,
            });

            this.logger.log(`findAll → success firmId=${firm.id} count=${result.length}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`findAll → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async create(userId: string, firmId: string | undefined, dto: CreateBranchDto): Promise<LegalBranchEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const result = await this.prisma.legalBranch.create({
                data: {
                    ...dto,
                    firmId:   firm.id,
                    isSystem: false,
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

    async update(userId: string, firmId: string | undefined, id: string, dto: UpdateBranchDto): Promise<LegalBranchEntity>
    {
        try
        {
            await this.findFirmBranch(userId, firmId, id);

            const result = await this.prisma.legalBranch.update({
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

    async remove(userId: string, firmId: string | undefined, id: string): Promise<{message: string}>
    {
        try
        {
            await this.findFirmBranch(userId, firmId, id);

            await this.prisma.legalBranch.update({
                where: {id},
                data: {deletedAt: new Date()},
            });

            this.logger.log(`remove → success id=${id}`);
            return {message: 'Rama jurídica eliminada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`remove → failed id=${id}`, error);
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
