import {Injectable, Logger} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {PrismaService} from '../prisma/prisma.service';

// Purga definitiva de las firmas cuyo plazo de recuperación (30 días) venció.
// El borrado en cascada de documentos, plantillas, clientes, procesos, suscripción,
// facturas, miembros y roles lo resuelve la BD vía onDelete: Cascade.
@Injectable()
export class FirmPurgeService
{
    private readonly logger = new Logger(FirmPurgeService.name);

    constructor(private readonly prisma: PrismaService) {}

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async purgeExpiredFirms(): Promise<void>
    {
        const expired = await this.prisma.firm.findMany({
            where:  {deletedAt: {not: null}, purgeAt: {lte: new Date()}},
            select: {id: true, name: true},
        });

        if (expired.length === 0) return;

        for (const firm of expired)
        {
            try
            {
                await this.prisma.firm.delete({where: {id: firm.id}});
                this.logger.log(`purgeExpiredFirms → "${firm.name}" (${firm.id}) eliminada definitivamente`);
            }
            catch (error)
            {
                this.logger.error(`purgeExpiredFirms → falló al eliminar ${firm.id}`, error as Error);
            }
        }
    }
}
