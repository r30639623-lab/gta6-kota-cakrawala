// main.ts — Kota Cakrawala round 8 rebuild (Node 22 stdlib-only).
// Menyerahkan game ke make.fun: menyalin game/ dan screenshots/ dari
// repo ini ke /output (atau $MAKEFUN_OUTPUT_DIR di luar grader), lalu
// menulis /output/dossier.json dengan buildDossier dari
// vendor/makefun-game.ts. Round 8 rebuild: siang cerah yang ramai,
// kru Bu Sari + ability aktif, panel dispatch polisi, HP in-game,
// side job + balapan jalanan, dialog misi berwajah, 12 mobil,
// senjata ke-4 Senapan, 12 misi 3 babak, 20 relik, 3 garasi.

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
console.log(`Kota Cakrawala round 8 rebuild: dossier written (${dossier.length} bytes) to ${outDir}/dossier.json`);
