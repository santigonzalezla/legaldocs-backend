import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    Query,
    UploadedFile,
    UseInterceptors,
    Body,
    Headers
} from '@nestjs/common';
import {IsOptional, IsUUID} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';

class AssignBranchDto
{
    @IsOptional()
    @IsUUID()
    @ApiProperty({required: false, nullable: true})
    branchId: string | null;
}
import {Throttle} from '@nestjs/throttler';
import {ApiBearerAuth, ApiConsumes, ApiTags} from '@nestjs/swagger';
import {buildUploadInterceptor} from '../../utils/storage/upload.interceptor';
import {LibraryService} from './library.service';
import {UploadLibraryDocumentDto} from './dto/upload-library-document.dto';
import {LibraryFiltersDto} from './dto/library-filters.dto';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {Permission} from '../permissions/decorators/permission.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';

@ApiTags('Library')
@ApiBearerAuth()
@Controller('library')
export class LibraryController
{
    constructor(private readonly libraryService: LibraryService) {}

    @Post('documents')
    @Permission('library:create', 'Subir documentos a la biblioteca')
    @Throttle({default: {limit: 30, ttl: 60_000}})
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(buildUploadInterceptor(20 * 1024 * 1024))
    upload(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadLibraryDocumentDto, @CurrentUser() user: LoggedUser, @Headers('x-firm-id') firmId: string)
    {
        return this.libraryService.upload(file, dto, user, firmId);
    }

    @Get('documents')
    @Permission('library:view', 'Ver biblioteca jurídica')
    findAll(@Query() filters: LibraryFiltersDto, @Headers('x-firm-id') firmId: string)
    {
        return this.libraryService.findAll(firmId, filters);
    }

    @Patch('documents/:id/branch')
    @Permission('library:assign-branch', 'Asignar rama jurídica a documentos de biblioteca')
    assignBranch(@Param('id') id: string, @Body() dto: AssignBranchDto, @Headers('x-firm-id') firmId: string)
    {
        return this.libraryService.assignBranch(id, dto.branchId ?? null, firmId);
    }

    @Delete('documents/:id')
    @Permission('library:delete', 'Eliminar documentos de la biblioteca')
    remove(@Param('id') id: string, @Headers('x-firm-id') firmId: string)
    {
        return this.libraryService.remove(id, firmId);
    }
}
