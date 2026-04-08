import {IsOptional, IsString, MaxLength} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';

export class ChatDto
{
    @IsString()
    @MaxLength(2000)
    @ApiProperty({example: '¿Cuál es el plazo máximo de un contrato de arrendamiento según la Ley 820?'})
    message: string;

    @IsOptional()
    @IsString()
    @ApiProperty({required: false, description: 'Contenido HTML del documento activo en el editor'})
    documentContent?: string;
}
