// Convierte la parte de acción de una permission key en una etiqueta legible.
// "toggle-favorite" -> "Toggle Favorite" (label por defecto, editable a futuro desde la UI de roles).
export function humanizePermissionKey(key: string): string
{
    const action = key.includes(':') ? key.split(':')[1] : key;

    return action
        .split('-')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
