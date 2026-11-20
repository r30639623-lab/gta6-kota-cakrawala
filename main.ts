// Kota Cakrawala — main.ts (Round 6 rebuild, 2026-11-20).
// Program Node 22 stdlib-only: menyalin game/ + screenshots/ dari repo
// ini ke /output (atau $MAKEFUN_OUTPUT_DIR) dan menulis
// /output/dossier.json via buildDossier dari vendor/makefun-game.ts.
// Fitur baru round 6: 12 misi 3 babak, 20 relik, 10 mobil + 3 garasi,
// reputasi 5 distrik, Wanted ★1-5 diperkuat (heli + roadblock).
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

function copyTree(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const from = join(src, name);
    const to = join(dest, name);
    const info = statSync(from);
    if (info.isDirectory()) copyTree(from, to);
    else if (info.isFile()) cpSync(from, to);
  }
}

function main() {
  const gameSrc = join(repoRoot, 'game');
  const shotsSrc = join(repoRoot, 'screenshots');
  if (!existsSync(gameSrc)) throw new Error('game/ tidak ditemukan di repo');
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  copyTree(gameSrc, join(outDir, 'game'));
  if (existsSync(shotsSrc)) copyTree(shotsSrc, join(outDir, 'screenshots'));
  const dossier = buildDossier(outDir, CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`Kota Cakrawala round 6 -> ${outDir} (dossier ${dossier.length} bytes)`);
}

main();
