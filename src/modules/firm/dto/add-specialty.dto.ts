import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString} from 'class-validator';

export class AddSpecialtyDto
{
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Especialidad jurídica del despacho',
        example: 'Derecho Civil',
        required: true,
    })
    specialty: string;
}
