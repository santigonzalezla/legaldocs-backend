import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiTags} from '@nestjs/swagger';
import {BranchService} from './branch.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from '../firm/decorators/firm-id.decorator';
import {Roles} from '../firm/decorators/roles.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {FirmMemberRole} from '../../../generated/prisma/client';
import {CreateBranchDto} from './dto/create-branch.dto';
import {UpdateBranchDto} from './dto/update-branch.dto';
import {BranchFiltersDto} from './dto/branch-filters.dto';

@ApiTags('Branch')
@ApiHeader({name: 'X-Firm-Id', required: false, description: 'ID de la firma activa (selector de workspace)'})
@Controller('branch')
export class BranchController
{
    constructor(private readonly branchService: BranchService) {}

    @Get()
    @ApiOperation({summary: 'Listar ramas jurídicas del sistema y del despacho'})
    async findAll(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Query() filters: BranchFiltersDto = {})
    {
        return this.branchService.findAll(user.userId, firmId, filters);
    }

    @Post()
    @Roles(FirmMemberRole.LAWYER)
    @ApiOperation({summary: 'Crear rama jurídica personalizada (LAWYER+)'})
    async create(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Body() dto: CreateBranchDto)
    {
        return this.branchService.create(user.userId, firmId, dto);
    }

    @Patch(':id')
    @Roles(FirmMemberRole.LAWYER)
    @ApiOperation({summary: 'Actualizar rama jurídica del despacho (LAWYER+)'})
    async update(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string, @Body() dto: UpdateBranchDto)
    {
        return this.branchService.update(user.userId, firmId, id, dto);
    }

    @Delete(':id')
    @Roles(FirmMemberRole.LAWYER)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar rama jurídica del despacho (LAWYER+)'})
    async remove(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string)
    {
        return this.branchService.remove(user.userId, firmId, id);
    }
}
