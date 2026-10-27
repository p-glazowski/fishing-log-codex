import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const source = await readFile(
  new URL('../apps/client/public/brand/perch.svg', import.meta.url),
  'utf8',
);
const artwork = source.match(/<g\b[\s\S]*<\/g>/)?.[0];
if (!artwork) throw new Error('Missing perch artwork');
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect width="48" height="48" rx="12" fill="#172b22"/><g transform="translate(4 4) scale(1.25)" style="color:#d9e7d3">${artwork}</g></svg>\n`;
const publicRoot = new URL('../apps/client/public/', import.meta.url);
await writeFile(new URL('favicon.svg', publicRoot), icon);
for (const [name, size] of [
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
]) {
  await sharp(Buffer.from(icon))
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(name, publicRoot)));
}
console.log('Generated perch favicon and Apple touch icon from the shared logo artwork.');
