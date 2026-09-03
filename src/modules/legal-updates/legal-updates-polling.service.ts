import {Injectable, Logger} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {PrismaService} from '../prisma/prisma.service';
import {LegalUpdateSourceAdapter, PollSourceSummary, RawLegalUpdate} from '../../interfaces/LegalUpdates';
import {SOURCE_ADAPTERS} from './sources';
import {resolveBranchSlug} from './sources/branch-tagging';

@Injectable()
export class LegalUpdatesPollingService
{
    private readonly logger = new Logger(LegalUpdatesPollingService.name);

    constructor(private readonly prisma: PrismaService) {}

    private async loadBranchMap(): Promise<Map<string, string>>
    {
        const branches = await this.prisma.legalBranch.findMany({
            where:  {isSystem: true, deletedAt: null},
            select: {id: true, slug: true},
        });

        return new Map(branches.map(branch => [branch.slug, branch.id]));
    }

    private resolveBranchId(item: RawLegalUpdate, branchIdBySlug: Map<string, string>): string | null
    {
        const slug = resolveBranchSlug([item.title, item.summary, item.category].filter(Boolean).join(' '));
        return slug ? branchIdBySlug.get(slug) ?? null : null;
    }

    private async runOne(adapter: LegalUpdateSourceAdapter, branchIdBySlug: Map<string, string>): Promise<PollSourceSummary>
    {
        const startedAt = new Date();

        try
        {
            const run = await this.prisma.legalUpdateSourceRun.findUnique({where: {source: adapter.source}});
            const {items, nextCursor} = await adapter.fetchSince(run?.lastCursor ?? null);

            const data = items.map(item => ({
                source:      adapter.source,
                sourceLabel: adapter.sourceLabel,
                externalId:  item.externalId,
                type:        item.type,
                title:       item.title,
                summary:     item.summary,
                url:         item.url,
                category:    item.category,
                branchId:    this.resolveBranchId(item, branchIdBySlug),
                publishedAt: item.publishedAt,
            }));

            const {count} = await this.prisma.legalUpdate.createMany({data, skipDuplicates: true});

            await this.prisma.legalUpdateSourceRun.upsert({
                where:  {source: adapter.source},
                create: {source: adapter.source, lastRunAt: startedAt, lastOkAt: startedAt, lastCursor: nextCursor, itemsLastRun: count},
                update: {lastRunAt: startedAt, lastOkAt: startedAt, lastError: null, lastCursor: nextCursor, itemsLastRun: count},
            });

            this.logger.log(`pollAll → ${adapter.source} ok items=${count}`);
            return {source: adapter.source, inserted: count, error: null};
        }
        catch (error)
        {
            const message = error instanceof Error ? error.message : 'error desconocido';

            await this.prisma.legalUpdateSourceRun.upsert({
                where:  {source: adapter.source},
                create: {source: adapter.source, lastRunAt: startedAt, lastError: message, itemsLastRun: 0},
                update: {lastRunAt: startedAt, lastError: message},
            }).catch(() => undefined);

            this.logger.error(`pollAll → ${adapter.source} falló: ${message}`);
            return {source: adapter.source, inserted: 0, error: message};
        }
    }

    @Cron(CronExpression.EVERY_6_HOURS)
    async pollAll(): Promise<PollSourceSummary[]>
    {
        const branchIdBySlug = await this.loadBranchMap();
        const summaries: PollSourceSummary[] = [];

        for (const adapter of SOURCE_ADAPTERS)
        {
            summaries.push(await this.runOne(adapter, branchIdBySlug));
        }

        return summaries;
    }
}
