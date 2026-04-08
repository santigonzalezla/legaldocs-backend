import {HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {FirmService} from '../firm/firm.service';
import {CreateClientDto} from './dto/create-client.dto';
import {UpdateClientDto} from './dto/update-client.dto';
import {ClientFiltersDto} from './dto/client-filters.dto';
import {ClientEntity} from './entities/client.entity';
import {Paginated} from '../../interfaces/Paginated';

@Injectable()
export class ClientService
{
    private readonly logger = new Logger(ClientService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly firmService: FirmService,
    ) {}

    async create(userId: string, firmId?: string, dto: CreateClientDto = {} as CreateClientDto): Promise<ClientEntity>
    {
        try
        {
            const firm = await this.firmService.getMyFirm(userId, firmId);

            const result = await this.prisma.client.create({
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

    async findAll(userId: string, firmId?: string, filters: ClientFiltersDto = {}): Promise<Paginated<ClientEntity>>
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
                ...(filters.type && {type: filters.type}),
                ...(filters.search && {
                    OR: [
                        {firstName:      {contains: filters.search, mode: 'insensitive' as const}},
                        {lastName:       {contains: filters.search, mode: 'insensitive' as const}},
                        {companyName:    {contains: filters.search, mode: 'insensitive' as const}},
                        {documentNumber: {contains: filters.search, mode: 'insensitive' as const}},
                        {email:          {contains: filters.search, mode: 'insensitive' as const}},
                    ],
                }),
            };

            const [data, total] = await this.prisma.$transaction([
                this.prisma.client.findMany({where, orderBy: {createdAt: 'desc'}, skip, take: limit}),
                this.prisma.client.count({where}),
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

    async findOne(userId: string, firmId?: string, id: string = ''): Promise<ClientEntity>
    {
        try
        {
            const result = await this.findFirmClient(userId, firmId, id);
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

    async update(userId: string, firmId?: string, id: string = '', dto: UpdateClientDto = {}): Promise<ClientEntity>
    {
        try
        {
            await this.findFirmClient(userId, firmId, id);

            const result = await this.prisma.client.update({where: {id}, data: dto});
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
            const client = await this.findFirmClient(userId, firmId, id);

            if (client.deletedAt)
                throw new HttpException('El cliente ya está eliminado', 400);

            await this.prisma.client.update({where: {id}, data: {deletedAt: new Date()}});

            this.logger.log(`remove → success id=${id}`);
            return {message: 'Cliente eliminado correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            this.logger.error(`remove → failed id=${id}`, error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async restore(userId: string, firmId?: string, id: string = ''): Promise<ClientEntity>
    {
        try
        {
            const client = await this.findFirmClient(userId, firmId, id, true);

            if (!client.deletedAt)
                throw new HttpException('El cliente no está eliminado', 400);

            const result = await this.prisma.client.update({where: {id}, data: {deletedAt: null}});
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

    private async findFirmClient(userId: string, firmId?: string, id: string = '', includeTrashed = false): Promise<ClientEntity>
    {
        const firm = await this.firmService.getMyFirm(userId, firmId);

        const client = await this.prisma.client.findFirst({
            where: {
                id,
                firmId:    firm.id,
                deletedAt: includeTrashed ? undefined : null,
            },
        });

        if (!client) throw new NotFoundException('Cliente no encontrado');

        return client;
    }
}
