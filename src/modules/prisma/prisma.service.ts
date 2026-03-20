import {Injectable, OnModuleInit, OnModuleDestroy} from '@nestjs/common';
import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient} from '../../../generated/prisma/client';
import {environmentVariables} from "../../config";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy
{
    constructor()
    {
        const adapter = new PrismaPg({connectionString: environmentVariables.databaseUrl});
        super({adapter});
    }

    async onModuleInit()
    {
        await this.$connect();
    }

    async onModuleDestroy()
    {
        await this.$disconnect();
    }
}
