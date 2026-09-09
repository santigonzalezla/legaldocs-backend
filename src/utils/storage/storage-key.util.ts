import {randomBytes} from 'crypto';

const stripDiacritics = (value: string): string =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const slugifySegment = (value: string, maxLength = 60): string =>
{
    const slug = stripDiacritics(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, maxLength)
        .replace(/-+$/g, '');

    return slug || 'sin-nombre';
};

export const buildStoredFilename = (originalName: string): string =>
{
    const dot = originalName.lastIndexOf('.');
    const hasExtension = dot > 0 && dot < originalName.length - 1;
    const base = hasExtension ? originalName.slice(0, dot) : originalName;
    const extension = hasExtension
        ? stripDiacritics(originalName.slice(dot + 1)).toLowerCase().replace(/[^a-z0-9]/g, '')
        : '';
    const suffix = randomBytes(2).toString('hex');
    const name = `${slugifySegment(base, 80)}-${suffix}`;

    return extension ? `${name}.${extension}` : name;
};

export const timestampPrefix = (date = new Date()): string =>
{
    const pad = (num: number) => String(num).padStart(2, '0');

    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`
        + `-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
};

export const buildStorageKey = (segments: Array<string | number>, originalName: string): string =>
{
    const [root, ...rest] = segments.map(segment => String(segment));
    const path = [root, ...rest.map(segment => slugifySegment(segment))].filter(Boolean).join('/');

    return `${path}/${timestampPrefix()}-${buildStoredFilename(originalName)}`;
};
