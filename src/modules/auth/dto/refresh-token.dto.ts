import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString} from 'class-validator';

export class RefreshTokenDto
{
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Refresh token emitido en el último login o refresh',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        required: true
    })
    refreshToken: string;
}
