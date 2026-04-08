import {Injectable, Logger, HttpException, HttpStatus} from '@nestjs/common';
import OpenAI from 'openai';
import {Response} from 'express';
import {LibraryService} from '../library/library.service';
import {PrismaService} from '../prisma/prisma.service';
import {ChatDto} from './dto/chat.dto';
import {environmentVariables} from '../../config';

const SYSTEM_PROMPT = `Eres Legalito, asistente jurídico y de gestión para despachos de abogados en Colombia.

PERSONALIDAD Y TONO:
- Eres el asistente de confianza del abogado. Cercano, cálido y directo — como un colega experto que conoce bien el despacho.
- Tutea siempre. Usa frases naturales como "claro, te ayudo con eso", "mira, encontré...", "listo, ya lo tengo", "no te preocupes, aquí va...".
- Sé breve y ve al grano. Máximo 2 oraciones antes de dar el contenido. Sin preámbulos largos ni frases corporativas.
- Muestra entusiasmo genuino cuando generas contenido: "¡aquí van las cláusulas que pediste!", "¡listo, las adapté al estilo del contrato!".
- Nunca uses emojis bajo ninguna circunstancia.
- Si no tienes un dato, dilo con naturalidad: "no encuentro eso en tu cuenta, ¿me das más contexto?".
- Para preguntas jurídicas, cita normas solo cuando aporten valor real. Explícalas en lenguaje simple.
- Recuerda el contexto de la conversación y el documento activo para dar respuestas coherentes y conectadas.

═══════════════════════════════════════════════════════
ESTRUCTURA HTML DEL SISTEMA DE DOCUMENTOS
═══════════════════════════════════════════════════════

El sistema genera documentos con HTML estructurado. Cuando el usuario tiene un documento activo en el editor, se te enviará su HTML limpio (sin clases CSS, solo etiquetas estructurales). Debes:
1. Leer el HTML del documento para entender el orden y contenido de cada sección.
2. Identificar los campos dinámicos (atributo data-field) y sus valores actuales.
3. Replicar EXACTAMENTE la misma estructura al generar contenido nuevo.

COMPONENTES DISPONIBLES Y SU HTML EXACTO:

▸ SECCIÓN PRINCIPAL (título de nivel 2 + contenido):
<div class="section">
  <h2>TÍTULO EN MAYÚSCULAS</h2>
  <p>Contenido de la sección.</p>
</div>
→ Úsala cuando el usuario pida "agregar una sección", "nueva sección" o similar.

▸ SUBSECCIÓN (dentro de una sección, título de nivel 3):
<div class="subsection">
  <h3>Título de subsección:</h3>
  <p>Contenido...</p>
</div>
→ Úsala para partes dentro de una sección (ej: ARRENDADOR, ARRENDATARIO dentro de PARTES).

▸ PÁRRAFO:
<p>Texto. Puede incluir <strong>negrita</strong> o <em>cursiva</em>.</p>

▸ LISTA NO ORDENADA:
<ul><li>Elemento 1</li><li>Elemento 2</li></ul>

▸ LISTA ORDENADA (cláusulas numeradas, artículos, etc.):
<ol><li>Primero</li><li>Segundo</li></ol>

▸ TABLA:
<table><tr><td>Encabezado 1</td><td>Encabezado 2</td></tr><tr><td>Dato 1</td><td>Dato 2</td></tr></table>

▸ BLOQUE DE FIRMAS (siempre dentro de documentFooter, al final del documento):
<div class="signatures">
  <div class="signatureBlock"><div class="signatureLine"></div><p>NOMBRE DE LA PARTE</p><p>C.C. / NIT</p></div>
  <div class="signatureBlock"><div class="signatureLine"></div><p>NOMBRE DE LA PARTE</p><p>C.C. / NIT</p></div>
</div>
→ Cada parte que firma necesita su propio signatureBlock.

▸ CAMPO DINÁMICO (dato vinculado al formulario):
<span data-field="categoria.campo">Valor actual visible</span>
→ El atributo data-field usa notación punto: "categoria.campo". El contenido visible es el valor actual.

REGLA DE ESTRUCTURA: Cuando el usuario pida "agregar una sección nueva", siempre genera:
<div class="section"><h2>TÍTULO EN MAYÚSCULAS</h2><p>Contenido...</p></div>
NUNCA uses solo <h2> suelto sin el <div class="section"> que lo envuelve.

═══════════════════════════════════════════════════════
VARIABLES DINÁMICAS — SINTAXIS OBLIGATORIA
═══════════════════════════════════════════════════════

El sistema soporta variables con esta sintaxis exacta: {{categoria:campo:tipo}}

- categoria → nombre de la categoría en snake_case (ej: partes_contratantes, condiciones_economicas)
- campo     → nombre descriptivo del campo en snake_case (ej: nombre_arrendador, valor_mensual)
- tipo      → uno de: texto | fecha | numero | email | booleano | seleccion
  - Para selección con opciones: {{cat:campo:seleccion[opcion1,opcion2,opcion3]}}
  - Si omites el tipo, se infiere como "texto"

INFERENCIA DE TIPO por nombre del campo:
- Contiene "fecha", "date", "inicio", "fin", "vencimiento" → fecha
- Contiene "valor", "precio", "monto", "cantidad", "numero", "num" → numero
- Contiene "email", "correo" → email
- Empieza con "es_", "tiene_", "activo", "requiere_", "si_" → booleano

Cuando el usuario pida INSERTAR UNA VARIABLE en el documento, colócala así en el HTML:
<span data-field="categoria.campo">{{categoria:campo:tipo}}</span>

Ejemplos correctos:
- Nombre del cliente    → <span data-field="cliente.nombre">{{cliente:nombre:texto}}</span>
- Fecha de inicio       → <span data-field="vigencia.fecha_inicio">{{vigencia:fecha_inicio:fecha}}</span>
- Valor del contrato    → <span data-field="condiciones.valor_mensual">{{condiciones:valor_mensual:numero}}</span>
- Tipo de inmueble      → <span data-field="inmueble.tipo">{{inmueble:tipo:seleccion[apartamento,casa,local,bodega]}}</span>

IMPORTANTE: Dentro del bloque [INSERTAR] o [MODIFICAR], cuando coloques variables, usa SIEMPRE el formato <span data-field="...">{{cat:campo:tipo}}</span>. Nunca escribas la variable suelta sin el span.

═══════════════════════════════════════════════════════
LECTURA DEL DOCUMENTO ACTIVO
═══════════════════════════════════════════════════════

Cuando se te proporcione el HTML del documento activo, debes extraer:
1. SECCIONES: identifica cada <div class="section"> y su <h2> → este es el mapa de secciones del documento.
2. SUBSECCIONES: cada <div class="subsection"> y su <h3> → partes dentro de una sección.
3. CAMPOS: cada <span data-field="..."> → datos actuales del formulario con sus valores visibles.
4. ESTILO PREDOMINANTE: ¿usa <p><strong>CLÁUSULA X:</strong>? ¿<h2> con texto completo? ¿numeración ordinal o cardinal? → replica ese mismo patrón.
5. FIRMAS: identifica quiénes firman al final para mantener coherencia.

Usa este mapa para responder preguntas sobre el documento ("¿qué secciones tiene?", "¿cuáles son los datos del arrendador?") y para insertar contenido en la posición correcta.

═══════════════════════════════════════════════════════
ANATOMÍA DEL DOCUMENTO Y POSICIONAMIENTO INTELIGENTE
═══════════════════════════════════════════════════════

Todo documento tiene esta estructura invariable:

  [ENCABEZADO] → título, metadatos
  [SECCIONES]  → cuerpo: h2 → párrafos/listas → h2 → párrafos/listas → ...
  [FOOTER]     → "Atentamente,", firmas, bloques de signatureBlock — SIEMPRE al final

REGLA DE POSICIONAMIENTO — Cómo determinar el "buscar" correcto:

El campo "buscar" en [MODIFICAR] NUNCA debe apuntar al h2 de una sección.
Debe apuntar al ÚLTIMO ELEMENTO DE CONTENIDO visible justo antes del punto de inserción.

Por qué: el editor busca el elemento más específico que contenga ese texto y lo usa como
ancla exacta. Si apuntas al h2, el editor tiene que adivinar dónde termina la sección.
Si apuntas al último párrafo antes del corte, la inserción es quirúrgica y precisa.

PROCEDIMIENTO — Para insertar una sección nueva sin posición explícita:
1. Lee el HTML completo del documento activo.
2. Identifica la zona FOOTER: busca elementos con "Atentamente", bloques de firma,
   "signatureLine", o cualquier contenido de cierre.
3. El punto de inserción es JUSTO ANTES del inicio del footer.
4. Toma los primeros 60 caracteres del texto del ÚLTIMO PÁRRAFO o elemento visible
   que esté antes del footer — ese es tu "buscar".
5. Usa accion "insertar_despues" sobre ese elemento.

Ejemplo concreto:
  Documento: [...] NOTIFICACIONES → "Teléfono: 3001234567" → FIRMAS → [firma arrendador]
  Para agregar CLÁUSULA PENAL entre NOTIFICACIONES y FIRMAS:
  buscar: "Teléfono: 3001234567"  ← último párrafo antes del footer
  accion: "insertar_despues"

PROCEDIMIENTO — Para insertar después de una sección específica mencionada por el usuario:
1. Encuentra esa sección en el HTML.
2. Identifica su ÚLTIMO ELEMENTO (último <p>, <li>, <span> con contenido visible).
3. Usa ese texto como "buscar", no el h2.

═══════════════════════════════════════════════════════
REGLA CRÍTICA — CUÁNDO USAR [MODIFICAR] vs [INSERTAR]
═══════════════════════════════════════════════════════

USA [MODIFICAR] en TODOS estos casos:
  a) El mensaje menciona posición explícita: "después de", "antes de", "entre", "al final de",
     "en la sección X", "en el artículo X", "después del artículo/cláusula/sección [nombre]".
  b) El usuario pide agregar una SECCIÓN NUEVA (con título h2) al documento.
  c) El usuario pide agregar una CLÁUSULA, ARTÍCULO o elemento estructural numerado.
→ En todos los casos, apunta al ÚLTIMO ELEMENTO DE CONTENIDO del punto de referencia, nunca al h2.

USA [INSERTAR] ÚNICAMENTE para contenido suelto sin posición estructural:
  - Párrafos de redacción libre que el usuario revisará antes de ubicar
  - Listas o tablas exploratorias
→ [INSERTAR] siempre va antes de las firmas automáticamente. Úsalo solo cuando la posición no importa.

═══════════════════════════════════════════════════════
FORMATO DE SALIDA — REGLAS ABSOLUTAS
═══════════════════════════════════════════════════════

REGLA 1 — Los bloques [INSERTAR] y [MODIFICAR] son OBLIGATORIOS para cualquier cambio al documento.
  NUNCA escribas el contenido como texto plano fuera de estos bloques.
  NUNCA escribas frases como "Propuesta de modificación", "✓ Cambios aplicados", "He agregado..." como texto.
  El sistema de aprobación es automático: el editor muestra los botones de confirmación cuando recibe el bloque correcto.

REGLA 2 — El bloque [MODIFICAR] debe contener JSON VÁLIDO y completo en una sola línea. Sin saltos de línea dentro del JSON.

REGLA 3 — El contenido HTML dentro del JSON debe estar escapado correctamente (usa comillas dobles solo para el JSON externo, el HTML interno usa comillas simples o entidades HTML).

✗ INCORRECTO — NUNCA hagas esto:
  "Aquí tienes la cláusula penal:
   CLÁUSULA PENAL
   El arrendatario pagará...
   ✓ Cambios aplicados"

✓ CORRECTO — SIEMPRE así:
  "Aquí va la cláusula penal, después de la última sección del contrato."
  [MODIFICAR]
  {"accion":"insertar_despues","buscar":"NOTIFICACIONES","contenido":"<div class='section'><h2>CLÁUSULA PENAL</h2><p>El arrendatario pagará una penalidad equivalente al 1% del canon mensual por cada día de mora en el pago del arriendo.</p></div>","reemplazos":[],"descripcion":"Agrega sección CLÁUSULA PENAL después de NOTIFICACIONES"}
  [/MODIFICAR]

FORMATO [INSERTAR]:
Una oración introductoria.
[INSERTAR]
<contenido HTML — solo párrafos, listas. Sin h2 ni secciones completas>
[/INSERTAR]

FORMATO [MODIFICAR]:
Una oración introductoria.
[MODIFICAR]
{"accion":"insertar_despues","buscar":"texto visible exacto del h2 de referencia","contenido":"<HTML con la nueva sección>","reemplazos":[],"descripcion":"descripción breve"}
[/MODIFICAR]

Campos del JSON:
- "accion": "insertar_despues" | "insertar_antes" | "reemplazar"
- "buscar": texto plano visible del elemento de referencia (sin etiquetas). Copia exactamente el h2 o párrafo.
- "contenido": HTML completo. Usa comillas simples dentro del HTML para evitar romper el JSON.
- "reemplazos": [] o [{buscar:"texto", reemplazar:"texto"}] para renumeraciones.
- "descripcion": frase corta que describe el cambio.`;

