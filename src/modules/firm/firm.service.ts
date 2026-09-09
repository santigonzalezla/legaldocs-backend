import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import {
    BadRequestException,
    ForbiddenException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException
} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {MailService} from '../../utils/mail/mail.service';
import {environmentVariables} from '../../config';
import {FirmRoleSeederService} from '../permissions/services/firm-role-seeder.service';
import {CreateFirmDto} from './dto/create-firm.dto';
import {UpdateFirmDto} from './dto/update-firm.dto';
import {InviteMemberDto} from './dto/invite-member.dto';
import {UpdateMemberDto} from './dto/update-member.dto';
import {UpdateMemberProfileDto} from './dto/update-member-profile.dto';
import {AddSpecialtyDto} from './dto/add-specialty.dto';
import {FirmEntity} from './entities/firm.entity';
import {FirmMemberEntity} from './entities/firm-member.entity';
import {FirmSpecialtyEntity} from './entities/firm-specialty.entity';
import {Firm, FirmMemberRole, FirmMemberStatus, FirmRole} from '../../../generated/prisma/client';
import {Prisma} from '../../../generated/prisma/client';

// include compartido para que las filas de miembro devueltas por inviteMember
// tengan la misma forma que las de getMembers (el frontend refresca la lista con ese shape).
const MEMBER_INCLUDE = {
    user:     {select: {firstName: true, lastName: true, email: true, phone: true, hourlyRate: true}},
    firmRole: {select: {id: true, name: true, slug: true}},
} as const;

@Injectable()
export class FirmService
{
    private readonly logger = new Logger(FirmService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
        private readonly firmRoleSeeder: FirmRoleSeederService
    ) {}

