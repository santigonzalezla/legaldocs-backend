import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseInterceptors
} from '@nestjs/common';
import {ApiBody, ApiConsumes, ApiHeader, ApiOperation, ApiTags} from '@nestjs/swagger';
import {FileInterceptor} from '@nestjs/platform-express';
import {memoryStorage} from 'multer';
import {TemplateService} from './template.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {FirmId} from '../firm/decorators/firm-id.decorator';
import {Roles} from '../firm/decorators/roles.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {FirmMemberRole} from '../../../generated/prisma/client';
import {CreateTemplateDto} from './dto/create-template.dto';
import {UpdateTemplateDto} from './dto/update-template.dto';
import {TemplateFiltersDto} from './dto/template-filters.dto';

@ApiTags('Template')
@ApiHeader({name: 'X-Firm-Id', required: false, description: 'ID de la firma activa (selector de workspace)'})
@Controller('template')
export class TemplateController
{
    constructor(private readonly templateService: TemplateService) {}

    @Post('parse-upload')
    @Roles(FirmMemberRole.LAWYER)
    @UseInterceptors(FileInterceptor('file', {storage: memoryStorage(), limits: {fileSize: 10 * 1024 * 1024}}))
    @ApiOperation({summary: 'Parsear plantilla Word (.docx) y extraer variables (LAWYER+)'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({schema: {type: 'object', properties: {file: {type: 'string', format: 'binary'}}}})
    async parseUpload(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @UploadedFile() file: Express.Multer.File)
    {
        return this.templateService.parseUpload(user.userId, firmId, file);
    }

    @Get()
    @ApiOperation({summary: 'Listar plantillas con filtros'})
    async findAll(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Query() filters: TemplateFiltersDto)
    {
        return this.templateService.findAll(user.userId, firmId, filters);
    }

    @Get(':id')
    @ApiOperation({summary: 'Obtener una plantilla por ID'})
    async findOne(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string)
    {
        return this.templateService.findOne(user.userId, firmId, id);
    }

    @Post()
    @Roles(FirmMemberRole.LAWYER)
    @ApiOperation({summary: 'Crear plantilla personalizada (LAWYER+)'})
    async create(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Body() dto: CreateTemplateDto)
    {
        return this.templateService.create(user.userId, firmId, dto);
    }

    @Patch(':id')
    @Roles(FirmMemberRole.LAWYER)
    @ApiOperation({summary: 'Actualizar plantilla del despacho (LAWYER+)'})
    async update(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string, @Body() dto: UpdateTemplateDto)
    {
        return this.templateService.update(user.userId, firmId, id, dto);
    }

    @Delete(':id')
    @Roles(FirmMemberRole.LAWYER)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar plantilla del despacho (LAWYER+)'})
    async remove(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string)
    {
        return this.templateService.remove(user.userId, firmId, id);
    }

    @Post(':id/copy')
    @Roles(FirmMemberRole.LAWYER)
    @ApiOperation({summary: 'Copiar plantilla al despacho (LAWYER+)'})
    async copyTemplate(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string)
    {
        return this.templateService.copyTemplate(user.userId, firmId, id);
    }

    @Patch(':id/favorite')
    @ApiOperation({summary: 'Marcar o desmarcar plantilla como favorita'})
    async toggleFavorite(@CurrentUser() user: LoggedUser, @FirmId() firmId: string | undefined, @Param('id') id: string)
    {
        return this.templateService.toggleFavorite(user.userId, firmId, id);
    }
}
