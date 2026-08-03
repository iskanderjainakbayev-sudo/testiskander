import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const files = ['speciesPeaceful.ts', 'speciesNeutral.ts', 'speciesAggressive.ts'];
const rows = files.flatMap((file) => {
  const source = readFileSync(join(root, 'src/lib/ocean', file), 'utf8');
  return source.split('\n').filter((line) => line.includes('s({ name:'));
});
const required = [
  'name', 'scientificName', 'assetId', 'bodyPlan', 'habitat', 'diet', 'color',
  'glow', 'size', 'speed', 'band', 'signature', 'behavior',
];
const value = (line, field) => line.match(new RegExp(`${field}: '([^']+)'`))?.[1];
const failures = [];

if (rows.length < 70 || rows.length > 100) failures.push(`catalog has ${rows.length} species; expected 70–100`);
for (const field of required) {
  rows.forEach((line, index) => {
    if (!line.includes(`${field}:`)) failures.push(`species ${index + 1} is missing ${field}`);
  });
}
for (const field of ['name', 'scientificName', 'assetId', 'signature']) {
  const values = rows.map((line) => value(line, field));
  const duplicates = values.filter((item, index) => item && values.indexOf(item) !== index);
  if (duplicates.length) failures.push(`duplicate ${field}: ${[...new Set(duplicates)].join(', ')}`);
}
const palettes = rows.map((line) => `${line.match(/color: (0x[\da-f]+)/i)?.[1]}:${line.match(/glow: (0x[\da-f]+)/i)?.[1]}`);
const duplicatePalettes = palettes.filter((palette, index) => palettes.indexOf(palette) !== index);
if (duplicatePalettes.length) failures.push(`duplicate palettes: ${[...new Set(duplicatePalettes)].join(', ')}`);
if (!rows.some((line) => line.includes('boss: true'))) failures.push('catalog has no boss species');

if (failures.length) throw new Error(`Ocean design validation failed:\n${failures.join('\n')}`);
console.log(`OCEAN_DESIGN_OK species=${rows.length} unique_names=${rows.length} unique_palettes=${rows.length}`);
