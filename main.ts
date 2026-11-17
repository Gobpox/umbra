// UMBRA — make.fun best-game-01 entry program (Node, standard library only).
//
// The game is the static site in game/ (open game/index.html in a browser; no
// build step, no network). This program only carries it to the grader: it
// copies game/ and screenshots/ into the output directory and writes
// dossier.json there with the vendored make.fun library, under the scorer's
// own caps.
//
// Run it the way the grader does, or locally with an output override:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The playable game, byte for byte.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

// The maker's screenshots of the real game running (first by name is the cover).
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The dossier the judge reads: at most 4 screenshots of 256 KiB each, at most
// 993 files and 48 MiB under game/, no game path over 1000 bytes, source text
// quoted up to 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