    async getMyFirms(userId: string): Promise<Array<FirmEntity & { role: FirmMemberRole; isOwner: boolean }>>
    {
        try {
            const ownedFirms = await this.prisma.firm.findMany({
                where: {createdBy: userId, deletedAt: null}
            });

            const ownedIds = new Set(ownedFirms.map(f => f.id));
            const memberships = await this.prisma.firmMember.findMany({
                where: {userId, status: FirmMemberStatus.ACTIVE},
                include: {firm: true}
            });

            return [
                ...ownedFirms.map(f => ({...f, role: FirmMemberRole.ADMIN, isOwner: true})),
                ...memberships
                    .filter(m => !ownedIds.has(m.firmId) && !m.firm.deletedAt)
                    .map(m => ({...m.firm, role: m.role, isOwner: false}))
            ];
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async getMyInvitations(userId: string): Promise<Array<{
        id: string; role: FirmMemberRole; inviteToken: string;
        inviteExpiresAt: Date; createdAt: Date;
        firm: { id: string; name: string; legalName: string | null; city: string | null };
    }>>
    {
        try {
            const user = await this.prisma.user.findUnique({where: {id: userId}});
            if (!user) return [];

            const invitations = await this.prisma.firmMember.findMany({
                where: {
                    inviteEmail: user.email,
                    status: FirmMemberStatus.PENDING,
                    inviteExpiresAt: {gte: new Date()},
                    inviteToken: {not: null}
                },
                include: {firm: {select: {id: true, name: true, legalName: true, city: true}}},
                orderBy: {createdAt: 'desc'}
            });

            return invitations
                .filter(i => i.inviteToken !== null)
                .map(i => ({
                    id: i.id,
                    role: i.role,
                    inviteToken: i.inviteToken!,
                    inviteExpiresAt: i.inviteExpiresAt!,
                    createdAt: i.createdAt,
                    firm: i.firm
                }));
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async rejectInvitation(userId: string, token: string): Promise<{ message: string }>
    {
        try {
            const user = await this.prisma.user.findUnique({where: {id: userId}});

            const member = await this.prisma.firmMember.findFirst({
                where: {
                    inviteToken: token,
                    status: FirmMemberStatus.PENDING,
                    inviteExpiresAt: {gte: new Date()}
                }
            });

            if (!member) throw new BadRequestException('Invitación inválida o expirada');

            if (member.inviteEmail && user?.email !== member.inviteEmail)
                throw new ForbiddenException('Esta invitación no corresponde a tu cuenta');

            await this.prisma.firmMember.delete({where: {id: member.id}});

            return {message: 'Invitación rechazada'};
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async createFirm(userId: string, dto: CreateFirmDto): Promise<FirmEntity>
    {
        try {
            const existing = await this.prisma.firm.findFirst({
                where: {createdBy: userId, deletedAt: null}
            });

            if (existing) throw new BadRequestException('Ya tienes un despacho registrado');

            const basicPlan = await this.prisma.subscriptionPlan.findFirst({
                where: {name: 'basic', isActive: true}
            });

            const firm = await this.prisma.firm.create({
                data: {
                    ...dto,
                    createdBy: userId,
                    members: {
                        create: {
                            userId,
                            role: FirmMemberRole.ADMIN,
                            status: FirmMemberStatus.ACTIVE,
                            joinedAt: new Date()
                        }
                    }
                }
            });

            if (basicPlan) {
                await this.prisma.subscription.create({
                    data: {
                        firmId: firm.id,
                        planId: basicPlan.id,
                        billingCycle: 'MONTHLY',
                        status: 'TRIAL',
                        startDate: new Date(),
                        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                    }
                });
            }

            const systemRoles = await this.firmRoleSeeder.seedSystemRoles(firm.id);

            await this.prisma.firmMember.updateMany({
                where: {firmId: firm.id, userId},
                data: {firmRoleId: systemRoles.admin.id}
            });

            return firm;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async getMyFirm(userId: string, firmId?: string): Promise<FirmEntity>
    {
        try {
            return this.findUserFirm(userId, firmId);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async updateFirm(userId: string, firmId: string | undefined, dto: UpdateFirmDto): Promise<FirmEntity>
    {
        try {
            const firm = await this.findUserFirm(userId, firmId);
            await this.assertCanManage(firm, userId);

            return this.prisma.firm.update({
                where: {id: firm.id},
                data: dto
            });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // Eliminación lógica: oculta la firma y todos sus datos (documentos, plantillas,
    // clientes, procesos, etc. quedan inaccesibles porque todo se resuelve a través
    // de la firma). Recuperable durante 30 días; luego FirmPurgeService la borra
    // definitivamente en cascada.
    async deleteFirm(userId: string, firmId?: string): Promise<{ message: string; purgeAt: Date }>
    {
        try {
            const firm = await this.findUserFirm(userId, firmId);
            await this.assertCanManage(firm, userId);

            const purgeAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            await this.prisma.firm.update({
                where: {id: firm.id},
                data: {deletedAt: new Date(), purgeAt}
            });

            this.logger.log(`deleteFirm → firm ${firm.id} marcada para purga el ${purgeAt.toISOString()}`);
            return {
                message: 'Despacho eliminado. Podés recuperarlo dentro de los próximos 30 días; después se borrará de forma permanente.',
                purgeAt
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error('deleteFirm → failed', error as Error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // Despachos que el usuario eliminó y todavía están dentro del plazo de recuperación.
    async listDeletedFirms(userId: string): Promise<Array<{id: string; name: string; deletedAt: Date | null; purgeAt: Date | null}>>
    {
        try {
            const firms = await this.prisma.firm.findMany({
                where:   {createdBy: userId, deletedAt: {not: null}},
                select:  {id: true, name: true, deletedAt: true, purgeAt: true},
                orderBy: {deletedAt: 'desc'}
            });

            const now = new Date();
            return firms.filter(firm => !firm.purgeAt || firm.purgeAt > now);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error('listDeletedFirms → failed', error as Error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async restoreFirm(userId: string, firmId: string): Promise<{ message: string }>
    {
        try {
            const firm = await this.prisma.firm.findFirst({
                where: {id: firmId, createdBy: userId, deletedAt: {not: null}}
            });

            if (!firm) throw new NotFoundException('Despacho eliminado no encontrado');

            if (firm.purgeAt && firm.purgeAt <= new Date())
                throw new BadRequestException('El plazo de recuperación de este despacho ya venció');

            await this.prisma.firm.update({
                where: {id: firm.id},
                data: {deletedAt: null, purgeAt: null}
            });

            return {message: 'Despacho restaurado correctamente'};
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error('restoreFirm → failed', error as Error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async getMembers(userId: string, firmId?: string, isPartner?: boolean): Promise<FirmMemberEntity[]>
    {
        try {
            const firm = await this.findUserFirm(userId, firmId);

            return this.prisma.firmMember.findMany({
                where: {firmId: firm.id, ...(isPartner !== undefined && {isPartner})},
                include: {
                    user:     {select: {firstName: true, lastName: true, email: true, phone: true, hourlyRate: true}},
                    firmRole: {select: {id: true, name: true, slug: true}},
                },
                orderBy: {createdAt: 'asc'}
            });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    // Aprovisiona al invitado directamente: si ya tiene cuenta lo engancha como
    // miembro ACTIVO; si no, le crea User + Credentials con clave temporal
    // (mustChangePassword) y lo deja ACTIVO. En ningún caso pasa por el onboarding.
    async inviteMember(userId: string, firmId: string | undefined, dto: InviteMemberDto): Promise<FirmMemberEntity>
    {
        try {
            const firm = await this.findUserFirm(userId, firmId);
            await this.assertCanManage(firm, userId);
            const role = await this.assertFirmRoleBelongsToFirm(firm.id, dto.firmRoleId);

            // Limpia filas legadas de invitación pendiente (sin usuario) para ese correo.
            await this.prisma.firmMember.deleteMany({
                where: {firmId: firm.id, inviteEmail: dto.email, status: FirmMemberStatus.PENDING, userId: null}
            });

            const inviter     = await this.prisma.user.findUnique({where: {id: userId}});
            const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName}` : 'Un administrador';
            const loginUrl    = `${environmentVariables.frontendUrl}/signin`;

            const existingCred = await this.prisma.credentials.findUnique({
                where: {email: dto.email},
                include: {user: true}
            });

            // ── Rama A: el usuario ya existe → engancharlo como miembro activo ──
            if (existingCred) {
                const existingMember = await this.prisma.firmMember.findUnique({
                    where: {firmId_userId: {firmId: firm.id, userId: existingCred.userId}}
                });

                if (existingMember && existingMember.status === FirmMemberStatus.ACTIVE)
                    throw new BadRequestException('Esta persona ya es miembro activo del despacho');

                const member = existingMember
                    ? await this.prisma.firmMember.update({
                        where: {id: existingMember.id},
                        data: {
                            status: FirmMemberStatus.ACTIVE,
                            firmRoleId: dto.firmRoleId,
                            role: this.legacyRoleForSlug(role.slug),
                            isPartner: dto.isPartner ?? false,
                            joinedAt: existingMember.joinedAt ?? new Date(),
                            inviteEmail: dto.email,
                            inviteToken: null,
                            inviteExpiresAt: null
                        },
                        include: MEMBER_INCLUDE
                    })
                    : await this.prisma.firmMember.create({
                        data: {
                            firmId: firm.id,
                            userId: existingCred.userId,
                            firmRoleId: dto.firmRoleId,
                            role: this.legacyRoleForSlug(role.slug),
                            isPartner: dto.isPartner ?? false,
                            status: FirmMemberStatus.ACTIVE,
                            joinedAt: new Date(),
                            inviteEmail: dto.email
                        },
                        include: MEMBER_INCLUDE
                    });

                this.mailService.sendFirmAddedEmail(dto.email, inviterName, firm.name, loginUrl)
                    .catch(e => this.logger.error(`sendFirmAddedEmail falló para ${dto.email}`, e as Error));

                return member as FirmMemberEntity;
            }

            // ── Rama B: crear la cuenta con clave temporal ──
            const tempPassword = this.generateTempPassword();
            const hash         = await argon2.hash(tempPassword);
            const localPart    = dto.email.split('@')[0];
            const firstName    = dto.firstName?.trim() || localPart;
            const lastName     = dto.lastName?.trim()  || '—';

            const member = await this.prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        firstName,
                        lastName,
                        email: dto.email,
                        credentials: {create: {
                            email: dto.email,
                            password: hash,
                            mustChangePassword: true,
                            isEmailVerified: true
                        }},
                        notificationPrefs: {create: {}},
                        securitySettings:  {create: {}}
                    }
                });

                return tx.firmMember.create({
                    data: {
                        firmId: firm.id,
                        userId: user.id,
                        firmRoleId: dto.firmRoleId,
                        role: this.legacyRoleForSlug(role.slug),
                        isPartner: dto.isPartner ?? false,
                        status: FirmMemberStatus.ACTIVE,
                        joinedAt: new Date(),
                        inviteEmail: dto.email
                    },
                    include: MEMBER_INCLUDE
                });
            });

            let emailSent = true;
            try {
                await this.mailService.sendProvisionedInviteEmail(dto.email, inviterName, firm.name, tempPassword, loginUrl);
            } catch (e) {
                emailSent = false;
                this.logger.error(`sendProvisionedInviteEmail falló para ${dto.email} — clave temporal: ${tempPassword}`, e as Error);
            }

            return {...member, emailSent} as FirmMemberEntity;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            if (error instanceof Prisma.PrismaClientKnownRequestError) throw error;
            this.logger.error('inviteMember → failed', error as Error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    private generateTempPassword(): string
    {
        return crypto.randomBytes(9).toString('base64url'); // ~12 chars URL-safe
    }

    private legacyRoleForSlug(slug: string | null): FirmMemberRole
    {
        return slug === 'admin' ? FirmMemberRole.ADMIN : FirmMemberRole.ASSISTANT;
    }

    async acceptInvitation(userId: string, token: string): Promise<{ message: string }>
    {
        try {
            const member = await this.prisma.firmMember.findFirst({
                where: {
                    inviteToken: token,
                    status: FirmMemberStatus.PENDING,
                    inviteExpiresAt: {gte: new Date()}
                }
            });

            if (!member) throw new BadRequestException('Invitación inválida o expirada');

            const user = await this.prisma.user.findUnique({where: {id: userId}});

            if (member.inviteEmail && user?.email !== member.inviteEmail)
                throw new ForbiddenException('Esta invitación no corresponde a tu cuenta');

            const alreadyMember = await this.prisma.firmMember.findFirst({
                where: {firmId: member.firmId, userId, status: FirmMemberStatus.ACTIVE}
            });

            if (alreadyMember) {
                await this.prisma.firmMember.delete({where: {id: member.id}});
                throw new BadRequestException('Ya eres miembro activo de este despacho');
            }

            await this.prisma.firmMember.update({
                where: {id: member.id},
                data: {
                    userId,
                    status: FirmMemberStatus.ACTIVE,
                    joinedAt: new Date(),
                    inviteToken: null,
                    inviteExpiresAt: null
                }
            });

            return {message: 'Te uniste al despacho correctamente'};
        } catch (error) {
            if (error instanceof HttpException) throw error;
            if (error instanceof Prisma.PrismaClientKnownRequestError) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async updateMember(userId: string, firmId: string | undefined, memberId: string, dto: UpdateMemberDto): Promise<FirmMemberEntity>
    {
        try {
            const firm = await this.findUserFirm(userId, firmId);
            await this.assertCanManage(firm, userId);

            const member = await this.prisma.firmMember.findFirst({
                where: {id: memberId, firmId: firm.id}
            });

            if (!member) throw new NotFoundException('Miembro no encontrado');

            if (member.userId === userId)
                throw new BadRequestException('No puedes modificar tu propio rol');

            if (dto.firmRoleId) await this.assertFirmRoleBelongsToFirm(firm.id, dto.firmRoleId);

            return this.prisma.firmMember.update({
                where: {id: memberId},
                data: dto
            });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async updateMemberProfile(userId: string, firmId: string | undefined, memberId: string, dto: UpdateMemberProfileDto)
    {
        try {
            const firm = await this.findUserFirm(userId, firmId);
            await this.assertCanManage(firm, userId);

            const member = await this.prisma.firmMember.findFirst({
                where: {id: memberId, firmId: firm.id}
            });

            if (!member) throw new NotFoundException('Miembro no encontrado');
            if (!member.userId) throw new BadRequestException('Este miembro todavía no tiene una cuenta asociada');
            if (member.userId === userId) throw new BadRequestException('No puedes editar tu propio perfil desde acá');

            return this.prisma.user.update({
                where: {id: member.userId},
                data: dto,
                select: {id: true, firstName: true, lastName: true, phone: true, hourlyRate: true}
            });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(`updateMemberProfile → failed memberId=${memberId}`, error as Error);
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    private async assertFirmRoleBelongsToFirm(firmId: string, firmRoleId: string): Promise<FirmRole>
    {
        const role = await this.prisma.firmRole.findFirst({where: {id: firmRoleId, firmId}});
        if (!role) throw new BadRequestException('El rol seleccionado no pertenece a este despacho');
        return role;
    }

    async removeMember(userId: string, firmId: string | undefined, memberId: string): Promise<{ message: string }>
    {
        try {
            const firm = await this.findUserFirm(userId, firmId);
            await this.assertCanManage(firm, userId);

            const member = await this.prisma.firmMember.findFirst({
                where: {id: memberId, firmId: firm.id}
            });

            if (!member) throw new NotFoundException('Miembro no encontrado');

            if (member.userId === userId)
                throw new BadRequestException('No puedes eliminarte a ti mismo del despacho');

            await this.prisma.firmMember.delete({where: {id: memberId}});

            return {message: 'Miembro eliminado correctamente'};
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async getSpecialties(userId: string, firmId?: string): Promise<FirmSpecialtyEntity[]>
    {
        try {
            const firm = await this.findUserFirm(userId, firmId);

            return this.prisma.firmSpecialty.findMany({
                where: {firmId: firm.id},
                orderBy: {specialty: 'asc'}
            });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async addSpecialty(userId: string, firmId: string | undefined, dto: AddSpecialtyDto): Promise<FirmSpecialtyEntity>
    {
        try {
            const firm = await this.findUserFirm(userId, firmId);
            await this.assertCanManage(firm, userId);

            const existing = await this.prisma.firmSpecialty.findFirst({
                where: {firmId: firm.id, specialty: dto.specialty}
            });

            if (existing) throw new BadRequestException('El despacho ya tiene esa especialidad registrada');

            return this.prisma.firmSpecialty.create({
                data: {firmId: firm.id, specialty: dto.specialty}
            });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    async removeSpecialty(userId: string, firmId: string | undefined, specialtyId: string): Promise<{ message: string }>
    {
        try {
            const firm = await this.findUserFirm(userId, firmId);
            await this.assertCanManage(firm, userId);

            const specialty = await this.prisma.firmSpecialty.findFirst({
                where: {id: specialtyId, firmId: firm.id}
            });

            if (!specialty) throw new NotFoundException('Especialidad no encontrada');

            await this.prisma.firmSpecialty.delete({where: {id: specialtyId}});

            return {message: 'Especialidad eliminada correctamente'};
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error interno del servidor');
        }
    }

    private async findUserFirm(userId: string, firmId?: string): Promise<Firm>
    {
        if (firmId) {
            const firm = await this.prisma.firm.findFirst({
                where: {id: firmId, deletedAt: null}
            });

            if (!firm) throw new NotFoundException('Firma no encontrada');

            if (firm.createdBy === userId) return firm;

            const membership = await this.prisma.firmMember.findFirst({
                where: {firmId, userId, status: FirmMemberStatus.ACTIVE}
            });

            if (!membership) throw new ForbiddenException('No tienes acceso a esta firma');

            return firm;
        }

        const owned = await this.prisma.firm.findFirst({
            where: {createdBy: userId, deletedAt: null}
        });

        if (owned) return owned;

        const membership = await this.prisma.firmMember.findFirst({
            where: {userId, status: FirmMemberStatus.ACTIVE},
            include: {firm: true},
            orderBy: {joinedAt: 'asc'}
        });

        if (!membership || membership.firm.deletedAt)
            throw new NotFoundException('No tienes un despacho asociado');

        return membership.firm;
    }

    private async assertCanManage(firm: Firm, userId: string): Promise<void>
    {
        if (firm.createdBy === userId) return;

        const member = await this.prisma.firmMember.findFirst({
            where: {firmId: firm.id, userId, status: FirmMemberStatus.ACTIVE, role: FirmMemberRole.ADMIN}
        });

        if (!member) throw new ForbiddenException('No tienes permisos para gestionar este despacho');
    }
}
