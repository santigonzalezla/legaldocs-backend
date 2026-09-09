import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query} from '@nestjs/common';
import {ApiHeader, ApiOperation, ApiTags} from '@nestjs/swagger';
import {ProcessCategoryService} from './process-category.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from '../firm/decorators/firm-id.decorator';
import {Permission} from '../permissions/decorators/permission.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {CreateProcessCategoryDto} from './dto/create-process-category.dto';
import {UpdateProcessCategoryDto} from './dto/update-process-category.dto';
import {ProcessCategoryFiltersDto} from './dto/process-category-filters.dto';

@ApiTags('Process Category')
@ApiHeader({name: 'X-Firm-Id', required: false, description: 'ID de la firma activa (selector de workspace)'})
@Controller('process-category')
export class ProcessCategoryController
{
    constructor(private readonly processCategoryService: ProcessCategoryService) {}

    @Get()
    @ApiOperation({summary: 'Listar/buscar categorías de proceso (para el combobox de categoría)'})
    async findAll(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Query() filters: ProcessCategoryFiltersDto = {})
    {
        return this.processCategoryService.findAll(user.userId, firmId, filters);
    }

    @Post()
    @Permission('processes:create', 'Crear procesos legales')
    @ApiOperation({summary: 'Crear categoría de proceso (o reutilizar si el nombre ya existe)'})
    async create(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Body() dto: CreateProcessCategoryDto)
    {
        return this.processCategoryService.create(user.userId, firmId, dto);
    }

    @Patch(':id')
    @Permission('processes:edit', 'Editar procesos legales')
    @ApiOperation({summary: 'Actualizar categoría de proceso del despacho'})
    async update(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string, @Body() dto: UpdateProcessCategoryDto)
    {
        return this.processCategoryService.update(user.userId, firmId, id, dto);
    }

    @Delete(':id')
    @Permission('processes:delete', 'Eliminar procesos legales')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar categoría de proceso del despacho'})
    async remove(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string)
    {
        return this.processCategoryService.remove(user.userId, firmId, id);
    }
}
