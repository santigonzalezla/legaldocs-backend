// Etiquetado best-effort de una actualización a una rama del derecho.
// Determinístico, sin IA: regex por rama sobre título + resumen + categoría.
// El polling traduce el slug a branchId con las ramas de sistema sembradas
// (civil, comercial, laboral, procesal, administrativo, penal).

interface BranchPattern
{
    slug:    string;
    pattern: RegExp;
}

// Orden = prioridad. Lo más específico primero; `civil` es amplio y va al final.
const BRANCH_PATTERNS: BranchPattern[] = [
    {slug: 'penal',          pattern: /\bpenal(es)?\b|casaci[oó]n penal|prevaricato|\bdelito\b|condena|fiscal[ií]a|acusaci[oó]n/i},
    {slug: 'laboral',        pattern: /\blaboral(es)?\b|del trabajo|contrato de trabajo|\bpensi[oó]n\b|\bsalario\b|despido|prestaciones sociales/i},
    {slug: 'comercial',      pattern: /\bcomercial(es)?\b|mercantil|\bsociedad(es)?\b|s\.?a\.?s\.?\b|supersociedades|insolvencia|c[aá]mara de comercio/i},
    {slug: 'administrativo', pattern: /\badministrativ[oa]s?\b|acci[oó]n de tutela|\btutela\b|derecho de petici[oó]n|contencioso|consejo de estado|acto administrativo/i},
    {slug: 'procesal',       pattern: /\bprocesal(es)?\b|c[oó]digo general del proceso|nulidad procesal|\brecurso de (reposici[oó]n|apelaci[oó]n|casaci[oó]n)\b/i},
    {slug: 'civil',          pattern: /\bcivil(es)?\b|arrendamiento|compraventa|\balimentos\b|sucesi[oó]n|responsabilidad civil|contrato/i},
];

export const resolveBranchSlug = (text: string): string | null =>
{
    const haystack = (text ?? '').toLowerCase();
    if (!haystack.trim()) return null;

    for (const {slug, pattern} of BRANCH_PATTERNS)
    {
        if (pattern.test(haystack)) return slug;
    }

    return null;
};
