import {HttpException, Injectable, InternalServerErrorException, NotFoundException} from '@nestjs/common';
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
    constructor(
        private readonly prisma: PrismaService,
        private readonly firmService: FirmService,
    ) {}

    async create(userId: string, firmId?: string, dto: CreateProcessDto = {} as CreateProcessDto): Promise<LegalProcessEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            return this.prisma.legalProcess.create({
                data: {
                    ...dto,
                    firmId:    firm.id,
                    createdBy: userId,
                },
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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

            return {data, total, page, limit};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async findOne(userId: string, firmId?: string, id: string = ''): Promise<LegalProcessEntity>
    {
        try
        {
            return this.findFirmProcess(userId, firmId, id);
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async update(userId: string, firmId?: string, id: string = '', dto: UpdateProcessDto = {}): Promise<LegalProcessEntity>
    {
        try
        {
            await this.findFirmProcess(userId, firmId, id);

            return this.prisma.legalProcess.update({where: {id}, data: dto});
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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

            return {message: 'Proceso eliminado correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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

            return this.prisma.legalProcess.update({where: {id}, data: {deletedAt: null}});
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async getTemplates(userId: string, firmId?: string, id: string = ''): Promise<ProcessTemplateEntity[]>
    {
        try
        {
            await this.findFirmProcess(userId, firmId, id);

            return this.prisma.processTemplate.findMany({
                where:   {processId: id},
                orderBy: {sortOrder: 'asc'},
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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

            return this.prisma.processTemplate.create({
                data: {
                    processId:  id,
                    templateId: dto.templateId,
                    sortOrder:  dto.sortOrder  ?? 0,
                    isRequired: dto.isRequired ?? false,
                },
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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

            return {message: 'Plantilla desvinculada del proceso'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
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
