import {BadRequestException, UnsupportedMediaTypeException} from '@nestjs/common';

export type UploadKind = 'pdf' | 'png' | 'jpeg' | 'docx' | 'txt';

const CANONICAL_MIME: Record<UploadKind, string> = {
    pdf:  'application/pdf',
    png:  'image/png',
    jpeg: 'image/jpeg',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt:  'text/plain',
};

const startsWith = (buffer: Buffer, bytes: number[]): boolean =>
    bytes.every((byte, index) => buffer[index] === byte);

const looksLikeUtf8Text = (buffer: Buffer): boolean =>
{
    const sample = buffer.subarray(0, 8192);
    if (sample.includes(0x00)) return false;
    try
    {
        new TextDecoder('utf-8', {fatal: true}).decode(sample);
        return true;
    }
    catch
    {
        return false;
    }
};

// Detecta el tipo por los primeros bytes (magic numbers), no por el Content-Type del cliente.
export const detectUploadKind = (buffer: Buffer): UploadKind | null =>
{
    if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'pdf';
    if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
    if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'jpeg';

    // DOCX es un ZIP; se exige la estructura OOXML para no aceptar un .zip renombrado.
    if (startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]))
    {
        const head = buffer.subarray(0, 4096).toString('latin1');
        if (head.includes('[Content_Types].xml') || head.includes('word/')) return 'docx';
        return null;
    }

    if (looksLikeUtf8Text(buffer)) return 'txt';

    return null;
};

export const assertValidUpload = (
    file: Express.Multer.File | undefined,
    allowed: UploadKind[],
): {kind: UploadKind; mime: string} =>
{
    if (!file || !file.buffer || file.buffer.length === 0)
        throw new BadRequestException('Debes adjuntar un archivo válido.');

    const kind = detectUploadKind(file.buffer);

    if (!kind || !allowed.includes(kind))
        throw new UnsupportedMediaTypeException(
            'El contenido del archivo no corresponde a un formato permitido (PDF, DOCX, JPG, PNG).',
        );

    return {kind, mime: CANONICAL_MIME[kind]};
};
