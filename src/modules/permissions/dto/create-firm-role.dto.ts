import {IsArray, IsOptional, IsString, MaxLength} from 'class-validator';

export class CreateFirmRoleDto
{
    @IsString()
    @MaxLength(60)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(250)
    description?: string;

    @IsOptional()
    @IsArray()
    @IsString({each: true})
    permissionKeys?: string[];
}
