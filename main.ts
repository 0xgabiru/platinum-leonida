// Platinum Leonida — entrypoint for the GTA VI trophy guide.
//
// This program is the hand-in step. It does three things, and nothing else:
//   1. Stages the guide itself (app/) and its screenshots (screenshots/)
//      into the output directory the grader reads.
//   2. Asks the vendored make.fun library to summarise that staged output
//      into dossier.json, the summary the judge reads.
//   3. Prints a one-line report (what was staged, how big the dossier is)
//      so a human running it can see the run worked.
//
// The program never deletes anything, never touches the network, and is
// deterministic: two runs over the same tree write byte-identical output.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the other caps refuse an entry the scorer would refuse anyway.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function entryRoot() {
  return fileURLToPath(new URL('.', import.meta.url));
}

function outputRoot() {
  return process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
}

function countEntries(dir) {
  let total = 0;
  for (const name of readdirNames(dir)) {
    const path = join(dir, name);
    total += 1;
    if (statSync(path).isDirectory()) total += countEntries(path);
  }
  return total;
}

function readdirNames(dir) {
  return readdirSync(dir);
}

function stageFolder(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  return countEntries(to);
}

function writeReport(out, staged, dossierBytes) {
  const line = `Platinum Leonida staged: ${staged} entries, dossier ${dossierBytes} bytes -> ${out}\n`;
  process.stdout.write(line);
}

function run() {
  const here = entryRoot();
  const out = outputRoot();
  mkdirSync(out, { recursive: true });
  let staged = 0;
  staged += stageFolder(join(here, 'app'), join(out, 'app'));
  const shots = join(out, 'screenshots');
  mkdirSync(shots, { recursive: true });
  if (existsSync(join(here, 'screenshots'))) {
    staged += stageFolder(join(here, 'screenshots'), shots);
  }
  const dossier = buildDossier(out, DOSSIER_CAPS);
  const target = join(out, 'dossier.json');
  writeFileSync(target, dossier);
  writeReport(out, staged, Buffer.byteLength(dossier));
}

run();
