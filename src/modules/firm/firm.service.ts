import * as crypto from 'crypto';
import {BadRequestException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {MailService} from '../../utils/mail/mail.service';
import {CreateFirmDto} from './dto/create-firm.dto';
import {UpdateFirmDto} from './dto/update-firm.dto';
import {InviteMemberDto} from './dto/invite-member.dto';
import {UpdateMemberDto} from './dto/update-member.dto';
import {AddSpecialtyDto} from './dto/add-specialty.dto';
import {FirmEntity} from './entities/firm.entity';
import {FirmMemberEntity} from './entities/firm-member.entity';
import {FirmSpecialtyEntity} from './entities/firm-specialty.entity';
import {Firm, FirmMemberRole, FirmMemberStatus} from '../../../generated/prisma/client';

@Injectable()
export class FirmService
{
    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
    ) {}

    async getMyFirms(userId: string): Promise<Array<FirmEntity & {role: FirmMemberRole; isOwner: boolean}>>
    {
        try
        {
            const ownedFirms = await this.prisma.firm.findMany({
                where: {createdBy: userId, deletedAt: null},
            });

            const ownedIds   = new Set(ownedFirms.map(f => f.id));
            const memberships = await this.prisma.firmMember.findMany({
                where: {userId, status: FirmMemberStatus.ACTIVE},
                include: {firm: true},
            });

            return [
                ...ownedFirms.map(f => ({...f, role: FirmMemberRole.ADMIN, isOwner: true})),
                ...memberships
                    .filter(m => !ownedIds.has(m.firmId) && !m.firm.deletedAt)
                    .map(m => ({...m.firm, role: m.role, isOwner: false})),
            ];
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async createFirm(userId: string, dto: CreateFirmDto): Promise<FirmEntity>
    {
        try
        {
            const existing = await this.prisma.firm.findFirst({
                where: {createdBy: userId, deletedAt: null},
            });

            if (existing) throw new BadRequestException('Ya tienes un despacho registrado');

            return this.prisma.firm.create({
                data: {
                    ...dto,
                    createdBy: userId,
                    members: {
                        create: {
                            userId,
                            role: FirmMemberRole.ADMIN,
                            status: FirmMemberStatus.ACTIVE,
                            joinedAt: new Date(),
                        },
                    },
                },
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async getMyFirm(userId: string, firmId?: string): Promise<FirmEntity>
    {
        try
        {
            return this.findUserFirm(userId, firmId);
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async updateFirm(userId: string, firmId: string | undefined, dto: UpdateFirmDto): Promise<FirmEntity>
    {
        try
        {
            const firm = await this.findUserFirm(userId, firmId);
            await this.assertCanManage(firm, userId);

            return this.prisma.firm.update({
                where: {id: firm.id},
                data: dto,
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async deleteFirm(userId: string, firmId?: string): Promise<{message: string}>
    {
        try
        {
            const firm = await this.findUserFirm(userId, firmId);

            if (firm.createdBy !== userId)
                throw new ForbiddenException('Solo el propietario puede eliminar el despacho');

            await this.prisma.firm.update({
                where: {id: firm.id},
                data: {deletedAt: new Date()},
            });

            return {message: 'Despacho eliminado correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async getMembers(userId: string, firmId?: string): Promise<FirmMemberEntity[]>
    {
        try
        {
            const firm = await this.findUserFirm(userId, firmId);

            return this.prisma.firmMember.findMany({
                where:   {firmId: firm.id},
                include: {user: {select: {firstName: true, lastName: true, email: true, phone: true}}},
                orderBy: {createdAt: 'asc'},
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async inviteMember(userId: string, firmId: string | undefined, dto: InviteMemberDto): Promise<FirmMemberEntity>
    {
        try
        {
            const firm = await this.findUserFirm(userId, firmId);
            await this.assertCanManage(firm, userId);

            const existing = await this.prisma.firmMember.findFirst({
                where: {firmId: firm.id, inviteEmail: dto.email},
            });

            if (existing) throw new BadRequestException('Ya existe una invitación para ese correo en este despacho');

            const inviteToken     = crypto.randomBytes(32).toString('hex');
            const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            const member = await this.prisma.firmMember.create({
                data: {
                    firmId: firm.id,
                    role: dto.role,
                    status: FirmMemberStatus.PENDING,
                    inviteEmail: dto.email,
                    inviteToken,
                    inviteExpiresAt,
                },
            });

            const inviter = await this.prisma.user.findUnique({where: {id: userId}});

            this.mailService.sendFirmInvitationEmail(
                dto.email,
                inviter ? `${inviter.firstName} ${inviter.lastName}` : 'Un miembro del despacho',
                firm.name,
                inviteToken,
            ).catch(() => {});

            return member;
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async acceptInvitation(userId: string, token: string): Promise<{message: string}>
    {
        try
        {
            const member = await this.prisma.firmMember.findFirst({
                where: {
                    inviteToken:    token,
                    status:         FirmMemberStatus.PENDING,
                    inviteExpiresAt: {gte: new Date()},
                },
            });

            if (!member) throw new BadRequestException('Invitación inválida o expirada');

            const user = await this.prisma.user.findUnique({where: {id: userId}});

            if (member.inviteEmail && user?.email !== member.inviteEmail)
                throw new ForbiddenException('Esta invitación no corresponde a tu cuenta');

            await this.prisma.firmMember.update({
                where: {id: member.id},
                data: {
                    userId,
                    status:          FirmMemberStatus.ACTIVE,
                    joinedAt:        new Date(),
                    inviteToken:     null,
                    inviteExpiresAt: null,
                },
            });

            return {message: 'Te uniste al despacho correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async updateMember(userId: string, firmId: string | undefined, memberId: string, dto: UpdateMemberDto): Promise<FirmMemberEntity>
    {
        try
        {
            const firm = await this.findUserFirm(userId, firmId);
            await this.assertCanManage(firm, userId);

            const member = await this.prisma.firmMember.findFirst({
                where: {id: memberId, firmId: firm.id},
            });

            if (!member) throw new NotFoundException('Miembro no encontrado');

            if (member.userId === userId)
                throw new BadRequestException('No puedes modificar tu propio rol');

            return this.prisma.firmMember.update({
                where: {id: memberId},
                data: dto,
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async removeMember(userId: string, firmId: string | undefined, memberId: string): Promise<{message: string}>
    {
        try
        {
            const firm = await this.findUserFirm(userId, firmId);
            await this.assertCanManage(firm, userId);

            const member = await this.prisma.firmMember.findFirst({
                where: {id: memberId, firmId: firm.id},
            });

            if (!member) throw new NotFoundException('Miembro no encontrado');

            if (member.userId === userId)
                throw new BadRequestException('No puedes eliminarte a ti mismo del despacho');

            await this.prisma.firmMember.delete({where: {id: memberId}});

            return {message: 'Miembro eliminado correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async getSpecialties(userId: string, firmId?: string): Promise<FirmSpecialtyEntity[]>
    {
        try
        {
            const firm = await this.findUserFirm(userId, firmId);

            return this.prisma.firmSpecialty.findMany({
                where: {firmId: firm.id},
                orderBy: {specialty: 'asc'},
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async addSpecialty(userId: string, firmId: string | undefined, dto: AddSpecialtyDto): Promise<FirmSpecialtyEntity>
    {
        try
        {
            const firm = await this.findUserFirm(userId, firmId);
            await this.assertCanManage(firm, userId);

            const existing = await this.prisma.firmSpecialty.findFirst({
                where: {firmId: firm.id, specialty: dto.specialty},
            });

            if (existing) throw new BadRequestException('El despacho ya tiene esa especialidad registrada');

            return this.prisma.firmSpecialty.create({
                data: {firmId: firm.id, specialty: dto.specialty},
            });
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async removeSpecialty(userId: string, firmId: string | undefined, specialtyId: string): Promise<{message: string}>
    {
        try
        {
            const firm = await this.findUserFirm(userId, firmId);
            await this.assertCanManage(firm, userId);

            const specialty = await this.prisma.firmSpecialty.findFirst({
                where: {id: specialtyId, firmId: firm.id},
            });

            if (!specialty) throw new NotFoundException('Especialidad no encontrada');

            await this.prisma.firmSpecialty.delete({where: {id: specialtyId}});

            return {message: 'Especialidad eliminada correctamente'};
        }
        catch (error)
        {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    private async findUserFirm(userId: string, firmId?: string): Promise<Firm>
    {
        if (firmId)
        {
            const firm = await this.prisma.firm.findFirst({
                where: {id: firmId, deletedAt: null},
            });

            if (!firm) throw new NotFoundException('Firma no encontrada');

            if (firm.createdBy === userId) return firm;

            const membership = await this.prisma.firmMember.findFirst({
                where: {firmId, userId, status: FirmMemberStatus.ACTIVE},
            });

            if (!membership) throw new ForbiddenException('No tienes acceso a esta firma');

            return firm;
        }

        const owned = await this.prisma.firm.findFirst({
            where: {createdBy: userId, deletedAt: null},
        });

        if (owned) return owned;

        const membership = await this.prisma.firmMember.findFirst({
            where: {userId, status: FirmMemberStatus.ACTIVE},
            include: {firm: true},
            orderBy: {joinedAt: 'asc'},
        });

        if (!membership || membership.firm.deletedAt)
            throw new NotFoundException('No tienes un despacho asociado');

        return membership.firm;
    }

    private async assertCanManage(firm: Firm, userId: string): Promise<void>
    {
        if (firm.createdBy === userId) return;

        const member = await this.prisma.firmMember.findFirst({
            where: {firmId: firm.id, userId, status: FirmMemberStatus.ACTIVE, role: FirmMemberRole.ADMIN},
        });

        if (!member) throw new ForbiddenException('No tienes permisos para gestionar este despacho');
    }
}
