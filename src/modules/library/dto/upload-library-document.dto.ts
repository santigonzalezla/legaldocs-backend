import {IsEnum, IsOptional, IsString, IsUUID} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {LibraryDocumentType} from '../../../../generated/prisma/client';

export class UploadLibraryDocumentDto
{
    @IsString()
    @ApiProperty({example: 'Ley 820 de 2003'})
    title: string;

    @IsOptional()
    @IsString()
    @ApiProperty({required: false})
    description?: string;

    @IsEnum(LibraryDocumentType)
    @ApiProperty({enum: LibraryDocumentType})
    type: LibraryDocumentType;

    @IsOptional()
    @IsUUID()
    @ApiProperty({required: false, description: 'ID de la rama jurídica'})
    branchId?: string;
}
