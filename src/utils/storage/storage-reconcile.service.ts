import {Injectable, Logger} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {PrismaService} from '../../modules/prisma/prisma.service';
import {StorageService} from './storage.service';

// Compara, por firma, los bytes reales en R2 contra el libro mayor (StorageObject).
// Sólo loguea el drift — no corrige. FirmPurgeService usa las 3AM, esto va a las 4AM.
@Injectable()
export class StorageReconcileService
{
    private readonly logger = new Logger(StorageReconcileService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_4AM)
    async reconcile(): Promise<void>
    {
        const firms = await this.prisma.firm.findMany({
            where:  {deletedAt: null},
            select: {id: true, name: true},
        });

        for (const firm of firms)
        {
            try
            {
                const objects = await this.storage.listFirmObjects(firm.id);
                const r2Bytes = objects.reduce((sum, object) => sum + object.size, 0);

                const ledger = await this.prisma.storageObject.aggregate({
                    where: {firmId: firm.id, deletedAt: null},
                    _sum:  {sizeBytes: true},
                });
                const ledgerBytes = ledger._sum.sizeBytes ?? 0;

                if (Math.abs(r2Bytes - ledgerBytes) > 1024)
                    this.logger.warn(
                        `reconcile → firma "${firm.name}" (${firm.id}): R2=${r2Bytes}B libro=${ledgerBytes}B drift=${r2Bytes - ledgerBytes}B`,
                    );
            }
            catch (error)
            {
                this.logger.error(`reconcile → falló ${firm.id}`, error as Error);
            }
        }
    }
}
