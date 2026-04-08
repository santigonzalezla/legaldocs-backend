import {HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {FirmService} from '../firm/firm.service';
import {CreateProcessDto} from './dto/create-process.dto';
import {UpdateProcessDto} from './dto/update-process.dto';
import {ProcessFiltersDto} from './dto/process-filters.dto';
import {AddProcessTemplateDto} from './dto/add-process-template.dto';
import {LegalProcessEntity} from './entities/legal-process.entity';
import {ProcessTemplateEntity} from './entities/process-template.entity';
import {Paginated} from '../../interfaces/Paginated';

@Injectable()
export class ProcessService
{
    private readonly logger = new Logger(ProcessService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly firmService: FirmService,
    ) {}

    async create(userId: string, firmId?: string, dto: CreateProcessDto = {} as CreateProcessDto): Promise<LegalProcessEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const result = await this.prisma.legalProcess.create({
                data: {
                    ...dto,
                    firmId:    firm.id,
                    createdBy: userId,
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

    async findAll(userId: string, firmId?: string, filters: ProcessFiltersDto = {}): Promise<Paginated<LegalProcessEntity>>
    {
        try
        {
            const firm  = await this.firmService.getMyFirm(userId, firmId);
            const page  = filters.page  ?? 1;
            const limit = filters.limit ?? 20;
            const skip  = (page - 1) * limit;

            const where = {
                firmId:    firm.id,
                deletedAt: filters.inTrash ? {not: null} : null,
                ...(filters.status     && {status:     filters.status}),
                ...(filters.clientId   && {clientId:   filters.clientId}),
                ...(filters.branchId   && {branchId:   filters.branchId}),
                ...(filters.assignedTo && {assignedTo: filters.assignedTo}),
                ...(filters.search && {
                    OR: [
                        {title:     {contains: filters.search, mode: 'insensitive' as const}},
                        {reference: {contains: filters.search, mode: 'insensitive' as const}},
                    ],
                }),
            };

            const [data, total] = await this.prisma.$transaction([
                this.prisma.legalProcess.findMany({where, orderBy: {createdAt: 'desc'}, skip, take: limit}),
                this.prisma.legalProcess.count({where}),
            ]);

            this.logger.log(`findAll → success firmId=${firm.id} total=${total}`);
            return {data, total, page, limit};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`findAll → failed userId=${userId}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async findOne(userId: string, firmId?: string, id: string = ''): Promise<LegalProcessEntity>
    {
        try
        {
            const result = await this.findFirmProcess(userId, firmId, id);
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

    async update(userId: string, firmId?: string, id: string = '', dto: UpdateProcessDto = {}): Promise<LegalProcessEntity>
    {
        try
        {
            await this.findFirmProcess(userId, firmId, id);

            const result = await this.prisma.legalProcess.update({where: {id}, data: dto});
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

    async remove(userId: string, firmId?: string, id: string = ''): Promise<{message: string}>
    {
        try
        {
            const process = await this.findFirmProcess(userId, firmId, id);

            if (process.deletedAt)
                throw new HttpException('El proceso ya está eliminado', 400);

            await this.prisma.legalProcess.update({where: {id}, data: {deletedAt: new Date()}});

            this.logger.log(`remove → success id=${id}`);
            return {message: 'Proceso eliminado correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`remove → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async restore(userId: string, firmId?: string, id: string = ''): Promise<LegalProcessEntity>
    {
        try
        {
            const process = await this.findFirmProcess(userId, firmId, id, true);

            if (!process.deletedAt)
                throw new HttpException('El proceso no está eliminado', 400);

            const result = await this.prisma.legalProcess.update({where: {id}, data: {deletedAt: null}});
            this.logger.log(`restore → success id=${id}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`restore → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async getTemplates(userId: string, firmId?: string, id: string = ''): Promise<ProcessTemplateEntity[]>
    {
        try
        {
            await this.findFirmProcess(userId, firmId, id);

            const result = await this.prisma.processTemplate.findMany({
                where:   {processId: id},
                orderBy: {sortOrder: 'asc'},
            });

            this.logger.log(`getTemplates → success processId=${id} count=${result.length}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`getTemplates → failed processId=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async addTemplate(userId: string, firmId?: string, id: string = '', dto: AddProcessTemplateDto = {} as AddProcessTemplateDto): Promise<ProcessTemplateEntity>
    {
        try
        {
            await this.findFirmProcess(userId, firmId, id);

            const existing = await this.prisma.processTemplate.findUnique({
                where: {processId_templateId: {processId: id, templateId: dto.templateId}},
            });

            if (existing)
                throw new HttpException('La plantilla ya está asociada a este proceso', 400);

            const result = await this.prisma.processTemplate.create({
                data: {
                    processId:  id,
                    templateId: dto.templateId,
                    sortOrder:  dto.sortOrder  ?? 0,
                    isRequired: dto.isRequired ?? false,
                },
            });

            this.logger.log(`addTemplate → success processId=${id} templateId=${dto.templateId}`);
            return result;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`addTemplate → failed processId=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async removeTemplate(userId: string, firmId?: string, id: string = '', templateId: string = ''): Promise<{message: string}>
    {
        try
        {
            await this.findFirmProcess(userId, firmId, id);

            const existing = await this.prisma.processTemplate.findUnique({
                where: {processId_templateId: {processId: id, templateId}},
            });

            if (!existing)
                throw new NotFoundException('La plantilla no está asociada a este proceso');

            await this.prisma.processTemplate.delete({
                where: {processId_templateId: {processId: id, templateId}},
            });

            this.logger.log(`removeTemplate → success processId=${id} templateId=${templateId}`);
            return {message: 'Plantilla desvinculada del proceso'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`removeTemplate → failed processId=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    private async findFirmProcess(userId: string, firmId?: string, id: string = '', includeTrashed = false): Promise<LegalProcessEntity>
    {
        const firm = await this.firmService.getMyFirm(userId, firmId);

        const process = await this.prisma.legalProcess.findFirst({
            where: {
                id,
                firmId:    firm.id,
                deletedAt: includeTrashed ? undefined : null,
            },
        });

        if (!process) throw new NotFoundException('Proceso no encontrado');

        return process;
    }
}
