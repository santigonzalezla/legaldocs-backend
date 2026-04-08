import {Controller, Post, Body, Headers, Res} from '@nestjs/common';
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger';
import {Response} from 'express';
import {AiService} from './ai.service';
import {ChatDto} from './dto/chat.dto';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AiController
{
    constructor(private readonly aiService: AiService) {}

    @Post('chat')
    chat(@Body() dto: ChatDto, @Headers('x-firm-id') firmId: string, @Res() res: Response)
    {
        return this.aiService.chat(dto, firmId, res);
    }
}
