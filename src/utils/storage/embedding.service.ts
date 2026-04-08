import {Injectable} from '@nestjs/common';
import OpenAI from 'openai';
import {environmentVariables} from '../../config';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHUNK_SIZE      = 800;   // tokens aprox (~3200 chars)
const CHUNK_OVERLAP   = 100;   // chars de solapamiento entre chunks

@Injectable()
export class EmbeddingService
{
    private readonly openai: OpenAI;

    constructor()
    {
        this.openai = new OpenAI({apiKey: environmentVariables.openaiApiKey});
    }

    chunkText(text: string): string[]
    {
        const chunkChars   = CHUNK_SIZE * 4;
        const overlapChars = CHUNK_OVERLAP * 4;
        const chunks: string[] = [];
        let start = 0;

        while (start < text.length)
        {
            const end   = Math.min(start + chunkChars, text.length);
            const chunk = text.slice(start, end).trim();
            if (chunk.length > 50) chunks.push(chunk);
            start += chunkChars - overlapChars;
        }

        return chunks;
    }

    async embedText(text: string): Promise<number[]>
    {
        const response = await this.openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: text.slice(0, 8000),
        });
        return response.data[0].embedding;
    }

    async embedBatch(texts: string[]): Promise<number[][]>
    {
        const response = await this.openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: texts.map(t => t.slice(0, 8000)),
        });
        return response.data.map(d => d.embedding);
    }

    vectorToSql(embedding: number[]): string
    {
        return `[${embedding.join(',')}]`;
    }
}
