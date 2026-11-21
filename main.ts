// main.ts — Kota Cakrawala round 7 (Node 22 stdlib-only).
// Menyerahkan game ke make.fun: menyalin game/ dan screenshots/ dari
// repo ini ke /output (atau $MAKEFUN_OUTPUT_DIR di luar grader), lalu
// menulis /output/dossier.json dengan buildDossier dari
// vendor/makefun-game.ts. Round 7: full rewrite — 12 misi 3 babak,
// 20 relik, 10 mobil + 3 garasi, reputasi 5 distrik, Wanted ★1-5,
// poles visual (bayangan, langit gradien, neon), screenshot seed 2.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`Kota Cakrawala round 7: dossier written (${dossier.length} bytes) to ${outDir}/dossier.json`);
