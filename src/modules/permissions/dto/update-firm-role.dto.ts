import {IsOptional, IsString, MaxLength} from 'class-validator';

export class UpdateFirmRoleDto
{
    @IsOptional()
    @IsString()
    @MaxLength(60)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(250)
    description?: string;
}
