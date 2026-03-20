import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean, IsOptional, IsString} from 'class-validator';

export class UpdateSignatureDto
{
    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Nombre identificador de la firma',
        example: 'Firma Principal',
        required: false,
    })
    name?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Contenido de la firma (SVG, base64 o texto según el tipo)',
        example: 'data:image/png;base64,...',
        required: false,
    })
    content?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Fuente tipográfica (solo para tipo TYPE)',
        example: 'Dancing Script',
        required: false,
    })
    font?: string;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Si esta firma es la predeterminada del usuario',
        example: false,
        required: false,
    })
    isDefault?: boolean;
}
