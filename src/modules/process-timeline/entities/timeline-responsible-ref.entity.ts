// Proyección mínima del FirmMember responsable de un evento de la línea de tiempo,
// embebida en la respuesta del GET /timeline (nombre + correo para el picker y los recordatorios).
export class TimelineResponsibleRefEntity
{
    id:   string;
    user: {firstName: string; lastName: string; email: string} | null;
}
