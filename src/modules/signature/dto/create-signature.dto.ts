import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean, IsEnum, IsOptional, IsString} from 'class-validator';
import {SignatureType} from '../../../../generated/prisma/client';

export class CreateSignatureDto
{
    @IsString()
    @ApiProperty({
        description: 'Nombre identificador de la firma',
        example: 'Firma Principal',
        required: true,
    })
    name: string;

    @IsEnum(SignatureType)
    @ApiProperty({
        description: 'Tipo de firma',
        example: SignatureType.DRAW,
        required: true,
        enum: SignatureType,
    })
    type: SignatureType;

    @IsString()
    @ApiProperty({
        description: 'Contenido de la firma (SVG, base64 o texto según el tipo)',
        example: 'data:image/png;base64,...',
        required: true,
    })
    content: string;

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
