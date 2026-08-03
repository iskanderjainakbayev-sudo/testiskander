import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const speciesDir = join(root, 'src/lib/ocean');
const modelDir = join(root, 'assets/models/ocean/fish');
const speciesFiles = readdirSync(speciesDir).filter((name) => /^species.*\.ts$/.test(name));
const entries = speciesFiles.flatMap((name) => {
  const source = readFileSync(join(speciesDir, name), 'utf8');
  return [...source.matchAll(/assetId: '([^']+)'.*?bodyPlan: '([^']+)'[^\n]+/g)]
    .filter((match) => !match[0].includes('boss: true'))
    .map((match) => ({ id: match[1], plan: match[2] }));
});

function glbJson(path) {
  const data = readFileSync(path);
  if (data.toString('ascii', 0, 4) !== 'glTF' || data.readUInt32LE(4) !== 2) {
    throw new Error(`Invalid GLB header: ${path}`);
  }
  const jsonLength = data.readUInt32LE(12);
  return JSON.parse(data.toString('utf8', 20, 20 + jsonLength).trimEnd());
}

const failures = [];
for (const { id, plan } of entries) {
  const path = join(modelDir, `${id}.glb`);
  try {
    const size = statSync(path).size;
    const document = glbJson(path);
    const names = new Set((document.nodes ?? []).map((node) => node.name));
    if (size > 300_000) failures.push(`${id}: ${size} bytes exceeds budget`);
    if (!(document.meshes?.length > 0)) failures.push(`${id}: no meshes`);
    if (['fish', 'whale', 'ray', 'puffer', 'turtle', 'shrimp'].includes(plan) && !names.has('swim-tail')) {
      failures.push(`${id}: missing swim-tail`);
    }
    if (['fish', 'whale', 'ray', 'puffer', 'turtle', 'squid', 'slug'].includes(plan)
      && !names.has('swim-fin-1')) failures.push(`${id}: missing animated fins`);
  } catch (error) {
    failures.push(`${id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
if (entries.length !== 69) failures.push(`catalog count is ${entries.length}, expected 69`);
if (failures.length) throw new Error(`Ocean creature validation failed:\n${failures.join('\n')}`);
console.log(`OCEAN_CREATURES_OK count=${entries.length}`);
