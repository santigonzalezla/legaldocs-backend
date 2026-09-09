import {HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {FirmService} from '../firm/firm.service';
import {CreateProcessCategoryDto} from './dto/create-process-category.dto';
import {UpdateProcessCategoryDto} from './dto/update-process-category.dto';
import {ProcessCategoryFiltersDto} from './dto/process-category-filters.dto';
import {ProcessCategoryEntity} from './entities/process-category.entity';

const slugify = (value: string): string =>
    value
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita tildes
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

@Injectable()
export class ProcessCategoryService
{
    private readonly logger = new Logger(ProcessCategoryService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly firmService: FirmService,
    ) {}

    async findAll(userId: string, firmId?: string, filters: ProcessCategoryFiltersDto = {}): Promise<ProcessCategoryEntity[]>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const result = await this.prisma.processCategory.findMany({
                where: {
                    deletedAt: null,
                    ...(filters.isActive !== undefined && {isActive: filters.isActive}),
                    ...(filters.search && {name: {contains: filters.search, mode: 'insensitive'}}),
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

    async create(userId: string, firmId: string | undefined, dto: CreateProcessCategoryDto): Promise<ProcessCategoryEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);
            const slug = dto.slug?.trim() || slugify(dto.name);

            const existing = await this.prisma.processCategory.findFirst({
                where: {slug, deletedAt: null, OR: [{isSystem: true}, {firmId: firm.id}]},
            });

            if (existing) return existing;

            const result = await this.prisma.processCategory.create({
                data: {name: dto.name.trim(), slug, firmId: firm.id, isSystem: false},
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

    async update(userId: string, firmId: string | undefined, id: string, dto: UpdateProcessCategoryDto): Promise<ProcessCategoryEntity>
    {
        try
        {
            await this.findFirmCategory(userId, firmId, id);

            const result = await this.prisma.processCategory.update({where: {id}, data: dto});
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
            await this.findFirmCategory(userId, firmId, id);

            await this.prisma.processCategory.update({where: {id}, data: {deletedAt: new Date()}});

            this.logger.log(`remove → success id=${id}`);
            return {message: 'Categoría eliminada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`remove → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    private async findFirmCategory(userId: string, firmId: string | undefined, id: string): Promise<ProcessCategoryEntity>
    {
        const firm = await this.firmService.getMyFirm(userId, firmId);
        const category = await this.prisma.processCategory.findFirst({
            where: {id, firmId: firm.id, isSystem: false, deletedAt: null},
        });

        if (!category) throw new NotFoundException('Categoría no encontrada');

        return category;
    }
}
