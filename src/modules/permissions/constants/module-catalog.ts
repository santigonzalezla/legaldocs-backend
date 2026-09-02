export interface ModuleCatalogEntry
{
    label:       string;
    description?: string;
    sortOrder:   number;
}

// Labels usados solo para auto-crear el registro de Module la primera vez que
// aparece una @Permission() de esa clave — no gobiernan el comportamiento del guard.
export const MODULE_CATALOG: Record<string, ModuleCatalogEntry> = {
    documents:     {label: 'Documentos',                 sortOrder: 10},
    processes:     {label: 'Procesos Legales',            sortOrder: 20},
    templates:     {label: 'Plantillas',                  sortOrder: 30},
    library:       {label: 'Biblioteca Jurídica',          sortOrder: 40},
    clients:       {label: 'Clientes',                    sortOrder: 50},
    time_entries:  {label: 'Control de Tiempo',            sortOrder: 60},
    branches:      {label: 'Ramas Jurídicas',              sortOrder: 70},
    team:          {label: 'Equipo',                      sortOrder: 80},
    firm_settings: {label: 'Configuración de la Firma',    sortOrder: 90},
};

// Excluidos a propósito, nunca reciben @Permission():
// - signatures: recurso personal del usuario (DigitalSignature no tiene firmId), mismo criterio que user.*
// - ai_assistant (Legalito): acceso parejo para todo el despacho, gateado por plan de suscripción, no por rol