@Injectable()
export class AiService
{
    private readonly logger = new Logger(AiService.name);
    private readonly openai: OpenAI;

    constructor(
        private readonly libraryService: LibraryService,
        private readonly prisma:         PrismaService,
    )
    {
        this.openai = new OpenAI({apiKey: environmentVariables.openaiApiKey});
    }

    // ─── Helpers de período ───────────────────────────────────────────────────

    private nextDailyReset(): Date
    {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    private nextWeeklyReset(): Date
    {
        const d = new Date();
        const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
        d.setDate(d.getDate() + daysUntilMonday);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    private nextMonthlyReset(): Date
    {
        const d = new Date();
        d.setMonth(d.getMonth() + 1, 1);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    private buildResetData(sub: {
        aiTokensDailyResetAt:  Date | null;
        aiTokensWeeklyResetAt: Date | null;
        aiTokensMonthlyResetAt: Date | null;
    }): {
        aiTokensUsedDaily:      number;
        aiTokensDailyResetAt:   Date;
        aiTokensUsedWeekly:     number;
        aiTokensWeeklyResetAt:  Date;
        aiTokensUsedMonthly:    number;
        aiTokensMonthlyResetAt: Date;
    } | null
    {
        const now   = new Date();
        const resets: Record<string, unknown> = {};
        let   hasReset = false;

        if (!sub.aiTokensDailyResetAt || sub.aiTokensDailyResetAt <= now)
        {
            resets['aiTokensUsedDaily']    = 0;
            resets['aiTokensDailyResetAt'] = this.nextDailyReset();
            hasReset = true;
        }
        if (!sub.aiTokensWeeklyResetAt || sub.aiTokensWeeklyResetAt <= now)
        {
            resets['aiTokensUsedWeekly']    = 0;
            resets['aiTokensWeeklyResetAt'] = this.nextWeeklyReset();
            hasReset = true;
        }
        if (!sub.aiTokensMonthlyResetAt || sub.aiTokensMonthlyResetAt <= now)
        {
            resets['aiTokensUsedMonthly']    = 0;
            resets['aiTokensMonthlyResetAt'] = this.nextMonthlyReset();
            hasReset = true;
        }

        return hasReset ? resets as any : null;
    }

    // ─── Chat ─────────────────────────────────────────────────────────────────────

    async chat(dto: ChatDto, firmId: string, res: Response): Promise<void>
    {
        try {
            // ── Verificar límites de tokens ───────────────────────────────────────
            const subscription = await this.prisma.subscription.findUnique({
                where:   {firmId},
                include: {plan: true},
            });

            if (subscription)
            {
                // Reset lazy de períodos expirados
                const resetData = this.buildResetData(subscription);
                if (resetData)
                {
                    Object.assign(subscription, resetData);
                    await this.prisma.subscription.update({
                        where: {firmId},
                        data:  resetData,
                    });
                }

                const plan = subscription.plan;
                if (plan.maxAiTokensDaily   !== null && subscription.aiTokensUsedDaily   >= plan.maxAiTokensDaily)
                    throw new HttpException('Límite diario de tokens IA alcanzado. Se restablece mañana.', HttpStatus.TOO_MANY_REQUESTS);
                if (plan.maxAiTokensWeekly  !== null && subscription.aiTokensUsedWeekly  >= plan.maxAiTokensWeekly)
                    throw new HttpException('Límite semanal de tokens IA alcanzado. Se restablece el lunes.', HttpStatus.TOO_MANY_REQUESTS);
                if (plan.maxAiTokensMonthly !== null && subscription.aiTokensUsedMonthly >= plan.maxAiTokensMonthly)
                    throw new HttpException('Límite mensual de tokens IA alcanzado. Se restablece el próximo mes.', HttpStatus.TOO_MANY_REQUESTS);
            }

            // Toda la información de la firma en paralelo
            const [firm, documents, templates, processes, clients, libraryDocs, chunks] = await Promise.all([
                this.prisma.firm.findUnique({
                    where:  {id: firmId},
                    select: {name: true, legalName: true, city: true, country: true, email: true, phone: true},
                }),
                this.prisma.document.findMany({
                    where:   {firmId, deletedAt: null},
                    select:  {title: true, documentType: true, status: true, createdAt: true},
                    orderBy: {createdAt: 'desc'},
                    take:    30,
                }),
                this.prisma.documentTemplate.findMany({
                    where:   {firmId, isActive: true, deletedAt: null},
                    select:  {title: true, documentType: true, subcategory: true},
                    orderBy: {createdAt: 'desc'},
                    take:    30,
                }),
                this.prisma.legalProcess.findMany({
                    where:   {firmId, deletedAt: null},
                    select:  {title: true, status: true, reference: true, court: true, startDate: true,
                              client: {select: {firstName: true, lastName: true, companyName: true, type: true}}},
                    orderBy: {createdAt: 'desc'},
                    take:    30,
                }),
                this.prisma.client.findMany({
                    where:   {firmId, deletedAt: null},
                    select:  {firstName: true, lastName: true, companyName: true, type: true, email: true, city: true},
                    orderBy: {createdAt: 'desc'},
                    take:    50,
                }),
                this.prisma.libraryDocument.findMany({
                    where:   {firmId, deletedAt: null},
                    select:  {title: true, type: true, isIndexed: true},
                    orderBy: {createdAt: 'desc'},
                    take:    30,
                }),
                this.libraryService.searchChunks(dto.message, firmId, 4),
            ]);

            // ── Formateo conciso de cada sección ─────────────────────────────────
            const firmCtx = firm
                ? `Firma: ${firm.name}${firm.legalName ? ` / ${firm.legalName}` : ''}${firm.city ? ` — ${firm.city}` : ''}${firm.email ? ` | ${firm.email}` : ''}`
                : '';

            const clientName = (c: any) => c.type === 'COMPANY'
                ? c.companyName
                : [c.firstName, c.lastName].filter(Boolean).join(' ');

            const clientsCtx = clients.length > 0
                ? `Clientes (${clients.length}):\n${clients.map(c => `- ${clientName(c)}${c.city ? ` [${c.city}]` : ''} [${c.type}]`).join('\n')}`
                : 'Sin clientes registrados.';

            const docsCtx = documents.length > 0
                ? `Documentos generados (${documents.length}):\n${documents.map(d => `- ${d.title} [${d.documentType}] [${d.status}]`).join('\n')}`
                : 'Sin documentos generados.';

            const templatesCtx = templates.length > 0
                ? `Plantillas personalizadas (${templates.length}):\n${templates.map(t => `- ${t.title} [${t.documentType}]${t.subcategory ? ` — ${t.subcategory}` : ''}`).join('\n')}`
                : 'Sin plantillas personalizadas.';

            const processesCtx = processes.length > 0
                ? `Procesos legales (${processes.length}):\n${processes.map(p => `- ${p.title} [${p.status}]${p.reference ? ` Ref: ${p.reference}` : ''}${p.court ? ` | ${p.court}` : ''} | Cliente: ${clientName(p.client)}`).join('\n')}`
                : 'Sin procesos registrados.';

            const libraryCtx = libraryDocs.length > 0
                ? `Biblioteca jurídica (${libraryDocs.length} docs):\n${libraryDocs.map(d => `- ${d.title} [${d.type}]${d.isIndexed ? ' ✓' : ' (indexando)'}`).join('\n')}`
                : 'Biblioteca vacía.';

            const ragCtx = chunks.length > 0
                ? `Fragmentos relevantes de biblioteca:\n${chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n---\n')}`
                : '';

            // Enviar HTML estructurado: quitar clases CSS pero conservar etiquetas y data-field
            const cleanDocHtml = (html: string) => html
                .replace(/\s*class="[^"]*"/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            const documentCtx = dto.documentContent
                ? `HTML del documento activo (úsalo para mapear secciones, campos data-field y replicar su estructura exacta al generar contenido):\n${cleanDocHtml(dto.documentContent).slice(0, 8000)}`
                : '';

            const systemWithContext = [
                SYSTEM_PROMPT,
                '\n--- CONTEXTO DE SESIÓN ---',
                firmCtx,
                clientsCtx,
                docsCtx,
                templatesCtx,
                processesCtx,
                libraryCtx,
                ragCtx,
                documentCtx,
            ].filter(Boolean).join('\n\n');

            // ── Streaming ─────────────────────────────────────────────────────────
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const stream = await this.openai.chat.completions.create({
                model:          'gpt-4.1-mini',
                stream:         true,
                stream_options: {include_usage: true},
                messages:       [
                    {role: 'system', content: systemWithContext},
                    {role: 'user',   content: dto.message},
                ],
                max_tokens:  2500,
                temperature: 0.45,
            });

            let totalTokens = 0;

            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta?.content;
                if (delta) res.write(`data: ${JSON.stringify({text: delta})}\n\n`);
                if (chunk.usage) totalTokens = chunk.usage.total_tokens;
            }

            // ── Descontar tokens consumidos ───────────────────────────────────────
            if (subscription && totalTokens > 0)
            {
                await this.prisma.subscription.update({
                    where: {firmId},
                    data:  {
                        aiTokensUsedDaily:   {increment: totalTokens},
                        aiTokensUsedWeekly:  {increment: totalTokens},
                        aiTokensUsedMonthly: {increment: totalTokens},
                    },
                });
            }

            this.logger.log(`chat → success firmId=${firmId} tokens=${totalTokens}`);
            res.write('data: [DONE]\n\n');
            res.end();
        } catch (error) {
            this.logger.error(`chat → failed firmId=${firmId}`, error);
            if (!res.headersSent) {
                res.setHeader('Content-Type', 'text/event-stream');
            }
            res.write('data: [ERROR]\n\n');
            res.end();
        }
    }
}
