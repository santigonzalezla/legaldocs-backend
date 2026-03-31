import {ApiProperty} from '@nestjs/swagger';
import {IsUUID, IsNotEmpty} from 'class-validator';

export class StartTimerDto
{
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({description: 'ID del proceso legal al que se asocia el conteo', example: 'uuid-v4'})
    processId: string;
}
