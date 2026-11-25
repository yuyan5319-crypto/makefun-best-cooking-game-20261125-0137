// Sizzle & Serve: hand-in program for the best-cooking-game bounty.
//
// The game itself is plain static files under game/ (game/index.html plus its
// ES modules, no build step, no network request). This program is the only
// moving part of the hand-in: it copies game/ and screenshots/ next to this
// file into the grader's output directory and writes dossier.json there with
// the vendored make.fun library, so the judge can read the game.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly instead of handing in an empty game: the grader would
// refuse it anyway, and a loud failure here is easier to debug.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing — nothing to hand in');
}
const shotFiles = existsSync(join(here, 'screenshots'))
  ? readdirSync(join(here, 'screenshots')).filter((f) => !f.startsWith('.'))
  : [];
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shotFiles.length}`);
}

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// Caps mirror the gate so a hand-in that passes here passes there: the text
// budget for the dossier, at most four screenshots of 256 KiB, and the
// game/ size and file-count limits from the competition rules.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
