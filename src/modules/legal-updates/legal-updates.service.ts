import {HttpException, Injectable, InternalServerErrorException, Logger} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {Paginated} from '../../interfaces/Paginated';
import {LegalUpdateSourceInfo} from '../../interfaces/LegalUpdates';
import {LegalUpdateFiltersDto} from './dto/legal-update-filters.dto';
import {LegalUpdateEntity} from './entities/legal-update.entity';
import {SOURCE_LABELS} from './sources';

@Injectable()
export class LegalUpdatesService
{
    private readonly logger = new Logger(LegalUpdatesService.name);

    constructor(private readonly prisma: PrismaService) {}

    async findAll(filters: LegalUpdateFiltersDto = {}): Promise<Paginated<LegalUpdateEntity>>
    {
        try
        {
            const page  = filters.page  ?? 1;
            const limit = filters.limit ?? 20;
            const skip  = (page - 1) * limit;

            const where = {
                ...(filters.source && {source: filters.source}),
                ...(filters.type   && {type: filters.type}),
                ...(filters.since  && {publishedAt: {gt: new Date(filters.since)}}),
                ...(filters.search   && {
                    OR: [
                        {title:   {contains: filters.search, mode: 'insensitive' as const}},
                        {summary: {contains: filters.search, mode: 'insensitive' as const}},
                    ],
                }),
            };

            const [data, total] = await this.prisma.$transaction([
                this.prisma.legalUpdate.findMany({
                    where,
                    orderBy: {publishedAt: 'desc'},
                    skip,
                    take: limit,
                    include: {branch: {select: {id: true, name: true, slug: true, color: true, icon: true}}},
                }),
                this.prisma.legalUpdate.count({where}),
            ]);

            this.logger.log(`findAll → success total=${total}`);
            return {data, total, page, limit};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error('findAll → failed', error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async listSources(): Promise<LegalUpdateSourceInfo[]>
    {
        try
        {
            const runs = await this.prisma.legalUpdateSourceRun.findMany({orderBy: {source: 'asc'}});

            return runs.map(run => ({
                source:       run.source,
                label:        SOURCE_LABELS.get(run.source) ?? run.source,
                lastOkAt:     run.lastOkAt ? run.lastOkAt.toISOString() : null,
                itemsLastRun: run.itemsLastRun,
            }));
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error('listSources → failed', error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }
}
