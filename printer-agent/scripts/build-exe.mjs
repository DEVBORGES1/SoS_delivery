// Gera dist/sos-impressora.exe: o agente inteiro num executável só (Node SEA),
// para instalar no computador da loja sem precisar do Node.js.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const exe = join(dist, 'sos-impressora.exe');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

console.log('1/4 Juntando o código num arquivo só…');
await build({
  entryPoints: [join(root, 'src/main.ts')],
  outfile: join(dist, 'agente.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  legalComments: 'none',
});

console.log('2/4 Preparando o executável…');
const seaConfig = join(dist, 'sea-config.json');
writeFileSync(
  seaConfig,
  JSON.stringify({ main: join(dist, 'agente.cjs'), output: join(dist, 'sea-prep.blob'), disableExperimentalSEAWarning: true }),
);
execFileSync(process.execPath, ['--experimental-sea-config', seaConfig], { stdio: 'inherit' });

console.log('3/4 Copiando o Node.js…');
copyFileSync(process.execPath, exe);

console.log('4/4 Embutindo o agente no executável…');
execFileSync(
  process.execPath,
  [
    join(root, 'node_modules/postject/dist/cli.js'),
    exe,
    'NODE_SEA_BLOB',
    join(dist, 'sea-prep.blob'),
    '--sentinel-fuse',
    'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
  ],
  { stdio: 'inherit' },
);

for (const file of ['iniciar-com-o-windows.cmd', 'LEIA-ME.txt']) copyFileSync(join(root, 'scripts', file), join(dist, file));
for (const file of ['agente.cjs', 'sea-config.json', 'sea-prep.blob']) rmSync(join(dist, file));

console.log(`\nPronto: ${exe}`);
console.log('Copie a pasta dist inteira para o computador da loja (ex.: C:\\SOS-Impressora).');
