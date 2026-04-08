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
import {FileInterceptor} from '@nestjs/platform-express';
import {ApiBearerAuth, ApiConsumes, ApiTags} from '@nestjs/swagger';
import {LibraryService} from './library.service';
import {UploadLibraryDocumentDto} from './dto/upload-library-document.dto';
import {LibraryFiltersDto} from './dto/library-filters.dto';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {LoggedUser} from '../../interfaces/LoggedUser';

@ApiTags('Library')
@ApiBearerAuth()
@Controller('library')
export class LibraryController
{
    constructor(private readonly libraryService: LibraryService) {}

    @Post('documents')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    upload(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadLibraryDocumentDto, @CurrentUser() user: LoggedUser, @Headers('x-firm-id') firmId: string)
    {
        return this.libraryService.upload(file, dto, user, firmId);
    }

    @Get('documents')
    findAll(@Query() filters: LibraryFiltersDto, @Headers('x-firm-id') firmId: string)
    {
        return this.libraryService.findAll(firmId, filters);
    }

    @Patch('documents/:id/branch')
    assignBranch(@Param('id') id: string, @Body() dto: AssignBranchDto, @Headers('x-firm-id') firmId: string)
    {
        return this.libraryService.assignBranch(id, dto.branchId ?? null, firmId);
    }

    @Delete('documents/:id')
    remove(@Param('id') id: string, @Headers('x-firm-id') firmId: string)
    {
        return this.libraryService.remove(id, firmId);
    }
}
