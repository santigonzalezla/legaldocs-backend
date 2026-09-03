// Corre todas las sondas en secuencia.
//   node scripts/source-probes/run-all.mjs

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

const probes = [
    // Fase 1 (validadas OK)
    'probe-corte-constitucional.mjs',
    'probe-corte-suprema.mjs',
    'probe-presidencia-normativa.mjs',
    'probe-actualicese.mjs',
    // Descartes / exploración
    'probe-suin-juriscol.mjs',
    'probe-ambito-juridico.mjs',
    'probe-candidates.mjs',
];

let failures = 0;

for (const probe of probes)
{
    const res = spawnSync(process.execPath, [join(here, probe)], { stdio: 'inherit', env: process.env });
    if (res.status !== 0)
    {
        failures++;
        console.log(`\n[!] ${probe} salió con código ${res.status}\n`);
    }
}

console.log('\n' + '#'.repeat(72));
console.log(failures ? `${failures} sonda(s) con fallo` : 'Todas las sondas corrieron');
console.log('#'.repeat(72));
process.exit(failures ? 1 : 0);
