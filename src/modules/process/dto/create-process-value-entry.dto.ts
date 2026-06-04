import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsNumber, IsString} from 'class-validator';

export class CreateProcessValueEntryDto
{
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({description: 'Valor en COP de la entrada adicional al proceso', example: 2000000})
    amount: number;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({description: 'Descripción o razón del ingreso adicional', example: 'Audiencia extraordinaria'})
    description: string;
}
