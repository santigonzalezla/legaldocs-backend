import {IsEnum, IsOptional, IsNumberString, IsUUID} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {LibraryDocumentType} from '../../../../generated/prisma/client';

export class LibraryFiltersDto
{
    @IsOptional()
    @IsEnum(LibraryDocumentType)
    @ApiProperty({enum: LibraryDocumentType, required: false})
    type?: LibraryDocumentType;

    @IsOptional()
    @IsUUID()
    @ApiProperty({required: false, description: 'Filtrar por rama jurídica'})
    branchId?: string;

    @IsOptional()
    @IsNumberString()
    @ApiProperty({required: false, default: 1})
    page?: string;

    @IsOptional()
    @IsNumberString()
    @ApiProperty({required: false, default: 20})
    limit?: string;
}
