import {SetMetadata} from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

export interface PermissionMetadata
{
    key:    string;
    label?: string;
}

// El label es opcional: si no se pasa, PermissionRegistryService genera uno
// a partir de la key en inglés (ver humanizePermissionKey). Se recomienda
// siempre pasarlo explícito en español para que el editor de roles del
// frontend no mezcle idiomas.
export const Permission = (key: string, label?: string) =>
    SetMetadata(PERMISSION_KEY, {key, label} as PermissionMetadata);
