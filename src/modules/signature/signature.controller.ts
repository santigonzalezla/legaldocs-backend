import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post} from '@nestjs/common';
import {ApiOperation, ApiTags} from '@nestjs/swagger';
import {SignatureService} from './signature.service';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';
import {CreateSignatureDto} from './dto/create-signature.dto';
import {UpdateSignatureDto} from './dto/update-signature.dto';

@ApiTags('Signature')
@Controller('signature')
export class SignatureController
{
    constructor(private readonly signatureService: SignatureService) {}

    @Get()
    @ApiOperation({summary: 'Listar firmas digitales del usuario'})
    async findAll(@CurrentUser() user: LoggedUser)
    {
        return this.signatureService.findAll(user.userId);
    }

    @Get(':id')
    @ApiOperation({summary: 'Obtener una firma digital por ID'})
    async findOne(@CurrentUser() user: LoggedUser, @Param('id') id: string)
    {
        return this.signatureService.findOne(user.userId, id);
    }

    @Post()
    @ApiOperation({summary: 'Crear nueva firma digital'})
    async create(@CurrentUser() user: LoggedUser, @Body() dto: CreateSignatureDto)
    {
        return this.signatureService.create(user.userId, dto);
    }

    @Patch(':id')
    @ApiOperation({summary: 'Actualizar firma digital'})
    async update(@CurrentUser() user: LoggedUser, @Param('id') id: string, @Body() dto: UpdateSignatureDto)
    {
        return this.signatureService.update(user.userId, id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Eliminar firma digital (soft delete)'})
    async remove(@CurrentUser() user: LoggedUser, @Param('id') id: string)
    {
        return this.signatureService.remove(user.userId, id);
    }

    @Patch(':id/default')
    @ApiOperation({summary: 'Establecer firma como predeterminada'})
    async setDefault(@CurrentUser() user: LoggedUser, @Param('id') id: string)
    {
        return this.signatureService.setDefault(user.userId, id);
    }
}
